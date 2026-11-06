import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Intelligent API Base URL Detection:
 * - If EXPO_PUBLIC_API_URL is explicitly set, prefer it.
 * - If running on a physical device or Expo Go over LAN, extract the dev machine LAN IP from Constants.expoConfig.hostUri.
 * - If running on an Android Emulator, loopback to host machine via http://10.0.2.2:3000.
 * - If running on Web / iOS Simulator, loopback via http://localhost:3000.
 */
export function getDetectedApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }
  } catch {}

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const ENV = {
  HANDOFF_CUTOFF_TIME_MINS: 5,
  API_BASE_URL: getDetectedApiUrl(),
  DEFAULT_POLL_INTERVAL_SEC: 5,
};
