import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AuthButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  variant = 'primary',
  onPress,
  isLoading = false,
  disabled = false,
  showArrow = false,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;
  const isPrimary = variant === 'primary';
  const isTextOnly = variant === 'text' || variant === 'secondary';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`w-full rounded-xl flex-row items-center justify-center ${
        isPrimary ? 'bg-[#2563eb]' : 'bg-transparent'
      } ${disabled || isLoading ? 'opacity-60' : ''}`}
      style={{
        height: isCompact ? 40 : 44,
        shadowColor: isPrimary ? '#2563eb' : undefined,
        shadowOffset: isPrimary ? { width: 0, height: 3 } : undefined,
        shadowOpacity: isPrimary ? 0.18 : 0,
        shadowRadius: isPrimary ? 6 : 0,
        elevation: isPrimary ? 2 : 0,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#64748b'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center gap-1.5">
          <Text
            className={`font-semibold ${
              isPrimary ? 'text-white' : 'text-[#64748b]'
            }`}
            style={{ fontSize: isCompact ? 13.5 : 14 }}
          >
            {label}
          </Text>
          {showArrow && isPrimary && (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12h14m-7-7l7 7-7 7"
                stroke="#ffffff"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
