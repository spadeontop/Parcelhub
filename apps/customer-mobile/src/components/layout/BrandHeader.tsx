import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { BackArrowIcon, ParcelHubLogoSvg, HelpIcon } from '../common/Icons';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showHelp?: boolean;
  backTarget?: ScreenId;
  onBack?: () => void;
  hideBorder?: boolean;
  hideStatusDot?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'ParcelHub',
  subtitle = "LILY'S CATERING HUB",
  showBack = false,
  showLogo = true,
  showHelp = true,
  backTarget = 'home',
  onBack,
  hideBorder = false,
  hideStatusDot = false,
}) => {
  const { hubOpen, navigateTo } = useApp();

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
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={16} color="#374151" />
          </TouchableOpacity>
        ) : showLogo ? (
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
            <ParcelHubLogoSvg size={24} />
          </View>
        ) : null}

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

      {/* Help / FAQs Screen Navigation */}
      {showHelp ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('faq')}
          className="items-center justify-center p-2"
          accessibilityLabel="Help"
        >
          <HelpIcon size={22} color="#9ca3af" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};