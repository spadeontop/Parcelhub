import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { ParcelHubLogoSvg } from '../common/Icons';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
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
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/20"
                accessibilityLabel="Help"
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"
                    stroke="#ffffff"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-wider">
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
            className="w-9 h-9 rounded-full bg-white/20 items-center justify-center border border-white/20"
            accessibilityLabel="Help"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
