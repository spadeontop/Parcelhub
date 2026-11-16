import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';

interface ModalFloatingInputProps extends TextInputProps {
  label: string;
  error?: boolean;
  isValid?: boolean;
  rightElement?: React.ReactNode;
}

export const ModalFloatingInput: React.FC<ModalFloatingInputProps> = ({
  label,
  error,
  isValid,
  rightElement,
  value,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  const stringValue = value !== undefined && value !== null ? String(value) : '';
  const hasValue = stringValue.length > 0;
  const isFloating = isFocused || hasValue;

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
    : isValid
    ? '#10b981'
    : '#e2e8f0';

  const labelTranslateY = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -11],
  });

  const labelFontSize = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [13.5, 10.5],
  });

  const labelColor = error
    ? '#dc2626'
    : isFocused
    ? '#2563eb'
    : isValid
    ? '#059669'
    : hasValue
    ? '#64748b'
    : '#94a3b8';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      className="bg-white rounded-[12px] border px-[13px] h-[54px] justify-center relative"
      style={[
        {
          borderColor,
          borderWidth: isFocused ? 1.5 : 1,
        },
        style,
      ]}
    >
      {/* Floating Label */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 13,
          right: rightElement ? 70 : 13,
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
            fontWeight: '600',
            includeFontPadding: false,
          }}
        >
          {label}
        </Animated.Text>
      </Animated.View>

      {/* TextInput Row */}
      <View
        className="flex-row items-center justify-between"
        style={{
          marginTop: isFloating ? 13 : 0,
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
          className="flex-1 font-bold text-[#1e293b] p-0 m-0"
          style={{
            fontSize: 14,
            includeFontPadding: false,
            height: 22,
            outline: 'none' as any,
          }}
          {...rest}
        />

        {rightElement && (
          <View className="pl-2 items-center justify-center" style={{ zIndex: 10 }}>
            {rightElement}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
