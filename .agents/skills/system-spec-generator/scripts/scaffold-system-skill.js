#!/usr/bin/env node

/**
 * scaffold-system-skill.js
 * Non-interactive CLI scaffolder that produces a fully compliant functional/system specification
 * skill conforming to the agentskills.io standard.
 */

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

function showHelp() {
  console.log(`
Usage: node scaffold-system-skill.js [options]

Options:
  --name <slug>         Skill directory slug (e.g. advising-queue-system-spec) [Required]
  --project <title>     Human readable project title [Default: derived from name]
  --client <platform>   Client tier platform (e.g. "Web Next.js", "React Native", "Web + Mobile") [Default: "Web Client"]
  --backend <runtime>   Backend runtime (e.g. "Node.js / Next.js API", "PHP 8.2 PDO") [Default: "Node.js API"]
  --database <engine>   Database engine (e.g. "PostgreSQL", "MySQL") [Default: "PostgreSQL"]
  --multi-tier          Expand architecture into references/architecture/ (web, mobile, db)
  --target-dir <path>   Output directory [Default: .agents/skills/<name>]
  --json                Output results as JSON
  --help                Show this help message
`);
}

function parseArgs(args) {
  const options = {
    name: '',
    project: '',
    client: 'Web Client',
    backend: 'Node.js API',
    database: 'PostgreSQL',
    multiTier: false,
    targetDir: '',
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--multi-tier') options.multiTier = true;
    else if (arg === '--name' && args[i + 1]) options.name = args[++i];
    else if (arg === '--project' && args[i + 1]) options.project = args[++i];
    else if (arg === '--client' && args[i + 1]) options.client = args[++i];
    else if (arg === '--backend' && args[i + 1]) options.backend = args[++i];
    else if (arg === '--database' && args[i + 1]) options.database = args[++i];
    else if (arg === '--target-dir' && args[i + 1]) options.targetDir = args[++i];
  }

  return options;
}

function titleCase(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.name) {
    console.error('Error: --name is required.');
    showHelp();
    process.exit(1);
  }

  const skillName = options.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const projectTitle = options.project || titleCase(skillName.replace(/-system-spec$|-functional$/, ''));
  const targetDir = path.resolve(process.cwd(), options.targetDir || `.agents/skills/${skillName}`);
  const referencesDir = path.join(targetDir, 'references');

  const templatesDir = path.join(__dirname, '..', 'assets', 'templates');

  // Load templates or use built-in fallbacks
  function loadTemplate(filename, fallback) {
    const filePath = path.join(templatesDir, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return fallback;
  }

  const skillTemplate = loadTemplate('SKILL.template.md', `---
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
1. **Never Hallucinate**: Only build routes and entities explicitly documented in \`references/\`.
2. **Consult First**: Load the relevant reference file from the table above before writing code.
3. **Strict Compliance**: Follow exact input types, auth guards, status codes, and atomic transaction steps.
4. **Spec Evolution**: If requirements or stack choices change, trigger \`system-spec-generator\` to run the Consistency & Ripple Analysis pass and update the spec.
`);

  const topologyTemplate = loadTemplate('topology.template.md', `# System Topology & Data Flow

## 1. Macro Architecture Diagram
\`\`\`mermaid
flowchart LR
    Client["{{CLIENT_NAME}}"] -->|HTTPS / REST| API["{{BACKEND_NAME}}"]
    API -->|Connection Pool| DB[("{{DATABASE_NAME}}")]
\`\`\`

## 2. Tier Specifications
| Tier | Platform / Runtime | Hosting / Location | Auth / Protocol |
| :--- | :--- | :--- | :--- |
| **Client** | {{CLIENT_PLATFORM}} | Managed / Cloud | Session / Token |
| **Backend API** | {{BACKEND_RUNTIME}} | Cloud Service | Auth Guard Middleware |
| **Database** | {{DATABASE_ENGINE}} | Managed DB | Parameterized Pool |

## 3. Communication Invariants
- Clients communicate exclusively through the API layer; direct database access is strictly forbidden.
- All mutating endpoints require valid authentication and role checks.
`);

  const routesTemplate = loadTemplate('routes.template.md', `# Routes & API Specification

## 1. Overview
All endpoints documented below are authoritative. Downstream coding agents must strictly implement these exact paths, methods, input payloads, and return types.

## 2. Endpoint Catalog

### GET /api/v1/health
- **Purpose**: System health check endpoint.
- **Allowed Roles**: Public
- **Auth Guard**: None
- **Success Response (200 OK)**: \`{ "success": true, "status": "UP" }\`
`);

  const rolesTemplate = loadTemplate('roles.template.md', `# Roles & Access Control Matrix

## 1. Actor Directory
| Role | Definition | Default Auth State |
| :--- | :--- | :--- |
| \`guest\` | Unauthenticated public visitor | Anonymous session / Device UUID |
| \`user\` | Standard authenticated user | Authenticated Bearer JWT |
| \`admin\` | System administrator | Multi-factor privileged admin session |

## 2. Route & Permission Matrix
| Route / Action | \`guest\` | \`user\` | \`admin\` | Scoping Filter |
| :--- | :---: | :---: | :---: | :--- |
| \`GET /api/v1/health\` | ALLOW | ALLOW | ALLOW | Public |
| \`POST /api/v1/auth/login\` | ALLOW | ALLOW | ALLOW | Public |
| \`GET /api/v1/user/profile\` | DENY | ALLOW | ALLOW | Own \`userId\` |
| \`POST /api/v1/admin/*\` | DENY | DENY | ALLOW | Global |

## 3. Boundary Invariants
- Users can only query and mutate their own resources (\`userId = req.user.id\`).
- Administrative actions require explicit role verification before controller execution.
`);

  const flowsTemplate = loadTemplate('flows.template.md', `# Core Business Flows & State Machines

## 1. Flow Overview
This document specifies multi-step state transitions, database transactions, and side-effects.

---

## 2. Primary Workflow

### State Transitions
\`\`\`
[INITIAL] -> PENDING -> IN_PROGRESS -> COMPLETED
                |
                v
            [CANCELLED]
\`\`\`

### Step-by-Step Execution Protocol
1. **Pre-condition Validation**: Verify entity exists and actor owns permission.
2. **Atomic Database Mutation**: Execute state mutation inside a database transaction.
3. **Side-Effects**: Emit audit event or notification.
`);

  const dataModelsTemplate = loadTemplate('data-models.template.md', `# Data Models & Envelopes

## 1. Uniform API Response Envelopes
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
    code: string;
    message: string;
    details?: unknown;
  };
}
\`\`\`

## 2. Core Entities
\`\`\`typescript
interface UserProfile {
  id: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  createdAt: string;
}
\`\`\`
`);

  const stackRulesTemplate = loadTemplate('stack-rules.template.md', `# Technical Stack Rules & Invariants

## 1. Database & Persistence
- **Engine**: {{DATABASE_ENGINE}}
- **Driver / ORM**: Parameterized query builder or strictly prepared statements.
- **Rules**:
  - Raw string concatenation in SQL queries is strictly forbidden.
  - Multi-table writes must run inside transactions.

## 2. Validation & Guards
- All inputs must be strictly validated before business logic execution.
- Auth guards must verify token signatures and roles.

## 3. Error Handling
- Throw domain-specific exceptions.
- Ensure all HTTP responses conform to the uniform error envelope defined in \`data-models.md\`.
`);

  // Ensure directories exist
  fs.mkdirSync(referencesDir, { recursive: true });

  const topologySummary = `- **Client Tier**: ${options.client}
- **Backend API**: ${options.backend}
- **Database Tier**: ${options.database}`;

  let renderedSkill = skillTemplate
    .replace(/{{SKILL_NAME}}/g, skillName)
    .replace(/{{PROJECT_NAME}}/g, skillName)
    .replace(/{{PROJECT_TITLE}}/g, projectTitle)
    .replace(/{{TOPOLOGY_SUMMARY}}/g, topologySummary);

  if (options.multiTier) {
    const multiTierRows = `| **Web Client Architecture** | [web-stack.md](./references/architecture/web-stack.md) | Web client conventions & session auth |
| **Mobile Architecture** | [mobile-stack.md](./references/architecture/mobile-stack.md) | Mobile client, SecureStore JWT & offline sync |
| **Database Architecture** | [database.md](./references/architecture/database.md) | Connection pool & migrations |
`;
    renderedSkill = renderedSkill.replace(
      '| **Stack Rules & Drivers** | [stack-rules.md](./references/stack-rules.md) | Database drivers, validation rules, architectural constraints |',
      `| **Stack Rules & Drivers** | [stack-rules.md](./references/stack-rules.md) | Database drivers, validation rules, architectural constraints |\n${multiTierRows}`
    );
  }

  const renderedTopology = topologyTemplate
    .replace(/{{CLIENT_NAME}}/g, options.client)
    .replace(/{{BACKEND_NAME}}/g, options.backend)
    .replace(/{{DATABASE_NAME}}/g, options.database)
    .replace(/{{CLIENT_PLATFORM}}/g, options.client)
    .replace(/{{BACKEND_RUNTIME}}/g, options.backend)
    .replace(/{{DATABASE_ENGINE}}/g, options.database);

  const renderedStackRules = stackRulesTemplate
    .replace(/{{DATABASE_ENGINE}}/g, options.database);

  // Write target files
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), renderedSkill, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'topology.md'), renderedTopology, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'routes.md'), routesTemplate, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'roles.md'), rolesTemplate, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'flows.md'), flowsTemplate, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'data-models.md'), dataModelsTemplate, 'utf8');
  fs.writeFileSync(path.join(referencesDir, 'stack-rules.md'), renderedStackRules, 'utf8');

  // Handle multi-tier architecture subfolder if requested
  if (options.multiTier) {
    const archDir = path.join(referencesDir, 'architecture');
    fs.mkdirSync(archDir, { recursive: true });
    fs.writeFileSync(
      path.join(archDir, 'web-stack.md'),
      `# Web Stack Specification\n\nPlatform: Web Client\nFramework: Next.js / React\nAuth: Cookie Session\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(archDir, 'mobile-stack.md'),
      `# Mobile Stack Specification\n\nPlatform: Mobile Client\nFramework: React Native Expo\nAuth: Bearer JWT in SecureStore\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(archDir, 'database.md'),
      `# Database Specification\n\nEngine: ${options.database}\nConnection: Connection Pooling\n`,
      'utf8'
    );
  }

  const generatedFiles = fs.readdirSync(referencesDir);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          skillName,
          targetDir,
          files: ['SKILL.md', ...generatedFiles.map((f) => `references/${f}`)],
        },
        null,
        2
      )
    );
  } else {
    console.log(`[system-spec-generator] Scaffolding complete!`);
    console.log(`  Location: ${targetDir}`);
    console.log(`  Master Router: SKILL.md`);
    console.log(`  References: ${generatedFiles.join(', ')}`);
  }
}

main();
