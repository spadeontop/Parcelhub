/**
 * Shared Drizzle column projections for v1 order queries.
 * Excludes the heavy base64 `proofImageUrl` column on non-photo endpoints.
 */
export const ORDER_NON_IMAGE_COLUMNS = {
  proofImageUrl: false,
} as const;
