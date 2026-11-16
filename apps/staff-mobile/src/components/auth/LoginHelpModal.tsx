import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Info, X, ShieldCheck } from '../common/Icons';

export interface LoginHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginHelpModal: React.FC<LoginHelpModalProps> = ({ isOpen, onClose }) => {
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
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <ShieldCheck size={18} color="#2563EB" />
              </View>
              <Text className="text-base font-bold text-slate-900">
                Staff Terminal Support
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View className="py-4 space-y-3.5">
            <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <Text className="text-xs font-bold text-slate-800 mb-1">
                Authorized Access Only
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">
                This terminal is reserved for registered ParcelHub front desk personnel and facility couriers.
              </Text>
            </View>

            <View className="space-y-1">
              <Text className="text-xs font-semibold text-slate-700">Need Login Credentials?</Text>
              <Text className="text-xs text-slate-500 leading-relaxed">
                If you have not been issued your Staff ID or password, please contact your Hub Operations Manager or Dispatch Lead.
              </Text>
            </View>

            <View className="space-y-1">
              <Text className="text-xs font-semibold text-slate-700">IT & Dispatch Desk</Text>
              <Text className="text-xs text-slate-500 leading-relaxed">
                Phone: +63 (2) 8888-HUB{'\n'}
                Email: support@parcelhub.internal
              </Text>
            </View>
          </View>

          {/* Close Action */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-slate-900 active:bg-black py-3 rounded-xl items-center justify-center mt-2"
          >
            <Text className="text-white text-sm font-bold">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
