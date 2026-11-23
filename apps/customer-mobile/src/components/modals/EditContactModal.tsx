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
import { useAuthSession } from '../../context/AuthSessionContext';
import { useToast } from '../../context/ToastContext';
import { FloatingInput } from '../common/FloatingInput';

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
}) => {
  const { customer } = useAuthSession();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState<string>(customer?.firstName || '');
  const [middleInitial, setMiddleInitial] = useState<string>(customer?.middleInitial || '');
  const [lastName, setLastName] = useState<string>(customer?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(customer?.phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(299); // 04:59
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  // Sync inputs whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      setFirstName(customer?.firstName || '');
      setMiddleInitial(customer?.middleInitial || '');
      setLastName(customer?.lastName || '');
      setPhoneNumber(customer?.phoneNumber || '');
      setVerificationCode('');
      setTimerSeconds(299);
      setIsTimerRunning(false);
      setCodeSent(false);
    }
  }, [visible, customer]);

  // Countdown timer effect
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
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First and last name cannot be empty.');
      return;
    }
    if (!verificationCode || verificationCode.length < 6) {
      showToast('Please enter the 6-digit verification code.');
      return;
    }

    showToast('Profile updates are not yet available in this version.');
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
                        d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1e293b]">
                      Edit Contact Details
                    </Text>
                    <Text className="text-[11px] font-medium text-[#64748b]">
                      Update your recipient identity &amp; info
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDiscardChanges}
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
                {/* Row 1: First Name & M.I. */}
                <View className="flex-row items-center gap-[10px]">
                  {/* First Name */}
                  <View className="flex-1">
                    <FloatingInput
                      label="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* M.I. */}
                  <View className="w-[80px]">
                    <FloatingInput
                      label="M.I."
                      value={middleInitial}
                      onChangeText={setMiddleInitial}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Row 2: Last Name */}
                <FloatingInput
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />

                {/* Row 3: Phone number */}
                <FloatingInput
                  label="Phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />

                {/* Row 4: Verification Code */}
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

                {/* Info Notice Banner */}
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

                {/* Modal Actions */}
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

export default EditContactModal;
