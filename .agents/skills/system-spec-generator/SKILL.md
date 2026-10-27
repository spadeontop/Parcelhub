---
name: system-spec-generator
description: >-
  Generate, scaffold, and dynamically evolve 100% authoritative functional and system architecture specification skills conforming to the agentskills.io standard. Compiles project requirements, rough developer notes, or existing codebases into progressive-disclosure functional specs (macro topology, concrete routes, RBAC permissions matrix, and business flow state machines). Includes a Consistency & Ripple Analysis engine to fluidly update specs when contracts, database drivers, or data structures evolve. Use when asked to generate a functional spec, plan system routes, design backend architecture, or update existing system contracts.
compatibility: Zero-dependency Node.js v18+
metadata:
  version: "1.0.0"
  standard: "agentskills.io"
---

# System Spec Generator (`system-spec-generator`)

A meta-compiler skill that creates and maintains self-contained, 100% authoritative functional and architectural specification skills conforming to the **agentskills.io** open standard.

Instead of leaving backend routing, authorization, and state transitions to LLM guesswork or divergent assumptions during autonomous or low-touch coding, generated skills **shoulder the entire functional flow**: downstream coding agents consult the specification as the single ground truth for routes, roles, database transactions, and data envelopes.

---

## When to Use This Skill

- When designing the functional architecture, API routes, or RBAC matrix for a new greenfield project.
- When extracting and formalizing the functional specification of an existing brownfield codebase.
- When a developer says: *"Plan the routes and flows for this feature"*, *"Create the functional spec"*, or *"Design the backend spec"*.
- When an existing project specification needs to **fluidly adapt** (e.g. *"Switch from mysqli to PDO"*, *"Change guest session shape"*, *"Add new route DELETE /api/queue/:id"*).

---

## Architectural Partnership & Principles

1. **Developer as Chief Architect**: The developer holds the vision and domain requirements. Always default to asking, consulting, and clarifying architectural choices and edge cases rather than making arbitrary assumptions.
2. **End-to-End Macro Topology**: Always trace the complete data flow (Clients -> Transport/API -> Backend Services -> Database/Cache) so downstream agents never mix client/server boundaries.
3. **The 100% Spec**: Every route, payload, auth guard, and state transition is concretely specified so downstream agents commanded to *"implement the backend"* have zero ambiguity.
4. **Living Fluidity**: The specification is mutable. When requirements evolve, the generator performs a **Consistency & Ripple Analysis Pass** to inspect dependencies, warn about conflicts, and update files synchronously.

---

## Progressive Disclosure Reference Architecture

- [01-intake-topology-elicitation.md](./references/01-intake-topology-elicitation.md): Brownfield extraction, greenfield intake interview, macro topology mapping, and preview generation.
- [02-spec-blueprints.md](./references/02-spec-blueprints.md): Canonical schemas for `topology.md`, `routes.md`, `roles.md`, `flows.md`, `data-models.md`, and `stack-rules.md`.
- [03-fluidity-ripple-protocol.md](./references/03-fluidity-ripple-protocol.md): The Consistency & Ripple Analysis engine for handling developer modifications.
- [04-downstream-execution-gate.md](./references/04-downstream-execution-gate.md): Execution rules injected into target skills for downstream coding agents.

---

## Bundled Generator Tools

- **Scaffold New System Spec Skill**:
  ```bash
  node scripts/scaffold-system-skill.js --name <project-slug>-system-spec --client "<client-tier>" --backend "<runtime>" --database "<engine>"
  ```
- **Validate Spec Compliance (agentskills.io)**:
  ```bash
  node scripts/validate-system-skill.js <path-to-skill-dir>
  ```

---

## Procedural Workflow (6 Phases)

### Phase 1: Intake & Discovery
1. Inspect any provided notes (e.g. `temp/notes.md`) or silently scan existing code (ORMs, routes, auth helpers).
2. Engage the developer with targeted architectural questions:
   - What clients exist (Web SPA, Mobile App, Kiosk) and where does the backend run?
   - Who are the distinct actors/roles (e.g., `guest`, `student`, `staff`, `admin`)?
   - What are the core stateful entities and actions?
   - What non-negotiable tech stack constraints apply (e.g., PostgreSQL with PDO, JWT auth)?

### Phase 2: Macro Topology Mapping
Map the system's communication flow and client boundaries:
- Define protocols, auth headers, hosting targets, and database connection pooling.
- Decide whether to bundle into `references/topology.md` + `stack-rules.md` (single-tier) or expand into `references/architecture/` (multi-tier).

### Phase 3: Full Markdown Preview & Approval Gate
Before creating files on disk:
1. Synthesize and present a **complete Markdown preview** showing:
   - High-level topology diagram.
   - Comprehensive Roles & Permissions table.
   - Authoritative Routes & Endpoints catalog (Method, Path, Guard, Input, Output).
   - Core Business Flows & State transitions.
   - Data Models and standard response envelopes.
2. Grill on edge cases or ambiguities, and await explicit developer confirmation.

### Phase 4: Procedural Skill Generation
Run the zero-dependency scaffolder to initialize the target skill:
```bash
node scripts/scaffold-system-skill.js \
  --name "<project-slug>-system-spec" \
  --client "<client-platform>" \
  --backend "<backend-runtime>" \
  --database "<database-engine>"
```
Populate all leaf reference files under `.agents/skills/<project-slug>-system-spec/references/` matching the confirmed preview.

### Phase 5: Verification & Linter Pass
Run the automated compliance validator:
```bash
node scripts/validate-system-skill.js .agents/skills/<project-slug>-system-spec
```
Confirm all checks pass (valid YAML frontmatter, router line budget, zero broken links, all leaf references populated).

### Phase 6: Fluid Evolution & Consistency Ripple Pass
When the developer changes requirements later (e.g. *"change mysqli to PDO"*, *"add deviceId to guest session"*, *"add route DELETE /queue/:id"*):
1. **Rescan**: Load all reference files in the target skill.
2. **Ripple Analysis**: Identify all directly and indirectly affected files.
3. **The Impact Grill**: Present the developer with a clear breakdown:
   - Direct changes.
   - Cascading ripples across routes/flows.
   - Inconsistencies or conflict warnings.
   - Architectural suggestions.
4. **Synchronize**: Upon developer confirmation, update all affected files in place.
