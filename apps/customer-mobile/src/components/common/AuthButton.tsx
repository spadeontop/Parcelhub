import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AuthButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
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
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`w-full h-12 rounded-xl flex-row items-center justify-center mb-3 ${
        isPrimary
          ? 'bg-[#2563eb]'
          : 'bg-white border border-[#cbd5e1]'
      } ${disabled || isLoading ? 'opacity-60' : ''}`}
      style={
        isPrimary
          ? {
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }
          : undefined
      }
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#334155'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center gap-1.5">
          <Text
            className={`font-bold text-[14px] ${
              isPrimary ? 'text-white' : 'text-[#334155]'
            }`}
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
