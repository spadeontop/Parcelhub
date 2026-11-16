import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

interface LoginNarrationHeaderProps {
  title?: string;
  subtitle?: string;
}

export const LoginNarrationHeader: React.FC<LoginNarrationHeaderProps> = ({
  title = 'Welcome!',
  subtitle = 'Sign in to track deliveries, manage hub\npickups, and view your QR passes.',
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  return (
    <View style={{ marginBottom: isCompact ? 16 : 24 }}>
      <Text
        className="font-bold text-[#1e293b]"
        style={{
          fontSize: isCompact ? 18 : 20,
          lineHeight: isCompact ? 22 : 25,
          marginBottom: isCompact ? 4 : 6,
        }}
      >
        {title}
      </Text>
      <Text
        className="font-normal text-[#64748b]"
        style={{
          fontSize: isCompact ? 11 : 12,
          lineHeight: isCompact ? 15 : 17,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
};
