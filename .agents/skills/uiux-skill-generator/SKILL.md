---
name: uiux-skill-generator
description: >-
  Generate, configure, and validate procedural UI/UX skills and components referencing ONLY the web directory (web/index.html, web/style.css, web/app.js, web/assets/). Strictly isolated to web/ without checking any other project folders. Conforms to the agentskills.io standard with deterministic recipes, tokens, and compliance linters.
compatibility: Zero-dependency Node.js v18+
metadata:
  version: "1.1.0"
  standard: "agentskills.io"
  target-scope: "web"
---

# UI/UX Skill Generator (`uiux-skill-generator`)

A meta-generator skill that creates and maintains self-contained, descriptive, procedural UI/UX skills conforming to the **agentskills.io** open specification, **referencing ONLY the `web/` directory** (`web/index.html`, `web/style.css`, `web/app.js`, `web/assets/`).

> [!IMPORTANT]
> **Strict Boundary Constraint**: This generator and all its sub-tools, templates, and linters reference **ONLY** `web/`. Never check, scan, search, or traverse any other directories or files in this workspace.

---

## When to Use This Skill

- When creating or modifying UI/UX skills, component recipes, or design tokens for `web/`.
- When standardizing UI consistency, typography, and color tokens matching the ParcelHub Mobile Web prototype in `web/`.
- When verifying accessibility (WCAG AA), interactive states, and semantic compliance across `web/`.

---

## Target Codebase & Single Source of Truth

This generator strictly derives all design tokens, layouts, and component patterns from:
- [index.html](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/web/index.html): Studio control bar, mobile phone mockup, SVG assets, and modal wrappers.
- [style.css](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/web/style.css): Custom CSS variables, fonts, animations (`.pulse-green`, `.btn-press`, `.dynamic-island`, `.floating-nav`).
- [app.js](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/web/app.js): Screen routing, bottom navigation bars, MPIN authorization keypad, escrow policies, and order tracking.
- [assets/](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/web/assets): Canonical vector icons (`home_icon.svg`, `orders_icon.svg`, `help_icon.svg`, `profile_icon.svg`, `bell_icon.svg`, `bottom_nav_bar.svg`, etc.).

---

## Architecture & Progressive Disclosure

1. **Discovery**: Agents parse only the frontmatter (~40 tokens).
2. **Activation**: Agents follow the 5-phase procedure below, locked to `web/`.
3. **Execution**: Heavy archetypes, spec rules, and templates are loaded strictly on demand from `references/` and `assets/templates/`.

### Modular References

- [spec-guidelines.md](./references/spec-guidelines.md): agentskills.io standard, constraints, and web-only isolation rules.
- [archetypes.md](./references/archetypes.md): Curated archetypes featuring `ParcelHub Mobile Web` as primary, with color seeds and typography.
- [iteration-protocol.md](./references/iteration-protocol.md): Strict protocol for manually or programmatically updating and extending generated skills.

---

## Bundled Generator Tools

All tools default to or require paths strictly within `web/`:

- **Scaffold New UI/UX Skill**:
  ```bash
  node scripts/scaffold-uiux-skill.js --name <descriptive-skill-name> --archetype "ParcelHub Mobile Web" --target-dir <path>
  ```
- **Validate Skill Compliance (agentskills.io)**:
  ```bash
  node scripts/validate-skill-spec.js <path-to-skill-dir>
  ```
- **Lint UI Compliance (Restricted to `web/`)**:
  ```bash
  node assets/templates/scripts/verify-ui-compliance.js web/
  ```

---

## Procedural Workflow (5 Phases)

### Phase 1: Intake & Discovery (Restricted to `web/`)
1. Review requirements against `web/`:
   - **Target Archetype**: `ParcelHub Mobile Web` (default) or other curated variants in [archetypes.md](./references/archetypes.md).
   - **Descriptive Skill Name**: Format as `<archetype-slug>-<domain>-skill` (e.g. `parcelhub-mobile-web-skill`).
   - **Brand / Accent Colors**: Sourced from `web/style.css` (`--primary-blue: #215cd4`, `--navy-dark: #163b86`, `--card-dark: #1e1e1e`, `--success-green: #10b780`, `--warning-gold: #c58b12`, `--pillGreen: #93eb99`).
   - **Target Framework**: HTML + Tailwind CSS + Vanilla JS (as implemented in `web/index.html` and `web/app.js`).
   - **Target Directory**: Local `.agents/skills/<skill-name>` or targeting `web/`.

### Phase 2: Token Harmonization & Contrast Pre-check
1. Ensure colors conform to WCAG 2.1 AA against canvases:
   - Body text against surfaces: **4.5:1**
   - High-contrast text on primary CTA: **4.5:1**
   - Interactive borders and controls: **3.0:1**

### Phase 3: Procedural Skill Generation
Run the non-interactive scaffolding CLI:
```bash
node scripts/scaffold-uiux-skill.js \
  --name "<descriptive-skill-name>" \
  --archetype "ParcelHub Mobile Web" \
  --brand-color "#215cd4" \
  --target-dir "<target-path>"
```
This generates the full skill directory with:
- `SKILL.md`: Master router with progressive disclosure referencing `web/`.
- `references/`: Canonical recipes (`cards.md`, `navbar.md`, `buttons-inputs.md`, `layouts-tables.md`, `feedback-dialogs.md`, `semantic-tokens.md`, `typography.md`).
- `scripts/`: Zero-dependency Node.js CLI tools (`verify-ui-compliance.js`, `scaffold-component.js`, `check-contrast.js`, `extend-skill.js`).

### Phase 4: Spec Validation & Mirroring
1. Run the validator to ensure the generated skill meets the agentskills.io standard:
   ```bash
   node scripts/validate-skill-spec.js <target-path>
   ```
2. Confirm the exit code is `0` and all tests pass.

### Phase 5: Skill Extension & Iteration Guidance
- To add new component recipes: `node scripts/extend-skill.js --add-component <name> --description "<details>"`
- To add new semantic tokens: `node scripts/extend-skill.js --add-token <name> --value-light <hex> --value-dark <hex>`
- All extensions must align strictly with patterns established in `web/`.

