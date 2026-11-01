import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';

export const MpinCreateScreen: React.FC = () => {
  const { createCustomerMpin, showToast, navigateTo } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePin = step === 1 ? firstPin : confirmPin;

  const handleKeyPress = useCallback(
    (num: string) => {
      if (activePin.length < 4) {
        const nextPin = activePin + num;
        if (step === 1) {
          setFirstPin(nextPin);
          if (nextPin.length === 4) {
            setTimeout(() => {
              setStep(2);
            }, 250);
          }
        } else {
          setConfirmPin(nextPin);
          if (nextPin.length === 4) {
            if (nextPin !== firstPin) {
              showToast('MPIN does not match. Please try again.');
              setTimeout(() => {
                setConfirmPin('');
                setFirstPin('');
                setStep(1);
              }, 400);
            } else {
              setIsSubmitting(true);
              autoSubmitTimerRef.current = setTimeout(() => {
                createCustomerMpin(nextPin)
                  .catch((err: any) => {
                    showToast(err?.message || 'Failed to create MPIN.');
                    setConfirmPin('');
                    setFirstPin('');
                    setStep(1);
                  })
                  .finally(() => {
                    setIsSubmitting(false);
                  });
              }, 250);
            }
          }
        }
      }
    },
    [activePin, step, firstPin, createCustomerMpin, showToast]
  );

  const handleBackspace = useCallback(() => {
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  }, [step]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-6 py-8 justify-between">
      <View>
        {/* Compact Logo */}
        <View className="items-center justify-center mb-5 mt-2">
          <ParcelHubLogoSvg size={44} />
          <Text className="text-xl font-black text-gray-900 mt-2">
            Create Security MPIN
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            Step {step} of 2: {step === 1 ? 'Choose 4 digits' : 'Confirm your 4 digits'}
          </Text>
        </View>

        {/* MPIN Input Display */}
        <View className="items-center mb-6">
          <Text className="text-sm font-semibold text-gray-700">
            {step === 1
              ? 'Enter your new 4-digit MPIN'
              : 'Re-enter your 4-digit MPIN to confirm'}
          </Text>

          {/* 4 PIN Dots */}
          <View className="flex-row items-center justify-center gap-4 mt-6">
            {[0, 1, 2, 3].map((idx) => (
              <View
                key={idx}
                className={`w-4 h-4 rounded-full ${
                  idx < activePin.length ? 'bg-[#215cd4]' : 'bg-gray-200'
                }`}
              />
            ))}
          </View>

          {isSubmitting && (
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
          ['RESET', '0', '⌫'],
        ].map((row, rIdx) => (
          <View key={rIdx} className="flex-row justify-between mb-3">
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                activeOpacity={0.7}
                onPress={() => {
                  if (btn === 'RESET') {
                    setFirstPin('');
                    setConfirmPin('');
                    setStep(1);
                  } else if (btn === '⌫') {
                    handleBackspace();
                  } else {
                    handleKeyPress(btn);
                  }
                }}
                className={`flex-1 mx-1.5 h-14 rounded-2xl items-center justify-center ${
                  btn === 'RESET' || btn === '⌫'
                    ? 'bg-gray-100'
                    : 'bg-gray-50 border border-gray-200 active:bg-blue-50'
                }`}
              >
                <Text
                  className={`font-bold ${
                    btn === 'RESET' || btn === '⌫'
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

        <TouchableOpacity
          onPress={() => navigateTo('login')}
          className="items-center py-2 mt-1"
        >
          <Text className="text-xs font-semibold text-gray-500">
            Cancel &amp; Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

