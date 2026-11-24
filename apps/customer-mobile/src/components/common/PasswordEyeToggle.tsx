import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { EyeIcon, EyeOffIcon } from './Icons';

export interface PasswordEyeToggleProps {
  /** Whether the password text is currently visible (unmasked). */
  isVisible: boolean;
  /** Callback invoked when the toggle button is pressed. */
  onToggle: () => void;
  /** Icon size in pixels. Defaults to 18. */
  size?: number;
  /** Icon stroke color. Defaults to '#6b7280'. */
  color?: string;
  /** Custom accessibility label for screen readers. */
  accessibilityLabel?: string;
  /** Disables the toggle button when true. */
  disabled?: boolean;
  /** Optional NativeWind className applied to the TouchableOpacity wrapper. */
  className?: string;
  /** Optional inline style applied to the TouchableOpacity wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Optional testID for automated testing. */
  testID?: string;
}

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export const PasswordEyeToggle: React.FC<PasswordEyeToggleProps> = ({
  isVisible,
  onToggle,
  size = 18,
  color = '#6b7280',
  accessibilityLabel,
  disabled = false,
  className = '',
  style,
  testID,
}) => {
  const progress = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isVisible ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [isVisible, progress]);

  const handlePressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.86,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 6,
      tension: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const eyeOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.2, 0],
  });

  const eyeScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });

  const eyeRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-12deg'],
  });

  const eyeOffOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.2, 1],
  });

  const eyeOffScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const eyeOffRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['12deg', '0deg'],
  });

  const resolvedLabel =
    accessibilityLabel ?? (isVisible ? 'Hide password' : 'Show password');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityState={{ disabled }}
      className={`p-1.5 items-center justify-center ${className}`.trim()}
      style={style}
      testID={testID}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressScale }],
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: eyeOpacity,
            transform: [{ scale: eyeScale }, { rotate: eyeRotate }],
          }}
        >
          <EyeIcon size={size} color={color} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: eyeOffOpacity,
            transform: [{ scale: eyeOffScale }, { rotate: eyeOffRotate }],
          }}
        >
          <EyeOffIcon size={size} color={color} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default PasswordEyeToggle;

