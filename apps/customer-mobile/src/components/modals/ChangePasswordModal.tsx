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
import { PasswordEyeToggle } from '../common/PasswordEyeToggle';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  maskedEmail: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  maskedEmail,
}) => {
  const { showToast } = useApp();

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Timer countdown
  const [timerSeconds, setTimerSeconds] = useState<number>(299); // 04:59
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setTimerSeconds(299);
      setIsTimerRunning(false);
      setCodeSent(false);
    }
  }, [visible]);

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
    showToast(`Verification code sent to ${maskedEmail}!`);
  };

  const handleSaveChanges = () => {
    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.');
      return;
    }
    if (!verificationCode || verificationCode.trim().length === 0) {
      showToast('Please enter the verification code.');
      return;
    }

    showToast('Password changed successfully!');
    onClose();
  };

  const handleDiscardChanges = () => {
    setCodeSent(false);
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
                Change Password
              </Text>

              {/* Field 1: Current Password */}
              <View className="mt-4 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Current Password
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    className="text-sm font-bold text-gray-900 p-0 flex-1"
                    style={{ outlineStyle: 'none' } as any}
                    placeholderTextColor="#9ca3af"
                  />
                  <PasswordEyeToggle
                    isVisible={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((prev) => !prev)}
                    accessibilityLabel={
                      showCurrentPassword ? 'Hide current password' : 'Show current password'
                    }
                    className="-mr-1.5"
                  />
                </View>
              </View>

              {/* Field 2: Change Password */}
              <View className="mt-3 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Change Password
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    className="text-sm font-bold text-gray-900 p-0 flex-1"
                    style={{ outlineStyle: 'none' } as any}
                    placeholderTextColor="#9ca3af"
                  />
                  <PasswordEyeToggle
                    isVisible={showNewPassword}
                    onToggle={() => setShowNewPassword((prev) => !prev)}
                    accessibilityLabel={
                      showNewPassword ? 'Hide new password' : 'Show new password'
                    }
                    className="-mr-1.5"
                  />
                </View>
              </View>

              {/* Field 3: Confirm Password */}
              <View className="mt-3 rounded-xl border border-gray-300 px-3.5 py-2.5 bg-white">
                <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
                  Confirm Password
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="text-sm font-bold text-gray-900 p-0 flex-1"
                    style={{ outlineStyle: 'none' } as any}
                    placeholderTextColor="#9ca3af"
                  />
                  <PasswordEyeToggle
                    isVisible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                    accessibilityLabel={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    className="-mr-1.5"
                  />
                </View>
              </View>

              {/* Field 4: Verification Code */}
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
