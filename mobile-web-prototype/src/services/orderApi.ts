import { Order } from '../types';
import { ENV } from '../config/env';

export const parseCurrency = (str?: string | null): number => {
  if (!str) return 0;
  const num = parseInt(str.replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export const getStatedFee = (order: Order): number => {
  const paid = parseCurrency(order.paidAmount);
  if (paid > 0) return paid;
  const cod = parseCurrency(order.codAmount);
  return cod > 0 ? cod : 480;
};

export const isClaimUnlocked = (order: Order): boolean => {
  if (order.status !== 'READY_TO_CLAIM' || !order.claimInitiatedAt) return false;
  const cutoffMs = ENV.HANDOFF_CUTOFF_TIME_MINS * 60 * 1000;
  const elapsed = Date.now() - order.claimInitiatedAt;
  return elapsed >= 0 && elapsed <= cutoffMs;
};

export const getClaimTimeRemainingSeconds = (order: Order): number => {
  if (order.status !== 'READY_TO_CLAIM' || !order.claimInitiatedAt) return 0;
  const cutoffMs = ENV.HANDOFF_CUTOFF_TIME_MINS * 60 * 1000;
  const elapsed = Date.now() - order.claimInitiatedAt;
  if (elapsed < 0) return ENV.HANDOFF_CUTOFF_TIME_MINS * 60;
  const remaining = Math.max(0, Math.floor((cutoffMs - elapsed) / 1000));
  return Math.min(ENV.HANDOFF_CUTOFF_TIME_MINS * 60, remaining);
};

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export type RouteRole = 'staff' | 'customer';

/**
 * Service providing contract handlers corresponding to the ParcelHub Order API routes:
 * 
 * Staff Routes:
 * - POST /orders/{id}/activate (takes amountReceived)
 * - POST /orders/{id}/make-claimable/pay
 * - POST /orders/{id}/make-claimable/attach-photo (takes imageUrl)
 * - POST /orders/{id}/claim
 * 
 * Customer Routes:
 * - POST /orders/{id}/claim
 */
export const orderApi = {
  /**
   * POST /orders/{id}/activate
   * Staff activates unpaid cash order. amountReceived must be >= stated fee.
   */
  staffActivate: (order: Order, amountReceived: number | string): ApiResponse<Order> => {
    if (order.status !== 'PAYMENT_REQUIRED') {
      return {
        success: false,
        message: `Order ${order.id} is not awaiting payment (current status: ${order.status}).`,
        error: 'INVALID_STATUS',
      };
    }

    const fee = getStatedFee(order);
    const parsedAmount = typeof amountReceived === 'string' ? parseCurrency(amountReceived) : Number(amountReceived);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return {
        success: false,
        message: 'A valid numeric payment amount is required.',
        error: 'INVALID_AMOUNT',
      };
    }

    if (parsedAmount < fee) {
      return {
        success: false,
        message: `Amount received (₱${parsedAmount.toLocaleString()}) is less than stated fee (₱${fee.toLocaleString()}).`,
        error: 'INSUFFICIENT_AMOUNT',
      };
    }

    const codNum = parseCurrency(order.codAmount);
    const change = Math.max(0, parsedAmount - codNum);

    const updated: Order = {
      ...order,
      status: 'AWAITING_PARCEL',
      paidAmount: `₱${parsedAmount.toLocaleString()}`,
      change: `₱${change.toLocaleString()}`,
      awaitingParcelTime: 'Just now',
    };

    return {
      success: true,
      message: `Cash deposit received: ₱${parsedAmount.toLocaleString()}. Order activated and awaiting parcel.`,
      data: updated,
    };
  },

  /**
   * POST /orders/{id}/make-claimable/pay
   * Staff pays courier arrival COD amount.
   */
  staffPayCourier: (order: Order): ApiResponse<Order> => {
    if (order.status !== 'AWAITING_PARCEL') {
      return {
        success: false,
        message: `Cannot pay courier for order in ${order.status} status.`,
        error: 'INVALID_STATUS',
      };
    }

    const updated: Order = {
      ...order,
      courierPaid: true,
    };

    return {
      success: true,
      message: `Courier payout recorded (${order.codAmount}). Please attach parcel photo.`,
      data: updated,
    };
  },

  /**
   * POST /orders/{id}/make-claimable/attach-photo
   * Staff attaches verified parcel photo. Moves order to READY_TO_CLAIM.
   */
  staffAttachPhoto: (order: Order, imageUrl: string): ApiResponse<Order> => {
    if (order.status !== 'AWAITING_PARCEL') {
      return {
        success: false,
        message: `Cannot attach parcel photo for order in ${order.status} status.`,
        error: 'INVALID_STATUS',
      };
    }

    if (!order.courierPaid) {
      return {
        success: false,
        message: 'Cannot attach photo before courier payout is logged.',
        error: 'PAYMENT_PENDING',
      };
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return {
        success: false,
        message: 'A valid parcel image is required.',
        error: 'INVALID_IMAGE',
      };
    }

    const updated: Order = {
      ...order,
      parcelImageUrl: imageUrl.trim(),
      status: 'READY_TO_CLAIM',
      readyToClaimTime: 'Just now',
    };

    return {
      success: true,
      message: 'Parcel photo attached & verified. Order is now ready to claim.',
      data: updated,
    };
  },

  /**
   * Customer route: POST /orders/{id}/claim
   * Customer initiates claim, which unlocks staff interaction for HANDOFF_CUTOFF_TIME_MINS minutes.
   */
  customerInitiateClaim: (order: Order): ApiResponse<Order> => {
    if (order.status !== 'READY_TO_CLAIM') {
      return {
        success: false,
        message: 'Order is not ready to claim.',
        error: 'INVALID_STATUS',
      };
    }

    const updated: Order = {
      ...order,
      claimInitiatedAt: Date.now(),
    };

    return {
      success: true,
      message: `Claim initiated! Staff terminal unlocked for ${ENV.HANDOFF_CUTOFF_TIME_MINS} minutes.`,
      data: updated,
    };
  },

  /**
   * Staff route: POST /orders/{id}/claim
   * Staff manually releases order to customer once customer has initiated claim.
   */
  staffRelease: (order: Order): ApiResponse<Order> => {
    if (order.status !== 'READY_TO_CLAIM') {
      return {
        success: false,
        message: `Order cannot be released in ${order.status} status.`,
        error: 'INVALID_STATUS',
      };
    }

    if (!isClaimUnlocked(order)) {
      return {
        success: false,
        message: 'Order interaction locked. Customer must initiate claim from mobile app first.',
        error: 'CLAIM_NOT_UNLOCKED',
      };
    }

    const finalChange = !order.change || order.change === 'To Be Determined' ? '₱20' : order.change;

    const updated: Order = {
      ...order,
      status: 'CLAIMED',
      claimedTime: 'Just now',
      change: finalChange,
      claimInitiatedAt: null,
    };

    return {
      success: true,
      message: `Parcel released to customer. Cash change ${finalChange} handed over.`,
      data: updated,
    };
  },

  /**
   * Unified route dispatcher matching the exact API specification:
   * Staff:
   *   POST /orders/{id}/activate (takes amountReceived)
   *   POST /orders/{id}/make-claimable/pay
   *   POST /orders/{id}/make-claimable/attach-photo (takes imageUrl)
   *   POST /orders/{id}/claim
   * Customer:
   *   POST /orders/{id}/claim
   */
  handleRoute: (
    role: RouteRole,
    method: string,
    path: string,
    orders: Order[],
    body?: any
  ): ApiResponse<Order> => {
    const match = path.match(/^\/orders\/([^/]+)(.*)$/);
    if (!match) {
      return { success: false, message: `Route ${path} not found`, error: 'NOT_FOUND' };
    }
    const orderId = match[1];
    const subPath = match[2] || '';
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, message: `Order ${orderId} not found`, error: 'ORDER_NOT_FOUND' };
    }

    if (method.toUpperCase() !== 'POST') {
      return { success: false, message: `Method ${method} not allowed`, error: 'METHOD_NOT_ALLOWED' };
    }

    if (role === 'staff') {
      if (subPath === '/activate') {
        return orderApi.staffActivate(order, body?.amountReceived);
      }
      if (subPath === '/make-claimable/pay') {
        return orderApi.staffPayCourier(order);
      }
      if (subPath === '/make-claimable/attach-photo') {
        return orderApi.staffAttachPhoto(order, body?.imageUrl);
      }
      if (subPath === '/claim') {
        return orderApi.staffRelease(order);
      }
    } else if (role === 'customer') {
      if (subPath === '/claim') {
        return orderApi.customerInitiateClaim(order);
      }
    }

    return {
      success: false,
      message: `Endpoint ${method} ${path} not recognized for role ${role}`,
      error: 'ROUTE_NOT_FOUND',
    };
  },
};
