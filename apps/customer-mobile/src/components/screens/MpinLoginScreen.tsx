import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';

export const MpinLoginScreen: React.FC = () => {
  const { authCustomer, verifyCustomerMpin, navigateTo, showToast } = useApp();
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyPress = useCallback((num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setIsVerifying(true);
        autoSubmitTimerRef.current = setTimeout(() => {
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
  }, [pin, verifyCustomerMpin, showToast]);

  const handleBackspace = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    setIsVerifying(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const displayName = authCustomer.firstname
    ? `${authCustomer.firstname} ${authCustomer.lastname}`
    : 'John Vince Dumaguit';

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-6 py-8 justify-between">
      <View>
        {/* Compact Logo */}
        <View className="items-center justify-center mb-5 mt-2">
          <ParcelHubLogoSvg size={44} />
          <View className="flex-row items-center mt-1">
            <Text className="text-lg font-black text-[#215cd4]">Parcel</Text>
            <Text className="text-lg font-black text-[#111827]">Hub</Text>
          </View>
        </View>

        {/* User Identity Box */}
        <View className="border border-gray-200 rounded-xl p-3 px-4 flex-row items-center justify-between mb-6 bg-white shadow-sm">
          <Text className="text-sm font-semibold text-gray-900">{displayName}</Text>
          <TouchableOpacity onPress={() => navigateTo('login')}>
            <Text className="text-xs font-bold text-[#215cd4]">Switch</Text>
          </TouchableOpacity>
        </View>

        {/* MPIN Input Display */}
        <View className="items-center mb-6">
          <Text className="text-lg font-bold text-gray-900">Enter your 4-digit MPIN</Text>
          <Text className="text-xs text-gray-400 mt-1">
            Secure code for pickups and transactions
          </Text>

          {/* 4 PIN Dots */}
          <View className="flex-row items-center justify-center gap-4 mt-6">
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

      {/* Keypad */}
      <View className="w-full max-w-xs self-center mb-4">
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['CLEAR', '0', '⌫'],
        ].map((row, rIdx) => (
          <View key={rIdx} className="flex-row justify-between mb-3">
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                activeOpacity={0.7}
                onPress={() => {
                  if (btn === 'CLEAR') setPin('');
                  else if (btn === '⌫') handleBackspace();
                  else handleKeyPress(btn);
                }}
                className={`flex-1 mx-1.5 h-14 rounded-2xl items-center justify-center ${
                  btn === 'CLEAR' || btn === '⌫'
                    ? 'bg-gray-100'
                    : 'bg-gray-50 border border-gray-200 active:bg-blue-50'
                }`}
              >
                <Text
                  className={`font-bold ${
                    btn === 'CLEAR' || btn === '⌫'
                      ? 'text-xs text-gray-600'
                      : 'text-2xl text-gray-900'
                  }`}
                >
                  {btn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

