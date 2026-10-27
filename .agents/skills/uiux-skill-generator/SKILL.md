---
name: uiux-skill-generator
description: >-
  Generate, configure, and validate procedural UI/UX skills conforming strictly to the agentskills.io open standard. Creates self-contained, descriptive design skills (e.g., monochrome-saas-modern-design-skill) complete with canonical component recipes, zero-dependency Node.js compliance linters, and extension protocols. Use when asked to create a UI/UX skill, scaffold frontend design guidelines, or build deterministic agent skills for web applications.
compatibility: Zero-dependency Node.js v18+
metadata:
  version: "1.0.0"
  standard: "agentskills.io"
---

# UI/UX Skill Generator (`uiux-skill-generator`)

A meta-generator skill that creates self-contained, descriptive, procedural UI/UX skills conforming to the **agentskills.io** open specification. 

Instead of leaving design decisions to LLM guesswork or divergent assumptions across prompts, generated skills enforce **hard procedural control**: agents must copy from canonical component recipes and execute deterministic compliance linters before declaring UI tasks complete.

---

## When to Use This Skill

- When creating a project-specific UI/UX skill for frontend web development.
- When establishing a design system or component library workflow for AI coding agents.
- When standardizing UI consistency across team workspaces with automated WCAG AA compliance.

---

## Architecture & Progressive Disclosure

This generator operates on a 3-tier progressive disclosure model:
1. **Discovery**: Agents only read this frontmatter (~40 tokens).
2. **Activation**: Agents follow the 5-phase procedure below.
3. **Execution**: Heavy archetypes, spec rules, and templates are loaded strictly on demand from `references/` and `assets/templates/`.

### Modular References

- [spec-guidelines.md](./references/spec-guidelines.md): agentskills.io standard, constraints, and CLI script best practices.
- [archetypes.md](./references/archetypes.md): Curated design archetypes, color seeds, typography pairings, and descriptive naming conventions.
- [iteration-protocol.md](./references/iteration-protocol.md): Strict protocol for manually or programmatically updating and extending generated skills.

---

## Bundled Generator Tools

- **Scaffold New UI/UX Skill**:
  ```bash
  node scripts/scaffold-uiux-skill.js --name <descriptive-skill-name> --archetype "<archetype>" --target-dir <path>
  ```
- **Validate Skill Compliance (agentskills.io)**:
  ```bash
  node scripts/validate-skill-spec.js <path-to-skill-dir>
  ```

---

## Procedural Workflow (5 Phases)

### Phase 1: Intake & Discovery
1. Identify or clarify key design parameters:
   - **Target Archetype**: Select from [archetypes.md](./references/archetypes.md) (e.g. `Monochrome SaaS Modern`, `Ultra-Minimal Clean`, `Cyber Dark`, `Warm Editorial`, `Enterprise Portal`).
   - **Descriptive Skill Name**: Format as `<archetype-slug>-<domain>-skill` (e.g. `monochrome-saas-modern-design-skill`).
   - **Brand / Accent Seed Color**: Optional custom primary hex (e.g. `#18181b` or `#0284c7`).
   - **Framework Target**: `tailwind-v4` (default with CSS variables) or `vanilla-css`.
   - **Target Directory**: Typically `.agents/skills/<skill-name>` for project-local use, or `skills/<skill-name>`.

### Phase 2: Token Harmonization & Contrast Pre-check
1. Verify the selected brand color meets minimum WCAG 2.1 AA contrast requirements against surface canvases:
   - Body text against surfaces: **4.5:1**
   - High-contrast text on primary CTA: **4.5:1**
   - Interactive borders and controls: **3.0:1**

### Phase 3: Procedural Skill Generation
Run the non-interactive scaffolding CLI:
```bash
node scripts/scaffold-uiux-skill.js \
  --name "<descriptive-skill-name>" \
  --archetype "<archetype>" \
  --brand-color "<hex>" \
  --target-dir "<target-path>"
```
This generates the full skill directory with:
- `SKILL.md`: Master router with progressive disclosure and procedural execution steps.
- `references/`: Canonical recipes (`cards.md`, `navbar.md`, `buttons-inputs.md`, `layouts-tables.md`, `feedback-dialogs.md`, `semantic-tokens.md`, `typography.md`).
- `scripts/`: Zero-dependency Node.js CLI tools (`verify-ui-compliance.js`, `scaffold-component.js`, `check-contrast.js`, `extend-skill.js`).

### Phase 4: Spec Validation & Mirroring
1. Run the validator to ensure the generated skill meets the agentskills.io standard:
   ```bash
   node scripts/validate-skill-spec.js <target-path>
   ```
2. Confirm the exit code is `0` and all tests pass.

### Phase 5: Skill Extension & Iteration Guidance
Explain to the user or agent how to evolve the skill:
- To add new component recipes: `node scripts/extend-skill.js --add-component <name> --description "<details>"`
- To add new semantic tokens: `node scripts/extend-skill.js --add-token <name> --value-light <hex> --value-dark <hex>`
- Always refer to [iteration-protocol.md](./references/iteration-protocol.md) to keep schemas synchronized.
