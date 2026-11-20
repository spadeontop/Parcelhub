import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StaffProvider } from '../context/StaffContext';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootAppContent() {
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
