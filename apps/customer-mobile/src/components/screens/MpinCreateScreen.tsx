import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg, ArrowLeftIcon } from '../common/Icons';
import { NumericKeypad } from '../common/NumericKeypad';

export const MpinCreateScreen: React.FC = () => {
  const { authCustomer, createCustomerMpin, navigateTo, showToast } = useApp();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [pin1, setPin1] = useState<string>('');
  const [pin2, setPin2] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mismatch, setMismatch] = useState<boolean>(false);

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (activeStep === 1) {
        setMismatch(false);
        if (pin1.length < 4) {
          setPin1((prev) => (prev.length < 4 ? prev + digit : prev));
        }
      } else {
        // If previous entry was mismatched, typing starts fresh immediately without freezing
        if (mismatch) {
          setMismatch(false);
          setPin2(digit);
          return;
        }

        if (pin2.length < 4) {
          const nextPin = pin2 + digit;
          setPin2(nextPin);
          if (nextPin.length === 4) {
            if (nextPin === pin1) {
              setMismatch(false);
            } else {
              setMismatch(true);
              showToast('MPIN does not match. Please re-enter.');
            }
          }
        }
      }
    },
    [activeStep, pin1, pin2, mismatch, showToast]
  );

  const handleBackspace = useCallback(() => {
    setMismatch(false);
    if (activeStep === 1) {
      if (pin1.length > 0) {
        setPin1((prev) => prev.slice(0, -1));
      }
    } else {
      if (pin2.length > 0) {
        setPin2((prev) => prev.slice(0, -1));
      } else {
        // Return to Step 1 if backspace on empty Step 2
        setActiveStep(1);
      }
    }
  }, [activeStep, pin1.length, pin2.length]);

  const handleClear = useCallback(() => {
    if (activeStep === 2) {
      setPin2('');
      setMismatch(false);
    } else {
      setPin1('');
    }
  }, [activeStep]);

  const isMatched = pin1.length === 4 && pin2.length === 4 && pin1 === pin2;
  const isStep1Valid = pin1.length === 4;
  const isStep2Valid = isMatched;
  const isCurrentStepValid = activeStep === 1 ? isStep1Valid : isStep2Valid;
  const isButtonDisabled = isSubmitting || !isCurrentStepValid;

  const handleSubmit = useCallback(async () => {
    if (pin1.length < 4) {
      showToast('Please enter a 4-digit MPIN first.');
      setActiveStep(1);
      return;
    }
    if (pin2.length < 4) {
      showToast('Please re-enter your 4-digit MPIN to confirm.');
      setActiveStep(2);
      return;
    }
    if (pin1 !== pin2) {
      setMismatch(true);
      showToast('MPIN confirmation does not match. Please re-enter.');
      setPin2('');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomerMpin(pin1);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create MPIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [pin1, pin2, createCustomerMpin, showToast]);

  const handleButtonClick = () => {
    if (activeStep === 1) {
      if (isStep1Valid) {
        setActiveStep(2);
        setMismatch(false);
      }
    } else {
      if (isStep2Valid) {
        handleSubmit();
      }
    }
  };

  const handleBack = useCallback(() => {
    if (activeStep === 2) {
      setActiveStep(1);
      setMismatch(false);
    } else {
      navigateTo('register');
    }
  }, [activeStep, navigateTo]);

  const displayName = authCustomer.firstname
    ? `${authCustomer.firstname} ${authCustomer.lastname}`
    : 'John Vince Dumaguit';

  const buttonLabel = isSubmitting
    ? 'Activating MPIN...'
    : activeStep === 1
    ? 'Create MPIN'
    : 'Confirm MPIN';

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-6 py-6"
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header, Identity & Dual MPIN Inputs */}
      <View>
        {/* Compact Horizontal Logo (moved down) */}
        <View className="flex-row items-center justify-center gap-2 mb-4 mt-7">
          <ParcelHubLogoSvg size={32} />
          <View className="flex-row items-center">
            <Text className="text-[19px] font-extrabold tracking-tight leading-none text-[#215cd4]">
              Parcel
            </Text>
            <Text className="text-[19px] font-extrabold tracking-tight leading-none text-[#111827]">
              Hub
            </Text>
          </View>
        </View>

        {/* User Identity Box */}
        <View className="border border-gray-200 rounded-lg p-2.5 px-3.5 flex-row items-center justify-between mb-4 bg-white shadow-xs">
          <Text className="text-[13.5px] font-medium text-gray-900">{displayName}</Text>
        </View>

        {/* Dual MPIN Creation & Confirmation Container */}
        <View className="flex-col gap-3 mb-4">
          {/* Step 1: Create 4-digit MPIN */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveStep(1);
              setMismatch(false);
            }}
            className={`p-3 rounded-xl border items-center ${
              activeStep === 1
                ? 'bg-blue-50/50 border-[#215cd4]/40 shadow-xs'
                : 'bg-gray-50/80 border-gray-200/80'
            }`}
          >
            <View className="flex-row items-center justify-center gap-1.5 mb-2">
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  pin1.length === 4
                    ? 'bg-[#10b780]'
                    : activeStep === 1
                    ? 'bg-[#215cd4]'
                    : 'bg-gray-300'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    pin1.length === 4 || activeStep === 1 ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {pin1.length === 4 ? '✓' : '1'}
                </Text>
              </View>
              <Text className="text-[12.5px] font-semibold text-gray-700">
                1. Enter MPIN
              </Text>
            </View>
            <View className="flex-row items-center justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin1.length;
                return (
                  <View
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-[1.5px] ${
                      isFilled
                        ? 'bg-[#215cd4] border-[#215cd4]'
                        : 'border-gray-300 bg-transparent'
                    }`}
                  />
                );
              })}
            </View>
          </TouchableOpacity>

          {/* Step 2: Re-enter MPIN to Confirm */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (pin1.length === 4) {
                setActiveStep(2);
                setMismatch(false);
              } else {
                showToast('Please finish entering your 4-digit MPIN first.');
              }
            }}
            className={`p-3 rounded-xl border items-center ${
              activeStep === 2
                ? 'bg-blue-50/50 border-[#215cd4]/40 shadow-xs'
                : 'bg-gray-50/80 border-gray-200/80'
            }`}
          >
            <View className="flex-row items-center justify-center gap-1.5 mb-2">
              <View
                className={`w-4 h-4 rounded-full items-center justify-center ${
                  isMatched
                    ? 'bg-[#10b780]'
                    : activeStep === 2
                    ? 'bg-[#215cd4]'
                    : 'bg-gray-300'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isMatched || activeStep === 2 ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {isMatched ? '✓' : '2'}
                </Text>
              </View>
              <Text className="text-[12.5px] font-semibold text-gray-700">
                2. Confirm MPIN
              </Text>
            </View>
            <View className="flex-row items-center justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin2.length;
                let dotStyle = 'border-gray-300 bg-transparent';
                if (activeStep === 2 && mismatch) {
                  dotStyle = 'border-red-500 bg-red-500';
                } else if (isMatched) {
                  dotStyle = 'border-[#10b780] bg-[#10b780]';
                } else if (isFilled) {
                  dotStyle = 'bg-[#215cd4] border-[#215cd4]';
                }
                return (
                  <View
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-[1.5px] ${dotStyle}`}
                  />
                );
              })}
            </View>
            {activeStep === 2 && (
              <View className="mt-1.5 items-center">
                {mismatch ? (
                  <Text className="text-[11px] font-semibold text-[#ef4444]">
                    Digits do not match
                  </Text>
                ) : isMatched ? (
                  <Text className="text-[11px] font-semibold text-[#10b780]">
                    MPIN verified &amp; ready!
                  </Text>
                ) : (
                  <Text className="text-[11px] font-medium text-gray-400">
                    Re-enter MPIN to Confirm
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Keypad + Primary Action Button */}
      <View className="w-full pb-2">
        {/* Keypad */}
        <NumericKeypad
          onPressDigit={handleKeyPress}
          onPressBackspace={handleBackspace}
          onPressClear={handleClear}
          disabled={isSubmitting}
        />

        <View className="mt-1 mb-2">
          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isButtonDisabled}
            onPress={handleButtonClick}
            className={`w-full h-11 rounded-lg items-center justify-center ${
              isButtonDisabled
                ? 'bg-gray-200'
                : 'bg-[#215cd4] active:bg-[#194cb5] shadow-xs'
            }`}
          >
            <Text
              className={`font-semibold text-[14.5px] ${
                isButtonDisabled ? 'text-gray-400' : 'text-white'
              }`}
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>

          {/* Secondary Action: Back text link with arrow on its left */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            className="flex-row items-center justify-center gap-1.5 py-2.5 mt-1"
          >
            <ArrowLeftIcon size={15} color="#4b5563" />
            <Text className="text-gray-600 font-semibold text-[13.5px]">Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default MpinCreateScreen;
