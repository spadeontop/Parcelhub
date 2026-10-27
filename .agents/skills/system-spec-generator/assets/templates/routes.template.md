# Routes & API Specification

## 1. Overview
All endpoints documented below are authoritative. Downstream coding agents must strictly implement these exact paths, methods, input payloads, and return types.

## 2. Endpoint Catalog

### `{{EXAMPLE_METHOD}} {{EXAMPLE_PATH}}`
- **Purpose**: {{EXAMPLE_PURPOSE}}
- **Allowed Roles**: `{{EXAMPLE_ROLES}}`
- **Auth Guard**: `{{EXAMPLE_GUARD}}`
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  \`\`\`json
  {
    "exampleField": "string"
  }
  \`\`\`
- **Success Response (200 OK)**:
  \`\`\`json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "COMPLETED"
    }
  }
  \`\`\`
- **Error Codes**:
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Insufficient role permissions.
- **Implementation Notes**: Wrap database operations in a transaction where state is modified.
