import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { FloatingInput } from '../common/FloatingInput';

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

  // Timer countdown
  const [timerSeconds, setTimerSeconds] = useState<number>(299); // 04:59
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  // Real-time password criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-]/.test(newPassword);
  const isNewPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const isConfirmPasswordMatch =
    confirmPassword.length > 0 && confirmPassword === newPassword;
  const isConfirmMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
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
    if (!isNewPasswordValid) {
      showToast('New password does not meet the security requirements.');
      return;
    }
    if (!isConfirmPasswordMatch) {
      showToast('New password and confirmation do not match.');
      return;
    }
    if (!verificationCode || verificationCode.length < 6) {
      showToast('Please enter the 6-digit verification code.');
      return;
    }

    showToast('Password changed successfully!');
    onClose();
  };

  const handleDiscardChanges = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className="flex-1 justify-center items-center px-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full max-w-[360px]"
          >
            <View
              className="bg-white rounded-[20px] p-[18px] border border-[#f1f5f9]"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 28,
                elevation: 10,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-9 h-9 rounded-[10px] bg-[#eff6ff] items-center justify-center mr-3">
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1e293b]">
                      Change Password
                    </Text>
                    <Text className="text-[11px] font-medium text-[#64748b]">
                      Update your account security credentials
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  className="w-7 h-7 rounded-full bg-[#f1f5f9] items-center justify-center -mr-1 -mt-0.5"
                  accessibilityLabel="Close"
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Form Fields using FloatingInput */}
              <View className="pt-[14px]">
                {/* Field 1: Current Password */}
                <FloatingInput
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />

                {/* Field 2: New Password */}
                <FloatingInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                {/* Password Strength Requirement Indicators (shown while typing new password) */}
                {newPassword.length > 0 && (
                  <View className="bg-slate-50 border border-slate-100 rounded-[10px] p-2.5 flex-row flex-wrap gap-x-3 gap-y-1 mb-2">
                    <Text
                      className={`text-[10px] font-semibold ${
                        hasMinLength ? 'text-[#059669]' : 'text-slate-400'
                      }`}
                    >
                      {hasMinLength ? '✓' : '•'} 8+ chars
                    </Text>
                    <Text
                      className={`text-[10px] font-semibold ${
                        hasUppercase ? 'text-[#059669]' : 'text-slate-400'
                      }`}
                    >
                      {hasUppercase ? '✓' : '•'} Uppercase
                    </Text>
                    <Text
                      className={`text-[10px] font-semibold ${
                        hasLowercase ? 'text-[#059669]' : 'text-slate-400'
                      }`}
                    >
                      {hasLowercase ? '✓' : '•'} Lowercase
                    </Text>
                    <Text
                      className={`text-[10px] font-semibold ${
                        hasNumber ? 'text-[#059669]' : 'text-slate-400'
                      }`}
                    >
                      {hasNumber ? '✓' : '•'} Number
                    </Text>
                    <Text
                      className={`text-[10px] font-semibold ${
                        hasSymbol ? 'text-[#059669]' : 'text-slate-400'
                      }`}
                    >
                      {hasSymbol ? '✓' : '•'} Symbol
                    </Text>
                  </View>
                )}

                {/* Field 3: Confirm Password */}
                <FloatingInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  error={isConfirmMismatch ? 'Passwords do not match' : undefined}
                />

                {/* Field 4: Verification Code */}
                <FloatingInput
                  label="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  rightElement={
                    isTimerRunning && timerSeconds > 0 ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleSendCode}
                      >
                        <Text className="text-[12px] font-bold text-gray-500">
                          {formatCountdown(timerSeconds)}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleSendCode}
                      >
                        <Text className="text-[12px] font-bold text-[#2563eb]">
                          Send Code
                        </Text>
                      </TouchableOpacity>
                    )
                  }
                />

                {/* Field 5: Info Notice Banner */}
                <View className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[10px] p-[11px] flex-row items-start mb-3">
                  <Svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginTop: 1 }}
                  >
                    <Path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#64748b"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 16V12M12 8H12.01"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text className="text-[11px] font-normal text-[#64748b] leading-[15px] ml-2 flex-1">
                    A 6-digit verification code will be sent to your email to confirm changes.
                  </Text>
                </View>

                {/* Field 6: Modal Actions */}
                <View className="flex-row items-center gap-[10px] pt-1">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSaveChanges}
                    className="flex-1 h-[44px] bg-[#2563eb] rounded-[12px] items-center justify-center active:bg-blue-700"
                  >
                    <Text className="text-[14px] font-bold text-white">
                      Save Changes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDiscardChanges}
                    className="flex-1 h-[44px] bg-white border border-[#cbd5e1] rounded-[12px] items-center justify-center active:bg-slate-50"
                  >
                    <Text className="text-[14px] font-bold text-[#334155]">
                      Discard Changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ChangePasswordModal;
