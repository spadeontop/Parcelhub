import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { orders } from "@/db/schema";

/**
 * Shared Drizzle column projections for v1 order queries.
 * Excludes the heavy base64 `proofImageUrl` column on non-photo endpoints.
 */
export const ORDER_NON_IMAGE_COLUMNS = {
  proofImageUrl: false,
} as const;

/**
 * Matches a staff lookup identifier against order ID, case-insensitive
 * ticketCode, or case-insensitive waybill trackingId, excluding uninitialized
 * draft orders (`PENDING_INITIALIZATION`).
 *
 * Uses `upper(...)` equality instead of `ILIKE` so `%` and `_` in scanned
 * identifiers are never interpreted as SQL pattern wildcards.
 */
export function buildStaffOrderLookupWhere(lookupId: string) {
  const upperLookupId = lookupId.toUpperCase();
  return and(
    ne(orders.status, "PENDING_INITIALIZATION"),
    or(
      eq(orders.id, lookupId),
      sql`upper(${orders.ticketCode}) = ${upperLookupId}`,
      sql`upper(${orders.trackingId}) = ${upperLookupId}`
    )
  );
}

/**
 * Deterministic ordering when multiple rows could share a `trackingId`
 * (e.g. a cancelled order followed by a re-created active order).
 * Prioritizes direct `id`/`ticketCode` hits, then non-cancelled orders,
 * then newest timestamp.
 */
export function getStaffOrderLookupOrderBy(lookupId: string) {
  const upperLookupId = lookupId.toUpperCase();
  return [
    sql`CASE WHEN ${orders.id} = ${lookupId} OR upper(${orders.ticketCode}) = ${upperLookupId} THEN 0 ELSE 1 END`,
    sql`CASE WHEN ${orders.status} = 'CANCELLED' THEN 1 ELSE 0 END`,
    desc(orders.timestamp),
  ];
}
