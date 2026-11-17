import React from 'react';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Only initialize native FCM background handler if NOT running in Expo Go
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
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
