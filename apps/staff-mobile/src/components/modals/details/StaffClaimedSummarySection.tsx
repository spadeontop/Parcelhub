import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../../types';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { ClaimedOrderTimeline } from './ClaimedOrderTimeline';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
  onViewProof: () => void;
}

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = ({
  order,
  onReturnHome,
  onViewProof,
}) => {
  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const paidAmount = typeof order.amountReceived === 'number' ? order.amountReceived : price;
  const change =
    typeof order.change === 'number' ? order.change : Math.max(0, paidAmount - price);

  return (
    <View>
      <PaymentSummaryCard
        price={price}
        paidAmount={paidAmount}
        change={change}
        className="mb-4"
      />

      <ClaimedOrderTimeline order={order} onViewProof={onViewProof} />

      <View className="items-center pt-1 pb-4">
        <Text className="text-[11.5px] text-[#64748B] text-center mb-3">
          Order completed and logged in hub records.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="w-full py-2.5 items-center justify-center"
        >
          <Text className="text-[13px] font-bold text-[#475569]">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
