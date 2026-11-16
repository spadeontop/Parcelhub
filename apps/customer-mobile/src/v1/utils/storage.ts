import * as SecureStore from 'expo-secure-store';
import { JWTToken, CustomerProfile } from '../types/api';

const V1_PRE_AUTH_TOKEN_KEY = 'parcelhub_v1_pre_auth_token';
const V1_AUTH_TOKEN_KEY = 'parcelhub_v1_auth_token';
const V1_REFRESH_TOKEN_KEY = 'parcelhub_v1_refresh_token';
const V1_PROFILE_KEY = 'parcelhub_v1_customer_profile';
const V1_PUSH_ENABLED_KEY = 'parcelhub_v1_push_notifications_enabled';

export const v1Storage = {
  async getPreAuthToken(): Promise<JWTToken | null> {
    try {
      return await SecureStore.getItemAsync(V1_PRE_AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setPreAuthToken(token: JWTToken): Promise<void> {
    try {
      await SecureStore.setItemAsync(V1_PRE_AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async clearPreAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(V1_PRE_AUTH_TOKEN_KEY);
    } catch {}
  },

  async getAuthToken(): Promise<JWTToken | null> {
    try {
      return await SecureStore.getItemAsync(V1_AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: JWTToken): Promise<void> {
    try {
      await SecureStore.setItemAsync(V1_AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(V1_AUTH_TOKEN_KEY);
    } catch {}
  },

  async getRefreshToken(): Promise<JWTToken | null> {
    try {
      return await SecureStore.getItemAsync(V1_REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: JWTToken): Promise<void> {
    try {
      await SecureStore.setItemAsync(V1_REFRESH_TOKEN_KEY, token);
    } catch {}
  },

  async clearRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(V1_REFRESH_TOKEN_KEY);
    } catch {}
  },

  async getCustomerProfile(): Promise<CustomerProfile | null> {
    try {
      const raw = await SecureStore.getItemAsync(V1_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setCustomerProfile(profile: CustomerProfile): Promise<void> {
    try {
      await SecureStore.setItemAsync(V1_PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  },

  async clearCustomerProfile(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(V1_PROFILE_KEY);
    } catch {}
  },

  async getPushNotificationsEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(V1_PUSH_ENABLED_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  async setPushNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(V1_PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {}
  },

  async clearAllTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(V1_PRE_AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(V1_AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(V1_REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(V1_PROFILE_KEY);
    } catch {}
  },
};
