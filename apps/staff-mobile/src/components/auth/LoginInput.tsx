import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from '../common/Icons';

export interface LoginInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  isPassword?: boolean;
  error?: string | null;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const LoginInput: React.FC<LoginInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  error,
  containerClassName = '',
  containerStyle,
  onFocus,
  onBlur,
  autoCapitalize = 'none',
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const getBorderColor = () => {
    if (error) return '#EF4444';
    if (isFocused) return '#1E1E1E';
    return '#E2E8F0';
  };

  const getLabelColor = () => {
    if (error) return '#EF4444';
    if (isFocused) return '#1E1E1E';
    return '#64748B';
  };

  return (
    <View className={`w-full ${containerClassName}`} style={containerStyle}>
      <View
        style={{
          borderWidth: isFocused ? 1.5 : 1,
          borderColor: getBorderColor(),
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 58,
          justifyContent: 'center',
        }}
      >
        {/* Tiny top label */}
        <Text
          style={{ color: getLabelColor() }}
          className="text-[11px] font-bold tracking-tight mb-0.5"
        >
          {label}
        </Text>

        <View className="flex-row items-center justify-between">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            secureTextEntry={isPassword && !showPassword}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              fontSize: 14,
              color: '#0F172A',
              paddingVertical: 0,
              fontWeight: '600',
              flex: 1,
            }}
            {...rest}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error message indicator */}
      {error ? (
        <Text className="text-[11px] text-red-500 font-medium mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
