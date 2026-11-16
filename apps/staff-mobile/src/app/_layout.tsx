import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StaffProvider, useStaff } from '../context/StaffContext';
import { Toast } from '../components/common/Toast';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootAppContent() {
  const { toast } = useStaff();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#000000' }}
      className="flex-1 bg-black"
      edges={['top']}
    >
      <StatusBar style="light" />
      <View
        style={{ flex: 1, backgroundColor: '#000000' }}
        className="flex-1 bg-black"
      >
        <Slot />
      </View>

      {/* Global Animated Toast Notification */}
      <Toast isOpen={toast.show} message={toast.message} type={toast.type} />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <StaffProvider>
        <RootAppContent />
      </StaffProvider>
    </SafeAreaProvider>
  );
}
