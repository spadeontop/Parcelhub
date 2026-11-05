import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, BellIcon, HelpIcon, ProfileIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'notifications' | 'help' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, openEscrowModal, notifications } = useApp();
  const unreadCount = notifications.filter((n) => n.unread).length;

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
        onPress={() => navigateTo('notifications')}
        className="items-center justify-center p-2 relative"
        accessibilityLabel="Notifications"
      >
        <BellIcon
          size={22}
          color={activeTab === 'notifications' ? '#215cd4' : '#9ca3af'}
        />
        {unreadCount > 0 && (
          <View className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 absolute top-1.5 right-1 items-center justify-center border border-white">
            <Text className="text-[9px] font-bold text-white text-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
        {activeTab === 'notifications' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
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

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('profile')}
        className="items-center justify-center p-2"
        accessibilityLabel="Profile"
      >
        <ProfileIcon
          size={22}
          color={activeTab === 'profile' ? '#215cd4' : '#9ca3af'}
        />
        {activeTab === 'profile' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>
    </View>
  );
};
