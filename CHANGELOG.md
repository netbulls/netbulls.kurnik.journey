# Changelog

All notable milestones, decisions, and achievements for **netbulls.kurnik.journey**.

Format: ISO 8601 timestamp · Location, Timezone

---

## 2026-02-21T16:33:00+01:00 · Warsaw, PL

### 🐦 First public milestone tweet posted
- @erace personal tweet: https://x.com/erace/status/2025232457792889331
- @kurnik_ai quote-tweet: https://x.com/kurnik_ai/status/2025236246461637047
- Tweet pipeline operational: AI drafts → approval → post → quote

## 2026-02-21T15:30:00+01:00 · Warsaw, PL

### 🔧 Tweet pipeline built
- `draft-tweet.ts` — AI-drafted milestone tweets via Claude API
- Two modes: `draft` (preview) and `post` (publish)
- Quote-tweet support for @kurnik_ai
- X API credentials encrypted with age
- Wired into release.sh pipeline

## 2026-02-21T14:50:00+01:00 · Warsaw, PL

### 📦 Versioning system implemented
- Ternity-pattern version injection: `git describe --tags --always`
- `version-inject.ts` stamps version into package.json + HTML
- `release.sh` — full release pipeline: tag, build, freeze snapshot, push, GitHub Release
- Frozen version snapshots at `site/versions/v{X.Y.Z}/`
- Version browser at `site/versions/index.html`

## 2026-02-21T14:00:00+01:00 · Warsaw, PL

### 📊 AI-curated timeline system
- `build-timeline.ts` — fetches changelogs from all 3 repos, sends to Claude for curation
- `timeline-template.html` — Kurnik-aesthetic vertical timeline
- Generates `site/timeline.html` with substantial milestones only
- Linked from index page as "The Build Log"

## 2026-02-21T13:41:00+01:00 · Warsaw, PL

### 📋 Distributed changelog system
- CHANGELOG.md in every Kurnik repo
- ISO 8601 timestamps with timezone + location
- Each repo owns its milestones, journey curates the public view

## 2026-02-21T13:40:00+01:00 · Warsaw, PL

### 🏗️ Journey site live at journey.kurnik.ai
- VPS deploy configured, SSL active
- Index page with phase navigation published
- Brand Foundation (Phase 01) linked and serving
- Back-link navigation between pages working

## 2026-02-21T13:00:00+01:00 · Warsaw, PL

### 🏗️ Journey repo created
- netbulls.kurnik.journey repo set up with Kurnik project pattern
- CLAUDE.md, .claude/rules, .claude/settings.json — matching netbulls.kurnik structure
- Publish directory standardized to `site/`

## 2026-02-21T12:30:00+01:00 · Warsaw, PL

### 📝 Decision: slide-based journey format
- Reference implementations reviewed: yosensi.slides.camfil.david, mercaso-bportal-slides
- Decided: content-first, static HTML. No React app. Presentation assembled as content grows.
- Each phase gets a self-contained HTML document in Kurnik aesthetic

## 2026-02-21T12:00:00+01:00 · Warsaw, PL

### 📝 Decision: domain structure locked
- journey.kurnik.ai — public journey site
- brand.kurnik.ai — brand assets
- kurnik.ai / www — marketing (future)
- app.kurnik.ai — production app (future)
- dev.app.kurnik.ai — dev environment (future)

## 2026-02-21T11:00:00+01:00 · Warsaw, PL

### 📝 Decision: repo structure locked
- All repos under netbulls GitHub org
- netbulls.kurnik (private) — product code
- netbulls.kurnik.brand (public) — brand assets
- netbulls.kurnik.journey (public) — journey site
- Deploy target: VPS (self-hosted), not managed hosting
