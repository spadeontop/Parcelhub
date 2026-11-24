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
      className={`w-full max-w-[280px] self-center ${className}`.trim()}
      style={style}
      testID={testID}
    >
      {digitRows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-[14px]">
          {row.map((digit) => (
            <TouchableOpacity
              key={digit}
              activeOpacity={0.7}
              disabled={disabled || undefined}
              onPress={() => onPressDigit(digit)}
              className={`w-16 h-16 rounded-full border border-[#e2e8f0] bg-white items-center justify-center ${
                disabled ? 'opacity-50' : ''
              }`}
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={digit}
              testID={testID ? `${testID}-digit-${digit}` : undefined}
            >
              <Text className="text-[#1e293b] text-[20px] font-bold leading-7">{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View className="flex-row justify-between mb-1">
        {onPressClear ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={disabled || undefined}
            onPress={onPressClear}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              disabled ? 'opacity-50' : ''
            }`}
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            testID={testID ? `${testID}-clear` : undefined}
          >
            <Text className="text-[#64748b] text-[12px] font-semibold">{clearLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-16 h-16" />
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled || undefined}
          onPress={() => onPressDigit('0')}
          className={`w-16 h-16 rounded-full border border-[#e2e8f0] bg-white items-center justify-center ${
            disabled ? 'opacity-50' : ''
          }`}
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="0"
          testID={testID ? `${testID}-digit-0` : undefined}
        >
          <Text className="text-[#1e293b] text-[20px] font-bold leading-7">0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={disabled || undefined}
          onPress={onPressBackspace}
          className={`w-16 h-16 rounded-full items-center justify-center ${
            disabled ? 'opacity-50' : ''
          }`}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          testID={testID ? `${testID}-backspace` : undefined}
        >
          <BackspaceIcon size={24} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NumericKeypad;
