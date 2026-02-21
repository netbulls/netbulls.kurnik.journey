#!/usr/bin/env bash
#
# Release: tag, build, snapshot, and deploy the journey site.
#
# Usage: ./scripts/release.sh <version>
#   version: semver like 0.2.0 (will be tagged as v0.2.0)
#
# What it does:
#   1. Pre-flight checks (clean tree, tag doesn't exist)
#   2. Tags the current commit as v<version>
#   3. Runs version-inject (stamps version into package.json + HTML)
#   4. Runs build:timeline (generates timeline page via AI curation)
#   5. Freezes current site/ into site/versions/v<version>/
#   6. Regenerates site/versions/index.html (version browser)
#   7. Commits everything, moves tag to final commit
#   8. Pushes tag + commit
#   9. Creates GitHub Release with notes from CHANGELOG.md
#
# Example:
#   ANTHROPIC_API_KEY=sk-... ./scripts/release.sh 0.1.0
#

set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "  e.g.: $0 0.1.0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# --- Pre-flight checks ---
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: Working tree is dirty. Commit or stash changes first."
  exit 1
fi

if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
  echo "Error: Tag v${VERSION} already exists."
  exit 1
fi

echo "=== Release v${VERSION} ==="
echo ""

# --- Tag (preliminary, will be moved after build) ---
git tag -a "v${VERSION}" -m "Release v${VERSION}"
echo "Tagged: v${VERSION}"

# --- Build ---
echo ""
echo "==> Version inject..."
bun run version-inject

echo ""
echo "==> Building timeline..."
bun run build:timeline

# --- Freeze snapshot ---
echo ""
echo "==> Freezing site snapshot to versions/v${VERSION}/..."
SNAPSHOT_DIR="site/versions/v${VERSION}"
mkdir -p "$SNAPSHOT_DIR"

# Copy all site files except the versions/ directory itself
for item in site/*; do
  basename="$(basename "$item")"
  if [ "$basename" != "versions" ]; then
    cp -r "$item" "$SNAPSHOT_DIR/"
  fi
done

echo "Snapshot: $SNAPSHOT_DIR/ ($(find "$SNAPSHOT_DIR" -type f | wc -l | tr -d ' ') files)"

# --- Generate version browser ---
echo ""
echo "==> Generating version browser..."
bun run scripts/build-version-browser.ts

# --- Commit built artifacts ---
echo ""
if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "Release v${VERSION} — built artifacts + frozen snapshot"
  # Move tag to include the build commit
  git tag -f -a "v${VERSION}" -m "Release v${VERSION}"
fi

# --- Push ---
echo ""
echo "==> Pushing..."
git push origin main
git push origin "v${VERSION}" --force

# --- Extract release notes from CHANGELOG.md ---
NOTES=""
if [ -f CHANGELOG.md ]; then
  NOTES=$(awk -v ver="$VERSION" '
    /^## / { if (found) exit; if (index($0, ver)) found=1; next }
    found { print }
  ' CHANGELOG.md | sed '/^[[:space:]]*$/d' | head -50)
fi

# --- GitHub Release ---
if command -v gh &>/dev/null; then
  echo ""
  echo "==> Creating GitHub Release..."
  if [ -n "$NOTES" ]; then
    gh release create "v${VERSION}" --title "v${VERSION}" --notes "$NOTES"
  else
    gh release create "v${VERSION}" --title "v${VERSION}" --generate-notes
  fi
else
  echo ""
  echo "gh CLI not found — skipping GitHub Release. Create manually or install gh."
fi

echo ""
echo "=== Done ==="
echo "  Version:   v${VERSION}"
echo "  Snapshot:  journey.kurnik.ai/versions/v${VERSION}/"
echo "  Browser:   journey.kurnik.ai/versions/"
echo "  Tag:       v${VERSION}"
echo "  Site:      journey.kurnik.ai"
