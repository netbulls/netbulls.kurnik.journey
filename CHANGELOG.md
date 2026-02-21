# Changelog

All notable milestones, decisions, and achievements for **netbulls.kurnik.journey**.

Format: ISO 8601 timestamp · Location, Timezone

---

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
