import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useApp } from '../../context/AppContext';

interface EditContactModalProps {
  visible: boolean;
  onClose: () => void;
  maskedEmail: string;
  maskedPhone: string;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  visible,
  onClose,
  maskedEmail,
  maskedPhone,
}) => {
  const { authCustomer, updateAuthCustomer, showToast } = useApp();

  const [email, setEmail] = useState<string>(maskedEmail);
  const [phoneNumber, setPhoneNumber] = useState<string>(maskedPhone);
  const [verificationCode, setVerificationCode] = useState<string>('8080');
  const [timerSeconds, setTimerSeconds] = useState<number>(299); // 04:59
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  // Sync inputs whenever modal becomes visible (defaults to Send Code state per Figma)
  useEffect(() => {
    if (visible) {
      setEmail(maskedEmail);
      setPhoneNumber(maskedPhone);
      setVerificationCode('8080');
      setTimerSeconds(299);
      setIsTimerRunning(false);
      setCodeSent(false);
    }
  }, [visible, maskedEmail, maskedPhone]);

  // Countdown timer for 04:59
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (visible && isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isTimerRunning, timerSeconds]);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendCode = () => {
    setCodeSent(true);
    setTimerSeconds(299);
    setIsTimerRunning(true);
    showToast(`Verification code sent into email ${maskedEmail}!`);
  };

  const handleSaveChanges = () => {
    if (!email || !email.trim()) {
      showToast('Please enter an email address.');
      return;
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      showToast('Please enter a phone number.');
      return;
    }
    if (!verificationCode || verificationCode.trim().length === 0) {
      showToast('Please enter the 4-digit verification code.');
      return;
    }

    // If user edited to an unmasked email or phone, persist it
    const newUpdates: { email?: string; phonenumber?: string } = {};
    if (email && !email.includes('****')) {
      newUpdates.email = email;
    }
    if (phoneNumber && !phoneNumber.includes('****')) {
      newUpdates.phonenumber = phoneNumber;
    }

    if (Object.keys(newUpdates).length > 0) {
      updateAuthCustomer(newUpdates);
    }

    showToast('Contact details saved successfully!');
    onClose();
  };

  const handleDiscardChanges = () => {
    setCodeSent(false);
    setEmail(maskedEmail);
    setPhoneNumber(maskedPhone);
    setVerificationCode('8080');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleDiscardChanges}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full max-w-sm"
          >
            <View className="w-full bg-white rounded-2xl p-6 shadow-2xl">
              {/* Modal Title */}
              <Text className="text-lg font-bold text-gray-900 tracking-tight">
                Edit Contact Details
              </Text>

              {/* Field 1: Email */}
              <View className="mt-4 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="text-sm font-bold text-gray-900 p-0"
                  style={{ outlineStyle: 'none' } as any}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Field 2: Phone number */}
              <View className="mt-3 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Phone number
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  className="text-sm font-bold text-gray-900 p-0"
                  style={{ outlineStyle: 'none' } as any}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Field 3: Verification Code */}
              <View className="mt-3 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Verification Code
                </Text>
                <View className="flex-row items-center justify-between">
                  <TextInput
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    className="text-sm font-bold text-gray-900 p-0 flex-1"
                    style={{ outlineStyle: 'none' } as any}
                    placeholder="Enter code"
                    placeholderTextColor="#9ca3af"
                  />
                  {isTimerRunning && timerSeconds > 0 ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleSendCode}
                    >
                      <Text className="text-xs font-semibold text-gray-500">
                        {formatCountdown(timerSeconds)}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity activeOpacity={0.7} onPress={handleSendCode}>
                      <Text className="text-xs font-bold text-[#215cd4]">
                        Send Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Subtext info - only shown upon pressing Send Code */}
              {codeSent && (
                <Text className="text-[11px] text-gray-600 text-center mt-3 px-1 leading-relaxed">
                  A verification code has been sent into email{' '}
                  <Text className="font-bold text-gray-900">{maskedEmail}</Text>
                </Text>
              )}

              {/* Action Buttons Row */}
              <View className="flex-row items-center gap-3 mt-6">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveChanges}
                  className="flex-1 h-12 rounded-xl bg-[#215cd4] active:bg-[#1a4bb0] items-center justify-center shadow-sm"
                >
                  <Text className="text-white text-sm font-semibold tracking-wide">
                    Save Changes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDiscardChanges}
                  className="flex-1 h-12 rounded-xl bg-white border border-gray-300 active:bg-gray-50 items-center justify-center"
                >
                  <Text className="text-gray-700 text-sm font-semibold tracking-wide">
                    Discard Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
