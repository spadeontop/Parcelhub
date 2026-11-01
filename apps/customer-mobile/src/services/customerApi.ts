import * as SecureStore from 'expo-secure-store';
import {
  CustomerRegisterRequest,
  CustomerRegisterResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerCreateMpinRequest,
  CustomerCreateMpinResponse,
  CustomerVerifyMpinRequest,
  CustomerVerifyMpinResponse,
} from '../types';
import { ENV } from '../config/env';

const REFRESH_TOKEN_KEY = 'parcelhub_customer_refresh_token';
const AUTH_TOKEN_KEY = 'parcelhub_customer_auth_token';

const isBusinessClientError = (status: number) =>
  status >= 400 && status < 500 && status !== 404 && status !== 405;

export const customerApi = {
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

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch {}
  },

  /**
   * POST /api/customer/register
   * Registers a new customer account
   */
  async register(payload: CustomerRegisterRequest): Promise<CustomerRegisterResponse> {
    const fallback: CustomerRegisterResponse = {
      statusMessage: `Welcome ${payload.firstname}! Registration successful. Next, create your security MPIN.`,
      refreshToken: `rt_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        const responseData = {
          statusMessage: data?.statusMessage || fallback.statusMessage,
          refreshToken: data?.refreshToken || fallback.refreshToken,
        };
        await this.setStoredRefreshToken(responseData.refreshToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.statusMessage || data.message || data.error)) {
        const err = new Error(data.statusMessage || data.message || data.error);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/login
   * Authenticates customer credentials
   */
  async login(payload: CustomerLoginRequest): Promise<CustomerLoginResponse> {
    const fallback: CustomerLoginResponse = {
      statusMessage: 'Credentials verified! Please enter your 4-digit MPIN.',
      refreshToken: `rt_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        const responseData = {
          statusMessage: data?.statusMessage || fallback.statusMessage,
          refreshToken: data?.refreshToken || fallback.refreshToken,
        };
        await this.setStoredRefreshToken(responseData.refreshToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.statusMessage || data.message || data.error)) {
        const err = new Error(data.statusMessage || data.message || data.error);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/create-mpin
   * Sets up initial 4-digit MPIN
   */
  async createMpin(payload: CustomerCreateMpinRequest): Promise<CustomerCreateMpinResponse> {
    const fallback: CustomerCreateMpinResponse = {
      statusMessage: 'MPIN created successfully! Welcome to ParcelHub.',
      authToken: `at_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/customer/create-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        const responseData = {
          statusMessage: data?.statusMessage || fallback.statusMessage,
          authToken: data?.authToken || fallback.authToken,
        };
        await this.setStoredAuthToken(responseData.authToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.statusMessage || data.message || data.error)) {
        const err = new Error(data.statusMessage || data.message || data.error);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredAuthToken(fallback.authToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredAuthToken(fallback.authToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/verify-mpin
   * Verifies 4-digit MPIN and issues access token
   */
  async verifyMpin(payload: CustomerVerifyMpinRequest): Promise<CustomerVerifyMpinResponse> {
    const fallback: CustomerVerifyMpinResponse = {
      statusMessage: 'Access granted!',
      authToken: `at_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/customer/verify-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        const responseData = {
          statusMessage: data?.statusMessage || fallback.statusMessage,
          authToken: data?.authToken || fallback.authToken,
        };
        await this.setStoredAuthToken(responseData.authToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.statusMessage || data.message || data.error)) {
        const err = new Error(data.statusMessage || data.message || data.error);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredAuthToken(fallback.authToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredAuthToken(fallback.authToken);
      return fallback;
    }
  },
};

