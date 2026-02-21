# DECISIONS.md

Full decision history for **netbulls.kurnik.journey** — the *why* behind the journey site. Written for Claude Code continuity.

---

## 2026-02-21 · Warsaw, PL — Bootstrap session

### Purpose of the journey site
Kurnik is being built in public. The journey site documents every phase — decisions, rationale, iterations — as it happens. Two goals:
1. Content marketing: shows structured product thinking, attracts early users
2. Credibility signal: anyone can see the work behind the product, not just the outcome

Pattern: build credibility by showing the process, not just the polish.

### Why static HTML (no framework)
- Journey documents are read-only artifacts. No interactivity needed.
- Self-contained HTML = no build pipeline, no dependencies to break, archive-safe
- Easier for AI agents to generate and modify correctly
- Deployable anywhere by copying files — no Node/npm required on server

### Design system
Matches brand exactly:
- Background: `#0e0c0a` (near-black, warm undertone)
- Accent: `#d4840a` (amber)
- Text: `#e8ddd0` (warm off-white)
- Fonts: DM Serif Display (display) + Manrope (UI) + DM Mono (code/labels)

Note: earlier files may reference `#0C0A09` / `#F59E0B` — these are close but the canonical values above are correct. Fix if editing those files.

---

## Versioning system

**Philosophy:** snapshots are automatic, releases are human decisions.

- Source of truth: `git describe --tags --always`
  - Clean tag: `v0.1.0` → release
  - Post-tag: `v0.1.0-3-gabc123` → snapshot (3 commits after tag)
- `<!-- VERSION -->` placeholder in all HTML files
- `scripts/version-inject.ts` — replaces placeholder with current version at deploy time
- Each release freezes `site/*` → `site/versions/v{X.Y.Z}/` (time capsule)
- Version browser at `site/versions/index.html`
- `scripts/release.sh` — tags, injects version, freezes snapshot, pushes

**Why:** lets anyone browse what the site looked like at any point in the journey. Part of the "building in public" story.

---

## Timeline build pipeline

**File:** `scripts/build-timeline.ts`
**Command:** `bun run build:timeline`

**How it works:**
1. Fetches `CHANGELOG.md` from all 3 repos (netbulls.kurnik, .brand, .journey) via GitHub API
2. Merges all entries, sorted by ISO 8601 timestamp
3. Sends merged log to Claude API with instructions to select substantial milestones for public consumption (filters out minor operational changes)
4. Claude returns curated list with public-friendly descriptions
5. Script generates `site/timeline.html` from the result

**Why Claude curates instead of showing everything:** The CHANGELOGs are honest operational logs. Not everything belongs in the public journey — e.g. "fixed stale docs/ reference" is a good CHANGELOG entry but irrelevant to the journey story. Claude picks the meaningful moments.

---

## Tweet automation

**File:** `scripts/draft-tweet.ts`
**Command:** `bun run tweet:draft` or `bun run tweet:post`

**Two modes:**
- `draft` — generates tweet text, prints to stdout, exits with code 2. For review before posting.
- `post` — posts directly via X API. No confirmation prompt.

**Posting chain:**
1. Posts from @erace (personal, founder voice)
2. @kurnik_ai quote-retweets the @erace post (product voice amplifies personal)

**Why two accounts:**
- @erace = human building in public. Authentic, personal.
- @kurnik_ai = product account. Follows the @erace thread and adds product framing.
- Quote-retweet pattern = both audiences see it, cross-pollination without duplication.

**Auth:**
- OAuth 1.0a (not OAuth 2.0) — required for posting
- Credentials stored age-encrypted in `secrets/x-api.md.age`
- `scripts/secrets.sh decrypt` unlocks before any tweet operation
- Never commit decrypted secrets

**First tweets posted:**
- @erace: https://x.com/erace/status/2025232457792889331
- @kurnik_ai: https://x.com/kurnik_ai/status/2025236246461637047

---

## Phase document structure

Each phase of the Kurnik build gets its own HTML file in `site/`:

| File | Phase | Status |
|------|-------|--------|
| `brand-foundation.html` | Phase 01 — Brand Foundation | ✅ Live |
| `symbol-exploration.html` | Phase 02 — Symbol Exploration | ⏳ Pending |
| `timeline.html` | Timeline (cross-phase) | ✅ Generated |

When a phase completes:
1. Add `site/[phase-name].html`
2. Update `site/index.html` — flip status badge, add link
3. Run `bun run build:timeline` to include in timeline
4. Draft tweet for milestone
5. CHANGELOG entry

---

## Deployment

VPS (self-hosted). No managed hosting.
- `deploy/` contains deployment scripts
- VPS serves `site/` directly at journey.kurnik.ai
- No build step — HTML files are the artifact

## Dependency on other repos
- **netbulls.kurnik.brand** — brand assets and phase documents originate there, get referenced here
- **netbulls.kurnik** — product architecture decisions become journey phase documents
- Timeline pipeline reads CHANGELOGs from all three — keep CHANGELOG entries meaningful
