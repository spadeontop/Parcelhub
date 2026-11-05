import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onClose,
}) => {
  const { signOutCustomer } = useApp();

  const handleConfirmSignOut = () => {
    onClose();
    signOutCustomer();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-5">
        <View className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
          {/* Modal Title (Left-aligned matching Figma modals) */}
          <Text className="text-lg font-bold text-gray-900 tracking-tight">
            Sign Out
          </Text>

          {/* Description */}
          <Text className="text-xs text-gray-600 mt-3 leading-relaxed">
            Are you sure you want to sign out of your account?
          </Text>

          {/* Buttons Row with Choices Confirm / Cancel per Requirement 2 */}
          <View className="flex-row items-center gap-3 mt-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmSignOut}
              className="flex-1 h-12 rounded-xl bg-[#215cd4] active:bg-[#1a4bb0] items-center justify-center shadow-sm"
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                Confirm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              className="flex-1 h-12 rounded-xl bg-white border border-gray-300 active:bg-gray-50 items-center justify-center"
            >
              <Text className="text-gray-700 text-sm font-semibold tracking-wide">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
