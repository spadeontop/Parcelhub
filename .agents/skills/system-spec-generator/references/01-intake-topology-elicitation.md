# Intake, Topology Elicitation & Preview Protocol

This reference governs how the `system-spec-generator` agent discovers system requirements, engages the developer as the Chief Architect, traces macro data topology, and generates a complete Markdown preview before scaffolding.

---

## 1. The Architectural Partnership

### Core Mindset
- **Treat the Developer as the Vision Holder**: The developer knows the problem domain, target users, and business requirements. Do not patronize, explain generic beginner web concepts, or assume they do not understand architecture.
- **Default to Asking & Consulting**: Unless explicitly commanded to *"generate non-interactively"* or *"skip questions"*, always ask clarifying architectural questions. Clarify data boundaries, edge cases, role limits, and failure modes.
- **Developer Planning Perspective**: Think like a pragmatic software architect scoping a real project:
  1. What is the fundamental problem or feature (e.g. queue management, student advising, e-commerce checkout)?
  2. What is the macro data flow (which clients talk to which services)?
  3. What are the planned routes, methods, and payloads?
  4. What are the role boundaries and state transitions?

---

## 2. Discovery Protocols

### A. Brownfield Discovery (Existing Codebase)
Before prompting the developer, inspect the repository silently:
1. **Route & Page Detection**:
   - Next.js / Remix / Nuxt: Scan `app/`, `pages/`, `routes/`, `server/api/`.
   - Express / Fastify / Nest / Laravel / Django / Go: Scan route definitions and controllers.
2. **Data & Schema Extraction**:
   - Scan ORM definitions (`prisma/schema.prisma`, `drizzle/schema.ts`, `migrations/`, `models/`).
   - Extract primary entities, foreign keys, and soft-delete/audit columns (`deleted_at`, `created_at`, `status`).
3. **Authentication & Session Mechanics**:
   - Identify auth libraries (`next-auth`, `@clerk/nextjs`, `lucia`, custom JWT, Passport, Laravel Sanctum).
   - Locate middleware guards (`middleware.ts`, guard decorators, auth wrappers).
4. **Actor/Role Identification**:
   - Grep for `enum Role`, role constants, or permission arrays.

Present your brownfield findings as an architectural summary, noting detected endpoints and roles, and ask the developer to confirm or highlight missing requirements.

### B. Greenfield Discovery (From Scratch or Rough Notes)
When starting from a prompt or rough notes (e.g. `temp/notes.md`):
1. **Analyze Provided Notes**: Extract all mentioned entities, user types, and workflow steps.
2. **Conduct the Architecture Intake Grill** (focused on system clarity):
   - **Topology & Clients**: What clients exist (Web SPA, Mobile React Native, Desktop, Webhooks) and where does the backend run (Next.js server, Node API, Serverless)?
   - **Actors & Permissions**: Who uses the system (e.g., Guest, Student, Instructor, Admin)?
   - **Core Entities & Data Shapes**: What are the central stateful objects (e.g., QueueTicket, Order, Course)?
   - **Key Endpoints & Routes**: What actions must be triggered over the wire?
   - **Stateful Flows & Invariants**: What multi-step processes exist (e.g., Ticket Creation -> Enqueue -> Assigned -> Resolved)?

---

## 3. High-Level Macro Topology Mapping

Every generated system specification MUST trace the macro data flow end-to-end so that AI coding agents never confuse client-side code with server-side code or assume incorrect data access paths.

### Standard Topology Elements
1. **Client Tier**:
   - Platform (e.g., React Native on iOS/Android, Next.js App Router on Web, Chrome Extension).
   - Auth storage (e.g., SecureStore for JWT, HTTP-only cookie, Session storage).
2. **Transport & API Layer**:
   - Protocol (REST, GraphQL, tRPC, WebSockets, Server Actions).
   - Base URL & Routing scheme (e.g., `https://api.domain.com/v1`, `/api/*`).
   - Guard mechanism (Bearer Token in `Authorization` header, NextAuth middleware).
3. **Backend & Compute Tier**:
   - Runtime & Framework (e.g., Node.js 20, Next.js Route Handlers on Vercel, Express on Railway, PHP 8.2 PDO).
   - Background workers (BullMQ, Celery, database polling cron).
4. **Persistence & Cache Tier**:
   - Primary Database (e.g., PostgreSQL, MySQL, Supabase, MongoDB).
   - Cache / Queue store (Redis, Upstash, SQS).
   - Blob Storage (S3, Cloudflare R2, Supabase Storage).

### Adaptive Granularity Heuristic
- **Single-Tier / Compact App** (e.g., Fullstack Next.js web app with single database):
  - Bundle topology and stack rules into `references/topology.md` and `references/stack-rules.md`.
- **Multi-Tier / Distributed App** (e.g., Mobile client + Web admin + Backend API + Realtime server):
  - Adaptively expand into a modular `references/architecture/` folder:
    - `references/architecture/topology.md` (End-to-end communication diagram & overview)
    - `references/architecture/web-stack.md` (Frontend web conventions)
    - `references/architecture/mobile-stack.md` (Mobile client conventions & offline rules)
    - `references/architecture/database.md` (Connection pooling, migrations, indexing rules)

---

## 4. The Full Markdown Preview & Approval Gate

Before writing any files into `.agents/skills/<project>-system-spec/`:
1. **Synthesize the Complete Spec Preview**:
   - Present the end-to-end architecture plan in markdown directly to the developer:
     - **Topology Map**: Visual ASCII or Mermaid diagram of clients, backend, and DB.
     - **Roles Matrix**: Complete table of actors and allowed routes/actions.
     - **Routes Catalog**: Complete list of planned endpoints (Method, Path, Guard, Input, Output).
     - **Flows Overview**: Pseudocode/steps for multi-step state machines.
     - **Data Models**: Concrete JSON/TypeScript schemas for entities and envelopes.
2. **Clarification Grill**:
   - Highlight any potential ambiguities, missing error states, or edge cases.
   - Ask for developer confirmation or specific adjustments.
3. **Approval Gate**:
   - Only execute scaffolding and write skill files after the developer confirms the preview.
