import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface LoginButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  containerClassName?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  containerClassName = '',
}) => {
  const isInteractive = !disabled && !isLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: 'bg-slate-100 active:bg-slate-200 border border-slate-200',
          text: 'text-slate-700',
        };
      case 'outline':
        return {
          container: 'bg-transparent active:bg-slate-50 border border-slate-300',
          text: 'text-slate-800',
        };
      case 'ghost':
        return {
          container: 'bg-transparent active:bg-slate-100',
          text: 'text-blue-600',
        };
      case 'primary':
      default:
        return {
          container: 'bg-black active:bg-neutral-800',
          text: 'text-white',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      style={[
        {
          height: 48,
          borderRadius: 14,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      className={`w-full items-center justify-center px-4 flex-row ${v.container} ${containerClassName}`}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#2563EB'}
        />
      ) : (
        <Text
          style={[textStyle]}
          className={`text-[14px] font-bold text-center tracking-wide ${v.text}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
