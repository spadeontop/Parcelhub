import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ParcelHubLogoSvg } from '../common/Icons';

interface AuthBrandHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onHelp?: () => void;
}

export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  title = 'ParcelHub',
  subtitle = 'Customer Mobile Portal',
  onBack,
  onHelp,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  return (
    <View
      className="bg-[#2563eb] px-5"
      style={{
        paddingTop: isCompact ? 16 : 28,
        paddingBottom: isCompact ? 24 : 36,
      }}
    >
      {/* Top action row */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: isCompact ? 6 : 10 }}
      >
        {onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/20"
            accessibilityLabel="Go back"
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
        ) : (
          <View className="w-9 h-9" />
        )}

        {onHelp ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onHelp}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/20"
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
        ) : (
          <View className="w-9 h-9" />
        )}
      </View>

      {/* Brand logo & title */}
      <View className="items-center justify-center">
        {/* ParcelHub Logo */}
        <View
          style={{
            marginBottom: isCompact ? 6 : 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <ParcelHubLogoSvg size={isCompact ? 40 : 48} />
        </View>

        <Text
          className="font-bold text-white text-center"
          style={{
            fontSize: isCompact ? 20 : 22,
            letterSpacing: -0.55,
          }}
        >
          {title}
        </Text>
        <Text
          className="font-medium text-[#dbeafe] text-center"
          style={{
            fontSize: isCompact ? 12 : 13,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};
