import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from '../../common/Icons';

export interface OrderConfirmationCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}

export const OrderConfirmationCheckbox: React.FC<OrderConfirmationCheckboxProps> = ({
  checked,
  onToggle,
  title,
  subtitle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      onPress={onToggle}
      className={`flex-row items-start gap-3 my-4 px-1 ${
        disabled ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Checkbox square */}
      <View
        className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
          checked
            ? 'bg-[#2563EB]'
            : 'bg-white border-2 border-[#CBD5E1]'
        }`}
      >
        {checked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
      </View>

      {/* Label and description */}
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-[#0F172A] leading-tight">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-[11.5px] font-normal text-[#475569] mt-1 leading-[16px]">
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
