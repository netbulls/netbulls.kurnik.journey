# CLAUDE.md

> **Do NOT run `/init` on this project** — it will overwrite these instructions.

## Session start

**Read these files before doing anything:**
1. `DECISIONS.md` — full journey site history, pipeline decisions, automation setup
2. `.claude/rules/*.md` — operational standards

If Redis MCP is available, also read key `current_session_reality` for live session state.

---

## Project Overview

**netbulls.kurnik.journey** is the public journey site for Kurnik — documenting every phase of building an AI-powered product incubator from idea to launch. Static HTML site deployed to VPS.

Content marketing + credibility signal. "How we built Kurnik from zero."

**Stack:** Static HTML/CSS. No framework. Self-contained HTML files with inline styles. Scripts in `scripts/` run with Bun.

## Critical Rules

- Deploy directory is `site/` — VPS serves from here
- Every HTML file must be fully self-contained (inline CSS, no external deps except Google Fonts)
- Design system: `#0e0c0a` bg, `#d4840a` amber, `#e8ddd0` text. DM Serif Display + Manrope + DM Mono.
- When a phase completes: add HTML to `site/`, update `site/index.html` status badge
- CHANGELOG entry for every milestone (ISO 8601 + timezone + location)

## Site Structure

```
site/
  index.html                # Landing — phase navigation
  brand-foundation.html     # Phase 01 ✅
  symbol-exploration.html   # Phase 02 (when complete)
  timeline.html             # AI-curated milestone timeline (generated)
  versions/                 # Frozen snapshots per release
scripts/
  build-timeline.ts         # Fetches CHANGELOGs, calls Claude API, generates timeline.html
  draft-tweet.ts            # Tweet automation (draft + post modes)
  version-inject.ts         # Injects version string into HTML
secrets/
  x-api.md.age              # Age-encrypted X/Twitter OAuth credentials
```

## Scripts

```bash
bun run build:timeline      # Regenerate timeline.html from all 3 repo CHANGELOGs
bun run tweet:draft         # Draft tweet (prints, exits 2)
bun run tweet:post          # Post tweet chain (@erace → @kurnik_ai quote-retweet)
```

Full automation details in DECISIONS.md.

---

Standards in `.claude/rules/*.md` — do not duplicate here.
