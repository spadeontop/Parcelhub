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
  const isActionDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isActionDisabled}
      className={`w-full rounded-xl flex-row items-center justify-center ${
        isPrimary
          ? isActionDisabled
            ? 'bg-[#93c5fd]' // Soft disabled blue when requirements not satisfied
            : 'bg-[#2563eb]' // Active brand blue
          : 'bg-transparent'
      }`}
      style={{
        height: isCompact ? 40 : 44,
        shadowColor: isPrimary && !isActionDisabled ? '#2563eb' : undefined,
        shadowOffset: isPrimary && !isActionDisabled ? { width: 0, height: 3 } : undefined,
        shadowOpacity: isPrimary && !isActionDisabled ? 0.18 : 0,
        shadowRadius: isPrimary && !isActionDisabled ? 6 : 0,
        elevation: isPrimary && !isActionDisabled ? 2 : 0,
        cursor: isActionDisabled ? ('not-allowed' as any) : ('pointer' as any),
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#64748b'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center gap-1.5">
          <Text
            className={`font-semibold ${
              isPrimary
                ? isActionDisabled
                  ? 'text-white/80'
                  : 'text-white'
                : 'text-[#64748b]'
            }`}
            style={{ fontSize: isCompact ? 13.5 : 14 }}
          >
            {label}
          </Text>
          {showArrow && isPrimary && (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12h14m-7-7l7 7-7 7"
                stroke={isActionDisabled ? 'rgba(255,255,255,0.7)' : '#ffffff'}
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
