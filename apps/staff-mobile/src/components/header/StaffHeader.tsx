import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { RefreshCw } from '../common/Icons';

interface StaffHeaderProps {
  children?: React.ReactNode;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ children }) => {
  const { staffUser, isOnline, isRefreshing, refreshOrders } = useStaff();

  return (
    <View className="bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-3">
      {/* Top Station Bar */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 items-center justify-center">
            <Text className="text-blue-400 font-black text-sm">PH</Text>
          </View>
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-sm tracking-tight">Staff Terminal</Text>
              <View className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                <Text className="text-[10px] font-mono text-slate-300">Desk #01</Text>
              </View>
            </View>
            <Text className="text-[10px] text-slate-400 font-medium">Lily's Catering Hub • Yati, Liloan</Text>
          </View>
        </View>

        {/* Status indicator & Manual Refresh */}
        <View className="flex-row items-center gap-2">
          <View
            className={`flex-row items-center gap-1.5 px-2 py-1 rounded-full border ${
              isOnline ? 'bg-emerald-950/60 border-emerald-800/60' : 'bg-rose-950/60 border-rose-800/60'
            }`}
          >
            <View className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <Text className={`text-[10px] font-semibold ${isOnline ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isOnline ? 'Live Backend' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={refreshOrders}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center active:bg-slate-700"
            accessibilityLabel="Refresh orders"
          >
            <RefreshCw size={14} color={isRefreshing ? '#3b82f6' : '#94a3b8'} className={isRefreshing ? 'animate-spin' : ''} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Children (e.g. Search Bar) */}
      {children}
    </View>
  );
};
