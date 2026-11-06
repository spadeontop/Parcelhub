import * as SecureStore from 'expo-secure-store';
import {
  StaffOrder,
  StaffLoginResponse,
  StaffOrderDetailResponse,
  StaffActivateOrderResponse,
  StaffPayCourierResponse,
  StaffAttachPhotoResponse,
  StaffClaimOrderResponse,
  OrderStatus,
} from '../types';
import { ENV } from '../config/env';

const AUTH_TOKEN_KEY = 'parcelhub_staff_auth_token';
const REFRESH_TOKEN_KEY = 'parcelhub_staff_refresh_token';
const STAFF_EMAIL_KEY = 'parcelhub_staff_email';

export class StaffApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'StaffApiError';
    this.statusCode = statusCode;
  }
}

export const staffApi = {
  async getStoredAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setStoredAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setStoredRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {}
  },

  async getStoredStaffEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STAFF_EMAIL_KEY);
    } catch {
      return null;
    }
  },

  async setStoredStaffEmail(email: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STAFF_EMAIL_KEY, email);
    } catch {}
  },

  async clearStoredSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(STAFF_EMAIL_KEY);
    } catch {}
  },

  async login(email: string, password: string): Promise<StaffLoginResponse> {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Login failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      await this.setStoredAuthToken(data.authToken);
      if (data.refreshToken) {
        await this.setStoredRefreshToken(data.refreshToken);
      }
      await this.setStoredStaffEmail(email);

      return data as StaffLoginResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(
        err?.message?.includes('Network request failed')
          ? `Cannot reach backend at ${ENV.API_BASE_URL}. Ensure Next.js server is running.`
          : err?.message || 'Network error during login'
      );
    }
  },

  async getOrders(status?: OrderStatus, limit?: number): Promise<StaffOrder[]> {
    const token = await this.getStoredAuthToken();
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());

    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders${qs}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Failed to fetch orders (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      const rawOrders: any[] = data?.orders || [];
      return rawOrders.map((o) => ({
        id: o.id || o.orderId,
        trackingId: o.trackingId || '',
        customer: o.customer || o.recipientName || 'Unknown Customer',
        productName: o.productName || o.product || 'Standard Parcel',
        amountToPay: typeof o.amountToPay === 'number' ? o.amountToPay : (o.price || 0),
        amountReceived: o.amountReceived,
        change: o.change || 0,
        timestamp: o.timestamp || new Date().toISOString(),
        status: o.status,
        statusMessage: o.statusMessage,
        isClaimActive: o.isClaimActive,
        claimRemainingSeconds: o.claimRemainingSeconds,
        claimInitiatedAt: o.claimInitiatedAt,
        claimExpiresAt: o.claimExpiresAt,
        courierPaid: o.courierPaid,
        courierPaidBy: o.courierPaidBy,
        courierPaidByName: o.courierPaidByName,
        courierPaidAt: o.courierPaidAt,
        proofImageUrl: o.proofImageUrl || o.imageUrl,
        notes: o.notes,
      }));
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(
        err?.message?.includes('Network request failed')
          ? `Backend offline: Cannot connect to ${ENV.API_BASE_URL}.`
          : err?.message || 'Error fetching staff orders'
      );
    }
  },

  async getOrder(orderId: string): Promise<StaffOrder> {
    const token = await this.getStoredAuthToken();
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Failed to fetch order ${orderId}`;
        throw new StaffApiError(errorMsg, res.status);
      }

      const o = data as StaffOrderDetailResponse;
      return {
        id: o.orderId || orderId,
        trackingId: o.trackingId,
        customer: o.customer,
        amountToPay: o.amountToPay,
        change: 0,
        timestamp: o.timestamp,
        status: o.status,
        statusMessage: o.statusMessage,
        isClaimActive: o.isClaimActive,
        claimRemainingSeconds: o.claimRemainingSeconds,
        courierPaid: o.courierPaid,
        courierPaidBy: o.courierPaidBy,
        courierPaidByName: o.courierPaidByName,
        courierPaidAt: o.courierPaidAt,
        proofImageUrl: o.proofImageUrl,
      };
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || `Error fetching order ${orderId}`);
    }
  },

  async activateOrder(orderId: string, amountReceived: number): Promise<StaffActivateOrderResponse> {
    const token = await this.getStoredAuthToken();
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountReceived }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Activation failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffActivateOrderResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error activating order');
    }
  },

  async payCourier(orderId: string): Promise<StaffPayCourierResponse> {
    const token = await this.getStoredAuthToken();
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/make-claimable/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Courier payment failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffPayCourierResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error recording courier payout');
    }
  },

  async attachPhoto(orderId: string, imageUrl: string): Promise<StaffAttachPhotoResponse> {
    const token = await this.getStoredAuthToken();
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/make-claimable/attach-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Photo attach failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffAttachPhotoResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error attaching parcel photo');
    }
  },

  async claimOrder(orderId: string): Promise<StaffClaimOrderResponse> {
    const token = await this.getStoredAuthToken();
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Claim failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffClaimOrderResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error releasing parcel to customer');
    }
  },
};
