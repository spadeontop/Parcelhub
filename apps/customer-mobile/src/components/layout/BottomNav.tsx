import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, BellIcon, HelpIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'help' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, openEscrowModal, openNotificationsModal, notifications } = useApp();
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <View className="h-16 rounded-full bg-white/95 flex-row items-center justify-around px-5 border border-gray-100 shadow-lg mt-auto mb-2">
      {/* 1. Home */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('home')}
        className="items-center justify-center p-2"
        accessibilityLabel="Home"
      >
        <HomeIcon
          size={22}
          color={activeTab === 'home' ? '#215cd4' : '#9ca3af'}
        />
        {activeTab === 'home' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>

      {/* 2. Transactions */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('transactions')}
        className="items-center justify-center p-2"
        accessibilityLabel="Transactions"
      >
        <OrdersIcon
          size={22}
          color={activeTab === 'transactions' ? '#215cd4' : '#9ca3af'}
        />
        {activeTab === 'transactions' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>

      {/* 3. Notifications */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openNotificationsModal}
        className="items-center justify-center p-2 relative"
        accessibilityLabel="Notifications"
      >
        <BellIcon size={22} color="#9ca3af" />
        {hasUnread && (
          <View className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 border border-white" />
        )}
        <View className="w-1.5 h-1.5 mt-1 opacity-0" />
      </TouchableOpacity>

      {/* 4. Help / Escrow Info */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openEscrowModal}
        className="items-center justify-center p-2"
        accessibilityLabel="Help"
      >
        <HelpIcon size={22} color="#9ca3af" />
        <View className="w-1.5 h-1.5 mt-1 opacity-0" />
      </TouchableOpacity>
    </View>
  );
};
