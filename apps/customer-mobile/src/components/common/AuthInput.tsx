import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  isPassword = false,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = Boolean(value && String(value).length > 0);
  const isHighlighted = isFocused || hasValue;

  return (
    <View className="mb-3.5">
      <View
        className={`w-full rounded-xl border bg-white px-3.5 pt-2 pb-2 justify-center ${
          error
            ? 'border-red-500'
            : isFocused
            ? 'border-[#2563eb] ring-1 ring-[#2563eb]'
            : 'border-[#e2e8f0]'
        }`}
        style={{ minHeight: 58 }}
      >
        {/* Label */}
        <Text
          className={`text-[11px] font-bold tracking-tight mb-0.5 ${
            error
              ? 'text-red-500'
              : isHighlighted
              ? 'text-[#2563eb]'
              : 'text-[#64748b]'
          }`}
        >
          {label}
        </Text>

        <View className="flex-row items-center justify-between">
          <TextInput
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (onBlur) onBlur(e);
            }}
            secureTextEntry={isPassword ? !showPassword : secureTextEntry}
            placeholderTextColor="#94a3b8"
            className="flex-1 text-[14px] font-bold text-[#1e293b] p-0 m-0"
            style={{ includeFontPadding: false }}
            {...rest}
          />

          {isPassword && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword((prev) => !prev)}
              className="pl-2 py-1"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye Off Icon
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M1 1l22 22"
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                // Eye Icon
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error ? (
        <Text className="text-[11.5px] font-medium text-red-500 mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
