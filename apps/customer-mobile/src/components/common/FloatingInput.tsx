import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  rightElement?: React.ReactNode;
  isPassword?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  containerStyle,
  inputContainerStyle,
  rightElement,
  isPassword = false,
  secureTextEntry,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue !== undefined ? String(defaultValue) : ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<any>(null);

  // Controlled vs uncontrolled value resolution
  const isControlled = value !== undefined;
  const activeValue = isControlled
    ? value !== null
      ? String(value)
      : ''
    : internalValue;
  const hasValue = activeValue.length > 0;
  const isFloating = isFocused || hasValue;
  const isError = Boolean(error && error.length > 0);
  const isPasswordField = isPassword || Boolean(secureTextEntry);

  // Animated progress: 0 = resting center, 1 = floating top
  const animatedProgress = useRef(new Animated.Value(isFloating ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: isFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFloating, animatedProgress]);

  // Label vertical position and font size interpolation
  const labelTranslateY = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isCompact ? -11 : -12],
  });

  const labelFontSize = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [isCompact ? 14 : 15, isCompact ? 10.5 : 11.5],
  });

  // Apple Design Colors:
  // - default border: #86868b (borderWidth: 1, borderRadius: 12)
  // - active/focused border: #0071e3
  // - error border & error text: #ff3b30
  // - floating label/placeholder: #6e6e73 (active focus: #0071e3, error: #ff3b30)
  // - typed text: #1d1d1f
  const borderColor = isError
    ? '#ff3b30'
    : isFocused
    ? '#0071e3'
    : '#86868b';

  const labelColor = isError
    ? '#ff3b30'
    : isFocused
    ? '#0071e3'
    : '#6e6e73';

  const handleChangeText = (text: string) => {
    if (!isControlled) {
      setInternalValue(text);
    }
    onChangeText?.(text);
  };

  const hasRightAction = Boolean(rightElement || isPasswordField);
  const paddingRight = rightElement ? 48 : isPasswordField ? 44 : 14;

  return (
    <View style={[{ marginBottom: isCompact ? 10 : 12 }, containerStyle]}>
      {/* Apple Minimalist Input Box */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          {
            height: isCompact ? 50 : 54,
            borderRadius: 12,
            borderWidth: 1,
            borderColor,
            backgroundColor: '#ffffff',
            paddingHorizontal: 14,
            justifyContent: 'center',
            position: 'relative',
            cursor: 'text' as any,
          },
          inputContainerStyle,
        ]}
      >
        {/* Floating Label / Resting Placeholder */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 14,
            right: hasRightAction ? paddingRight + 4 : 14,
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
              fontWeight: '400',
              includeFontPadding: false,
            }}
          >
            {label}
          </Animated.Text>
        </Animated.View>

        {/* Typed TextInput Container */}
        <View
          style={{
            marginTop: isFloating ? (isCompact ? 14 : 16) : 0,
            paddingRight: hasRightAction ? paddingRight - 14 : 0,
            zIndex: 2,
          }}
        >
          <TextInput
            ref={inputRef}
            value={activeValue}
            onChangeText={handleChangeText}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            secureTextEntry={isPasswordField ? !showPassword : false}
            selectionColor="#0071e3"
            style={[
              {
                fontSize: isCompact ? 14.5 : 15.5,
                color: '#1d1d1f',
                fontWeight: '400',
                height: isCompact ? 22 : 24,
                padding: 0,
                margin: 0,
                includeFontPadding: false,
                outline: 'none' as any,
                zIndex: 3,
              },
              style,
            ]}
            {...rest}
          />
        </View>

        {/* Right Element or Password Visibility Eye Toggle */}
        {hasRightAction && (
          <View
            style={{
              position: 'absolute',
              right: 12,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {rightElement}

            {!rightElement && isPasswordField && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  padding: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer' as any,
                }}
              >
                {showPassword ? (
                  // Open Eye (revealed)
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="#86868b"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                      stroke="#86868b"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  // Slashed Eye (hidden)
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      stroke="#86868b"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M1 1l22 22"
                      stroke="#86868b"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Validation Feedback Error Message */}
      {isError && (
        <View style={{ marginTop: 4, marginLeft: 4 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#ff3b30',
              fontWeight: '400',
            }}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FloatingInput;
