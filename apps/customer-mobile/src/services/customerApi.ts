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
  CustomerProfileRes,
} from '../types';
import { ENV } from '../config/env';

const REFRESH_TOKEN_KEY = 'parcelhub_customer_refresh_token';
const AUTH_TOKEN_KEY = 'parcelhub_customer_auth_token';
const PRE_AUTH_TOKEN_KEY = 'parcelhub_customer_pre_auth_token';
const PROFILE_KEY = 'parcelhub_customer_profile';
const API_URL_KEY = 'parcelhub_api_base_url';
const LIVE_MODE_KEY = 'parcelhub_is_live_mode';

const isBusinessClientError = (status: number) =>
  status >= 400 && status < 500 && status !== 404 && status !== 405;

const isWeb = typeof window !== 'undefined' && Boolean(window.localStorage);

const storageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return window.localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        window.localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        window.localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const customerApi = {
  async getStoredRefreshToken(): Promise<string | null> {
    return await storageAdapter.getItem(REFRESH_TOKEN_KEY);
  },

  async setStoredRefreshToken(token: string): Promise<void> {
    await storageAdapter.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getStoredAuthToken(): Promise<string | null> {
    return await storageAdapter.getItem(AUTH_TOKEN_KEY);
  },

  async setStoredAuthToken(token: string): Promise<void> {
    await storageAdapter.setItem(AUTH_TOKEN_KEY, token);
  },

  async getStoredPreAuthToken(): Promise<string | null> {
    return await storageAdapter.getItem(PRE_AUTH_TOKEN_KEY);
  },

  async setStoredPreAuthToken(token: string): Promise<void> {
    await storageAdapter.setItem(PRE_AUTH_TOKEN_KEY, token);
  },

  async getStoredApiUrl(): Promise<string | null> {
    return await storageAdapter.getItem(API_URL_KEY);
  },

  async setStoredApiUrl(url: string): Promise<void> {
    await storageAdapter.setItem(API_URL_KEY, url);
  },

  async getStoredIsLiveMode(): Promise<boolean | null> {
    const val = await storageAdapter.getItem(LIVE_MODE_KEY);
    return val !== null ? val === 'true' : null;
  },

  async setStoredIsLiveMode(isLive: boolean): Promise<void> {
    await storageAdapter.setItem(LIVE_MODE_KEY, isLive ? 'true' : 'false');
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      storageAdapter.deleteItem(REFRESH_TOKEN_KEY),
      storageAdapter.deleteItem(AUTH_TOKEN_KEY),
      storageAdapter.deleteItem(PRE_AUTH_TOKEN_KEY),
      storageAdapter.deleteItem(PROFILE_KEY),
    ]);
  },

  async getStoredProfile(): Promise<any | null> {
    try {
      const raw = await storageAdapter.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setStoredProfile(profile: any): Promise<void> {
    await storageAdapter.setItem(PROFILE_KEY, JSON.stringify(profile));
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
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerRegisterRes> {
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

    const errorMsg = data?.message || data?.error || data?.statusMessage || `Registration failed (HTTP ${res.status})`;
    const error: any = new Error(errorMsg);
    error.statusCode = data?.statusCode || res.status;
    error.error = data?.error;
    throw error;
  },

  /**
   * POST /api/customer/login
   * Authenticates customer credentials, returns preAuthToken
   */
  async login(
    payload: CustomerLoginReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerLoginRes> {
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

    const errorMsg = data?.message || data?.error || data?.statusMessage || `Login failed (HTTP ${res.status})`;
    const error: any = new Error(errorMsg);
    error.statusCode = data?.statusCode || res.status;
    error.error = data?.error;
    throw error;
  },

  /**
   * POST /api/customer/create-mpin
   * Sets up initial 4-digit MPIN, returns authToken & refreshToken
   */
  async createMpin(
    payload: CustomerCreateMpinReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerCreateMpinRes> {
    const res = await fetch(`${baseUrl}/api/customer/create-mpin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.authToken) {
      const responseData: CustomerCreateMpinRes = {
        statusMessage: data.statusMessage || 'MPIN created successfully',
        authToken: data.authToken,
        refreshToken: data.refreshToken,
        customer: data.customer,
      };
      await this.setStoredAuthToken(responseData.authToken);
      if (responseData.refreshToken) {
        await this.setStoredRefreshToken(responseData.refreshToken);
      }
      if (responseData.customer) {
        await this.setStoredProfile(responseData.customer);
      }
      return responseData;
    }

    const errorMsg = data?.message || data?.error || data?.statusMessage || `Failed to create MPIN (HTTP ${res.status})`;
    throw new Error(errorMsg);
  },

  /**
   * POST /api/customer/mpin
   * Verifies 4-digit MPIN against preAuthToken, returns authToken & refreshToken
   */
  async verifyMpin(
    payload: CustomerVerifyMpinReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerVerifyMpinRes> {
    const res = await fetch(`${baseUrl}/api/customer/mpin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.authToken) {
      const responseData: CustomerVerifyMpinRes = {
        statusMessage: data.statusMessage || 'Access granted',
        authToken: data.authToken,
        refreshToken: data.refreshToken,
        customer: data.customer,
      };
      await this.setStoredAuthToken(responseData.authToken);
      if (responseData.refreshToken) {
        await this.setStoredRefreshToken(responseData.refreshToken);
      }
      if (responseData.customer) {
        await this.setStoredProfile(responseData.customer);
      }
      return responseData;
    }

    const errorMsg = data?.message || data?.error || data?.statusMessage || `MPIN verification failed (HTTP ${res.status})`;
    throw new Error(errorMsg);
  },

  /**
   * GET /api/customer/profile
   * Retrieves profile of currently authenticated customer
   */
  async getProfile(
    authToken: string,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerProfileRes> {
    const res = await fetch(`${baseUrl}/api/customer/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.customer) {
      const responseData: CustomerProfileRes = {
        statusMessage: data.statusMessage || 'Profile retrieved successfully',
        customer: data.customer,
      };
      await this.setStoredProfile(responseData.customer);
      return responseData;
    }

    const errorMsg = data?.message || data?.error || data?.statusMessage || `Failed to fetch profile (HTTP ${res.status})`;
    throw new Error(errorMsg);
  },
};
