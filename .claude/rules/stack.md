# Stack

## Site

- **Format:** Static HTML
- **Styling:** Inline CSS with shared design tokens (CSS variables)
- **Fonts:** Google Fonts — DM Serif Display, Plus Jakarta Sans, JetBrains Mono
- **Deploy:** Netlify from `site/` directory
- **Domain:** TBD (journey.kurnik.ai or similar)

## Design Tokens

```css
--bg-deep: #0C0A09;
--bg-surface: #1C1917;
--bg-elevated: #292524;
--text-primary: #FAFAF9;
--text-secondary: #A8A29E;
--text-muted: #78716C;
--accent-warm: #F59E0B;
--accent-egg: #FDE68A;
--accent-rooster: #DC2626;
--border: rgba(168, 162, 158, 0.12);
```

## No Framework

This is intentionally framework-free. If we ever need interactivity beyond vanilla JS, we'll evaluate then. The constraint is a feature — forces content focus.
