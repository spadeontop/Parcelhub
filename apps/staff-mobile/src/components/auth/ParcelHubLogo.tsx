import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

export interface ParcelHubLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const ParcelHubLogo: React.FC<ParcelHubLogoProps> = ({ size = 52, style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
        <G id="ParcelHubEmblem">
          {/* Rounded base badge */}
          <Path
            d="M37 0H15C6.71573 0 0 6.71573 0 15V37C0 45.2843 6.71573 52 15 52H37C45.2843 52 52 45.2843 52 37V15C52 6.71573 45.2843 0 37 0Z"
            fill="#1E1E1E"
          />
          {/* Top-left L bracket */}
          <Path d="M6 6H33V15H15V46H6V6Z" fill="#FFFFFF" />
          {/* Bottom-right inverted L bracket */}
          <Path d="M46 46H19V37H37V6H46V46Z" fill="#FFFFFF" />
          {/* Center Blue Accent */}
          <Path d="M33 19H19V33H33V19Z" fill="#2563EB" />
        </G>
      </Svg>
    </View>
  );
};
