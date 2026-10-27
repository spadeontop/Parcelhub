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

## 3. Tailwind v4 Theme & CSS Variables Definition

When mounting into HTML/Vite:
```html
<style type="text/tailwindcss">
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-ring: var(--ring);
}

:root {
  --background: {{COLOR_BG_LIGHT}};
  --foreground: {{COLOR_TEXT_LIGHT}};
  --surface: {{COLOR_SURFACE_LIGHT}};
  --surface-elevated: {{COLOR_SURFACE_ELEVATED_LIGHT}};
  --muted: {{COLOR_MUTED_LIGHT}};
  --muted-foreground: {{COLOR_TEXT_MUTED_LIGHT}};
  --border: {{COLOR_BORDER_LIGHT}};
  --border-subtle: {{COLOR_BORDER_SUBTLE_LIGHT}};
  --primary: {{COLOR_PRIMARY_LIGHT}};
  --primary-foreground: {{COLOR_PRIMARY_FG_LIGHT}};
  --ring: {{COLOR_PRIMARY_LIGHT}};
}

.dark {
  --background: {{COLOR_BG_DARK}};
  --foreground: {{COLOR_TEXT_DARK}};
  --surface: {{COLOR_SURFACE_DARK}};
  --surface-elevated: {{COLOR_SURFACE_ELEVATED_DARK}};
  --muted: {{COLOR_MUTED_DARK}};
  --muted-foreground: {{COLOR_TEXT_MUTED_DARK}};
  --border: {{COLOR_BORDER_DARK}};
  --border-subtle: {{COLOR_BORDER_SUBTLE_DARK}};
  --primary: {{COLOR_PRIMARY_DARK}};
  --primary-foreground: {{COLOR_PRIMARY_FG_DARK}};
  --ring: {{COLOR_PRIMARY_DARK}};
}
</style>
```

---

## 4. Anti-Patterns & Hard Constraints

1. **NO Arbitrary Hex Inlining**: Never write `<div class="bg-[#121212]">`. Always use `<div class="bg-surface">`.
2. **NO Hardcoded Grays**: Do not use `text-gray-400` or `border-zinc-800`. Always use `text-muted-foreground` and `border-border`.
3. **Contrast Verification**: Run `node scripts/check-contrast.js` if tweaking variable values.
