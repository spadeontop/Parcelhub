import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
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
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasValue = Boolean(value !== undefined && value !== null && String(value).length > 0);
  const isFloating = isFocused || hasValue;

  // Animated value: 0 = centered placeholder, 1 = floating top label
  const animatedProgress = useRef(new Animated.Value(isFloating ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: isFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFloating, animatedProgress]);

  const borderColor = error
    ? '#ef4444'
    : isFocused
    ? '#2563eb'
    : '#e2e8f0';

  const labelTranslateY = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isCompact ? -11 : -13],
  });

  const labelFontSize = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [isCompact ? 13.5 : 14, isCompact ? 9.5 : 10.5],
  });

  const labelColor = error
    ? '#ef4444'
    : isFocused
    ? '#2563eb'
    : hasValue
    ? '#2563eb'
    : '#94a3b8';

  return (
    <View style={{ marginBottom: isCompact ? 8 : 10 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        className="w-full rounded-xl border bg-white px-3.5 relative justify-center"
        style={{
          height: isCompact ? 48 : 54,
          borderColor,
          cursor: 'text' as any,
        }}
      >
        {/* Floating Label / Placeholder */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 14,
            right: isPassword ? 44 : 14,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            zIndex: 1,
            transform: [{ translateY: labelTranslateY }],
            ...(Platform.OS === 'web'
              ? ({
                  pointerEvents: 'none',
                  userSelect: 'none',
                } as any)
              : {}),
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={{
              fontSize: labelFontSize,
              color: labelColor,
              fontWeight: '700',
              includeFontPadding: false,
            }}
          >
            {label}
          </Animated.Text>
        </Animated.View>

        {/* TextInput container */}
        <View
          style={{
            marginTop: isFloating ? (isCompact ? 14 : 16) : 0,
            paddingRight: isPassword ? 34 : 0,
            zIndex: 2,
          }}
        >
          <TextInput
            ref={inputRef}
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
            className="w-full font-bold text-[#1e293b] p-0 m-0"
            style={{
              fontSize: isCompact ? 13.5 : 14.5,
              includeFontPadding: false,
              height: isCompact ? 22 : 24,
              outline: 'none' as any,
              zIndex: 3,
            }}
            {...rest}
          />
        </View>

        {/* Independent vertically centered password toggle icon */}
        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-0 bottom-0 justify-center items-center"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={{
              zIndex: 10,
              cursor: 'pointer' as any,
            }}
          >
            {showPassword ? (
              // Visible state -> Show open eye
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
            ) : (
              // Hidden/Masked state -> Show slashed eye (eye off)
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error ? (
        <Animated.Text
          className="font-medium text-red-500 ml-1"
          style={{ fontSize: 11, marginTop: 2 }}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
};
