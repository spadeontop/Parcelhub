---
name: {{SKILL_NAME}}
description: >-
  Build, style, and verify UI components and frontend views using the {{ARCHETYPE}} design system with strict token recipes and deterministic compliance linting. Use when generating or modifying frontend UI/UX in this project.
compatibility: Zero-dependency Node.js v18+
metadata:
  archetype: "{{ARCHETYPE}}"
  version: "1.0.0"
---

# {{SKILL_NAME}} (Procedural UI/UX Design System)

A deterministic, procedural UI/UX skill enforcing the **{{ARCHETYPE}}** design system. Strictly locks down design decisions using pre-validated component recipes and automated compliance verification to prevent inconsistent styles or hallucinated classes across agent turns.

---

## When to Use This Skill

- When creating or modifying frontend user interfaces, pages, or components in this project.
- When generating cards, forms, navigation headers, tables, modals, or layouts.
- When checking UI code for WCAG AA compliance, semantic token adherence, and interactive states.

---

## Hard Control Principles

1. **CANONICAL RECIPES ONLY**: Do not invent CSS classes or structure from scratch. Copy and adapt exact recipes from the [references/](./references) directory.
2. **ZERO ARBITRARY VALUES**: Never use arbitrary hex codes (`bg-[#...]`) or unmapped Tailwind color palettes (`bg-blue-500`). Use predefined semantic tokens (`bg-primary`, `bg-surface`, `text-foreground`, `border-border`).
3. **MANDATORY VERIFICATION**: After creating or modifying any UI file, run `node scripts/verify-ui-compliance.js <path>` to deterministically verify compliance.
4. **NO EMOJIS IN UI**: Never use emojis as decorative or icon elements. Use clean SVG icons or semantic badges.
5. **APPLICATION SHELL FIRST (NO LANDING PAGE DRIFT)**: For dashboards, admin panels, and SaaS tools, ALWAYS build within an application shell (`<aside>` sidebar navigation + clean main workspace). Never default to marketing hero banners, giant splash headlines, or single-page marketing scroll containers for functional tasks.
6. **PROGRESSIVE DISCLOSURE (PoLP)**: Complex mutations (entity creation, credential changes) and deep detail inspections must use **Modals or Slide-Over Drawers** from `references/feedback-dialogs.md` rather than cluttering page surfaces.

---

## Component Reference Index

Before writing any markup, consult the corresponding canonical recipe:

| Component | Reference File | Primary Recipe |
| :--- | :--- | :--- |
| **Tokens & Theme** | [semantic-tokens.md](./references/semantic-tokens.md) | 60-30-10 distribution and CSS variables |
| **Typography** | [typography.md](./references/typography.md) | Responsive scales, heading hierarchy, tracking |
| **Buttons & Inputs** | [buttons-inputs.md](./references/buttons-inputs.md) | Primary, secondary, outline, text fields, selects |
| **Cards & Panels** | [cards.md](./references/cards.md) | KPI metric cards, action cards, containers |
| **Navigation & Header** | [navbar.md](./references/navbar.md) | App header, breadcrumbs, theme switcher |
| **Layouts & Tables** | [layouts-tables.md](./references/layouts-tables.md) | App shell, sidebar, responsive data tables |
| **Modals & Drawers** | [feedback-dialogs.md](./references/feedback-dialogs.md) | Form modals, slide-over sheets, alerts, empty states |

---

## Bundled Tool Scripts

Execute these scripts directly in the terminal to scaffold and verify UI code:

- **Extract Component Boilerplate**:
  ```bash
  node scripts/scaffold-component.js --type <card|button|navbar|input|modal|drawer|table>
  ```
- **Audit WCAG Contrast**:
  ```bash
  node scripts/check-contrast.js
  ```
- **Lint UI Compliance (Mandatory Step)**:
  ```bash
  node scripts/verify-ui-compliance.js <path-to-html-or-component>
  ```
- **Extend Skill with New Component**:
  ```bash
  node scripts/extend-skill.js --add-component <name> --description "<details>"
  ```

---

## Procedural Workflow (5 Steps)

### Step 0: Layout Archetype Gate & Scope
Classify the view before writing markup:
- **Application Tool / Dashboard (DEFAULT)**: Must use an application shell (`<aside>` sidebar navigation, view router, structured metric/table grid from `references/layouts-tables.md`). Entity mutations and inspections must use **Modals or Drawer Sheets** (`references/feedback-dialogs.md`). Marketing hero banners are **strictly forbidden**.
- **Marketing / Content Page**: Dedicated landing page, documentation, or public announcement. Uses hero section, feature grid, and footer CTA.

### Step 1: Identify Required Components
Scan requirements and identify components (e.g. Sidebar + Metric Cards + Data Table + Creation Modal). Open the corresponding reference file(s) in `references/`.

### Step 2: Extract Canonical Recipes
Use the scaffolding script to retrieve verified markup:
```bash
node scripts/scaffold-component.js --type card --variant metric
node scripts/scaffold-component.js --type modal --variant form
node scripts/scaffold-component.js --type drawer --variant detail
```
Alternatively, copy the exact code block from `references/<component>.md`.

### Step 3: Assemble & Wire Up Interface
Integrate the component into the page layout:
- Ensure surfaces follow the 60-30-10 rule: Canvas (`bg-background`), Cards (`bg-surface`), Elevated panels/Modals (`bg-surface-elevated`).
- Use `font-sans` for text and `font-mono` for metrics and numbers.
- Maintain accessible markup: ensure all `<button>` elements have text or `aria-label`, `<input>` elements have labels, and `<img>` elements have `alt`.

### Step 4: Run Deterministic Compliance Verification
Run the linter on the target file:
```bash
node scripts/verify-ui-compliance.js path/to/index.html
```
- If errors are reported, inspect the line number and remediation instruction, adjust the markup, and rerun until the check passes with `0 errors`.
