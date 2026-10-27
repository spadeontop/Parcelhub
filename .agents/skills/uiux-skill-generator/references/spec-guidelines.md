# Agent Skills Specification Reference (`agentskills.io`)

This document defines the architecture, constraints, and validation standards defined by the **agentskills.io** open specification for packaging procedural knowledge, workflows, and deterministic tool scripts for AI coding agents.

---

## 1. Directory Structure

A compliant agent skill must be a self-contained directory with a canonical `SKILL.md` entry point:

```text
<skill-name>/
├── SKILL.md          # REQUIRED: Primary router, frontmatter metadata, and high-level procedures (<500 lines)
├── scripts/          # OPTIONAL: Non-interactive deterministic CLI scripts (Node.js, Bash, Python)
├── references/       # OPTIONAL: Flat Markdown documentation and copy-pasteable canonical recipes
└── assets/           # OPTIONAL: Templates, boilerplate files, or schemas used during execution
```

> [!NOTE]
> All subdirectories within the skill must use flat structures (depth 1) where possible to minimize token traversal overhead.

---

## 2. `SKILL.md` Specification

The entry file `SKILL.md` must begin with valid YAML frontmatter followed by structured Markdown instructions.

### Frontmatter Schema

```yaml
---
name: descriptive-skill-name
description: Clear, non-empty trigger criteria in third person. Max 1024 chars.
license: Apache-2.0
compatibility: Zero-dependency Node.js v18+ or standard shell
metadata:
  version: "1.0.0"
  archetype: "procedural-uiux"
---
```

### Constraints & Rules

| Field | Required | Limits / Rules |
| :--- | :--- | :--- |
| `name` | **Yes** | Max 64 characters. Only lowercase alphanumeric (`a-z`, `0-9`) and hyphens. Cannot start or end with a hyphen. Must match directory basename. |
| `description` | **Yes** | Max 1024 characters. Non-empty. Must describe **what** the skill does and **when** the agent should trigger it. |
| `license` | No | SPDX license identifier (e.g., `Apache-2.0`, `MIT`). |
| `compatibility`| No | Max 500 characters describing required runtimes or OS support. |
| `metadata` | No | Arbitrary key-value string pairs for metadata tracking. |

### Size & Token Budget
- **`SKILL.md` line count**: Strictly under **500 lines** (ideally 100–300 lines).
- Heavy documentation, detailed code examples, and component schemas must be moved to `references/`.
- Repetitive, mechanical, or error-prone tasks must be delegated to `scripts/`.

---

## 3. Three-Tier Progressive Disclosure

1. **Discovery (Startup)**:
   The agent parses only the YAML frontmatter (`name` and `description`). Token footprint: ~30–50 tokens per skill.
2. **Activation (Triggering)**:
   When a user prompt matches the description, the agent reads `SKILL.md`. The agent learns the procedural phases and reference index.
3. **Execution (Deep-Dive)**:
   The agent only reads specific files in `references/` (e.g. `references/cards.md`) when those exact components are needed, and executes scripts from `scripts/` to validate or scaffold artifacts.

---

## 4. Deterministic Scripts Standards

LLMs should not guess, calculate contrast, or improvise complex AST or JSON transformations. All mechanical operations must be handled by deterministic CLI scripts:

1. **Zero Interactive Prompts**: Scripts must **never** hang waiting for terminal input (`readline`, `prompt`, stdin confirmations).
2. **Standard CLI Flags**:
   - Must provide `--help` documenting all supported options and flags.
   - Must accept arguments via standard flags (e.g. `--target <path>`, `--type <name>`).
3. **Structured Outputs**:
   - Provide human-readable summaries and machine-readable JSON flags (`--json`) where applicable.
4. **Actionable Stderr on Failure**:
   - Exit with code `0` on success and non-zero (e.g. `1`) on failure.
   - Diagnostics must print file paths, line numbers, and unambiguous remediation steps so the agent can self-correct immediately.
5. **Runtime Simplicity**:
   - Prefer zero-dependency native Node.js (`node:fs`, `node:path`, `node:process`) requiring no `npm install`.

---

## 5. Hard Control Principles for UI/UX Skills

To eliminate divergent assumptions across model turns:
1. **Canonical Recipes**: All UI components must have a single source-of-truth recipe in `references/`. The agent is instructed to copy or adapt that exact recipe rather than inventing CSS classes or markup.
2. **Token Locking**: Colors and elevations must strictly map to defined semantic tokens (`bg-primary`, `bg-surface`, `border-border`, etc.). Hardcoded hex values or arbitrary utility values are forbidden.
3. **Linter Enforcement**: Every generated UI snippet or page must be passed through `scripts/verify-ui-compliance.js` before being declared complete.
