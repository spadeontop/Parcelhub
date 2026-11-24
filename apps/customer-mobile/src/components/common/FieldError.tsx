import { Text, View } from 'react-native';

export function FieldError({ message, color = '#ef4444' }: { message: string; color?: string }) {
  return (
    <View style={{ marginTop: 4, marginLeft: 4 }}>
      <Text
        accessibilityLiveRegion="polite"
        style={{ fontSize: 12, fontFamily: 'GoogleSans-Regular', color }}
      >
        {message}
      </Text>
    </View>
  );
}
