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
        {/* Isometric Cube / Box Logo */}
        <View
          className="rounded-[12px] bg-[rgba(255,255,255,0.16)] items-center justify-center border border-[rgba(255,255,255,0.2)]"
          style={{
            width: isCompact ? 38 : 44,
            height: isCompact ? 38 : 44,
            marginBottom: isCompact ? 6 : 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Svg
            width={isCompact ? 20 : 24}
            height={isCompact ? 20 : 24}
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M21 16V8C20.9993 7.2862 20.6182 6.6269 20 6.27L13 2.27C12.3812 1.91273 11.6188 1.91273 11 2.27L4 6.27C3.38183 6.6269 3.00073 7.2862 3 8V16C3.00073 16.7138 3.38183 17.3731 4 17.73L11 21.73C11.6188 22.0873 12.3812 22.0873 13 21.73L20 17.73C20.6182 17.3731 20.9993 16.7138 21 16V16"
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3.27 6.96L12 12.01L20.73 6.96"
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 22.08V12"
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
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
