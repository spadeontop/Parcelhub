import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface ConfirmationSubmitSectionProps {
  /** Title shown inside the confirmation card */
  title: string;
  /** Subtitle/caption description shown inside the confirmation card */
  subtitle?: string;
  /** Label on the primary action button */
  buttonLabel: string;
  /** Custom error message when submitted while unchecked */
  errorMessage?: string;
  /** Controlled checked state */
  isChecked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Callback invoked when the button is pressed and confirmation is valid */
  onSubmit: () => void | Promise<void>;
  /** Optional form validation check called on submit attempt */
  onValidate?: () => boolean;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Visually mutes checkbox & button while keeping both tappable via onLockedPress */
  isLocked?: boolean;
  /** Called when checkbox or submit button is pressed while isLocked is true */
  onLockedPress?: () => void;
  /** When true, stops before highlighting the checkbox if onValidate returns false */
  validateBeforeCheck?: boolean;
  /** Optional container class or style */
  className?: string;
  /** Primary button theme color (defaults to #215cd4) */
  themeColor?: string;
  buttonColor?: string;
}

export const ConfirmationSubmitSection: React.FC<ConfirmationSubmitSectionProps> = ({
  title,
  subtitle,
  buttonLabel,
  errorMessage = 'Please check the confirmation box before submitting.',
  isChecked: controlledChecked,
  onCheckedChange,
  onSubmit,
  onValidate,
  isLoading = false,
  isLocked = false,
  onLockedPress,
  validateBeforeCheck = false,
  className = '',
  themeColor = '#215cd4',
  buttonColor,
}) => {
  const [internalChecked, setInternalChecked] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  // Horizontal shake animation value
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Clear error whenever checked state becomes true or section becomes locked
  useEffect(() => {
    if ((isChecked || isLocked) && hasError) {
      setHasError(false);
    }
  }, [isChecked, isLocked, hasError]);

  const triggerShake = () => {
    setHasError(true);
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleToggle = () => {
    if (isLoading) return;
    if (isLocked) {
      onLockedPress?.();
      return;
    }
    const nextVal = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(nextVal);
    }
    if (onCheckedChange) {
      onCheckedChange(nextVal);
    }
  };

  const handlePressSubmit = () => {
    if (isLoading) return;
    if (isLocked) {
      onLockedPress?.();
      return;
    }

    let isFormValid = true;
    if (onValidate) {
      isFormValid = onValidate();
    }

    if (validateBeforeCheck && !isFormValid) {
      return;
    }

    if (!isChecked) {
      triggerShake();
      return;
    }

    if (!isFormValid) {
      return;
    }

    setHasError(false);
    onSubmit();
  };

  return (
    <View className={`w-full gap-3 ${className}`}>
      {/* Tappable Confirmation Card */}
      <Animated.View
        style={{
          transform: [{ translateX: shakeAnim }],
          opacity: isLocked ? 0.6 : 1,
        }}
      >
        <TouchableOpacity
          activeOpacity={isLoading ? 1 : 0.85}
          onPress={handleToggle}
          className={`flex-row items-start p-3.5 rounded-xl border-[1.5px] transition-all ${
            hasError
              ? 'bg-[#fef2f2] border-[#dc2626]'
              : isChecked
              ? 'bg-[#fafafa]'
              : 'bg-white border-[#e4e4e7]'
          }`}
          style={
            !hasError && isChecked
              ? { borderColor: themeColor }
              : undefined
          }
        >
          {/* Checkbox Box */}
          <View
            className={`w-[20px] h-[20px] rounded-[5px] items-center justify-center mt-0.5 border-[1.5px] mr-3 ${
              hasError
                ? 'border-[#dc2626] bg-white'
                : isChecked
                ? ''
                : 'border-[#cbd5e1] bg-white'
            }`}
            style={
              isChecked && !hasError
                ? { backgroundColor: themeColor, borderColor: themeColor }
                : undefined
            }
          >
            {isChecked && (
              <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                <Path
                  d="M2.5 7.5L5.5 10.5L11.5 3.5"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>

          {/* Title and Subtitle */}
          <View className="flex-1 justify-center">
            <Text className="text-[13px] font-semibold text-[#09090b] leading-tight">
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-[11.5px] font-normal text-[#71717a] mt-1 leading-[15px]">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Inline Validation Error Message */}
      {hasError && (
        <View className="px-1 -mt-1">
          <Text className="text-[12px] font-semibold text-[#dc2626]">
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Primary Submit Button (Undisabled, Always Tappable) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePressSubmit}
        disabled={isLoading}
        className="w-full h-[48px] rounded-[12px] items-center justify-center flex-row shadow-sm"
        style={{
          backgroundColor: buttonColor ?? themeColor,
          opacity: isLocked ? 0.45 : isLoading ? 0.85 : 1,
          shadowColor: buttonColor ?? themeColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isLocked ? 0 : 0.25,
          shadowRadius: 10,
          elevation: isLocked ? 0 : 3,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text className="text-white font-bold text-[14.5px] tracking-wide">
            {buttonLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
export default ConfirmationSubmitSection;
