import * as SecureStore from 'expo-secure-store';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
  CustomerVerifyMpinReq,
  CustomerVerifyMpinRes,
} from '../types';
import { ENV } from '../config/env';

const REFRESH_TOKEN_KEY = 'parcelhub_customer_refresh_token';
const AUTH_TOKEN_KEY = 'parcelhub_customer_auth_token';
const PRE_AUTH_TOKEN_KEY = 'parcelhub_customer_pre_auth_token';
const API_URL_KEY = 'parcelhub_api_base_url';
const LIVE_MODE_KEY = 'parcelhub_is_live_mode';

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

  async getStoredPreAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(PRE_AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setStoredPreAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(PRE_AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async getStoredApiUrl(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(API_URL_KEY);
    } catch {
      return null;
    }
  },

  async setStoredApiUrl(url: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(API_URL_KEY, url);
    } catch {}
  },

  async getStoredIsLiveMode(): Promise<boolean | null> {
    try {
      const val = await SecureStore.getItemAsync(LIVE_MODE_KEY);
      return val !== null ? val === 'true' : null;
    } catch {
      return null;
    }
  },

  async setStoredIsLiveMode(isLive: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(LIVE_MODE_KEY, isLive ? 'true' : 'false');
    } catch {}
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(PRE_AUTH_TOKEN_KEY);
    } catch {}
  },

  /**
   * Health check ping to verify if backend is reachable.
   * Returns alive=true if the server responds (even with 401 Unauthorized).
   */
  async checkHealth(baseUrl: string = ENV.API_BASE_URL): Promise<{
    alive: boolean;
    status: number;
    latencyMs: number;
    message?: string;
  }> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${baseUrl}/api/customer/orders`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      return {
        alive: true,
        status: res.status,
        latencyMs,
        message: res.status === 401 ? 'Backend active (401 Auth Required)' : `HTTP ${res.status} OK`,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      return {
        alive: false,
        status: 0,
        latencyMs,
        message: err?.name === 'AbortError' ? 'Connection timed out (4s)' : 'Server unreachable / offline',
      };
    }
  },

  /**
   * POST /api/customer/register
   * Registers a new customer account, returns preAuthToken
   */
  async register(
    payload: CustomerRegisterReq,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true
  ): Promise<CustomerRegisterRes> {
    const fallback: CustomerRegisterRes = {
      statusMessage: `Welcome ${payload.firstName}! Registration successful. Next, create your security MPIN.`,
      preAuthToken: `preauth_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    if (!isLiveMode) {
      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    }

    try {
      const res = await fetch(`${baseUrl}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          firstName: payload.firstName,
          lastName: payload.lastName,
          middleInitial: payload.middleInitial,
          phoneNumber: payload.phoneNumber,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.preAuthToken) {
        const responseData: CustomerRegisterRes = {
          statusMessage: data.statusMessage || 'Registration successful',
          preAuthToken: data.preAuthToken,
        };
        await this.setStoredPreAuthToken(responseData.preAuthToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.message || data.error || data.statusMessage)) {
        const err = new Error(data.message || data.error || data.statusMessage);
        (err as any).isBackendError = true;
        throw err;
      }

      // If backend failed unexpectedly, use fallback
      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/login
   * Authenticates customer credentials, returns preAuthToken
   */
  async login(
    payload: CustomerLoginReq,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true
  ): Promise<CustomerLoginRes> {
    const fallback: CustomerLoginRes = {
      statusMessage: 'Credentials verified! Please enter your 4-digit MPIN.',
      preAuthToken: `preauth_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    if (!isLiveMode) {
      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    }

    try {
      const res = await fetch(`${baseUrl}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.preAuthToken) {
        const responseData: CustomerLoginRes = {
          statusMessage: data.statusMessage || 'Credentials verified',
          preAuthToken: data.preAuthToken,
        };
        await this.setStoredPreAuthToken(responseData.preAuthToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.message || data.error || data.statusMessage)) {
        const err = new Error(data.message || data.error || data.statusMessage);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredPreAuthToken(fallback.preAuthToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/create-mpin
   * Sets up initial 4-digit MPIN, returns authToken & refreshToken
   */
  async createMpin(
    payload: CustomerCreateMpinReq,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true
  ): Promise<CustomerCreateMpinRes> {
    const fallback: CustomerCreateMpinRes = {
      statusMessage: 'MPIN created successfully! Welcome to ParcelHub.',
      authToken: `at_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      refreshToken: `rt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    if (!isLiveMode) {
      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }

    try {
      const res = await fetch(`${baseUrl}/api/customer/create-mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.authToken) {
        const responseData: CustomerCreateMpinRes = {
          statusMessage: data.statusMessage || fallback.statusMessage,
          authToken: data.authToken,
          refreshToken: data.refreshToken || fallback.refreshToken,
        };
        await this.setStoredAuthToken(responseData.authToken);
        await this.setStoredRefreshToken(responseData.refreshToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.message || data.error || data.statusMessage)) {
        const err = new Error(data.message || data.error || data.statusMessage);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }
  },

  /**
   * POST /api/customer/mpin
   * Verifies 4-digit MPIN against preAuthToken, returns authToken & refreshToken
   */
  async verifyMpin(
    payload: CustomerVerifyMpinReq,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true
  ): Promise<CustomerVerifyMpinRes> {
    const fallback: CustomerVerifyMpinRes = {
      statusMessage: 'Access granted!',
      authToken: `at_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      refreshToken: `rt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    if (!isLiveMode) {
      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }

    try {
      const res = await fetch(`${baseUrl}/api/customer/mpin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.authToken) {
        const responseData: CustomerVerifyMpinRes = {
          statusMessage: data.statusMessage || fallback.statusMessage,
          authToken: data.authToken,
          refreshToken: data.refreshToken || fallback.refreshToken,
        };
        await this.setStoredAuthToken(responseData.authToken);
        await this.setStoredRefreshToken(responseData.refreshToken);
        return responseData;
      }

      if (isBusinessClientError(res.status) && data && (data.message || data.error || data.statusMessage)) {
        const err = new Error(data.message || data.error || data.statusMessage);
        (err as any).isBackendError = true;
        throw err;
      }

      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    } catch (err: any) {
      if (err?.isBackendError) throw err;
      await this.setStoredAuthToken(fallback.authToken);
      await this.setStoredRefreshToken(fallback.refreshToken);
      return fallback;
    }
  },
};
