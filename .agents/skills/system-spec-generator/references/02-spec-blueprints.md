# Target Spec Blueprints & Canonical Schemas

This reference provides the authoritative structure for each markdown file generated inside `.agents/skills/<project>-system-spec/references/`. Downstream coding agents rely on these exact schemas to understand and implement the system.

---

## 1. `references/topology.md` Blueprint

```markdown
# System Topology & Data Flow

## 1. Macro Architecture Diagram
\`\`\`mermaid
flowchart LR
    Web["Web Client (Next.js SPA)"] -->|HTTPS / REST API| API["Backend Service (Vercel Node.js)"]
    Mobile["Mobile Client (React Native)"] -->|Bearer JWT / REST| API
    API -->|Connection Pool (pg)| DB[("PostgreSQL Database")]
    API -->|Job Dispatch| Redis[("Redis Queue / Cache")]
\`\`\`

## 2. Tier Specifications
| Tier | Platform / Runtime | Hosting / Location | Auth / Protocol |
| :--- | :--- | :--- | :--- |
| **Web Client** | Next.js 14 App Router | Vercel | HTTP-only Cookie Session |
| **Mobile Client** | React Native Expo | iOS / Android Native | SecureStore Bearer JWT |
| **Backend API** | Node.js 20 / Express | Railway / Vercel API | JWT Auth Guard Middleware |
| **Database** | PostgreSQL 16 | Supabase Managed | Connection Pooling (port 6543) |
| **Queue / Cache** | Redis 7.2 | Upstash Serverless | TLS REST / TCP |

## 3. Communication Invariants
- Clients NEVER connect directly to the database or Redis cache.
- All client-to-backend communication traverses standard API routes prefixed with `/api/v1`.
- Mobile client refreshes tokens via `POST /api/v1/auth/refresh` on 401 response.
```

---

## 2. `references/routes.md` Blueprint

Each route must be documented as an **Actionable Endpoint Card** with exact input, output, and guard specs:

```markdown
# Routes & API Specification

## [Group Name] (e.g., Queue Management)

### `POST /api/v1/queue/tickets`
- **Purpose**: Creates and enqueues a new service ticket for an actor.
- **Allowed Roles**: `student`, `guest`
- **Auth Guard**: `requireAuth(['student', 'guest'])`
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  \`\`\`json
  {
    "category": "ADVISING | ENROLLMENT | FINANCIAL",
    "notes": "string (optional, max 500 chars)"
  }
  \`\`\`
- **Success Response (201 Created)**:
  \`\`\`json
  {
    "success": true,
    "data": {
      "ticketId": "string (uuid)",
      "position": 14,
      "estimatedWaitMinutes": 28,
      "status": "QUEUED",
      "createdAt": "2026-10-20T12:00:00Z"
    }
  }
  \`\`\`
- **Error Codes**:
  - `400 Bad Request`: Validation failure on category or notes length.
  - `401 Unauthorized`: Missing or invalid session token.
  - `409 Conflict`: Actor already has an active pending ticket in this category.
- **Implementation Notes**: Must run inside an atomic database transaction. Decrements queue counter only on dequeue.

---

### `GET /api/v1/queue/tickets/:id`
- **Purpose**: Retrieves live ticket status and current queue position.
- **Allowed Roles**: `student`, `guest`, `staff`, `admin`
- **Auth Guard**: `requireAuth(['student', 'guest', 'staff', 'admin'])`
- **Route Parameters**: `id` (uuid)
- **Success Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "data": {
      "ticketId": "uuid",
      "status": "QUEUED | CALLING | IN_PROGRESS | RESOLVED | CANCELLED",
      "position": 3,
      "assignedStaff": "string | null"
    }
  }
  \`\`\`
- **Error Codes**:
  - `403 Forbidden`: Actor does not own the ticket and is not `staff` or `admin`.
  - `404 Not Found`: Ticket ID does not exist.
```

---

## 3. `references/roles.md` Blueprint

```markdown
# Roles & Access Control Matrix

## 1. Actor Directory
| Role | Definition | Default Auth State |
| :--- | :--- | :--- |
| `guest` | Unauthenticated visitor or temporary kiosk visitor | Anonymous session / Device UUID |
| `student` | Verified enrolled student | Authenticated student JWT |
| `staff` | Service agent or department advisor | Authenticated staff JWT with department claim |
| `admin` | System administrator with full operational privileges | MFA-enforced admin session |

## 2. Route & Permission Matrix
| Route / Action | `guest` | `student` | `staff` | `admin` | Scoping Filter |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `POST /api/v1/auth/login` | ALLOW | ALLOW | ALLOW | ALLOW | Public |
| `POST /api/v1/queue/tickets` | ALLOW | ALLOW | DENY | DENY | Own `deviceId` or `studentId` |
| `GET /api/v1/queue/tickets/:id` | OWN | OWN | ALLOW | ALLOW | `staff` scoped to department |
| `PATCH /api/v1/queue/tickets/:id` | DENY | CANCEL | ALLOW | ALLOW | Staff can call/resolve; Student can only cancel |
| `GET /api/v1/admin/audit-logs` | DENY | DENY | DENY | ALLOW | Global |

## 3. Boundary Invariants
- Multi-tenant or multi-department queries MUST include `departmentId = req.user.departmentId` unless `admin`.
- A user can never escalate their own role via `PATCH /api/v1/users/me`.
```

---

## 4. `references/flows.md` Blueprint

```markdown
# Core Business Flows & State Machines

## Flow: Queue Ticket Lifecycle

### State Machine
\`\`\`
[CREATION] -> QUEUED -> CALLING -> IN_PROGRESS -> RESOLVED
                 |         |            |
                 v         v            v
             CANCELLED  NO_SHOW     CANCELLED
\`\`\`

### Step-by-Step Execution Protocol
When a staff member triggers `PATCH /api/v1/queue/tickets/:id/call`:
1. **Validate Pre-conditions**:
   - Ticket must be in `QUEUED` state.
   - Staff member must not have another active ticket in `CALLING` or `IN_PROGRESS` status.
2. **Atomic Mutation**:
   - Begin DB transaction:
     - Update `tickets.status = 'CALLING'`.
     - Update `tickets.assigned_staff_id = req.user.id`.
     - Update `tickets.called_at = NOW()`.
     - Recalculate positions of all remaining `QUEUED` tickets in the department.
   - Commit transaction.
3. **Realtime Broadcast**:
   - Emit WebSocket event `ticket:called` to channel `department:<id>`.
   - Send Push Notification / SMS to student device if registered.
4. **Auto No-Show Timer**:
   - Schedule Redis delayed job: if ticket not marked `IN_PROGRESS` within 5 minutes, transition to `NO_SHOW`.
```

---

## 5. `references/data-models.md` Blueprint

```markdown
# Data Models & Contracts

## 1. Standard API Response Envelopes
\`\`\`typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // e.g. "TICKET_ALREADY_ACTIVE"
    message: string;    // Human-readable summary
    details?: unknown;  // Validation errors array
  };
}
\`\`\`

## 2. Core Entities
\`\`\`typescript
interface GuestSession {
  deviceId: string;     // UUID generated on device
  ipAddress: string;
  temporaryName?: string;
  createdAt: string;
}

interface TicketEntity {
  id: string;           // UUIDv4
  actorType: 'GUEST' | 'STUDENT';
  actorId: string;      // deviceId or studentId
  departmentId: string;
  category: 'ADVISING' | 'ENROLLMENT' | 'FINANCIAL';
  status: 'QUEUED' | 'CALLING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'NO_SHOW';
  position: number;
  assignedStaffId?: string;
  createdAt: string;
  resolvedAt?: string;
}
\`\`\`
```

---

## 6. `references/stack-rules.md` Blueprint

```markdown
# Technical Stack Rules & Invariants

## 1. Database & Drivers
- **Engine**: PostgreSQL 16 with Supabase.
- **ORM / Query Builder**: Drizzle ORM (or PDO with strict prepared statements).
- **Rule**: NEVER use raw string concatenation in SQL queries. Always use parameterized queries.
- **Rule**: All mutations touching multiple records MUST be wrapped in transactions (`db.transaction()`).

## 2. Validation & Schemas
- **Library**: Zod 3.x.
- **Rule**: Every API route handler must validate `req.body` and `req.query` using Zod schema before processing logic.

## 3. Error Handling & HTTP Codes
- Throw typed domain errors (`NotFoundError`, `UnauthorizedError`, `ConflictError`).
- Global error middleware catches domain errors and transforms into standard `ApiErrorResponse`.
```
