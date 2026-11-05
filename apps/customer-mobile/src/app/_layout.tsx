import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../context/AppContext';
import { MpinModal } from '../components/modals/MpinModal';
import { ProofOfDeliveryModal } from '../components/modals/ProofOfDeliveryModal';
import { NotificationsModal } from '../components/modals/NotificationsModal';
import { Toast } from '../components/common/Toast';
import '../global.css';

// Ensure splash screen can hide gracefully
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootAppContent() {
  const { toast } = useApp();

  useEffect(() => {
    // Hide splash screen once Root layout mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
      <MpinModal />
      <ProofOfDeliveryModal />
      <NotificationsModal />

      {/* Global Animated Toast Notification Pill */}
      <Toast isOpen={toast.show} message={toast.message} />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppProvider>
        <RootAppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
