import React, { useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleProp,
  ViewStyle,
  Easing,
  View,
} from 'react-native';

export type ButtonActionState = 'idle' | 'loading' | 'success';

export interface StaffActionButtonProps {
  state?: ButtonActionState;
  idleLabel: string;
  loadingLabel?: string;
  successLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const customBezier = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * StaffActionButton matching button feedback 3.html:
 * Clean idle layer & loading layer with spinner, 0.98 press scale.
 * Success transition immediately closes the modal and delegates to button feedback 4.html.
 */
export const StaffActionButton: React.FC<StaffActionButtonProps> = ({
  state = 'idle',
  idleLabel,
  loadingLabel = 'Processing...',
  onPress,
  disabled = false,
  className = '',
  style,
  icon,
}) => {
  const isLoading = state === 'loading';

  // Background color animation: 0: #09090B, 1: #27272A
  const bgAnim = useRef(new Animated.Value(0)).current;

  // Press scale animation: 1.0 -> 0.98
  const pressScale = useRef(new Animated.Value(1)).current;

  // Layer transition animations (from button feedback 3):
  // Idle layer: opacity (200ms), translateY: 0 -> -8 (240ms)
  const idleOpacity = useRef(new Animated.Value(1)).current;
  const idleTranslateY = useRef(new Animated.Value(0)).current;

  // Loading layer: opacity (200ms), translateY: 8 -> 0 (240ms)
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 250,
          easing: customBezier,
          useNativeDriver: false,
        }),
        Animated.timing(idleOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(idleTranslateY, {
          toValue: -8,
          duration: 240,
          easing: customBezier,
          useNativeDriver: true,
        }),
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTranslateY, {
          toValue: 0,
          duration: 240,
          easing: customBezier,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 250,
          easing: customBezier,
          useNativeDriver: false,
        }),
        Animated.timing(idleOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(idleTranslateY, {
          toValue: 0,
          duration: 240,
          easing: customBezier,
          useNativeDriver: true,
        }),
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTranslateY, {
          toValue: 8,
          duration: 240,
          easing: customBezier,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const handlePressIn = () => {
    if (disabled || isLoading) return;
    Animated.timing(pressScale, {
      toValue: 0.98,
      duration: 120,
      easing: customBezier,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 140,
      easing: customBezier,
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#09090B', '#27272A'],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: pressScale }],
          borderRadius: 14,
          overflow: 'hidden',
          width: '100%',
        },
        style,
      ]}
      className={className}
    >
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled || isLoading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={{
            backgroundColor,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderRadius: 14,
          }}
        >
          {/* Layer 1: Idle State */}
          <Animated.View
            pointerEvents={isLoading ? 'none' : 'auto'}
            style={{
              position: 'absolute',
              opacity: idleOpacity,
              transform: [{ translateY: idleTranslateY }],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {icon && <View>{icon}</View>}
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: '600',
                letterSpacing: -0.2,
              }}
            >
              {idleLabel}
            </Text>
          </Animated.View>

          {/* Layer 2: Loading State (button feedback 3.html) */}
          <Animated.View
            pointerEvents={isLoading ? 'auto' : 'none'}
            style={{
              position: 'absolute',
              opacity: loadingOpacity,
              transform: [{ translateY: loadingTranslateY }],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: '600',
                letterSpacing: -0.2,
              }}
            >
              {loadingLabel}
            </Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
