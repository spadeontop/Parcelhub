import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface OrderConfirmationCardProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  shakeTrigger?: number;
  className?: string;
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  checked,
  onToggle,
  title,
  subtitle,
  disabled = false,
  hasError = false,
  errorMessage = 'Please check the confirmation box before submitting.',
  shakeTrigger = 0,
  className = '',
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lastShakeTriggerRef = useRef<number>(shakeTrigger);

  // 1:1 Checkbox SVG scale (0.7 -> 1) & opacity (0 -> 1) over 180ms ease
  const checkScaleAnim = useRef(new Animated.Value(checked ? 1 : 0.7)).current;
  const checkOpacityAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  // 1:1 Error message translateY (-4 -> 0) & opacity (0 -> 1) over 200ms ease
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const errorTranslateYAnim = useRef(new Animated.Value(-4)).current;

  // Checkbox SVG animation (0.18s ease)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(checkScaleAnim, {
        toValue: checked ? 1 : 0.7,
        duration: 180,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacityAnim, {
        toValue: checked ? 1 : 0,
        duration: 180,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checked, checkScaleAnim, checkOpacityAnim]);

  // Only show error state when hasError is true AND box is NOT checked
  const showErrorState = hasError && !checked;

  // Inline error message transition (0.2s ease)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(errorOpacityAnim, {
        toValue: showErrorState ? 1 : 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(errorTranslateYAnim, {
        toValue: showErrorState ? 0 : -4,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showErrorState, errorOpacityAnim, errorTranslateYAnim]);

  // 1:1 Shake keyframes from button uncheck feedback.html (0.36s total duration):
  // 10%, 90% (-2px) | 20%, 80% (4px) | 30%, 50%, 70% (-5px) | 40%, 60% (5px)
  useEffect(() => {
    if (shakeTrigger > 0 && shakeTrigger !== lastShakeTriggerRef.current && !checked) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -2, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -2, duration: 36, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 36, useNativeDriver: true }),
      ]).start();
    }
    lastShakeTriggerRef.current = shakeTrigger;
  }, [shakeTrigger, checked, shakeAnim]);

  // 1:1 Styling
  let borderColor = '#E4E4E7';
  let backgroundColor = '#FFFFFF';
  let checkboxBorderColor = '#CBD5E1';
  let checkboxBg = '#FFFFFF';

  if (showErrorState) {
    borderColor = '#DC2626';
    backgroundColor = '#FEF2F2';
    checkboxBorderColor = '#DC2626';
    checkboxBg = '#FFFFFF';
  } else if (checked) {
    borderColor = '#18181B';
    backgroundColor = '#FAFAFA';
    checkboxBorderColor = '#09090B';
    checkboxBg = '#09090B';
  }

  return (
    <View className={`my-3 w-full ${className}`}>
      {/* 1:1 Tappable Card Container with Shake */}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TouchableOpacity
          activeOpacity={disabled ? 1 : 0.85}
          disabled={disabled}
          onPress={onToggle}
          style={{
            borderColor,
            backgroundColor,
            borderWidth: 1.5,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {/* 1:1 Custom Checkbox (18px x 18px, borderRadius: 5px) */}
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: checkboxBorderColor,
              backgroundColor: checkboxBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            {/* 1:1 Animated Checkmark SVG from reference */}
            <Animated.View
              style={{
                opacity: checkOpacityAnim,
                transform: [{ scale: checkScaleAnim }],
              }}
            >
              <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                <Path
                  d="M2.5 7.5L5.5 10.5L11.5 3.5"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Text Labels */}
          <View className="flex-1">
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#09090B',
                lineHeight: 18,
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '400',
                  color: '#71717A',
                  marginTop: 3,
                  lineHeight: 16,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 1:1 Inline Validation Error: NO ICON, clean text span with slide & fade */}
      {showErrorState && !!errorMessage && (
        <Animated.View
          style={{
            opacity: errorOpacityAnim,
            transform: [{ translateY: errorTranslateYAnim }],
            marginTop: 6,
            paddingHorizontal: 2,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#DC2626',
              lineHeight: 16,
            }}
          >
            {errorMessage}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};
