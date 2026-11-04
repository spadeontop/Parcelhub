import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { BackArrowIcon, ParcelHubLogoSvg } from '../common/Icons';
import Svg, { Path } from 'react-native-svg';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTarget?: ScreenId;
  onBack?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'ParcelHub',
  subtitle = "LILY'S CATERING HUB",
  showBack = false,
  backTarget = 'home',
  onBack,
}) => {
  const {
    hubOpen,
    notifications,
    openNotificationsModal,
    navigateTo,
  } = useApp();

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-100/90 pb-3 mb-2">
      <View className="flex-row items-center gap-2.5">
        {showBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (onBack) onBack();
              else navigateTo(backTarget);
            }}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <BackArrowIcon size={18} color="#374151" />
          </TouchableOpacity>
        ) : (
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
            <ParcelHubLogoSvg size={24} />
          </View>
        )}
        <View>
          <Text className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
            {title}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <View
              className={`w-2 h-2 rounded-full ${
                hubOpen ? 'bg-[#10b780]' : 'bg-[#ef4444]'
              }`}
            />
            <Text className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* User Profile Avatar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigateTo('mpin_login')}
        className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 items-center justify-center shadow-xs"
        accessibilityLabel="User Profile (Nyeowsz)"
      >
        <Text className="text-xs font-bold text-slate-600 tracking-wider">
          NY
        </Text>
      </TouchableOpacity>
    </View>
  );
};

