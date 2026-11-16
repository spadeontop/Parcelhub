import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useV1 } from '../../v1/context/V1Context';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'notifications' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo } = useV1();
  const unreadCount = 0;

  return (
    <View className="absolute bottom-3 left-4 right-4 pointer-events-box-none">
      <View
        className="bg-white border border-[#f1f5f9] flex-row items-center justify-between px-[17px] py-[10px] rounded-full"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
      {/* 1. Home */}
      <View className="flex-1 items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('home')}
          className="items-center justify-center py-1 px-3"
          accessibilityLabel="Home"
        >
          {/* Filled Home Icon when active, Outline when inactive */}
          {activeTab === 'home' ? (
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10.707 2.293C10.3165 1.90262 9.6835 1.90262 9.293 2.293L2.293 9.293C1.91403 9.68538 1.91945 10.3091 2.30518 10.6948C2.69092 11.0806 3.31462 11.086 3.707 10.707L4 10.414V17C4 17.5519 4.44808 18 5 18H7C7.55192 18 8 17.5519 8 17V15C8 14.4481 8.44808 14 9 14H11C11.5519 14 12 14.4481 12 15V17C12 17.5519 12.4481 18 13 18H15C15.5519 18 16 17.5519 16 17V10.414L16.293 10.707C16.6854 11.086 17.3091 11.0806 17.6948 10.6948C18.0806 10.3091 18.086 9.68538 17.707 9.293L10.707 2.293V2.293"
                fill="#215cd4"
              />
            </Svg>
          ) : (
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M3 8.5L10 3L17 8.5V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V8.5Z"
                stroke="#94a3b8"
                strokeWidth={1.67}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M8 17V11H12V17"
                stroke="#94a3b8"
                strokeWidth={1.67}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          <Text
            className={`text-[9px] pt-[3px] ${
              activeTab === 'home'
                ? 'font-bold text-[#215cd4]'
                : 'font-medium text-[#94a3b8]'
            }`}
          >
            Home
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Orders */}
      <View className="flex-1 items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('transactions')}
          className="items-center justify-center py-1 px-3"
          accessibilityLabel="Orders"
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M7.5 4.16667H5.83333C4.91286 4.16667 4.16667 4.91286 4.16667 5.83333V15.8333C4.16667 16.7538 4.91286 17.5 5.83333 17.5H14.1667C15.0871 17.5 15.8333 16.7538 15.8333 15.8333V5.83333C15.8333 4.91286 15.0871 4.16667 14.1667 4.16667H12.5M7.5 4.16667C7.5 5.08714 8.24619 5.83333 9.16667 5.83333H10.8333C11.7538 5.83333 12.5 5.08714 12.5 4.16667M7.5 4.16667C7.5 3.24619 8.24619 2.5 9.16667 2.5H10.8333C11.7538 2.5 12.5 3.24619 12.5 4.16667"
              strokeWidth={1.67}
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={activeTab === 'transactions' ? '#215cd4' : '#94a3b8'}
            />
          </Svg>
          <Text
            className={`text-[9px] pt-[3px] ${
              activeTab === 'transactions'
                ? 'font-bold text-[#215cd4]'
                : 'font-medium text-[#94a3b8]'
            }`}
          >
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Alerts */}
      <View className="flex-1 items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('notifications')}
          className="items-center justify-center py-1 px-3 relative"
          accessibilityLabel="Alerts"
        >
          <View className="relative">
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M12.5 14.1667H16.6667L15.4958 12.9958C15.1783 12.6782 14.9999 12.2475 15 11.7983V9.16667C15.0003 7.04725 13.6647 5.15777 11.6667 4.45083V4.16667C11.6667 3.24681 10.9199 2.5 10 2.5C9.08014 2.5 8.33333 3.24681 8.33333 4.16667V4.45083C6.39167 5.1375 5 6.99 5 9.16667V11.7992C5 12.2475 4.82167 12.6783 4.50417 12.9958L3.33333 14.1667H7.5M12.5 14.1667V15C12.5 16.3798 11.3798 17.5 10 17.5C8.62021 17.5 7.5 16.3798 7.5 15V14.1667M12.5 14.1667H7.5"
                strokeWidth={1.67}
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke={activeTab === 'notifications' ? '#215cd4' : '#94a3b8'}
              />
            </Svg>

            {/* Notification Badge Dot (matching Figma 8px #f43f5e dot) */}
            {unreadCount > 0 && (
              <View
                className="absolute -top-[1px] -right-[2px] w-[8px] h-[8px] rounded-full bg-[#f43f5e] border border-white"
              />
            )}
          </View>
          <Text
            className={`text-[9px] pt-[3px] ${
              activeTab === 'notifications'
                ? 'font-bold text-[#215cd4]'
                : 'font-medium text-[#94a3b8]'
            }`}
          >
            Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Profile */}
      <View className="flex-1 items-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('profile')}
          className="items-center justify-center py-1 px-3"
          accessibilityLabel="Profile"
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M13.3333 5.83333C13.3333 7.67305 11.8397 9.16667 10 9.16667C8.16028 9.16667 6.66667 7.67305 6.66667 5.83333C6.66667 3.99362 8.16028 2.5 10 2.5C11.8397 2.5 13.3333 3.99362 13.3333 5.83333V5.83333M10 11.6667C6.7805 11.6667 4.16667 14.2805 4.16667 17.5H15.8333C15.8333 14.2805 13.2195 11.6667 10 11.6667V11.6667"
              strokeWidth={1.67}
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={activeTab === 'profile' ? '#215cd4' : '#94a3b8'}
            />
          </Svg>
          <Text
            className={`text-[9px] pt-[3px] ${
              activeTab === 'profile'
                ? 'font-bold text-[#215cd4]'
                : 'font-medium text-[#94a3b8]'
            }`}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
};

