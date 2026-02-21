# CLAUDE.md

> **Do NOT run `/init` on this project** — it will overwrite these instructions.

## Project Overview

**netbulls.kurnik.journey** is the public journey site for Kurnik — documenting every phase of building an AI-powered product incubator from idea to launch. Static HTML site deployed to Netlify.

This is content marketing and credibility signal. Shows structured product thinking in action — "how we built Kurnik from zero."

**Stack:** Static HTML/CSS. No build step. No framework. Self-contained HTML documents with inline styles. Google Fonts loaded via CDN.

## Key Design Decisions

- **Static HTML only** — no React, no build pipeline. Each phase document is a self-contained HTML file.
- **Kurnik aesthetic** — dark backgrounds (#0C0A09), warm amber accents (#F59E0B), DM Serif Display + Plus Jakarta Sans + JetBrains Mono.
- **Content-first** — presentation is secondary. Documents capture decisions, rationale, iterations. Polish comes from consistent aesthetic, not animation complexity.
- **Phase documents** — each phase of the project gets its own HTML file in `site/`. Index page links to completed phases. Future phases shown as disabled.

## Dependencies

- **netbulls.kurnik.brand** — brand assets feed into the journey. Brand foundation document originated there, published copy lives here.
- **netbulls.kurnik** — private product repo. Architecture/tech decisions from there get documented as journey phases.

## Site Structure

```
site/
  index.html              Landing page with phase navigation
  brand-foundation.html   Phase 01 (complete)
  symbol-exploration.html  Phase 02 (when complete)
  ...                     Future phases
```

## Critical Rules

- Publish directory is `site/` — Netlify serves from here
- Every HTML file must be fully self-contained (inline CSS, no external dependencies except Google Fonts)
- Keep the design system consistent: same CSS variables, same fonts, same component patterns across all phase documents
- When a phase completes, update `site/index.html` to link to it and flip its status badge

---

Standards for Directory Boundaries, Versioning, Environments, Workflow, and Stack are in `.claude/rules/*.md` — loaded automatically, do not duplicate here.

## Global Learnings

Cross-project learnings are stored at: `$CLAUDE_PROJECTS_HOME/LEARNINGS.md`

When the user says something is worth adding to global learnings, append it to that file with the project name and date. Always confirm with the user before writing.
