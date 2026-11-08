import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { Check } from '../../common/Icons';

interface StaffUnpaidActionSectionProps {
  order: StaffOrder;
  isSubmitting: boolean;
  onActivate: (orderId: string, amount: number) => Promise<void>;
  onReturnHome: () => void;
}

export const StaffUnpaidActionSection: React.FC<StaffUnpaidActionSectionProps> = ({
  order,
  isSubmitting,
  onActivate,
  onReturnHome,
}) => {
  const fee = typeof order.amountToPay === 'number' ? order.amountToPay : 300;
  const [cashText, setCashText] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const cashNum = parseFloat(cashText) || 0;
  const change = Math.max(0, cashNum - fee);
  const isSufficient = cashNum >= fee;
  const canActivate = isConfirmed && isSufficient && !isSubmitting;

  const handleSubmit = async () => {
    if (!canActivate) return;
    await onActivate(order.id, cashNum);
  };

  return (
    <View className="space-y-4">
      {/* Card 2: AMOUNT RECEIVED matching unpaid.png */}
      <View className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 shadow-xs">
        <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
          AMOUNT RECEIVED
        </Text>

        {/* Currency Input Field */}
        <View className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 flex-row items-center justify-between mb-4">
          <Text className="text-sm font-bold text-[#0F172A] font-mono">₱</Text>
          <TextInput
            value={cashText}
            onChangeText={setCashText}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            style={{ outlineStyle: 'none' } as any}
            className="flex-1 text-right text-base font-bold text-[#0F172A] font-mono p-0 outline-none focus:outline-none"
          />
        </View>

        {/* Amount to Pay */}
        <View className="flex-row items-center justify-between py-1.5 border-b border-[#F8FAFC]">
          <Text className="text-xs text-[#64748B] font-medium">Amount to Pay</Text>
          <Text className="text-xs font-bold text-[#0F172A]">
            ₱{fee.toLocaleString()}
          </Text>
        </View>

        {/* Change */}
        <View className="flex-row items-center justify-between py-1.5 mb-2">
          <Text className="text-xs text-[#64748B] font-medium">Change</Text>
          <Text className="text-xs font-bold text-[#2563EB]">
            ₱{change.toLocaleString()}
          </Text>
        </View>

        {/* Footer Note */}
        <Text className="text-[11px] text-[#64748B] leading-relaxed">
          Change is only given alongside the order parcel’s receiving.
        </Text>
      </View>

      {/* Confirmation Checkbox matching unpaid.png */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsConfirmed((prev) => !prev)}
        className="flex-row items-start gap-3 px-1 mb-5"
      >
        <View
          className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
            isConfirmed ? 'bg-[#215CD4]' : 'bg-white border-2 border-[#CBD5E1]'
          }`}
        >
          {isConfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-[#0F172A]">
            I confirm that I received exactly ₱{cashNum.toLocaleString()}
          </Text>
          <Text className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
            Only activate the order if you received the exact or more compared to the specified amount.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={!canActivate}
        className={`w-full py-4 rounded-xl items-center justify-center shadow-md mb-2 ${
          canActivate ? 'bg-[#215CD4] active:bg-[#1d4ed8]' : 'bg-[#94A3B8]'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-sm">
            Activate Order
          </Text>
        )}
      </TouchableOpacity>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        className="w-full py-3 items-center justify-center"
      >
        <Text className="text-xs font-semibold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
