import { Platform } from 'react-native';
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

// In-memory cache for fast, reliable synchronous access across web & native
let memoryAuthToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryStaffEmail: string | null = null;

const isWeb = Platform.OS === 'web';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

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
    if (memoryAuthToken) return memoryAuthToken;
    const stored = await storage.getItem(AUTH_TOKEN_KEY);
    if (stored) memoryAuthToken = stored;
    return stored;
  },

  async setStoredAuthToken(token: string): Promise<void> {
    memoryAuthToken = token;
    await storage.setItem(AUTH_TOKEN_KEY, token);
  },

  async getStoredRefreshToken(): Promise<string | null> {
    if (memoryRefreshToken) return memoryRefreshToken;
    const stored = await storage.getItem(REFRESH_TOKEN_KEY);
    if (stored) memoryRefreshToken = stored;
    return stored;
  },

  async setStoredRefreshToken(token: string): Promise<void> {
    memoryRefreshToken = token;
    await storage.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getStoredStaffEmail(): Promise<string | null> {
    if (memoryStaffEmail) return memoryStaffEmail;
    const stored = await storage.getItem(STAFF_EMAIL_KEY);
    if (stored) memoryStaffEmail = stored;
    return stored;
  },

  async setStoredStaffEmail(email: string): Promise<void> {
    memoryStaffEmail = email;
    await storage.setItem(STAFF_EMAIL_KEY, email);
  },

  async clearStoredSession(): Promise<void> {
    memoryAuthToken = null;
    memoryRefreshToken = null;
    memoryStaffEmail = null;
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(REFRESH_TOKEN_KEY);
    await storage.deleteItem(STAFF_EMAIL_KEY);
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

  async getOrders(status?: OrderStatus, limit?: number, explicitToken?: string): Promise<StaffOrder[]> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());

    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders${qs}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
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
        claimedAt: o.claimedAt,
        createdAt: o.createdAt || (o.statusTimeline && o.statusTimeline[0]?.timestamp) || o.timestamp,
        statusTimeline: o.statusTimeline,
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

  async getOrder(orderId: string, explicitToken?: string): Promise<StaffOrder> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
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
        claimedAt: o.claimedAt,
        createdAt: o.createdAt || (o.statusTimeline && o.statusTimeline[0]?.timestamp) || o.timestamp,
        statusTimeline: o.statusTimeline,
        proofImageUrl: o.proofImageUrl,
      };
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || `Error fetching order ${orderId}`);
    }
  },

  async activateOrder(orderId: string, amountReceived: number, explicitToken?: string): Promise<StaffActivateOrderResponse> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountReceived }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Activation failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffActivateOrderResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error activating order');
    }
  },

  async payCourier(orderId: string, explicitToken?: string): Promise<StaffPayCourierResponse> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/make-claimable/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Courier payment failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffPayCourierResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error recording courier payout');
    }
  },

  async attachPhoto(orderId: string, imageUrl: string, explicitToken?: string): Promise<StaffAttachPhotoResponse> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/make-claimable/attach-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
        const errorMsg = data?.message || data?.error || data?.statusMessage || `Photo attach failed (${res.status})`;
        throw new StaffApiError(errorMsg, res.status);
      }

      return data as StaffAttachPhotoResponse;
    } catch (err: any) {
      if (err instanceof StaffApiError) throw err;
      throw new StaffApiError(err?.message || 'Error attaching parcel photo');
    }
  },

  async claimOrder(orderId: string, explicitToken?: string): Promise<StaffClaimOrderResponse> {
    const token = explicitToken || (await this.getStoredAuthToken());
    if (!token) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/staff/orders/${encodeURIComponent(orderId)}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          await this.clearStoredSession();
        }
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
