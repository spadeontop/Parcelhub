# System Topology & Data Flow

## 1. Macro Architecture Diagram
\`\`\`mermaid
flowchart LR
    Client["{{CLIENT_NAME}}"] -->|{{PROTOCOL}}| API["{{BACKEND_NAME}}"]
    API -->|Connection Pool| DB[("{{DATABASE_NAME}}")]
\`\`\`

## 2. Tier Specifications
| Tier | Platform / Runtime | Hosting / Location | Auth / Protocol |
| :--- | :--- | :--- | :--- |
| **Client** | {{CLIENT_PLATFORM}} | {{CLIENT_HOSTING}} | {{CLIENT_AUTH}} |
| **Backend API** | {{BACKEND_RUNTIME}} | {{BACKEND_HOSTING}} | {{BACKEND_AUTH}} |
| **Database** | {{DATABASE_ENGINE}} | {{DATABASE_HOSTING}} | {{DATABASE_CONNECTION}} |

## 3. Communication Invariants
- Clients communicate exclusively through the API layer; direct database access is forbidden.
- All requests require the specified authentication guard unless marked public.
