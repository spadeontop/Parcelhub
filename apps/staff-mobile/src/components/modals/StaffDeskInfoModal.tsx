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
      <View className="flex-1 bg-black/75 justify-center px-4">
        <View className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Info size={18} color="#60a5fa" />
              <Text className="text-white font-bold text-sm">Station & Session Info</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Station Terminal</Text>
              <Text className="text-xs font-mono font-bold text-white">Counter Desk #01</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Hub Branch</Text>
              <Text className="text-xs font-medium text-slate-200">Lily's Catering Hub</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Active Staff</Text>
              <Text className="text-xs font-medium text-blue-400">{staffUser?.email || 'staff@parcelhub.com'}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Backend Endpoint</Text>
              <Text className="text-[10px] font-mono text-slate-400">{ENV.API_BASE_URL}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-400">Backend Status</Text>
              <Text className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isOnline ? 'Connected & Synced' : 'Offline / Unreachable'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-rose-950/40 border border-rose-800/60 py-3 rounded-xl flex-row items-center justify-center gap-2 active:bg-rose-900/50"
          >
            <LogOut size={16} color="#f43f5e" />
            <Text className="text-rose-400 font-bold text-xs uppercase tracking-wider">
              Sign Out of Counter Terminal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
