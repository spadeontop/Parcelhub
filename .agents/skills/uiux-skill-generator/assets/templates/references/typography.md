# Typography Scales & Hierarchy

This document defines the strict typographic contract for **{{SKILL_NAME}}**.
Adhere strictly to these font pairings, hierarchy rules, and line-height combinations.

---

## 1. Font Family Stacks

- **Primary Sans (Body & UI)**:
  `font-sans`: `{{FONT_PRIMARY}}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace (Data, Code & Numeric Metrics)**:
  `font-mono`: `{{FONT_MONO}}, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

---

## 2. Type Hierarchy Scale

| Semantic Role | Tailwind Recipe | Tracking & Leading | Usage |
| :--- | :--- | :--- | :--- |
| **Page Title (`h1`)** | `text-3xl sm:text-4xl font-bold text-foreground` | `tracking-tight leading-tight` | Single per view / page hero |
| **Section Header (`h2`)** | `text-xl sm:text-2xl font-semibold text-foreground` | `tracking-tight leading-snug` | Major view section |
| **Subsection Header (`h3`)**| `text-lg font-medium text-foreground` | `tracking-normal leading-normal` | Card header or list group |
| **Card / Group Header (`h4`)**| `text-sm font-medium text-foreground` | `tracking-normal leading-tight` | Small card titles, widget labels |
| **Body (Default)** | `text-sm font-normal text-foreground` | `leading-relaxed` | Paragraphs, documentation text |
| **Body (Muted)** | `text-sm font-normal text-muted-foreground` | `leading-relaxed` | Descriptions, secondary context |
| **Caption / Meta** | `text-xs font-normal text-muted-foreground` | `leading-normal` | Timestamps, tags, footnotes |
| **Metric Hero** | `text-2xl sm:text-3xl font-bold font-mono text-foreground` | `tracking-tight` | KPI metrics, financial numbers |

---

## 3. Typographic Recipes

### Hero Section Header
```html
<div class="space-y-1">
  <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Overview</h1>
  <p class="text-sm text-muted-foreground">Monitor system performance and real-time metric streams.</p>
</div>
```

### Section Header with Action
```html
<div class="flex items-center justify-between pb-4 border-b border-border-subtle">
  <div class="space-y-0.5">
    <h2 class="text-xl font-semibold tracking-tight text-foreground">Active Deployments</h2>
    <p class="text-xs text-muted-foreground">Showing 14 healthy services across 3 regions.</p>
  </div>
  <button class="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">
    Deploy New
  </button>
</div>
```

---

## 4. Anti-Patterns & Rules

1. **NO Arbitrary Font Sizes**: Do not use `text-[13px]`. Use predefined `text-xs`, `text-sm`, `text-base`.
2. **NO Heading Level Skipping**: Never jump from an `h1` directly to an `h3` in the DOM tree. Always maintain semantic document outlines.
3. **Always Pair High Contrast**: Use `text-foreground` for primary headings and `text-muted-foreground` for auxiliary context.
