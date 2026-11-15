import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AuthBrandHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onHelp?: () => void;
}

export const AuthBrandHeader: React.FC<AuthBrandHeaderProps> = ({
  title = 'ParcelHub',
  subtitle = 'Create your account',
  onBack,
  onHelp,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  return (
    <View
      className="bg-[#2563eb] px-5"
      style={{
        paddingTop: isCompact ? 10 : 16,
        paddingBottom: isCompact ? 10 : 16,
      }}
    >
      {/* Top action row */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: isCompact ? 4 : 8 }}
      >
        {onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center border border-white/30"
            accessibilityLabel="Go back"
          >
            {/* White back arrow */}
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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
          <View className="w-8 h-8" />
        )}

        {onHelp ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onHelp}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center border border-white/30"
            accessibilityLabel="Help"
          >
            {/* White question mark / help */}
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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
          <View className="w-8 h-8" />
        )}
      </View>

      {/* Brand logo & title */}
      <View className="items-center justify-center">
        {/* Isometric Cube / Box Logo matching Figma */}
        <View
          className="rounded-2xl bg-white/15 items-center justify-center border border-white/25"
          style={{
            width: isCompact ? 36 : 44,
            height: isCompact ? 36 : 44,
            marginBottom: isCompact ? 4 : 8,
          }}
        >
          <Svg
            width={isCompact ? 22 : 26}
            height={isCompact ? 22 : 26}
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
              stroke="#ffffff"
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <Path
              d="M12 12L3 7M12 12l9-5M12 12v10"
              stroke="#ffffff"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text
          className="font-bold text-white tracking-tight text-center"
          style={{ fontSize: isCompact ? 18 : 20 }}
        >
          {title}
        </Text>
        <Text
          className="font-normal text-[#dbeafe] text-center"
          style={{
            fontSize: isCompact ? 11 : 12.5,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};
