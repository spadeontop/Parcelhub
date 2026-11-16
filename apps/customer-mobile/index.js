import React from 'react';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Top-level background message handler for headless Android tasks
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM Background] Headless message received:', remoteMessage);
  });
} catch (e) {
  // Graceful catch for web or environments where native messaging is not loaded
  console.warn('[FCM Background] Native messaging init:', e?.message || e);
}

export function App() {
  const ctx = require.context('./src/app');
  return React.createElement(ExpoRoot, { context: ctx });
}

registerRootComponent(App);
