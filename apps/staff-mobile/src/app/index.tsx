import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useStaff } from '../context/StaffContext';
import { LoginScreen } from '../components/screens/LoginScreen';
import { StaffTerminalScreen } from '../components/screens/StaffTerminalScreen';

export default function IndexPage() {
  const { isAuthenticated, isInitialLoading } = useStaff();

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color="#215CD4" />
        <Text className="text-[#64748B] text-xs font-semibold mt-3 tracking-wider uppercase">
          Initializing Staff Terminal...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <StaffTerminalScreen />;
}
