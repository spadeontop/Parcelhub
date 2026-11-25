import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { StaffProfile } from '@parcelhub/contracts';

const AUTH_TOKEN_KEY = 'parcelhub_staff_auth_token';
const REFRESH_TOKEN_KEY = 'parcelhub_staff_refresh_token';
const STAFF_EMAIL_KEY = 'parcelhub_staff_email';
const STAFF_PROFILE_KEY = 'parcelhub_staff_profile';

let memoryAuthToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryStaffEmail: string | null = null;
let memoryStaffProfile: StaffProfile | null = null;

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

export const staffStorage = {
  async getAuthToken(): Promise<string | null> {
    if (memoryAuthToken) return memoryAuthToken;
    const stored = await storage.getItem(AUTH_TOKEN_KEY);
    if (stored) memoryAuthToken = stored;
    return stored;
  },

  async setAuthToken(token: string): Promise<void> {
    memoryAuthToken = token;
    await storage.setItem(AUTH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    if (memoryRefreshToken) return memoryRefreshToken;
    const stored = await storage.getItem(REFRESH_TOKEN_KEY);
    if (stored) memoryRefreshToken = stored;
    return stored;
  },

  async setRefreshToken(token: string): Promise<void> {
    memoryRefreshToken = token;
    await storage.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getStaffEmail(): Promise<string | null> {
    if (memoryStaffEmail) return memoryStaffEmail;
    const stored = await storage.getItem(STAFF_EMAIL_KEY);
    if (stored) memoryStaffEmail = stored;
    return stored;
  },

  async setStaffEmail(email: string): Promise<void> {
    memoryStaffEmail = email;
    await storage.setItem(STAFF_EMAIL_KEY, email);
  },

  async getStaffProfile(): Promise<StaffProfile | null> {
    if (memoryStaffProfile) return memoryStaffProfile;
    const raw = await storage.getItem(STAFF_PROFILE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StaffProfile;
      if (parsed && typeof parsed.id === 'string' && typeof parsed.username === 'string') {
        memoryStaffProfile = parsed;
        return parsed;
      }
    } catch {}
    return null;
  },

  async setStaffProfile(profile: StaffProfile): Promise<void> {
    memoryStaffProfile = profile;
    await storage.setItem(STAFF_PROFILE_KEY, JSON.stringify(profile));
  },

  async clearSession(): Promise<void> {
    memoryAuthToken = null;
    memoryRefreshToken = null;
    memoryStaffEmail = null;
    memoryStaffProfile = null;
    await Promise.all([
      storage.deleteItem(AUTH_TOKEN_KEY),
      storage.deleteItem(REFRESH_TOKEN_KEY),
      storage.deleteItem(STAFF_EMAIL_KEY),
      storage.deleteItem(STAFF_PROFILE_KEY),
    ]);
  },
};
