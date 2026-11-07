export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Parses and sanitizes pagination parameters from search params.
 * - Defaults limit to `defaultLimit` (default 20) if omitted, non-numeric, or <= 0.
 * - Clamps limit to `maxLimit` (default 100).
 * - Defaults offset to 0 if omitted, non-numeric, or < 0.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");

  let limit = rawLimit !== null ? parseInt(rawLimit, 10) : defaultLimit;
  if (isNaN(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  limit = Math.min(limit, maxLimit);

  let offset = rawOffset !== null ? parseInt(rawOffset, 10) : 0;
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }

  return { limit, offset };
}

