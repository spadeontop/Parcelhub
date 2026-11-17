import React from 'react';
import { Platform, TurboModuleRegistry, NativeModules } from 'react-native';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Only initialize native FCM background handler if the native module is actually compiled in the binary
const isFirebaseAvailable =
  Platform.OS !== 'web' &&
  Boolean(
    TurboModuleRegistry.get?.('NativeRNFBTurboApp') ||
    TurboModuleRegistry.get?.('NativeRNFBTurboMessaging') ||
    NativeModules?.RNFBAppModule ||
    NativeModules?.NativeRNFBTurboApp
  );

if (isFirebaseAvailable) {
  try {
    const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    const messaging = getMessaging();
    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log('[FCM Background] Headless message received:', remoteMessage);
    });
  } catch (e) {
    console.warn('[FCM Background] Native messaging init:', e?.message || e);
  }
}

export function App() {
  const ctx = require.context('./src/app');
  return React.createElement(ExpoRoot, { context: ctx });
}

registerRootComponent(App);
