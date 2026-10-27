# Semantic Tokens Contract (60-30-10 Architecture)

This document defines the strict color, surface, and elevation token contract for **modern-mobile-fintech-design-skill** (Archetype: **Cyber Dark**).
AI agents MUST use these semantic classes and MUST NOT introduce arbitrary hex codes (`bg-[#...]`) or unmapped Tailwind utilities.

---

## 1. 60-30-10 System Allocation

### 60% Dominant (Canvas & Primary Surfaces)
Provides the calm, grounding canvas for the entire interface.
- `bg-background`: Main application canvas. Light: `#f8fafc`, Dark: `#08090a`.
- `bg-surface`: Default component card/container canvas. Light: `#ffffff`, Dark: `#0f1012`.
- `text-foreground`: Primary high-contrast body and heading text. Light: `#0f172a`, Dark: `#f1f5f9`.

### 30% Secondary (Hierarchy, Structural Borders, Elevated Surfaces)
Creates depth, structure, and readable divisions.
- `bg-surface-elevated`: Hover states, dropdowns, popovers, and elevated modal panels. Light: `#f1f5f9`, Dark: `#17181c`.
- `bg-muted`: Subtle fill for chips, code blocks, inactive tabs, and input backings. Light: `#f1f5f9`, Dark: `#15171d`.
- `text-muted-foreground`: Secondary meta-data, timestamps, placeholders, and descriptions. Light: `#64748b`, Dark: `#8b949e`.
- `border-border`: Primary container and card borders (1px solid). Light: `#cbd5e1`, Dark: `#22242a`.
- `border-border-subtle`: Divider lines and table row separators. Light: `#f1f5f9`, Dark: `#16181e`.

### 10% Accent (Interactive Focus & Primary Calls-to-Action)
Draws the user's eye directly to key interactive decisions. Never overused.
- `bg-primary`: Primary CTA button background and active state indicator. Light: `#2563eb`, Dark: `#2563eb`.
- `text-primary-foreground`: High-contrast text rendered on top of `bg-primary`. Light: `#fafafa`, Dark: `#fafafa`.
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
  --background: #f8fafc;
  --foreground: #0f172a;
  --surface: #ffffff;
  --surface-elevated: #f1f5f9;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --border: #cbd5e1;
  --border-subtle: #f1f5f9;
  --primary: #2563eb;
  --primary-foreground: #fafafa;
  --ring: #2563eb;
}

.dark {
  --background: #08090a;
  --foreground: #f1f5f9;
  --surface: #0f1012;
  --surface-elevated: #17181c;
  --muted: #15171d;
  --muted-foreground: #8b949e;
  --border: #22242a;
  --border-subtle: #16181e;
  --primary: #2563eb;
  --primary-foreground: #fafafa;
  --ring: #2563eb;
}
</style>
```

---

## 4. Anti-Patterns & Hard Constraints

1. **NO Arbitrary Hex Inlining**: Never write `<div class="bg-[#121212]">`. Always use `<div class="bg-surface">`.
2. **NO Hardcoded Grays**: Do not use `text-gray-400` or `border-zinc-800`. Always use `text-muted-foreground` and `border-border`.
3. **Contrast Verification**: Run `node scripts/check-contrast.js` if tweaking variable values.
