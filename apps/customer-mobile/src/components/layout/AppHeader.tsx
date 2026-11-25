import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { ParcelHubLogoSvg } from '../common/Icons';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  subtitleUppercase?: boolean;
  showLogo?: boolean;
  statusDotColor?: string;
  onHelp?: () => void;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
  centerTitle?: boolean;
  backgroundColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  subtitleUppercase = true,
  showLogo = false,
  statusDotColor,
  onHelp,
  rightElement,
  onBack,
  showBackButton = false,
  centerTitle = false,
  backgroundColor,
}) => {
  const { navigateTo, goBack } = useNavigationUi();
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const handleHelp = onHelp || (() => navigateTo('faq'));

  // When centerTitle is true, layout left (back button or empty placeholder), center (title & subtitle), right (help or custom or empty placeholder)
  if (centerTitle) {
    return (
      <View
        className="px-5"
        style={{
          backgroundColor: backgroundColor || '#2563eb',
          paddingTop: isCompact ? 14 : 24,
          paddingBottom: isCompact ? 20 : 28,
        }}
      >
        <View className="flex-row items-center justify-between relative min-h-[40px]">
          {/* Left Slot */}
          <View className="w-10 h-10 justify-center items-start z-10">
            {showBackButton ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onBack || goBack}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/20"
                accessibilityLabel="Back"
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 19l-7-7 7-7"
                    stroke="#ffffff"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Centered Title & Subtitle */}
          <View className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center pointer-events-none">
            <View className="flex-row items-center justify-center gap-2">
              <Text
                className="font-bold text-white tracking-tight leading-[28px] text-[20px] text-center"
                numberOfLines={1}
              >
                {title}
              </Text>
              {statusDotColor && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: statusDotColor }}
                />
              )}
            </View>
            {subtitle ? (
              <View className="flex-row items-center justify-center gap-1.5 mt-0.5">
                <Text className="text-[12px] font-medium text-[#dbeafe] text-center">
                  {subtitle}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Right Slot */}
          <View className="w-10 h-10 justify-center items-end z-10">
            {rightElement ? (
              rightElement
            ) : onHelp ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleHelp}
                className="items-center justify-center"
                accessibilityLabel="Help"
              >
                <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
                  <Rect x="0.5" y="0.5" width="34" height="34" rx="17" fill="white" />
                  <Rect x="0.5" y="0.5" width="34" height="34" rx="17" stroke="#E3E7EF" />
                  <Path
                    d="M16.375 20.2351V20.1136C16.3835 19.321 16.4624 18.6903 16.6115 18.2216C16.7649 17.7528 16.9822 17.3736 17.2635 17.0838C17.5447 16.794 17.8835 16.5298 18.2798 16.2912C18.5355 16.1293 18.7656 15.9482 18.9702 15.7479C19.1747 15.5476 19.3366 15.3175 19.456 15.0575C19.5753 14.7976 19.6349 14.5099 19.6349 14.1946C19.6349 13.8153 19.5455 13.4872 19.3665 13.2102C19.1875 12.9332 18.9489 12.7202 18.6506 12.571C18.3565 12.4176 18.0284 12.3409 17.6662 12.3409C17.3381 12.3409 17.0249 12.4091 16.7266 12.5455C16.4283 12.6818 16.1811 12.8949 15.9851 13.1847C15.7891 13.4702 15.6761 13.8388 15.6463 14.2905H13.7031C13.733 13.5234 13.9268 12.8757 14.2848 12.3473C14.6428 11.8146 15.1158 11.4119 15.7038 11.1392C16.2962 10.8665 16.9503 10.7301 17.6662 10.7301C18.4503 10.7301 19.1364 10.8771 19.7244 11.1712C20.3125 11.4609 20.7685 11.8679 21.0923 12.392C21.4205 12.9119 21.5845 13.5192 21.5845 14.2138C21.5845 14.6911 21.5099 15.1214 21.3608 15.505C21.2116 15.8842 20.9986 16.223 20.7216 16.5213C20.4489 16.8196 20.1207 17.0838 19.7372 17.3139C19.375 17.5398 19.081 17.7741 18.8551 18.017C18.6335 18.2599 18.4716 18.5476 18.3693 18.88C18.267 19.2124 18.2116 19.6236 18.2031 20.1136V20.2351H16.375ZM17.3402 24.1214C16.9908 24.1214 16.6903 23.9979 16.4389 23.7507C16.1875 23.4993 16.0618 23.1967 16.0618 22.843C16.0618 22.4936 16.1875 22.1953 16.4389 21.9482C16.6903 21.6967 16.9908 21.571 17.3402 21.571C17.6854 21.571 17.9837 21.6967 18.2351 21.9482C18.4908 22.1953 18.6186 22.4936 18.6186 22.843C18.6186 23.0774 18.5589 23.2926 18.4396 23.4886C18.3246 23.6804 18.1712 23.8338 17.9794 23.9489C17.7876 24.0639 17.5746 24.1214 17.3402 24.1214Z"
                    fill="#165BE8"
                  />
                </Svg>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className="px-5"
      style={{
        backgroundColor: backgroundColor || '#2563eb',
        paddingTop: isCompact ? 14 : 24,
        paddingBottom: isCompact ? 20 : 28,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side: Back button or Logo or Title */}
        <View className="flex-row items-center flex-1 pr-2">
          {showBackButton && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack || goBack}
              className="w-9 h-9 rounded-full bg-white/20 items-center justify-center border border-white/20 mr-3"
              accessibilityLabel="Back"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19l-7-7 7-7"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

          {showLogo && (
            <View
              className="mr-3 items-center justify-center"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
                position: 'relative',
              }}
            >
              <ParcelHubLogoSvg size={40} />
              {statusDotColor && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: statusDotColor,
                    borderWidth: 2,
                    borderColor: backgroundColor || '#2563eb',
                  }}
                />
              )}
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={`font-bold text-white tracking-tight leading-[26px] ${
                  showLogo ? 'text-[18px]' : 'text-[20px]'
                }`}
                numberOfLines={1}
              >
                {title}
              </Text>
              {!showLogo && statusDotColor && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: statusDotColor }}
                />
              )}
            </View>
            {subtitle && (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text
                  className={
                    subtitleUppercase
                      ? 'text-[11px] font-bold text-[#dbeafe] uppercase tracking-wider'
                      : 'text-[12px] font-medium text-[#dbeafe]'
                  }
                >
                  {subtitle}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Action: custom rightElement or Help Button */}
        {rightElement ? (
          rightElement
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleHelp}
            className="items-center justify-center"
            accessibilityLabel="Help"
          >
            <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
              <Rect x="0.5" y="0.5" width="34" height="34" rx="17" fill="white" />
              <Rect x="0.5" y="0.5" width="34" height="34" rx="17" stroke="#E3E7EF" />
              <Path
                d="M16.375 20.2351V20.1136C16.3835 19.321 16.4624 18.6903 16.6115 18.2216C16.7649 17.7528 16.9822 17.3736 17.2635 17.0838C17.5447 16.794 17.8835 16.5298 18.2798 16.2912C18.5355 16.1293 18.7656 15.9482 18.9702 15.7479C19.1747 15.5476 19.3366 15.3175 19.456 15.0575C19.5753 14.7976 19.6349 14.5099 19.6349 14.1946C19.6349 13.8153 19.5455 13.4872 19.3665 13.2102C19.1875 12.9332 18.9489 12.7202 18.6506 12.571C18.3565 12.4176 18.0284 12.3409 17.6662 12.3409C17.3381 12.3409 17.0249 12.4091 16.7266 12.5455C16.4283 12.6818 16.1811 12.8949 15.9851 13.1847C15.7891 13.4702 15.6761 13.8388 15.6463 14.2905H13.7031C13.733 13.5234 13.9268 12.8757 14.2848 12.3473C14.6428 11.8146 15.1158 11.4119 15.7038 11.1392C16.2962 10.8665 16.9503 10.7301 17.6662 10.7301C18.4503 10.7301 19.1364 10.8771 19.7244 11.1712C20.3125 11.4609 20.7685 11.8679 21.0923 12.392C21.4205 12.9119 21.5845 13.5192 21.5845 14.2138C21.5845 14.6911 21.5099 15.1214 21.3608 15.505C21.2116 15.8842 20.9986 16.223 20.7216 16.5213C20.4489 16.8196 20.1207 17.0838 19.7372 17.3139C19.375 17.5398 19.081 17.7741 18.8551 18.017C18.6335 18.2599 18.4716 18.5476 18.3693 18.88C18.267 19.2124 18.2116 19.6236 18.2031 20.1136V20.2351H16.375ZM17.3402 24.1214C16.9908 24.1214 16.6903 23.9979 16.4389 23.7507C16.1875 23.4993 16.0618 23.1967 16.0618 22.843C16.0618 22.4936 16.1875 22.1953 16.4389 21.9482C16.6903 21.6967 16.9908 21.571 17.3402 21.571C17.6854 21.571 17.9837 21.6967 18.2351 21.9482C18.4908 22.1953 18.6186 22.4936 18.6186 22.843C18.6186 23.0774 18.5589 23.2926 18.4396 23.4886C18.3246 23.6804 18.1712 23.8338 17.9794 23.9489C17.7876 24.0639 17.5746 24.1214 17.3402 24.1214Z"
                fill="#165BE8"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
