import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Image } from 'expo-image';

interface VerificationCodeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  length: number;
  digitStyle?: StyleProp<TextStyle>;
}

export function VerificationCodeInput({
  value,
  onChangeText,
  onSubmit,
  length,
  digitStyle,
}: VerificationCodeInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.container}>
      <View aria-hidden pointerEvents="none" style={styles.cells}>
        {Array.from({ length }, (_, index) => {
          const digit = value[index];
          const active = focused && index === activeIndex;
          return (
            <View key={index} style={[styles.cell, digit && styles.filled, active && styles.active]}>
              {digit ? (
                <Text style={[styles.digit, digitStyle]}>{digit}</Text>
              ) : active ? (
                <Image
                  source={require('../../../assets/password-recovery/code-caret.svg')}
                  style={styles.caret}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={`${length}-digit verification code`}
        autoComplete="off"
        caretHidden
        keyboardType="number-pad"
        onBlur={() => setFocused(false)}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        style={[StyleSheet.absoluteFill, styles.input]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 54 },
  cells: { flex: 1, flexDirection: 'row', gap: 8 },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1.2,
  },
  filled: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  active: { backgroundColor: '#fff', borderColor: '#1d5ce6', borderWidth: 2 },
  digit: { color: '#0f172a', fontSize: 20, fontWeight: '700', includeFontPadding: false },
  caret: { width: 2, height: 22 },
  input: {
    backgroundColor: 'transparent',
    color: 'transparent',
    opacity: 0,
    padding: 0,
  },
});
