import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

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
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  return (
    <View style={{ marginBottom: isCompact ? 10 : 14 }}>
      {/* Top Stepper Pill and Progress Bars */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: isCompact ? 6 : 10 }}
      >
        <View className="bg-[#eff6ff] px-2.5 py-0.5 rounded-full border border-[#dbeafe]">
          <Text
            className="font-bold text-[#2563eb] tracking-wide uppercase"
            style={{ fontSize: isCompact ? 10 : 11 }}
          >
            STEP {step} OF {totalSteps}
          </Text>
        </View>

        {/* Indicator bars */}
        <View className="flex-row items-center gap-1.5">
          <View
            className={`w-7 h-1 rounded-full ${
              step >= 1 ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'
            }`}
          />
          <View
            className={`w-7 h-1 rounded-full ${
              step >= 2 ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'
            }`}
          />
        </View>
      </View>

      {/* Title & Subtitle */}
      <Text
        className="font-bold text-[#1e293b] tracking-tight"
        style={{ fontSize: isCompact ? 15 : 16.5 }}
      >
        {title}
      </Text>
      <Text
        className="font-normal text-[#64748b]"
        style={{
          fontSize: isCompact ? 11 : 12,
          marginTop: isCompact ? 1 : 2,
        }}
      >
        {subtitle}
      </Text>

      {/* Subtle Divider */}
      <View
        className="h-px bg-[#f1f5f9]"
        style={{
          marginTop: isCompact ? 8 : 12,
          marginBottom: 2,
        }}
      />
    </View>
  );
};
