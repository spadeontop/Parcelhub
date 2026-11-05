import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
}) => {
  const { showToast } = useApp();

  const handleConfirmDelete = () => {
    // Per requirement 1: Only the modal for visuals, no delete account backend function attached
    showToast('Delete account confirmation (visual demo only).');
    onClose();
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
            Delete Account
          </Text>

          {/* Description */}
          <Text className="text-xs text-gray-600 mt-3 leading-relaxed">
            Are you sure you want to delete your account? This action is permanent and cannot be reversed.
          </Text>

          {/* Alert box */}
          <View className="mt-4 p-3 bg-red-50/80 border border-red-100 rounded-xl">
            <Text className="text-[11px] font-semibold text-red-800 leading-snug">
              All active orders, pickup history, and personal contact details will be erased permanently.
            </Text>
          </View>

          {/* Buttons Row */}
          <View className="flex-row items-center gap-3 mt-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmDelete}
              className="flex-1 h-12 rounded-xl bg-[#ef4444] active:bg-[#dc2626] items-center justify-center shadow-sm"
            >
              <Text className="text-white text-sm font-semibold tracking-wide">
                Delete Account
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
