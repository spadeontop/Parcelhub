import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { BackspaceIcon } from './Icons';

export interface NumericKeypadProps {
  onPressDigit: (digit: string) => void;
  onPressBackspace: () => void;
  onPressClear?: () => void;
  disabled?: boolean;
  clearLabel?: string;
  layout?: 'phone' | 'numpad';
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

const PHONE_ROWS: readonly (readonly string[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

const NUMPAD_ROWS: readonly (readonly string[])[] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onPressDigit,
  onPressBackspace,
  onPressClear,
  disabled = false,
  clearLabel = 'Clear',
  layout = 'phone',
  style,
  className = '',
  testID,
}) => {
  const digitRows = layout === 'numpad' ? NUMPAD_ROWS : PHONE_ROWS;

  return (
    <View
      className={`w-full max-w-[260px] self-center mb-4 ${className}`.trim()}
      style={style}
      testID={testID}
    >
      {digitRows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-3">
          {row.map((digit) => (
            <TouchableOpacity
              key={digit}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={() => onPressDigit(digit)}
              className={`w-[58px] h-[58px] rounded-full border border-gray-200 bg-white items-center justify-center shadow-xs active:bg-gray-50 ${
                disabled ? 'opacity-50' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel={digit}
              testID={testID ? `${testID}-digit-${digit}` : undefined}
            >
              <Text className="text-gray-900 text-lg font-semibold">{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View className="flex-row justify-between mb-1">
        {onPressClear ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={disabled}
            onPress={onPressClear}
            className={`w-[58px] h-[58px] rounded-full border border-gray-200 bg-white items-center justify-center shadow-xs active:bg-gray-50 ${
              disabled ? 'opacity-50' : ''
            }`}
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            testID={testID ? `${testID}-clear` : undefined}
          >
            <Text className="text-gray-500 text-xs font-semibold">{clearLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-[58px] h-[58px]" />
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => onPressDigit('0')}
          className={`w-[58px] h-[58px] rounded-full border border-gray-200 bg-white items-center justify-center shadow-xs active:bg-gray-50 ${
            disabled ? 'opacity-50' : ''
          }`}
          accessibilityRole="button"
          accessibilityLabel="0"
          testID={testID ? `${testID}-digit-0` : undefined}
        >
          <Text className="text-gray-900 text-lg font-semibold">0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled}
          onPress={onPressBackspace}
          className={`w-[58px] h-[58px] rounded-full border border-gray-200 bg-white items-center justify-center shadow-xs active:bg-gray-50 ${
            disabled ? 'opacity-50' : ''
          }`}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          testID={testID ? `${testID}-backspace` : undefined}
        >
          <BackspaceIcon size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NumericKeypad;
