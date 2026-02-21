# Workflow

## Phase Completion

1. Create the phase HTML document in `site/`
2. Update `site/index.html` — change the phase from disabled div to linked anchor, flip status badge
3. Commit with message: `Add Phase XX: [Name]`
4. Deploy to VPS: `cd deploy && ./deploy.sh`

## Content Standards

- Every phase document must explain WHAT was decided and WHY
- Include iterations and rejected alternatives where relevant
- Artifacts (SVGs, comparisons, scoring sheets) embedded inline
- Self-contained — reader needs no external context

## Commits

- Conventional style: `Add Phase 02: Symbol Exploration`
- Content updates: `Update index — mark Phase 02 complete`
- Fixes: `Fix typo in brand foundation`
