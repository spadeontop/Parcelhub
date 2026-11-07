import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { X, LogOut, Info, ShieldCheck, User } from '../common/Icons';
import { useStaff } from '../../context/StaffContext';
import { ENV } from '../../config/env';

interface StaffDeskInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffDeskInfoModal: React.FC<StaffDeskInfoModalProps> = ({ isOpen, onClose }) => {
  const { staffUser, logout, isOnline } = useStaff();

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center px-5">
        <View className="bg-white rounded-3xl p-6 shadow-xl border border-[#E2E8F0] space-y-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-[#DBEAFE] items-center justify-center">
                <Info size={18} color="#215CD4" />
              </View>
              <Text className="text-sm font-bold text-[#0F172A]">
                Staff Account & Terminal Info
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-[#F1F5F9] items-center justify-center"
            >
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Details list */}
          <View className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] space-y-2.5">
            <View className="flex-row justify-between items-center py-1 border-b border-slate-200/60">
              <Text className="text-xs text-[#64748B] font-medium">Terminal Station</Text>
              <Text className="text-xs font-mono font-bold text-[#0F172A]">Counter Desk #01</Text>
            </View>

            <View className="flex-row justify-between items-center py-1 border-b border-slate-200/60">
              <Text className="text-xs text-[#64748B] font-medium">Hub Branch</Text>
              <Text className="text-xs font-semibold text-[#0F172A]">Lily's Catering Hub</Text>
            </View>

            <View className="flex-row justify-between items-center py-1 border-b border-slate-200/60">
              <Text className="text-xs text-[#64748B] font-medium">Active Staff</Text>
              <Text className="text-xs font-bold text-[#215CD4]">
                {staffUser?.email || 'staff@parcelhub.com'}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-xs text-[#64748B] font-medium">Sync Status</Text>
              <Text className={`text-xs font-bold ${isOnline ? 'text-[#059669]' : 'text-rose-600'}`}>
                {isOnline ? 'Live Backend Connected' : 'Offline Mode'}
              </Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSignOut}
            className="w-full bg-rose-50 border border-rose-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:bg-rose-100"
          >
            <LogOut size={16} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-700">
              Sign Out of Terminal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
