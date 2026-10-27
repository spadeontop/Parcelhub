# Technical Stack Rules & Invariants

## 1. Database & Persistence
- **Engine**: {{DATABASE_ENGINE}}
- **Driver / ORM**: {{DATABASE_DRIVER}}
- **Rules**:
  - Always use parameterized queries / prepared statements. Raw string interpolation in queries is strictly forbidden.
  - Multi-table writes must run inside transactions.

## 2. Validation & Guards
- **Validation**: Strict schema validation on all inputs before business logic execution.
- **Authentication**: Guards verify token signatures and claims before passing to route handlers.

## 3. Error Handling
- Throw domain-specific exceptions.
- Ensure all HTTP responses conform to the uniform error envelope defined in `data-models.md`.
