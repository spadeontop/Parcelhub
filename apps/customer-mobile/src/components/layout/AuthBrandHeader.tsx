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
        paddingTop: isCompact ? 14 : 24,
        paddingBottom: isCompact ? 18 : 28,
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
        {/* Isometric Cube / Box Logo */}
        <View
          className="rounded-2xl bg-white/15 items-center justify-center border border-white/25"
          style={{
            width: isCompact ? 42 : 52,
            height: isCompact ? 42 : 52,
            marginBottom: isCompact ? 6 : 10,
          }}
        >
          <Svg
            width={isCompact ? 24 : 30}
            height={isCompact ? 24 : 30}
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
          style={{ fontSize: isCompact ? 20 : 22 }}
        >
          {title}
        </Text>
        <Text
          className="font-normal text-[#dbeafe] text-center"
          style={{
            fontSize: isCompact ? 12 : 13,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};
