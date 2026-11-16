import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

export interface LoginHelpButtonProps {
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const LoginHelpButton: React.FC<LoginHelpButtonProps> = ({
  onPress,
  size = 40,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Staff Terminal Help"
      style={[{ width: size, height: size }, style]}
      className="items-center justify-center rounded-full"
    >
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <G id="Login_Button_Help">
          <Path
            d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
            fill="white"
            fillOpacity={0.1}
          />
          <Path
            d="M17.2 17.2C17.2 15.65 18.45 14.4 20 14.4C21.55 14.4 22.8 15.65 22.8 17.2C22.8 18.5 21.9 19.3 20.8 19.8C20.3 20.05 20 20.5 20 21.1V21.6"
            stroke="white"
            strokeWidth={1.9}
            strokeLinecap="round"
          />
          <Path
            d="M20 25.9C20.6075 25.9 21.1 25.4075 21.1 24.8C21.1 24.1925 20.6075 23.7 20 23.7C19.3925 23.7 18.9 24.1925 18.9 24.8C18.9 25.4075 19.3925 25.9 20 25.9Z"
            fill="white"
          />
        </G>
      </Svg>
    </TouchableOpacity>
  );
};
