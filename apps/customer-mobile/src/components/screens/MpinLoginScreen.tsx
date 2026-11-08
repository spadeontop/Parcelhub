import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';
import { NumericKeypad } from '../common/NumericKeypad';

export const MpinLoginScreen: React.FC = () => {
  const { authCustomer, verifyCustomerMpin, navigateTo, showToast } = useApp();
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = null;
      }
    };
  }, []);

  const handleKeyPress = useCallback(
    (num: string) => {
      if (pin.length < 4 && !isVerifying && !autoSubmitTimerRef.current) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          autoSubmitTimerRef.current = setTimeout(() => {
            autoSubmitTimerRef.current = null;
            setIsVerifying(true);
            verifyCustomerMpin(nextPin)
              .catch((err: any) => {
                showToast(err?.message || 'Invalid MPIN. Try again.');
                setPin('');
              })
              .finally(() => {
                setIsVerifying(false);
              });
          }, 250);
        }
      }
    },
    [pin, isVerifying, verifyCustomerMpin, showToast]
  );

  const handleBackspace = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    setIsVerifying(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    setIsVerifying(false);
    setPin('');
  }, []);

  const displayName = authCustomer.firstname
    ? `${authCustomer.firstname} ${authCustomer.lastname}`
    : 'John Vince Dumaguit';

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-6 py-6"
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header, Identity & MPIN Input Display */}
      <View>
        {/* Compact Logo (moved down) */}
        <View className="items-center justify-center mb-4 mt-7">
          <ParcelHubLogoSvg size={44} />
          <View className="flex-row items-center mt-1">
            <Text className="text-lg font-black text-[#215cd4]">Parcel</Text>
            <Text className="text-lg font-black text-[#111827]">Hub</Text>
          </View>
        </View>

        {/* User Identity Box */}
        <View className="border border-gray-200 rounded-xl p-3 px-4 flex-row items-center justify-between mb-5 bg-white shadow-sm">
          <Text className="text-sm font-semibold text-gray-900">{displayName}</Text>
          <TouchableOpacity onPress={() => navigateTo('login')}>
            <Text className="text-xs font-bold text-[#215cd4]">Switch</Text>
          </TouchableOpacity>
        </View>

        {/* MPIN Input Display */}
        <View className="items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Enter your 4-digit MPIN</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Secure code for pickups and transactions
          </Text>

          {/* 4 PIN Dots */}
          <View className="flex-row items-center justify-center gap-4 mt-5">
            {[0, 1, 2, 3].map((idx) => (
              <View
                key={idx}
                className={`w-4 h-4 rounded-full ${
                  idx < pin.length ? 'bg-[#215cd4]' : 'bg-gray-200'
                }`}
              />
            ))}
          </View>

          {isVerifying && (
            <View className="mt-3">
              <ActivityIndicator size="small" color="#215cd4" />
            </View>
          )}
        </View>
      </View>

      {/* Bottom Section: Keypad (in bottom part, padded and not elevated) */}
      <View className="w-full pb-3">
        <NumericKeypad
          onPressDigit={handleKeyPress}
          onPressBackspace={handleBackspace}
          onPressClear={handleClear}
          disabled={isVerifying}
        />
      </View>
    </ScrollView>
  );
};

export default MpinLoginScreen;

