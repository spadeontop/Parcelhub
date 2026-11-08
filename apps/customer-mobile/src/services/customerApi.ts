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
      };
      await this.setStoredAuthToken(responseData.authToken);
      if (responseData.refreshToken) {
        await this.setStoredRefreshToken(responseData.refreshToken);
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
      };
      await this.setStoredAuthToken(responseData.authToken);
      if (responseData.refreshToken) {
        await this.setStoredRefreshToken(responseData.refreshToken);
      }
      return responseData;
    }

    const errorMsg = data?.message || data?.error || data?.statusMessage || `MPIN verification failed (HTTP ${res.status})`;
    throw new Error(errorMsg);
  },
};
