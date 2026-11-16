import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Lock, X } from '../common/Icons';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Lock size={16} color="#2563EB" />
              </View>
              <Text className="text-base font-bold text-slate-900">
                Password Recovery
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View className="py-4 space-y-3">
            <Text className="text-xs text-slate-600 leading-relaxed">
              For security compliance, staff accounts cannot be self-reset from the mobile terminal.
            </Text>

            <View className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <Text className="text-xs font-semibold text-amber-900">
                Contact Hub Supervisor
              </Text>
              <Text className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Please request a temporary PIN or password reset ticket directly from your shift lead in the Admin Portal.
              </Text>
            </View>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-[#2563EB] active:bg-blue-700 py-3 rounded-xl items-center justify-center mt-2"
          >
            <Text className="text-white text-sm font-bold">Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
