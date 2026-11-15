import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'parcelhub_customer_refresh_token';
const AUTH_TOKEN_KEY = 'parcelhub_customer_auth_token';
const PRE_AUTH_TOKEN_KEY = 'parcelhub_customer_pre_auth_token';
const PROFILE_KEY = 'parcelhub_customer_profile';

export const tokenStorageV1 = {
  async getPreAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(PRE_AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setPreAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(PRE_AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async clearPreAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PRE_AUTH_TOKEN_KEY);
    } catch {}
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch {}
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {}
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(PRE_AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(PROFILE_KEY);
    } catch {}
  },
};
