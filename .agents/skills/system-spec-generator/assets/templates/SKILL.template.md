---
name: {{SKILL_NAME}}
description: 100% authoritative functional specification for {{PROJECT_NAME}}. Defines macro topology, routes, API endpoints, role permissions, and business logic flows. Use whenever designing, creating, modifying, or testing routes, APIs, pages, auth guards, or backend logic.
compatibility: Zero-dependency Node.js v18+
metadata:
  version: "1.0.0"
  standard: "agentskills.io"
---

# {{PROJECT_TITLE}} Functional Specification

This skill serves as the **100% authoritative functional specification** for {{PROJECT_NAME}}. When implementing backend services, routes, or workflows, coding agents must follow these specifications as the single source of truth.

---

## High-Level System Topology

{{TOPOLOGY_SUMMARY}}

Refer to [topology.md](./references/topology.md) for full macro architecture diagrams and client-to-backend communication tiers.

---

## Progressive Disclosure Router (Procedural RAG)

Load only the specific reference file needed for your current task:

| Task / Feature Intent | Reference File to Consult | Purpose |
| :--- | :--- | :--- |
| **Routes, APIs & Endpoints** | [routes.md](./references/routes.md) | Method, Path, Payload schemas, Response envelopes, Errors |
| **Roles, RBAC & Permissions** | [roles.md](./references/roles.md) | Actor directory, access control matrix, forbidden actions |
| **Business Flows & State** | [flows.md](./references/flows.md) | Step-by-step logic, state machines, atomic DB transactions |
| **Data Models & Contracts** | [data-models.md](./references/data-models.md) | Entity shapes, session structures, standard API envelopes |
| **Stack Rules & Drivers** | [stack-rules.md](./references/stack-rules.md) | Database drivers, validation rules, architectural constraints |

---

## Downstream Execution Gate

When commanded to *"implement the backend"* or build any route/flow:
1. **Never Hallucinate**: Only build routes and entities explicitly documented in `references/`.
2. **Consult First**: Load the relevant reference file from the table above before writing code.
3. **Strict Compliance**: Follow exact input types, auth guards, status codes, and atomic transaction steps.
4. **Spec Evolution**: If requirements or stack choices change, trigger `system-spec-generator` to run the Consistency & Ripple Analysis pass and update the spec.
