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
import { ModalFloatingInput } from '../common/ModalFloatingInput';

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
  const { authCustomer, updateAuthCustomer, showToast } = useApp();

  const [firstName, setFirstName] = useState<string>(authCustomer?.firstname || '');
  const [middleInitial, setMiddleInitial] = useState<string>(authCustomer?.middleinitial || '');
  const [lastName, setLastName] = useState<string>(authCustomer?.lastname || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(authCustomer?.phonenumber || '');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(299); // 04:59
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  // Sync inputs whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      setFirstName(authCustomer?.firstname || '');
      setMiddleInitial(authCustomer?.middleinitial || '');
      setLastName(authCustomer?.lastname || '');
      setPhoneNumber(authCustomer?.phonenumber || '');
      setVerificationCode('');
      setTimerSeconds(299);
      setIsTimerRunning(false);
      setCodeSent(false);
    }
  }, [
    visible,
    authCustomer?.firstname,
    authCustomer?.middleinitial,
    authCustomer?.lastname,
    authCustomer?.phonenumber,
  ]);

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
    showToast(`Verification code sent to ${maskedEmail}!`);
  };

  const handleSaveChanges = () => {
    if (!firstName.trim()) {
      showToast('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      showToast('Please enter your last name.');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast('Please enter a phone number.');
      return;
    }
    if (!verificationCode.trim()) {
      showToast('Please enter the verification code.');
      return;
    }

    const newUpdates: {
      firstname?: string;
      middleinitial?: string;
      lastname?: string;
      phonenumber?: string;
    } = {
      firstname: firstName.trim(),
      middleinitial: middleInitial.trim(),
      lastname: lastName.trim(),
    };

    if (phoneNumber && !phoneNumber.includes('****')) {
      newUpdates.phonenumber = phoneNumber.trim();
    }

    updateAuthCustomer(newUpdates);
    showToast('Contact details saved successfully!');
    onClose();
  };

  const handleDiscardChanges = () => {
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
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full max-w-[360px]"
          >
            <View
              className="w-full bg-white rounded-[16px] border border-[#f1f5f9] p-[21px]"
              style={{
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Header */}
              <View className="pb-[14px] border-b border-[#f1f5f9]">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-[16px] font-bold text-[#1e293b] tracking-[-0.4px]">
                      Edit Contact & Details
                    </Text>
                    <Text className="text-[12px] text-[#64748b] mt-1">
                      Update your contact information below
                    </Text>
                  </View>

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
              </View>

              {/* Form Fields */}
              <View className="pt-[14px] flex-col gap-[12px]">
                {/* Row 1: First Name & M.I. */}
                <View className="flex-row items-center gap-[10px]">
                  {/* First Name */}
                  <View className="flex-1">
                    <ModalFloatingInput
                      label="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* M.I. */}
                  <View className="w-[80px]">
                    <ModalFloatingInput
                      label="M.I."
                      value={middleInitial}
                      onChangeText={setMiddleInitial}
                      maxLength={2}
                      autoCapitalize="characters"
                      style={{ textAlign: 'center' as any }}
                    />
                  </View>
                </View>

                {/* Row 2: Last Name */}
                <ModalFloatingInput
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />

                {/* Row 3: Phone number */}
                <ModalFloatingInput
                  label="Phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />

                {/* Row 4: Verification Code */}
                <ModalFloatingInput
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

                {/* Row 5: Info Notice Banner */}
                <View className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[10px] p-[11px] flex-row items-start">
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
                  <Text className="text-[11px] text-[#64748b] leading-[15px] ml-2 flex-1">
                    A 6-digit verification code will be sent to your email to confirm changes.
                  </Text>
                </View>

                {/* Row 6: Modal Actions */}
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
