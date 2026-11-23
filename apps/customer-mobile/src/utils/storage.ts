import * as SecureStore from 'expo-secure-store';
import { JWTToken, CustomerProfile } from '../types/api';

const V1_PRE_AUTH_TOKEN_KEY = 'parcelhub_v1_pre_auth_token';
const V1_AUTH_TOKEN_KEY = 'parcelhub_v1_auth_token';
const V1_REFRESH_TOKEN_KEY = 'parcelhub_v1_refresh_token';
const V1_PROFILE_KEY = 'parcelhub_v1_customer_profile';
const V1_PUSH_ENABLED_KEY = 'parcelhub_v1_push_notifications_enabled';

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

export const v1Storage = {
  async getPreAuthToken(): Promise<JWTToken | null> {
    return (await storageAdapter.getItem(V1_PRE_AUTH_TOKEN_KEY)) as JWTToken | null;
  },

  async setPreAuthToken(token: JWTToken): Promise<void> {
    await storageAdapter.setItem(V1_PRE_AUTH_TOKEN_KEY, token);
  },

  async clearPreAuthToken(): Promise<void> {
    await storageAdapter.deleteItem(V1_PRE_AUTH_TOKEN_KEY);
  },

  async getAuthToken(): Promise<JWTToken | null> {
    return (await storageAdapter.getItem(V1_AUTH_TOKEN_KEY)) as JWTToken | null;
  },

  async setAuthToken(token: JWTToken): Promise<void> {
    await storageAdapter.setItem(V1_AUTH_TOKEN_KEY, token);
  },

  async clearAuthToken(): Promise<void> {
    await storageAdapter.deleteItem(V1_AUTH_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<JWTToken | null> {
    return (await storageAdapter.getItem(V1_REFRESH_TOKEN_KEY)) as JWTToken | null;
  },

  async setRefreshToken(token: JWTToken): Promise<void> {
    await storageAdapter.setItem(V1_REFRESH_TOKEN_KEY, token);
  },

  async clearRefreshToken(): Promise<void> {
    await storageAdapter.deleteItem(V1_REFRESH_TOKEN_KEY);
  },

  async getCustomerProfile(): Promise<CustomerProfile | null> {
    try {
      const raw = await storageAdapter.getItem(V1_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setCustomerProfile(profile: CustomerProfile): Promise<void> {
    await storageAdapter.setItem(V1_PROFILE_KEY, JSON.stringify(profile));
  },

  async clearCustomerProfile(): Promise<void> {
    await storageAdapter.deleteItem(V1_PROFILE_KEY);
  },

  async getPushNotificationsEnabled(): Promise<boolean> {
    const val = await storageAdapter.getItem(V1_PUSH_ENABLED_KEY);
    return val === null ? true : val === 'true';
  },

  async setPushNotificationsEnabled(enabled: boolean): Promise<void> {
    await storageAdapter.setItem(V1_PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async clearAllTokens(): Promise<void> {
    await Promise.all([
      storageAdapter.deleteItem(V1_PRE_AUTH_TOKEN_KEY),
      storageAdapter.deleteItem(V1_AUTH_TOKEN_KEY),
      storageAdapter.deleteItem(V1_REFRESH_TOKEN_KEY),
      storageAdapter.deleteItem(V1_PROFILE_KEY),
    ]);
  },
};
