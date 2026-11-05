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
  hideBorder?: boolean;
  hideStatusDot?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'ParcelHub',
  subtitle = "LILY'S CATERING HUB",
  showBack = false,
  backTarget = 'home',
  onBack,
  hideBorder = false,
  hideStatusDot = false,
}) => {
  const {
    hubOpen,
    notifications,
    openNotificationsModal,
    navigateTo,
  } = useApp();

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <View
      className={`flex-row items-center justify-between py-2 ${
        hideBorder ? 'mb-2' : 'border-b border-gray-100/90 pb-3 mb-2'
      }`}
    >
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
            {!hideStatusDot && (
              <View
                className={`w-2 h-2 rounded-full ${
                  hubOpen ? 'bg-[#10b780]' : 'bg-[#ef4444]'
                }`}
              />
            )}
            <Text className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Bell / Notifications Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openNotificationsModal}
        className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200/60 items-center justify-center relative"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 17H20L18.595 15.595C18.2141 15.2141 18 14.6973 18 14.158V11C18 7.686 15.314 5 12 5C8.686 5 6 7.686 6 11V14.158C6 14.6973 5.78586 15.2141 5.405 15.595L4 17H9M15 17V18C15 19.657 13.657 21 12 21C10.343 21 9 19.657 9 18V17M15 17H9"
            stroke="#475569"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        {hasUnread && (
          <View className="w-2.5 h-2.5 rounded-full bg-red-500 absolute top-1 right-1 border-2 border-white" />
        )}
      </TouchableOpacity>
    </View>
  );
};

