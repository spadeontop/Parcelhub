import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { OrderConfirmationCheckbox } from './OrderConfirmationCheckbox';
import { OrderCardContainer } from '../../common/OrderCardContainer';

export interface StaffUnpaidActionSectionProps {
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
  const fee = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const [cashText, setCashText] = useState<string>(
    typeof order.amountReceived === 'number' && order.amountReceived > 0
      ? String(order.amountReceived)
      : ''
  );
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  useEffect(() => {
    setIsConfirmed(false);
    setIsLocked(false);
    setCashText(
      typeof order.amountReceived === 'number' && order.amountReceived > 0
        ? String(order.amountReceived)
        : ''
    );
  }, [order.id, order.amountReceived]);

  const cashNum = parseFloat(cashText) || 0;
  const change = cashNum > 0 ? Math.max(0, cashNum - fee) : 0;
  const isSufficient = fee > 0 ? cashNum >= fee : cashNum > 0;
  const canActivate = isConfirmed && isSufficient && !isSubmitting;

  const handleSubmit = async () => {
    if (!canActivate || isLocked) return;
    setIsLocked(true);
    await onActivate(order.id, cashNum);
  };

  return (
    <View className="gap-4">
      {/* Card: AMOUNT RECEIVED (Card_Amount_Received in Figma 1343:1662) */}
      <OrderCardContainer className="mb-4">
        <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-2.5">
          AMOUNT RECEIVED
        </Text>

        {/* Currency Input Field */}
        <View
          className={`rounded-xl px-4 py-2.5 flex-row items-center justify-between bg-white mb-4 ${
            isInputFocused
              ? 'border-2 border-[#2563EB]'
              : 'border border-[#CBD5E1]'
          }`}
        >
          <Text className="text-[18px] font-bold text-[#64748B]">₱</Text>
          <TextInput
            value={cashText}
            onChangeText={setCashText}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', padding: 0 }}
            className="flex-1 text-right text-[18px] font-bold text-[#0F172A]"
          />
        </View>

        {/* Horizontal Divider */}
        <View className="h-px bg-[#F1F5F9] my-2" />

        {/* Two Columns: Amount to Pay & Change with vertical divider */}
        <View className="flex-row items-center justify-between py-2">
          {/* Amount to Pay Column */}
          <View className="flex-1">
            <Text className="text-[12px] font-normal text-[#64748B]">
              Amount to Pay
            </Text>
            <Text className="text-[18px] font-bold text-[#0F172A] mt-0.5">
              ₱{fee.toLocaleString()}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View className="w-px h-9 bg-[#F1F5F9] mx-4" />

          {/* Change Column */}
          <View className="flex-1 items-end">
            <Text className="text-[12px] font-normal text-[#64748B]">
              Change
            </Text>
            <Text className="text-[18px] font-bold text-[#2563EB] mt-0.5">
              ₱{change.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Change Policy Disclaimer */}
        <Text className="text-[12px] font-normal text-[#64748B] mt-2 leading-[18px]">
          Change is only given alongside the order parcel&apos;s receiving.
        </Text>
      </OrderCardContainer>

      {/* Confirmation Checkbox (Confirmation_Box in Figma) */}
      <OrderConfirmationCheckbox
        checked={isConfirmed}
        onToggle={() => {
          if (!isLocked && !isSubmitting) {
            setIsConfirmed((prev) => !prev);
          }
        }}
        title={
          cashNum > 0
            ? `I confirm that I received exactly ₱${cashNum.toLocaleString()}`
            : 'I confirm that I received the payment'
        }
        subtitle="Only activate the order if you received the exact or more compared to the specified amount."
        disabled={isLocked || isSubmitting || !isSufficient}
      />

      {/* Action Buttons: Solid Black Activate Order & Return to Home */}
      <View className="mt-3">
        {/* Activate Order Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!canActivate}
          className={`w-full h-[48px] rounded-xl items-center justify-center ${
            canActivate ? 'bg-black' : 'bg-[#94A3B8]'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-[15px] tracking-wide">
              Activate Order
            </Text>
          )}
        </TouchableOpacity>

        {/* Return to Home Secondary Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="w-full py-3 items-center justify-center mt-2"
        >
          <Text className="text-[13px] font-bold text-[#475569]">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
