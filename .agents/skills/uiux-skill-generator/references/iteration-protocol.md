# Skill Iteration & Extension Protocol

This document defines the strict specification for manually or programmatically updating and extending an existing procedural UI/UX skill when developer design assumptions or component requirements evolve.

---

## 1. Principles of Skill Evolution

When a developer introduces new design requirements (e.g., adding an Accordion component, adding an amber warning badge, or updating border radii):
1. **Never Improvise in Code First**: Do not generate new UI markup directly without first codifying the canonical recipe into the skill's references.
2. **Deterministic Synchronization**: Every component recipe added to `references/` must be mirrored in `scripts/scaffold-component.js` and audited by `scripts/verify-ui-compliance.js`.
3. **Preserve Token Contract**: New colors or surface elevations must be registered in `references/semantic-tokens.md` and validated for WCAG contrast before use.

---

## 2. Automated Extension Workflow (Recommended)

Every generated skill bundles the non-interactive script `scripts/extend-skill.js`.

### Adding a New Component Recipe
```bash
node scripts/extend-skill.js --add-component "accordion" \
  --description "Collapsible disclosure item with animated chevron and keyboard toggle" \
  --markup "path/to/accordion.html"
```
This command:
1. Creates `references/accordion.md` with the standard blueprint structure (variants, accessibility checklist, markup recipe).
2. Updates `SKILL.md` to register the new reference in the component catalog.
3. Automatically enables `node scripts/scaffold-component.js --type accordion` via dynamic reference discovery.

### Registering a New Semantic Token
```bash
node scripts/extend-skill.js --add-token "warning-subtle" \
  --value-light "#fef3c7" \
  --value-dark "#78350f" \
  --role "30% secondary background for warning notices"
```
This command:
1. Validates the contrast against `text-foreground`.
2. Updates `references/semantic-tokens.md`.
3. Whitelists the token in `scripts/verify-ui-compliance.js`.

---

## 3. Manual Component Extension Specification

If extending `references/<component>.md` manually, adhere strictly to this 4-section schema:

```markdown
# [Component Name] Recipe

## 1. Design Tokens & Constraints
- Surface: bg-surface / bg-surface-elevated
- Border: border border-border
- Interactive: hover:border-border-subtle focus-visible:ring-2 focus-visible:ring-ring
- Touch Target: minimum 44px height for interactive triggers

## 2. Accessibility Checklist (WCAG 2.1 AA)
- [ ] Appropriate ARIA attributes (e.g. aria-expanded="false", aria-controls="...")
- [ ] Keyboard accessible (Enter and Space activate toggle)
- [ ] Contrast ratio between text and surface >= 4.5:1

## 3. Canonical Recipe (Copy-Paste Target)
\`\`\`html
<!-- Paste exact Tailwind v4 / Semantic token markup here -->
\`\`\`

## 4. Variants
- Default / Inactive
- Active / Expanded
- Disabled state
```

---

## 4. Verification Check
After any manual or automated skill iteration:
1. Run `node scripts/check-contrast.js` to ensure token changes did not break WCAG contrast.
2. Run `node scripts/validate-skill-spec.js .` to confirm frontmatter and file integrity remain intact.
