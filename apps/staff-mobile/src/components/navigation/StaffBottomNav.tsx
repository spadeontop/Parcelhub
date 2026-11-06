import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Package, CheckCircle, Info, LogOut } from '../common/Icons';
import { StaffTab } from '../../types';

interface StaffBottomNavProps {
  activeTab: StaffTab;
  onSelectTab: (tab: StaffTab) => void;
  onOpenDeskInfo: () => void;
  onSignOut: () => void;
}

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenDeskInfo,
  onSignOut,
}) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800/80 px-4 py-2 flex-row justify-around items-center">
      <TouchableOpacity
        onPress={() => onSelectTab('active')}
        className="items-center py-1 px-3"
      >
        <Package size={20} color={activeTab === 'active' || activeTab === 'ready' || activeTab === 'unpaid' ? '#3b82f6' : '#64748b'} />
        <Text
          className={`text-[10px] mt-1 font-semibold ${
            activeTab === 'active' || activeTab === 'ready' || activeTab === 'unpaid' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Queue
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onSelectTab('claimed')}
        className="items-center py-1 px-3"
      >
        <CheckCircle size={20} color={activeTab === 'claimed' ? '#3b82f6' : '#64748b'} />
        <Text
          className={`text-[10px] mt-1 font-semibold ${
            activeTab === 'claimed' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          Activity Log
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenDeskInfo}
        className="items-center py-1 px-3"
      >
        <Info size={20} color="#64748b" />
        <Text className="text-[10px] mt-1 font-semibold text-slate-400">
          Desk #01
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSignOut}
        className="items-center py-1 px-3"
      >
        <LogOut size={20} color="#f43f5e" />
        <Text className="text-[10px] mt-1 font-semibold text-rose-400">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
};
