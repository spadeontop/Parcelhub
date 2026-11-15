import React from 'react';
import { View, Text } from 'react-native';

interface FormCardHeaderProps {
  step: 1 | 2;
  totalSteps?: number;
  title: string;
  subtitle: string;
}

export const FormCardHeader: React.FC<FormCardHeaderProps> = ({
  step,
  totalSteps = 2,
  title,
  subtitle,
}) => {
  return (
    <View className="mb-4">
      {/* Top Stepper Pill and Progress Bars */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="bg-[#eff6ff] px-2.5 py-1 rounded-full border border-[#dbeafe]">
          <Text className="text-[11px] font-bold text-[#2563eb] tracking-wide uppercase">
            STEP {step} OF {totalSteps}
          </Text>
        </View>

        {/* Indicator bars */}
        <View className="flex-row items-center gap-1.5">
          <View
            className={`w-8 h-1 rounded-full ${
              step >= 1 ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'
            }`}
          />
          <View
            className={`w-8 h-1 rounded-full ${
              step >= 2 ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'
            }`}
          />
        </View>
      </View>

      {/* Title & Subtitle */}
      <Text className="text-[16px] font-bold text-[#1e293b] tracking-tight">
        {title}
      </Text>
      <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
        {subtitle}
      </Text>

      {/* Subtle Divider */}
      <View className="h-px bg-[#f1f5f9] mt-3.5 mb-1" />
    </View>
  );
};
