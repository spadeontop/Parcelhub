import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useV1 } from '../../v1/context/V1Context';
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
  const { navigateTo } = useV1();
  const hubOpen = true;

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
          <View className="w-9 h-9 items-center justify-center relative">
            <ParcelHubLogoSvg size={36} />
            {!hideStatusDot && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 11,
                  height: 11,
                  borderRadius: 5.5,
                  backgroundColor: hubOpen ? '#10b780' : '#ef4444',
                  borderWidth: 2,
                  borderColor: '#ffffff',
                }}
              />
            )}
          </View>
        ) : null}

        <View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
              {title}
            </Text>
            {!showLogo && !hideStatusDot && (
              <View
                className={`w-2 h-2 rounded-full ${
                  hubOpen ? 'bg-[#10b780]' : 'bg-[#ef4444]'
                }`}
              />
            )}
          </View>
          <View className="flex-row items-center gap-1.5 mt-1">
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