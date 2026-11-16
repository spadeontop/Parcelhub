import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from '../../common/Icons';

export interface OrderDetailsHeaderProps {
  title?: string;
  subtitle: string;
  onBack: () => void;
}

export const OrderDetailsHeader: React.FC<OrderDetailsHeaderProps> = ({
  title = 'Order Details',
  subtitle,
  onBack,
}) => {
  return (
    <View className="bg-black pt-4 pb-6 px-5 flex-row items-center justify-between">
      {/* Circular Back Button (Btn_Back_Bg in Figma) */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
        accessibilityRole="button"
        accessibilityLabel="Go back to Home"
      >
        <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Centered Title & Subtitle */}
      <View className="items-center justify-center flex-1 px-2">
        <Text className="text-[18px] font-bold text-white text-center tracking-tight">
          {title}
        </Text>
        <Text className="text-[12px] font-normal text-[#A1A1AA] text-center mt-0.5">
          {subtitle}
        </Text>
      </View>

      {/* Right Spacer to preserve exact centering */}
      <View className="w-10 h-10" />
    </View>
  );
};
