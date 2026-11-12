import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { ArrowLeftIcon } from './Icons';

export interface BackButtonProps {
  /** Callback invoked when the back button is pressed. */
  onPress: () => void;
  /** Icon size in pixels. Defaults to 22 (matching User Profile). */
  size?: number;
  /** Icon stroke color. Defaults to '#1f2937'. */
  color?: string;
  /** Custom accessibility label for screen readers. Defaults to 'Back'. */
  accessibilityLabel?: string;
  /** Disables the button when true. */
  disabled?: boolean;
  /** Optional NativeWind className applied to the TouchableOpacity wrapper. */
  className?: string;
  /** Optional inline style applied to the TouchableOpacity wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Optional testID for automated testing. */
  testID?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  size = 22,
  color = '#1f2937',
  accessibilityLabel = 'Back',
  disabled = false,
  className = '',
  style,
  testID,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      className={`w-8 h-8 items-center justify-center ${className}`.trim()}
      style={style}
      testID={testID}
    >
      <ArrowLeftIcon size={size} color={color} />
    </TouchableOpacity>
  );
};

export default BackButton;

