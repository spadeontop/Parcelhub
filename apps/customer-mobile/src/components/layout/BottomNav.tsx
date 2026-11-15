import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, BellIcon, ProfileIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'notifications' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, notifications } = useApp();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <View
      className="h-[63px] rounded-full bg-white flex-row items-center justify-around px-6 border border-[#F1F5F9] mx-4 mb-3"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* 1. Home */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('home')}
        className="items-center justify-center p-1.5"
        accessibilityLabel="Home"
      >
        <HomeIcon
          size={24}
          color={activeTab === 'home' ? '#2563EB' : '#94A3B8'}
        />
        {activeTab === 'home' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>

      {/* 2. Transactions */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('transactions')}
        className="items-center justify-center p-1.5"
        accessibilityLabel="Transactions"
      >
        <OrdersIcon
          size={24}
          color={activeTab === 'transactions' ? '#2563EB' : '#94A3B8'}
        />
        {activeTab === 'transactions' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>

      {/* 3. Notifications */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('notifications')}
        className="items-center justify-center p-1.5 relative"
        accessibilityLabel="Notifications"
      >
        <BellIcon
          size={24}
          color={activeTab === 'notifications' ? '#2563EB' : '#94A3B8'}
        />
        {unreadCount > 0 && (
          <View className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 absolute top-1 right-0.5 items-center justify-center border border-white">
            <Text className="text-[9px] font-bold text-white text-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
        {activeTab === 'notifications' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>

      {/* 4. Profile */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigateTo('profile')}
        className="items-center justify-center p-1.5"
        accessibilityLabel="Profile"
      >
        <ProfileIcon
          size={24}
          color={activeTab === 'profile' ? '#2563EB' : '#94A3B8'}
        />
        {activeTab === 'profile' ? (
          <View className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1" />
        ) : (
          <View className="w-1.5 h-1.5 mt-1 opacity-0" />
        )}
      </TouchableOpacity>
    </View>
  );
};
