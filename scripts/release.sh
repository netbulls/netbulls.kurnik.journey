#!/usr/bin/env bash
#
# Release: tag, build, and deploy the journey site.
#
# Usage: ./scripts/release.sh <version>
#   version: semver like 0.2.0 (will be tagged as v0.2.0)
#
# What it does:
#   1. Tags the current commit as v<version>
#   2. Runs version-inject (stamps version into package.json + HTML)
#   3. Runs build:timeline (generates timeline page)
#   4. Commits the built artifacts
#   5. Pushes tag + commit
#
# Example:
#   ./scripts/release.sh 0.1.0
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

# --- Tag ---
echo "=== Release v${VERSION} ==="
echo ""
git tag -a "v${VERSION}" -m "Release v${VERSION}"
echo "Tagged: v${VERSION}"

# --- Build ---
echo ""
echo "==> Version inject..."
bun run version-inject

echo ""
echo "==> Building timeline..."
bun run build:timeline

# --- Commit built artifacts ---
if ! git diff --quiet; then
  git add -A
  git commit -m "Release v${VERSION} — built artifacts"
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
echo "  Version:  v${VERSION}"
echo "  Tag:     v${VERSION}"
echo "  Site:    journey.kurnik.ai"
