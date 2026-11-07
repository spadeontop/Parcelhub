import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { RefreshCw } from '../common/Icons';

interface StaffHeaderProps {
  children?: React.ReactNode;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ children }) => {
  const { isOnline, isRefreshing, refreshOrders } = useStaff();

  return (
    <View className="bg-transparent px-5 pt-3 pb-2">
      {/* Top Header matching home.png */}
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-[11px] font-bold text-[#215CD4] uppercase tracking-wider">
            INVENTORY & ASSETS
          </Text>
          <Text className="text-2xl font-bold text-[#1E1E1E] tracking-tight mt-0.5">
            Items & Claims
          </Text>
        </View>

        {/* Live sync & refresh */}
        <View className="flex-row items-center gap-2 pt-1">
          <View
            className={`flex-row items-center gap-1.5 px-2 py-0.5 rounded-full border ${
              isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <View className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <Text className={`text-[10px] font-semibold ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isOnline ? 'Live' : 'Offline'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={refreshOrders}
            disabled={isRefreshing}
            className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] items-center justify-center active:bg-slate-100 shadow-xs"
            accessibilityLabel="Refresh orders"
          >
            <RefreshCw
              size={12}
              color={isRefreshing ? '#215CD4' : '#64748B'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Embedded Search Bar */}
      {children}
    </View>
  );
};
