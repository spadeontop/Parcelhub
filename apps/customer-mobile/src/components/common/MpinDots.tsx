import { StyleSheet, View } from 'react-native';

export const MPIN_LENGTH = 4;

export function MpinDots({ count }: { count: number }) {
  return (
    <View accessible accessibilityLabel={count + ' of ' + MPIN_LENGTH + ' digits entered'} style={styles.dots}>
      {Array.from({ length: MPIN_LENGTH }, (_, index) => (
        <View key={index} style={[styles.dot, index < count && styles.filledDot]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 22 },
  dot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#cbd5e1' },
  filledDot: { backgroundColor: '#2563eb' },
});
