import type { OrderStatus, StaffOrder } from '../types';

export type StaffQrLookupResult =
  | { kind: 'found'; order: StaffOrder; hasDetails: boolean }
  | { kind: 'ambiguous'; matches: StaffOrder[] }
  | { kind: 'not-found' };

export const PAID_ACTIVE_QR_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'READY_TO_CLAIM',
  'AWAITING_PARCEL',
]);

export const ACTIVE_QR_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'READY_TO_CLAIM',
  'AWAITING_PARCEL',
  'PAYMENT_REQUIRED',
]);

export function isActiveQrOrderStatus(status: OrderStatus): boolean {
  return ACTIVE_QR_ORDER_STATUSES.has(status);
}

/**
 * Resolves exact QR code matches into a single lookup result.
 * When multiple orders share the same code (e.g., an older CANCELLED/REFUNDED order
 * alongside a current order with the same tracking ID), active orders are prioritized:
 * 1. A single active order (`READY_TO_CLAIM`, `AWAITING_PARCEL`, `PAYMENT_REQUIRED`) wins.
 * 2. Among multiple active orders, a single paid active order (`READY_TO_CLAIM`,
 *    `AWAITING_PARCEL`) wins over unpaid (`PAYMENT_REQUIRED`) orders.
 * 3. Remaining ties return `ambiguous`.
 */
export function resolveQrOrderMatches(matches: readonly StaffOrder[]): StaffQrLookupResult {
  const uniqueMatches = new Map<string, StaffOrder>();
  for (const order of matches) {
    if (order.status === 'PENDING_INITIALIZATION') continue;
    if (!uniqueMatches.has(order.id)) {
      uniqueMatches.set(order.id, order);
    }
  }

  const candidates = Array.from(uniqueMatches.values());
  if (candidates.length === 0) return { kind: 'not-found' };
  if (candidates.length === 1) {
    return { kind: 'found', order: candidates[0], hasDetails: false };
  }

  const activeMatches = candidates.filter((order) => ACTIVE_QR_ORDER_STATUSES.has(order.status));
  if (activeMatches.length === 1) {
    return { kind: 'found', order: activeMatches[0], hasDetails: false };
  }

  if (activeMatches.length > 1) {
    const paidActiveMatches = activeMatches.filter((order) =>
      PAID_ACTIVE_QR_ORDER_STATUSES.has(order.status)
    );
    if (paidActiveMatches.length === 1) {
      return { kind: 'found', order: paidActiveMatches[0], hasDetails: false };
    }
  }

  return { kind: 'ambiguous', matches: candidates };
}
