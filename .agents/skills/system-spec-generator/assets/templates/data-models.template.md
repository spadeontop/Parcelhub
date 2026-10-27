# Data Models & Envelopes

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
interface {{PRIMARY_ENTITY_NAME}} {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`
