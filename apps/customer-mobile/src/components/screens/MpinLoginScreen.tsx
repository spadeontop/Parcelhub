import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useV1 } from '../../v1/context/V1Context';
import { AuthBrandHeader } from '../layout/AuthBrandHeader';
import { NumericKeypad } from '../common/NumericKeypad';

export const MpinLoginScreen: React.FC = () => {
  const { customer, verifyCustomerMpin, navigateTo, switchAccount, showToast } = useV1();
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
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
        if (errorMessage) setErrorMessage('');
        const nextPin = pin + num;
        setPin(nextPin);

        if (nextPin.length === 4) {
          autoSubmitTimerRef.current = setTimeout(() => {
            autoSubmitTimerRef.current = null;
            setIsVerifying(true);
            verifyCustomerMpin(nextPin)
              .catch((err: any) => {
                const msg = err?.message || 'Invalid MPIN';
                const status = err?.statusCode;

                setPin('');

                // Backend-authoritative error handling (Rule #9)
                // If MPIN unset (HTTP 400), navigate to mpin_create
                if (status === 400 && msg.toLowerCase().includes('set up your mpin')) {
                  showToast(msg);
                  navigateTo('mpin_create');
                  return;
                }

                // If Incorrect MPIN (HTTP 401), render inline red error below the dots
                if (status === 401 && msg.toLowerCase().includes('incorrect')) {
                  setErrorMessage(msg);
                  return;
                }

                // If session expired (HTTP 401) or account blacklisted (HTTP 403), route to login
                if (status === 401 || status === 403) {
                  showToast(msg);
                  navigateTo('login');
                  return;
                }

                setErrorMessage(msg);
              })
              .finally(() => {
                setIsVerifying(false);
              });
          }, 200);
        }
      }
    },
    [pin, isVerifying, errorMessage, verifyCustomerMpin, showToast, navigateTo]
  );

  const handleBackspace = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (errorMessage) setErrorMessage('');
    setIsVerifying(false);
    setPin((prev) => prev.slice(0, -1));
  }, [errorMessage]);

  const handleClear = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (errorMessage) setErrorMessage('');
    setIsVerifying(false);
    setPin('');
  }, [errorMessage]);

  const handleSwitchAccount = () => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    void switchAccount();
  };

  const handleForgotMpin = () => {
    showToast('Please contact your branch administrator to reset your MPIN.');
  };

  const displayEmail = customer?.email || 'user@example.com';

  return (
    <View className="flex-1 bg-[#2563eb]">
      {/* Top Brand Header */}
      <AuthBrandHeader
        title="ParcelHub"
        subtitle="Customer Mobile Portal"
      />

      {/* Main Curved White/Slate Sheet (Vector background: #F8FAFC) */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] px-4 pt-5 pb-6 justify-between">
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        >
          {/* Top Form Container: Identity Box & MPIN Indicators */}
          <View className="w-full max-w-[358px] self-center">
            {/* User Account Card / Switcher */}
            <View
              className="bg-white border border-[#e2e8f0] rounded-[12px] p-[13px] flex-row items-center justify-between mb-4"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <Text
                className="text-[14px] font-medium text-[#1e293b] pl-2.5 flex-1"
                numberOfLines={1}
              >
                {displayEmail}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSwitchAccount}
                className="px-2 py-1 rounded-[8px]"
              >
                <Text className="text-[14px] font-semibold text-[#2563eb]">Switch</Text>
              </TouchableOpacity>
            </View>

            {/* Title & Context */}
            <View className="items-center pt-4">
              <Text className="text-[18px] font-bold text-[#1e293b] text-center tracking-[-0.45px]">
                Enter your 4-digit MPIN
              </Text>
              <Text className="text-[12px] font-normal text-[#64748b] text-center mt-1">
                Secure code for pickups and transactions
              </Text>
            </View>

            {/* MPIN Dots Indicator (14px dots, 16px gap) */}
            <View className="flex-row items-center justify-center py-5">
              <View className="flex-row items-center gap-4">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = idx < pin.length;
                  return (
                    <View
                      key={idx}
                      className={`w-[14px] h-[14px] rounded-full ${
                        isFilled ? 'bg-[#2563eb]' : 'bg-[#cbd5e1]'
                      }`}
                    />
                  );
                })}
              </View>
            </View>

            {/* Error Message Row (or Loading Indicator) */}
            <View className="h-5 items-center justify-center mb-1">
              {isVerifying ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : errorMessage ? (
                <Text className="text-[12px] font-normal text-[#cb292e] text-center">
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Section: Ergonomic Keypad & Forgot MPIN */}
          <View className="w-full self-center">
            <NumericKeypad
              onPressDigit={handleKeyPress}
              onPressBackspace={handleBackspace}
              onPressClear={handleClear}
              disabled={isVerifying}
            />

            {/* Forgot MPIN Button */}
            <View className="items-center justify-center py-2.5 mt-1">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotMpin}
                className="py-1 px-4"
              >
                <Text className="text-[14px] font-bold text-[#2563eb] text-center">
                  Forgot MPIN?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default MpinLoginScreen;
