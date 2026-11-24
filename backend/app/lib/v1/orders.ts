import { and, eq, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import type {
  CustomerCancelReasonCode,
  OrderPhotoType,
  OrderStatus,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

/**
 * Shared Drizzle column projections for v1 order queries.
 * Excludes the heavy base64 `proofImageUrl` column on non-photo endpoints.
 */
export const ORDER_NON_IMAGE_COLUMNS = {
  proofImageUrl: false,
} as const;

export const PAID_ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  "AWAITING_PARCEL",
  "READY_TO_CLAIM",
  "CLAIMED",
] as const;

export const VALID_ORDER_PHOTO_TYPES: readonly OrderPhotoType[] = [
  "screenshot",
  "proof",
  "all",
] as const;

/**
 * Canonicalizes a courier tracking ID for write storage and indexed equality lookups.
 * Strips all whitespace and uppercases (e.g. "spxph 123" -> "SPXPH123").
 */
export function normalizeTrackingId(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Matches an order by either its UUIDv7 primary key or case-insensitive human ticketCode.
 */
export function matchOrderByIdOrTicket(identifier: string): SQL {
  return or(eq(orders.id, identifier), eq(orders.ticketCode, identifier.toUpperCase()))!;
}

/**
 * Checks whether a canonicalized tracking ID is already bound to a paid active parcel
 * (`AWAITING_PARCEL`, `READY_TO_CLAIM`, `CLAIMED`). Uses exact equality so PostgreSQL
 * hits `orders_paid_tracking_id_unique` directly in O(log N).
 */
export async function hasActivePaidTrackingId(
  normalizedTrackingId: string,
  excludeOrderId?: string
): Promise<boolean> {
  const conditions: SQL[] = [
    eq(orders.trackingId, normalizedTrackingId),
    inArray(orders.status, PAID_ACTIVE_ORDER_STATUSES as OrderStatus[]),
  ];
  if (excludeOrderId) {
    conditions.push(ne(orders.id, excludeOrderId));
  }

  const existing = await db.query.orders.findFirst({
    where: and(...conditions),
    columns: { id: true },
  });

  return Boolean(existing);
}

/**
 * Computes whether a customer's claim pass window is currently active and how many seconds remain.
 */
export function computeClaimWindow(
  claimRequested: boolean,
  claimExpiresAt: Date | string | null | undefined,
  nowMs: number = Date.now()
): { isClaimActive: boolean; claimRemainingSeconds: number } {
  if (!claimRequested || !claimExpiresAt) {
    return { isClaimActive: false, claimRemainingSeconds: 0 };
  }
  const expiresMs = new Date(claimExpiresAt).getTime();
  const diffSec = Math.floor((expiresMs - nowMs) / 1000);
  if (diffSec > 0) {
    return { isClaimActive: true, claimRemainingSeconds: diffSec };
  }
  return { isClaimActive: false, claimRemainingSeconds: 0 };
}

/**
 * Parses and validates the `?type=screenshot|proof|all` query parameter for photo endpoints.
 */
export function parsePhotoType(
  searchParams: URLSearchParams
): { ok: true; photoType: OrderPhotoType } | { ok: false; error: string } {
  const rawType = searchParams.get("type");
  if (!rawType) {
    return { ok: true, photoType: "all" };
  }
  if (!VALID_ORDER_PHOTO_TYPES.includes(rawType as OrderPhotoType)) {
    return {
      ok: false,
      error: `Invalid photo type filter. Allowed values: ${VALID_ORDER_PHOTO_TYPES.join(", ")}`,
    };
  }
  return { ok: true, photoType: rawType as OrderPhotoType };
}

/**
 * Fetches only the requested photo column(s) (`proof`, `screenshot`, or `all`) for an order.
 * Returns `null` if no matching order exists.
 */
export async function fetchOrderPhotos(
  whereClause: SQL | undefined,
  photoType: OrderPhotoType
): Promise<{ orderId: string; imageUrl: string | null; proofImageUrl: string | null } | null> {
  if (photoType === "proof") {
    const order = await db.query.orders.findFirst({
      where: whereClause,
      columns: {
        id: true,
        proofImageUrl: true,
      },
    });
    if (!order) return null;
    return {
      orderId: order.id,
      imageUrl: null,
      proofImageUrl: order.proofImageUrl ?? null,
    };
  }

  if (photoType === "screenshot") {
    const [order] = await db
      .select({
        id: orders.id,
        imageUrl: orderScreenshots.imageUrl,
      })
      .from(orders)
      .leftJoin(orderScreenshots, eq(orderScreenshots.orderId, orders.id))
      .where(whereClause)
      .limit(1);

    if (!order) return null;
    return {
      orderId: order.id,
      imageUrl: order.imageUrl ?? null,
      proofImageUrl: null,
    };
  }

  const [order] = await db
    .select({
      id: orders.id,
      imageUrl: orderScreenshots.imageUrl,
      proofImageUrl: orders.proofImageUrl,
    })
    .from(orders)
    .leftJoin(orderScreenshots, eq(orderScreenshots.orderId, orders.id))
    .where(whereClause)
    .limit(1);

  if (!order) return null;
  return {
    orderId: order.id,
    imageUrl: order.imageUrl ?? null,
    proofImageUrl: order.proofImageUrl ?? null,
  };
}

/**
 * Builds an atomic PostgreSQL JSONB append expression for `orders.status_timeline`.
 */
export function appendStatusTimelineSql(status: OrderStatus, timestampIso: string) {
  const entry: StatusTimelineEntry = { status, timestamp: timestampIso };
  return sql<StatusTimelineEntry[]>`coalesce(${orders.statusTimeline}, '[]'::jsonb) || ${JSON.stringify([entry])}::jsonb`;
}

/**
 * Canonical human-readable status label for Staff order list and detail endpoints.
 */
export function getStaffOrderStatusMessage(status: OrderStatus): string {
  switch (status) {
    case "AWAITING_PARCEL":
      return "Awaiting parcel arrival";
    case "READY_TO_CLAIM":
      return "Ready for customer pickup";
    case "PAYMENT_REQUIRED":
      return "Awaiting customer cash deposit";
    case "PENDING_INITIALIZATION":
      return "Pending initialization";
    case "CLAIMED":
      return "Parcel claimed";
    case "CANCELLED":
      return "Order cancelled";
    case "REFUNDED":
      return "Order refunded";
    default:
      return status;
  }
}

export const VALID_CUSTOMER_CANCEL_REASON_CODES: readonly CustomerCancelReasonCode[] = [
  "CHANGED_MIND",
  "SELLER_CANCELLED",
  "WRONG_DETAILS",
  "DUPLICATE_ORDER",
  "DELIVERY_DELAYED",
  "OTHER",
] as const;

export function computeRefundableAmount(order: {
  status: OrderStatus;
  activatedAt?: Date | string | null;
  amountReceived: number | null;
  price: number;
  courierPaid: boolean;
  isRefunded: boolean;
}): number {
  if (
    order.status === "CANCELLED" &&
    Boolean(order.activatedAt) &&
    order.amountReceived !== null &&
    order.amountReceived >= order.price &&
    order.price > 0 &&
    !order.courierPaid &&
    !order.isRefunded
  ) {
    return order.price;
  }
  return 0;
}

export function computeRefundWindow(
  refundRequested: boolean,
  refundExpiresAt: Date | string | null | undefined,
  nowMs: number = Date.now()
): { isRefundActive: boolean; refundRemainingSeconds: number } {
  if (!refundRequested || !refundExpiresAt) {
    return { isRefundActive: false, refundRemainingSeconds: 0 };
  }
  const expiresMs = new Date(refundExpiresAt).getTime();
  const diffSec = Math.floor((expiresMs - nowMs) / 1000);
  if (diffSec > 0) {
    return { isRefundActive: true, refundRemainingSeconds: diffSec };
  }
  return { isRefundActive: false, refundRemainingSeconds: 0 };
}

export function parseOptionalCancelOrRefundReason(body?: {
  reasonCode?: unknown;
  reason?: unknown;
}):
  | {
      ok: true;
      reasonCode: CustomerCancelReasonCode | null;
      reason: string | null;
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: true, reasonCode: null, reason: null };
  }

  let reasonCode: CustomerCancelReasonCode | null = null;
  if (body.reasonCode !== undefined && body.reasonCode !== null && body.reasonCode !== "") {
    if (
      typeof body.reasonCode !== "string" ||
      !VALID_CUSTOMER_CANCEL_REASON_CODES.includes(body.reasonCode as CustomerCancelReasonCode)
    ) {
      return {
        ok: false,
        error: `Invalid reasonCode. Allowed values: ${VALID_CUSTOMER_CANCEL_REASON_CODES.join(", ")}`,
      };
    }
    reasonCode = body.reasonCode as CustomerCancelReasonCode;
  }

  let reason: string | null = null;
  if (body.reason !== undefined && body.reason !== null) {
    if (typeof body.reason !== "string") {
      return { ok: false, error: "reason must be a string" };
    }
    const trimmed = body.reason.trim();
    if (trimmed.length > 300) {
      return { ok: false, error: "reason must not exceed 300 characters" };
    }
    reason = trimmed.length > 0 ? trimmed : null;
  }

  return { ok: true, reasonCode, reason };
}

/**
 * Formats a staff member's display name from first and last name columns.
 */
export function formatStaffFullName(
  firstName?: string | null,
  lastName?: string | null
): string | undefined {
  if (!firstName && !lastName) return undefined;
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full || undefined;
}
