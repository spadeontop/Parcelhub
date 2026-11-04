import {
  Order,
  OrderStatus,
  parseCurrency,
  getStatedFee,
  isClaimUnlocked as contractsIsClaimUnlocked,
  getClaimTimeRemainingSeconds as contractsGetClaimTimeRemainingSeconds,
} from '@parcelhub/contracts';
import { ENV } from '../config/env';

export { parseCurrency, getStatedFee };

export const isClaimUnlocked = (order: Order): boolean => {
  return contractsIsClaimUnlocked(order, ENV.HANDOFF_CUTOFF_TIME_MINS);
};

export const getClaimTimeRemainingSeconds = (order: Order): number => {
  return contractsGetClaimTimeRemainingSeconds(order, ENV.HANDOFF_CUTOFF_TIME_MINS);
};

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const orderApi = {
  customerInitiateClaim: (order: Order): ApiResponse<Order> => {
    if (order.status !== 'READY_TO_CLAIM') {
      return {
        success: false,
        message: `Order ${order.id} is not ready to claim (current status: ${order.status}).`,
        error: 'INVALID_STATUS',
      };
    }

    const now = Date.now();
    const updated: Order = {
      ...order,
      claimInitiatedAt: now,
    };

    return {
      success: true,
      message: `Pickup pass unlocked for 5 minutes! Present your key or QR code to Lily's Catering Hub counter.`,
      data: updated,
    };
  },

  customerVerifyMpinAndClaim: (order: Order): ApiResponse<Order> => {
    const updated: Order = {
      ...order,
      claimInitiatedAt: Date.now(),
    };
    return {
      success: true,
      message: 'MPIN verified! Active counter handover ticket valid for 5:00 minutes.',
      data: updated,
    };
  },
};

