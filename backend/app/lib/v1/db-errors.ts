/**
 * Database error inspection helpers for PostgreSQL / PGlite drivers wrapped by Drizzle ORM.
 */

interface PostgresErrorLike {
  code?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  message?: unknown;
  cause?: unknown;
}

/**
 * Checks whether an error (or its `.cause` chain up to depth 4) represents a
 * PostgreSQL unique-constraint violation (`23505`), optionally matching a
 * specific constraint/index name.
 */
export function isUniqueViolation(
  err: unknown,
  constraintName?: string
): boolean {
  let current: unknown = err;

  for (let depth = 0; depth <= 4 && current && typeof current === "object"; depth++) {
    const record = current as PostgresErrorLike;

    if (record.code === "23505") {
      if (!constraintName) {
        return true;
      }

      if (
        record.constraint === constraintName ||
        record.constraint_name === constraintName ||
        (typeof record.message === "string" &&
          record.message.includes(constraintName))
      ) {
        return true;
      }
    }

    current = record.cause;
  }

  return false;
}
