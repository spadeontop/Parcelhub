import React, { useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleProp,
  ViewStyle,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

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

export const StaffActionButton: React.FC<StaffActionButtonProps> = ({
  state = 'idle',
  idleLabel,
  loadingLabel = 'Processing...',
  successLabel = 'Completed',
  onPress,
  disabled = false,
  className = '',
  style,
  icon,
}) => {
  const isIdle = state === 'idle';
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';

  // Strip any accidental leading checkmark character from label to prevent double-check
  const cleanSuccessLabel = (successLabel || 'Completed').replace(/^[✓✔]\s*/, '');

  // 1:1 Background color transition: 0.32s cubic-bezier(0.22, 1, 0.36, 1)
  const bgAnim = useRef(new Animated.Value(0)).current; // 0: idle, 1: loading, 2: success

  // 1:1 Press scale animation: 0.14s cubic-bezier(0.22, 1, 0.36, 1)
  const pressScale = useRef(new Animated.Value(1)).current;

  // 1:1 Layer animations:
  // Idle layer: opacity (220ms), translateY: 0 -> -10 (280ms)
  const idleOpacity = useRef(new Animated.Value(1)).current;
  const idleTranslateY = useRef(new Animated.Value(0)).current;

  // Loading layer: opacity (220ms), translateY: 10 -> 0 (280ms)
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingTranslateY = useRef(new Animated.Value(10)).current;

  // Success layer: opacity (220ms), scale: 0.9 -> 1 (280ms)
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.9)).current;

  // 1:1 SVG Checkmark Draw animation: stroke-dashoffset 22 -> 0 over 0.36s with 0.1s delay
  const checkDashOffset = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (isLoading) {
      // Reset check path
      checkDashOffset.setValue(22);

      // Transition to Loading (background: #18181B)
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 320,
          easing: customBezier,
          useNativeDriver: false,
        }),
        // Idle exits: opacity 0, translateY -10
        Animated.timing(idleOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(idleTranslateY, {
          toValue: -10,
          duration: 280,
          easing: customBezier,
          useNativeDriver: true,
        }),
        // Loading enters: opacity 1, translateY 0
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTranslateY, {
          toValue: 0,
          duration: 280,
          easing: customBezier,
          useNativeDriver: true,
        }),
        // Success stays hidden
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 0.9,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isSuccess) {
      // Transition to Success (background: #16A34A)
      checkDashOffset.setValue(22);

      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 2,
          duration: 320,
          easing: customBezier,
          useNativeDriver: false,
        }),
        // Idle stays hidden
        Animated.timing(idleOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(idleTranslateY, {
          toValue: -10,
          duration: 280,
          useNativeDriver: true,
        }),
        // Loading exits
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTranslateY, {
          toValue: 10,
          duration: 280,
          useNativeDriver: true,
        }),
        // Success enters: opacity 1, scale 1
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 1,
          duration: 280,
          easing: customBezier,
          useNativeDriver: true,
        }),
        // Exact 1:1 SVG drawCheck: 0.36s cubic-bezier(0.22, 1, 0.36, 1) with 0.1s delay
        Animated.timing(checkDashOffset, {
          toValue: 0,
          duration: 360,
          delay: 100,
          easing: customBezier,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      checkDashOffset.setValue(22);

      // Idle state (background: #09090B)
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 320,
          easing: customBezier,
          useNativeDriver: false,
        }),
        // Idle enters: opacity 1, translateY 0
        Animated.timing(idleOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(idleTranslateY, {
          toValue: 0,
          duration: 280,
          easing: customBezier,
          useNativeDriver: true,
        }),
        // Loading exits
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(loadingTranslateY, {
          toValue: 10,
          duration: 280,
          useNativeDriver: true,
        }),
        // Success exits
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(successScale, {
          toValue: 0.9,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    isLoading,
    isSuccess,
    bgAnim,
    idleOpacity,
    idleTranslateY,
    loadingOpacity,
    loadingTranslateY,
    successOpacity,
    successScale,
    checkDashOffset,
  ]);

  const handlePressIn = () => {
    if (isIdle && !disabled) {
      Animated.timing(pressScale, {
        toValue: 0.98,
        duration: 140,
        easing: customBezier,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (isIdle) {
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 140,
        easing: customBezier,
        useNativeDriver: true,
      }).start();
    }
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      disabled && isIdle ? '#94A3B8' : '#09090B',
      '#18181B',
      '#16A34A',
    ],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: pressScale }],
          width: '100%',
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading || isSuccess}
        className={`w-full h-[48px] rounded-[10px] overflow-hidden justify-center items-center ${className}`}
        style={[
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
            elevation: 1,
          },
          style,
        ]}
      >
        <Animated.View
          style={{
            backgroundColor,
            width: '100%',
            height: '100%',
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Layer 1: Idle (0.22s opacity, 0.28s translateY) */}
          <Animated.View
            pointerEvents={isIdle ? 'auto' : 'none'}
            style={{
              position: 'absolute',
              inset: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: idleOpacity,
              transform: [{ translateY: idleTranslateY }],
            }}
          >
            {icon}
            <Text className="text-white font-semibold text-[14.5px] tracking-wide">
              {idleLabel}
            </Text>
          </Animated.View>

          {/* Layer 2: Loading (0.22s opacity, 0.28s translateY) */}
          <Animated.View
            pointerEvents={isLoading ? 'auto' : 'none'}
            style={{
              position: 'absolute',
              inset: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loadingOpacity,
              transform: [{ translateY: loadingTranslateY }],
            }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text className="text-white font-semibold text-[14.5px] tracking-wide">
              {loadingLabel}
            </Text>
          </Animated.View>

          {/* Layer 3: Success (0.22s opacity, 0.28s scale 0.9 -> 1 + SVG drawCheck) */}
          <Animated.View
            pointerEvents={isSuccess ? 'auto' : 'none'}
            style={{
              position: 'absolute',
              inset: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            }}
          >
            {/* 1:1 Animated Checkmark SVG from button feedback 2.html */}
            <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
              <AnimatedPath
                d="M4.5 10.5L8.2 14.2L15.8 6.5"
                stroke="#FFFFFF"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={[22, 22]}
                strokeDashoffset={checkDashOffset}
              />
            </Svg>
            <Text className="text-white font-semibold text-[14.5px] tracking-wide">
              {cleanSuccessLabel}
            </Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
