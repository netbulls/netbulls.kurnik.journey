# Directory Boundaries

## Site Root

`site/` is the deployable directory. Netlify serves from here. Every file in this directory must be production-ready.

## Working Files

Drafts, notes, and work-in-progress go in `drafts/` (gitignored if needed). Only move to `site/` when ready to publish.

## No Build Step

There is no build pipeline. Files in `site/` are served as-is. This means:
- No TypeScript, no JSX, no SCSS
- Plain HTML, CSS, and vanilla JS only
- All styles inline or in `<style>` tags
- External dependencies limited to Google Fonts CDN
