import React from 'react';
import { View, Text } from 'react-native';
import { OrderCardContainer } from '../../common/OrderCardContainer';

export interface PaymentSummaryCardProps {
  price: number;
  paidAmount: number;
  change: number;
  className?: string;
}

/**
 * Payment Summary Card strictly conforming to Figma node 1338:639 (1342:9).
 * Features 3 columns with light dividers inside the standard OrderCardContainer.
 */
export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  price,
  paidAmount,
  change,
  className = 'mb-4',
}) => {
  return (
    <OrderCardContainer className={className}>
      <Text className="text-[12px] font-semibold text-[#334155] mb-3">
        Payment summary
      </Text>

      <View className="flex-row items-center justify-between">
        {/* Column 1: Price */}
        <View className="flex-1">
          <Text className="text-[10px] font-normal text-[#64748B]">Price</Text>
          <Text className="text-[18px] font-bold text-[#0F172A] mt-0.5">
            ₱{price.toLocaleString()}
          </Text>
        </View>

        {/* Divider 1 */}
        <View className="w-px h-10 bg-[#F1F5F9] mx-2" />

        {/* Column 2: Paid Amount */}
        <View className="flex-1 items-center">
          <Text className="text-[10px] font-normal text-[#64748B]">Paid Amount</Text>
          <Text className="text-[18px] font-bold text-[#0F172A] mt-0.5">
            ₱{paidAmount.toLocaleString()}
          </Text>
        </View>

        {/* Divider 2 */}
        <View className="w-px h-10 bg-[#F1F5F9] mx-2" />

        {/* Column 3: Change */}
        <View className="flex-1 items-end">
          <Text className="text-[10px] font-normal text-[#64748B]">Change</Text>
          <Text className="text-[18px] font-bold text-[#2563EB] mt-0.5">
            ₱{change.toLocaleString()}
          </Text>
        </View>
      </View>
    </OrderCardContainer>
  );
};
