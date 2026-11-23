import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { V1Provider, useV1 } from '../v1/context/V1Context';
import { ProofOfDeliveryModal } from '../components/modals/ProofOfDeliveryModal';
import { Toast } from '../components/common/Toast';
import '../global.css';

// Ensure splash screen can hide gracefully
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootAppContent() {
  const { toast } = useV1();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white"
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white">
        <Slot />
      </View>

      {/* Global Interactive Modals */}
      <ProofOfDeliveryModal />

      {/* Global Animated Toast Notification Pill */}
      <Toast isOpen={toast.show} message={toast.message} />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'GoogleSans-Regular': require('../../assets/fonts/GoogleSans-Regular.ttf'),
    'GoogleSans-Medium': require('../../assets/fonts/GoogleSans-Medium.ttf'),
    'GoogleSans-SemiBold': require('../../assets/fonts/GoogleSans-SemiBold.ttf'),
    'GoogleSans-Bold': require('../../assets/fonts/GoogleSans-Bold.ttf'),
    'GoogleSans-Italic': require('../../assets/fonts/GoogleSans-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <V1Provider>
        <RootAppContent />
      </V1Provider>
    </SafeAreaProvider>
  );
}
