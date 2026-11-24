import { Text, View } from 'react-native';

interface FieldErrorProps {
  message: string;
  color?: string;
  centered?: boolean;
}

export function FieldError({ message, color = '#ef4444', centered = false }: FieldErrorProps) {
  return (
    <View style={{ marginTop: 4, marginLeft: centered ? 0 : 4 }}>
      <Text
        accessibilityLiveRegion="polite"
        style={{ fontSize: 12, fontFamily: 'GoogleSans-Regular', color, textAlign: centered ? 'center' : undefined }}
      >
        {message}
      </Text>
    </View>
  );
}
