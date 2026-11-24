import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

interface FormCardHeaderProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle: React.ReactNode;
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
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              className={index < step ? 'w-7 h-1 rounded-full bg-[#2563eb]' : 'w-7 h-1 rounded-full bg-[#e2e8f0]'}
            />
          ))}
        </View>
      </View>

      {/* Title & Subtitle */}
      <Text
        accessibilityRole="header"
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

    </View>
  );
};
