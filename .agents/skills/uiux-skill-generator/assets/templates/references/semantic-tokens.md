# Semantic Tokens Contract (60-30-10 Architecture)

This document defines the strict color, surface, and elevation token contract for **{{SKILL_NAME}}** (Archetype: **{{ARCHETYPE}}**).
AI agents MUST use these semantic classes and MUST NOT introduce arbitrary hex codes (`bg-[#...]`) or unmapped Tailwind utilities.

---

## 1. 60-30-10 System Allocation

### 60% Dominant (Canvas & Primary Surfaces)
Provides the calm, grounding canvas for the entire interface.
- `bg-background`: Main application canvas. Light: `{{COLOR_BG_LIGHT}}`, Dark: `{{COLOR_BG_DARK}}`.
- `bg-surface`: Default component card/container canvas. Light: `{{COLOR_SURFACE_LIGHT}}`, Dark: `{{COLOR_SURFACE_DARK}}`.
- `text-foreground`: Primary high-contrast body and heading text. Light: `{{COLOR_TEXT_LIGHT}}`, Dark: `{{COLOR_TEXT_DARK}}`.

### 30% Secondary (Hierarchy, Structural Borders, Elevated Surfaces)
Creates depth, structure, and readable divisions.
- `bg-surface-elevated`: Hover states, dropdowns, popovers, and elevated modal panels. Light: `{{COLOR_SURFACE_ELEVATED_LIGHT}}`, Dark: `{{COLOR_SURFACE_ELEVATED_DARK}}`.
- `bg-muted`: Subtle fill for chips, code blocks, inactive tabs, and input backings. Light: `{{COLOR_MUTED_LIGHT}}`, Dark: `{{COLOR_MUTED_DARK}}`.
- `text-muted-foreground`: Secondary meta-data, timestamps, placeholders, and descriptions. Light: `{{COLOR_TEXT_MUTED_LIGHT}}`, Dark: `{{COLOR_TEXT_MUTED_DARK}}`.
- `border-border`: Primary container and card borders (1px solid). Light: `{{COLOR_BORDER_LIGHT}}`, Dark: `{{COLOR_BORDER_DARK}}`.
- `border-border-subtle`: Divider lines and table row separators. Light: `{{COLOR_BORDER_SUBTLE_LIGHT}}`, Dark: `{{COLOR_BORDER_SUBTLE_DARK}}`.

### 10% Accent (Interactive Focus & Primary Calls-to-Action)
Draws the user's eye directly to key interactive decisions. Never overused.
- `bg-primary`: Primary CTA button background and active state indicator. Light: `{{COLOR_PRIMARY_LIGHT}}`, Dark: `{{COLOR_PRIMARY_DARK}}`.
- `text-primary-foreground`: High-contrast text rendered on top of `bg-primary`. Light: `{{COLOR_PRIMARY_FG_LIGHT}}`, Dark: `{{COLOR_PRIMARY_FG_DARK}}`.
- `hover:bg-primary-hover`: Interactive hover state for primary elements.
- `ring-ring`: Focus-visible outline ring for accessible keyboard navigation (`focus-visible:ring-2 focus-visible:ring-ring`).

---

## 2. Functional & Status Tokens

Used strictly for state communication (not decorative styling):
- **Success**: `bg-success` / `text-success` / `bg-success-subtle`
- **Warning**: `bg-warning` / `text-warning` / `bg-warning-subtle`
- **Destructive**: `bg-destructive` / `text-destructive` / `bg-destructive-subtle`
- **Info**: `bg-info` / `text-info` / `bg-info-subtle`

---

## 3. Tailwind Configuration & CSS Variables (from `web/`)

When configuring Tailwind and CSS in `web/index.html` and `web/style.css`:

```html
<!-- Tailwind CDN & Brand Palette Extension -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            blue: '#215cd4',
            blueHover: '#194cb5',
            navy: '#163b86',
            dark: '#1e1e1e',
            emerald: '#10b780',
            gold: '#c58b12',
            pillGreen: '#93eb99'
          }
        },
        fontFamily: {
          sans: ['"Google Sans Flex"', '"Google Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace']
        }
      }
    }
  }
</script>
```

In `web/style.css`:
```css
:root {
  --font-main: 'Google Sans Flex', 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --primary-blue: #215cd4;
  --primary-blue-hover: #194cb5;
  --navy-dark: #163b86;
  --card-dark: #1e1e1e;
  --success-green: #10b780;
  --warning-gold: #c58b12;
  --danger-red: #ef4444;
}
```

---

## 4. Anti-Patterns & Hard Constraints

1. **NO Unregistered Hex Colors**: All colors must resolve to the verified `web/` palette (`#215cd4`, `#163b86`, `#1e1e1e`, `#10b780`, `#93eb99`, `#c58b12`, `#ef4444`).
2. **Strict Workspace Boundary**: This token contract references ONLY `web/`. Never check or import styles from other workspace directories.
3. **Contrast Verification**: Run `node scripts/check-contrast.js` to ensure text-to-surface contrast remains >= 4.5:1.
