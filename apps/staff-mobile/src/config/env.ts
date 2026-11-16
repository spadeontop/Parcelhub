import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Intelligent API Base URL Detection:
 * - If EXPO_PUBLIC_API_URL is explicitly configured, use it.
 * - On Web, localhost:3000 is directly reachable on the browser.
 * - On Native Mobile (physical device or Expo Go over LAN):
 *   Extract the host machine LAN IP from Constants.expoConfig?.hostUri
 *   (e.g. "192.168.1.13:8081" -> "http://192.168.1.13:3000").
 * - On Android Emulator, loopback to the host machine via http://10.0.2.2:3000.
 */
export function getDetectedApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Web running directly on the dev machine
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Native Mobile (Expo Go / Development build): dynamically resolve Metro host machine LAN IP
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }
  } catch {}

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // LAN Wi-Fi fallback for physical devices
  return 'http://192.168.1.13:3000';
}

export const ENV = {
  API_BASE_URL: getDetectedApiUrl(),
  DEFAULT_STAFF_EMAIL: 'staff@parcelhub.com',
  DEFAULT_STAFF_PASSWORD: 'string',
  POLLING_INTERVAL_MS: 4000,
  HANDOFF_CUTOFF_TIME_MINS: 5,
};
