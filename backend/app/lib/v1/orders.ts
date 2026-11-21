/**
 * Shared Drizzle column projections for v1 order queries.
 * Excludes the heavy base64 `proofImageUrl` column on non-photo endpoints.
 */
export const ORDER_NON_IMAGE_COLUMNS = {
  proofImageUrl: false,
} as const;

/**
 * Canonicalizes a courier tracking ID for write storage and indexed equality lookups.
 * Strips all whitespace and uppercases (e.g. "spxph 123" -> "SPXPH123").
 */
export function normalizeTrackingId(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}
