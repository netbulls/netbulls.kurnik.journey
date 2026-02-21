# Kurnik Journey

> From idea to product — building in public 🐔

The complete, documented journey of building [Kurnik](https://kurnik.ai) — an AI-powered product incubator where ideas come home to roost.

## What This Is

A public-facing site that captures every phase of building Kurnik: naming, brand identity, architecture decisions, tech stack choices, implementation, and launch. Every decision documented. Every iteration captured.

## Structure

```
site/                   Deployable site root
  index.html            Journey landing page
  brand-foundation.html Phase 01: Brand Foundation
  ...                   Future phases added here
```

## Kurnik Project Repos

| Repo | Visibility | Purpose |
|------|-----------|----------|
| `netbulls.kurnik` | Private | Product code |
| `netbulls.kurnik.brand` | Public | Brand assets & design iterations |
| `netbulls.kurnik.journey` | Public | This repo — the published journey site |

## Deploy

VPS: `cd deploy && ./deploy.sh` — rsyncs `site/` to VPS, served by Caddy container at journey.kurnik.ai.

---

Built by [netbulls](https://github.com/netbulls) · kurnik.ai
