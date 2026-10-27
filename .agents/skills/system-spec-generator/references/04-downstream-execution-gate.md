# Downstream Execution Gate Specification

This reference defines the strict procedural instructions compiled into the target skill's `SKILL.md`. When a coding agent is asked to *"implement the backend"*, *"scaffold the API"*, or *"build the queue worker"*, these rules govern how the agent leverages the generated functional specification.

---

## 1. The Single Source of Truth Mandate

1. **The Specification Shoulders the Entire Functional Flow**:
   - The downstream agent does not guess route paths, query parameters, auth guard function names, or database column names.
   - All behavioral logic, state machines, and access control rules are already decided in `references/`.
2. **Zero-Hallucination Execution**:
   - The agent MUST NOT invent ad-hoc endpoints (e.g. creating `/api/temp-queue` when only `/api/v1/queue/tickets` is documented).
   - The agent MUST NOT bypass role guards or invent custom permission roles.
3. **Spec-First Evolution**:
   - If the downstream agent encounters an unhandled edge case or missing route requirement, it must NOT write improvised code. It must update the specification via the `system-spec-generator` fluidity protocol first or request confirmation from the developer.

---

## 2. Standard 4-Step Downstream Agent Workflow

When commanded to build or modify any backend, API, or fullstack feature:

### Step 1: Procedural RAG Injection (Load Specific References)
Do NOT load all markdown files at once. Use targeted lookup based on the task:
- Implementing an API endpoint? -> Load `references/routes.md` for signature & payload.
- Enforcing access controls / auth middleware? -> Load `references/roles.md`.
- Building multi-step business logic or DB transactions? -> Load `references/flows.md`.
- Defining TypeScript types or DB schema? -> Load `references/data-models.md`.
- Setting up database connection, drivers, or validation? -> Load `references/stack-rules.md`.

### Step 2: Signature & Guard Alignment
- Match the route method (`GET`, `POST`, `PATCH`, `DELETE`) and path exactly.
- Wire the required auth guard decorator or middleware function matching the role permissions defined in `roles.md`.
- Validate incoming `req.body` and `req.query` strictly against the schema in `routes.md` and `data-models.md`.

### Step 3: Transaction & Flow Implementation
- Follow the exact sequential steps outlined in `flows.md`.
- If atomic mutations are specified, wrap the operations in a database transaction (`db.transaction()`).
- Emit the specified events or notifications (e.g., WebSockets, delayed queue jobs).

### Step 4: Verification Against Invariants
- Verify that response envelopes match `ApiResponse<T>` or `ApiErrorResponse`.
- Confirm HTTP error codes match those documented in `routes.md` (e.g., `400`, `401`, `403`, `409`, `404`).
- Check that no forbidden drivers (e.g., raw SQL strings if prepared statements are mandated) were used.
