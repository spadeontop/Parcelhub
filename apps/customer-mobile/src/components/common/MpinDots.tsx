import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export const MPIN_LENGTH = 4;

export function MpinDots({ filledCount, style }: { filledCount: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityLabel={`${filledCount} of ${MPIN_LENGTH} digits entered`} style={[styles.row, style]}>
      {Array.from({ length: MPIN_LENGTH }, (_, index) => (
        <View key={index} style={[styles.dot, index < filledCount && styles.filled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  dot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#cbd5e1' },
  filled: { backgroundColor: '#2563eb' },
});
