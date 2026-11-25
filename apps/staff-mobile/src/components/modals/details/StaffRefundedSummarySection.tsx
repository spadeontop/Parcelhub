import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../../types';
import { OrderCardContainer } from '../../common/OrderCardContainer';

interface StaffRefundedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
}

function formatDateTime(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const StaffRefundedSummarySection: React.FC<StaffRefundedSummarySectionProps> = ({
  order,
  onReturnHome,
}) => {
  const refundedAmount =
    typeof order.refundAmount === 'number'
      ? order.refundAmount
      : typeof order.amountToPay === 'number'
        ? order.amountToPay
        : 0;

  return (
    <View>
      <OrderCardContainer className="mb-4">
        <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
          CASH REFUND RELEASED
        </Text>
        <View className="flex-row items-center justify-between mt-1 mb-3">
          <Text className="text-[28px] font-bold text-[#7E22CE]">
            ₱{refundedAmount.toLocaleString()}
          </Text>
          <View className="bg-[#F3E8FF] rounded-full px-3 py-1">
            <Text className="text-[11px] font-semibold text-[#7E22CE]">Refunded</Text>
          </View>
        </View>

        <View className="h-px bg-[#F1F5F9] my-2" />

        <View className="gap-2 mt-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#64748B]">Refunded At</Text>
            <Text className="text-[12px] font-medium text-[#334155]">
              {formatDateTime(order.refundedAt || order.timestamp)}
            </Text>
          </View>
          {order.refundedByName ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-[#64748B]">Processed By</Text>
              <Text className="text-[12px] font-semibold text-[#0F172A]">
                {order.refundedByName}
              </Text>
            </View>
          ) : null}
          {order.cancelReason || order.cancelReasonCode ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-[#64748B]">Cancel Reason</Text>
              <Text className="text-[12px] font-medium text-[#334155] text-right flex-1 ml-4">
                {order.cancelReason || order.cancelReasonCode}
              </Text>
            </View>
          ) : null}
          {order.cancelledAt ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-[#64748B]">Cancelled At</Text>
              <Text className="text-[12px] font-medium text-[#334155]">
                {formatDateTime(order.cancelledAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </OrderCardContainer>

      <View className="items-center pt-1 pb-4">
        <Text className="text-[11.5px] text-[#64748B] text-center mb-3">
          Refund completed and logged in hub records.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="w-full py-2.5 items-center justify-center"
        >
          <Text className="text-[13px] font-bold text-[#475569]">Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
