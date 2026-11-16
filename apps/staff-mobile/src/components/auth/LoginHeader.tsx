import React from 'react';
import { View, Text } from 'react-native';
import { ParcelHubLogo } from './ParcelHubLogo';
import { LoginHelpButton } from './LoginHelpButton';

export interface LoginHeaderProps {
  onHelpPress?: () => void;
  title?: string;
  subtitle?: string;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({
  onHelpPress,
  title = 'ParcelHub',
  subtitle = 'Staff Mobile Portal',
}) => {
  return (
    <View className={`bg-black pb-8 px-6 ${onHelpPress ? 'pt-3' : 'pt-8'}`}>
      {/* Top Action Row (Help Button right aligned) */}
      {onHelpPress && (
        <View className="flex-row justify-end items-center h-10 mb-2">
          <LoginHelpButton onPress={onHelpPress} />
        </View>
      )}

      {/* Brand Identity */}
      <View className="items-center justify-center">
        <ParcelHubLogo size={52} />

        <Text className="text-[22px] font-bold text-white tracking-tight mt-3">
          {title}
        </Text>

        <Text className="text-[13px] font-normal text-[#DBEAFE] mt-1 tracking-wide">
          {subtitle}
        </Text>
      </View>
    </View>
  );
};
