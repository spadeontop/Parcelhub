import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, HelpIcon, ProfileIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'help' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, openEscrowModal, showToast } = useApp();

  return (
    <View className="h-16 rounded-full bg-white/95 flex-row items-center justify-around px-5 border border-gray-100 shadow-lg mt-auto mb-2">
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
        onPress={() => navigateTo('mpin_login')}
        className="items-center justify-center p-2"
        accessibilityLabel="Security / Switch Account"
      >
        <ProfileIcon size={22} color="#9ca3af" />
        <View className="w-1.5 h-1.5 mt-1 opacity-0" />
      </TouchableOpacity>
    </View>
  );
};

