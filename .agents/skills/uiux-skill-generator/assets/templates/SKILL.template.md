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

1. **CANONICAL RECIPES ONLY**: Do not invent CSS classes or structure from scratch. Copy and adapt exact recipes from the [references/](./references) directory referencing `web/`.
2. **ZERO ARBITRARY VALUES**: Never use unmapped arbitrary hex codes. Use predefined semantic tokens and brand tokens matching `web/style.css` (`bg-[#215cd4]`, `bg-[#163b86]`, `bg-[#1e1e1e]`, `text-[#10b780]`, `bg-[#93eb99]`, etc.).
3. **MANDATORY VERIFICATION**: After creating or modifying any UI file in `web/`, run `node scripts/verify-ui-compliance.js web/` to deterministically verify compliance.
4. **NO EMOJIS IN UI**: Never use emojis as decorative or icon elements. Use clean SVG icons matching `web/assets/` (`home_icon.svg`, `orders_icon.svg`, `help_icon.svg`, `profile_icon.svg`, `bell_icon.svg`).
5. **MOBILE APPLICATION SHELL FIRST**: For mobile prototypes and hub operations, ALWAYS build within the mobile phone mockup frame (`.phone-mockup`, `.dynamic-island`, status bar, floating bottom nav bar). Do not default to desktop sidebar navigation.
6. **PROGRESSIVE DISCLOSURE (PoLP)**: Complex mutations (entity creation, deposit verification, MPIN authorization) and details inspections must use **Modals or Bottom Drawers** from `references/feedback-dialogs.md` rather than cluttering the screen viewport.
7. **WORKSPACE SCOPE ISOLATION**: Strictly reference ONLY `web/`. Never check or modify files outside `web/`.

---

## Component Reference Index

Before writing any markup, consult the corresponding canonical recipe:

| Component | Reference File | Primary Recipe |
| :--- | :--- | :--- |
| **Tokens & Theme** | [semantic-tokens.md](./references/semantic-tokens.md) | 60-30-10 distribution and CSS variables from `web/` |
| **Typography** | [typography.md](./references/typography.md) | Google Sans Flex / Plus Jakarta Sans & JetBrains Mono |
| **Buttons & Inputs** | [buttons-inputs.md](./references/buttons-inputs.md) | Primary Blue, Navy, Pill Green, receipt dropzone |
| **Cards & Panels** | [cards.md](./references/cards.md) | Welcome Dark Card, Activities List, Zero Orders Empty State |
| **Navigation & Header** | [navbar.md](./references/navbar.md) | Mobile brand header, floating bottom nav, labeled bottom nav |
| **Layouts & Tables** | [layouts-tables.md](./references/layouts-tables.md) | Phone frame mockup, dynamic island, stepper timeline |
| **Modals & Drawers** | [feedback-dialogs.md](./references/feedback-dialogs.md) | 6-Digit MPIN modal, PoD modal, Escrow modal, Drawer, Toast |

---

## Bundled Tool Scripts

Execute these scripts directly in the terminal to scaffold and verify UI code:

- **Extract Component Boilerplate**:
  ```bash
  node scripts/scaffold-component.js --type <card|button|navbar|input|modal|drawer|layout>
  ```
- **Audit WCAG Contrast**:
  ```bash
  node scripts/check-contrast.js
  ```
- **Lint UI Compliance (Mandatory Step - Scoped to `web/`)**:
  ```bash
  node scripts/verify-ui-compliance.js web/
  ```
- **Extend Skill with New Component**:
  ```bash
  node scripts/extend-skill.js --add-component <name> --description "<details>"
  ```

---

## Procedural Workflow (5 Steps)

### Step 0: Layout Archetype Gate & Scope
Classify the view before writing markup:
- **Mobile Application Shell (DEFAULT)**: Must use the mobile viewport (`#mobile-screen-content` inside `#phone-frame`, floating bottom nav from `references/navbar.md`). Entity mutations and inspections must use **Modals or Bottom Drawers** (`references/feedback-dialogs.md`). Desktop sidebar layouts are **strictly forbidden**.
- **Studio Wrapper**: Ambient background (`bg-slate-900`) containing the top control bar (`#screen-select`, `#hub-status-toggle`) hosting the phone frame.

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
