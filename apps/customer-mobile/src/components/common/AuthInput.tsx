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

export type InputFeedbackState = 'normal' | 'filled' | 'error';
export type AuthInputType = 'text' | 'email' | 'phone' | 'password';

interface AuthInputProps extends TextInputProps {
  label: string;
  type?: AuthInputType;
  error?: string;
  isPassword?: boolean;
  isValid?: boolean; // When explicitly provided or computed
  feedbackState?: InputFeedbackState;
}

// Built-in validation helpers
const isValidEmailAddress = (val: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(val.trim());
};

const isValidPhoneNumber = (val: string): boolean => {
  // Supports PH/international formats: e.g. 09171234567, +639171234567, 9171234567 (10-13 digits)
  const cleaned = val.replace(/[\s\-\(\)]/g, '');
  return /^(\+63|0)?9\d{9}$/.test(cleaned) || (cleaned.length >= 10 && /^\+?\d+$/.test(cleaned));
};

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  type = 'text',
  error,
  isPassword: isPasswordProp,
  isValid: isValidProp,
  feedbackState,
  secureTextEntry,
  keyboardType: keyboardTypeProp,
  autoCapitalize: autoCapitalizeProp,
  value,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const isPassword = isPasswordProp || type === 'password';
  const isEmail = type === 'email';
  const isPhone = type === 'phone';

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const stringValue = value !== undefined && value !== null ? String(value) : '';
  const hasValue = stringValue.length > 0;
  const isFloating = isFocused || hasValue;

  // Auto-compute validity by input type when isValidProp is not explicitly provided
  let computedIsValid = false;
  if (isValidProp !== undefined) {
    computedIsValid = isValidProp;
  } else if (hasValue) {
    if (isEmail) computedIsValid = isValidEmailAddress(stringValue);
    else if (isPhone) computedIsValid = isValidPhoneNumber(stringValue);
  }

  // Derive active state: 'error' | 'filled' | 'normal'
  const computedState: InputFeedbackState = feedbackState
    ? feedbackState
    : error
    ? 'error'
    : hasValue
    ? 'filled'
    : 'normal';

  const isError = computedState === 'error';

  // Animated value: 0 = centered placeholder, 1 = floating top label
  const animatedProgress = useRef(new Animated.Value(isFloating ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: isFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFloating, animatedProgress]);

  // Border color:
  // - Error: #ef4444 (red)
  // - Focused only: #2563eb (brand blue)
  // - Normal / Filled unfocused: #e2e8f0 (subtle neutral border)
  const borderColor = isError
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

  // Label color:
  // - Error: #dc2626
  // - Focused only: #2563eb
  // - Filled (unfocused): #64748b (slate)
  // - Normal (empty): #94a3b8 (placeholder grey)
  const labelColor = isError
    ? '#dc2626'
    : isFocused
    ? '#2563eb'
    : hasValue
    ? '#64748b'
    : '#94a3b8';

  // Shows checkmark if valid and not in error state
  const hasCheck = computedIsValid && hasValue && !isError;
  const paddingRight = isPassword && hasCheck ? 64 : isPassword || hasCheck ? 38 : 0;

  // Derive default keyboardType and autoCapitalize from type
  const keyboardType =
    keyboardTypeProp ??
    (isEmail ? 'email-address' : isPhone ? 'phone-pad' : 'default');

  const autoCapitalize =
    autoCapitalizeProp ?? (isEmail || isPassword ? 'none' : 'sentences');

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
            right: paddingRight > 0 ? paddingRight + 10 : 14,
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
            paddingRight,
            zIndex: 2,
          }}
        >
          <TextInput
            ref={inputRef}
            value={value}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
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

        {/* Right Action Icons (Green Check & Password Eye) */}
        <View
          className="absolute right-3 top-0 bottom-0 flex-row items-center gap-1.5"
          style={{ zIndex: 10 }}
        >
          {/* Green Check (Filled / Valid indicator) - clean checkmark without circle background */}
          {hasCheck && (
            <View className="justify-center items-center px-0.5">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#16a34a"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}

          {/* Password Eye Toggle */}
          {isPassword && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword((prev) => !prev)}
              className="p-1 justify-center items-center"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={{ cursor: 'pointer' as any }}
            >
              {showPassword ? (
                // Visible -> Open eye
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
                // Hidden -> Slashed eye (eye off)
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
        </View>
      </TouchableOpacity>

      {/* Error Feedback Message matching Figma */}
      {isError && error ? (
        <View className="flex-row items-center gap-1 mt-1 ml-1">
          <View className="w-3.5 h-3.5 rounded-full bg-[#ef4444] items-center justify-center">
            <Svg width={8} height={8} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8v5M12 16h.01"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Animated.Text
            className="font-medium text-[#dc2626]"
            style={{ fontSize: 11 }}
          >
            {error}
          </Animated.Text>
        </View>
      ) : null}
    </View>
  );
};
