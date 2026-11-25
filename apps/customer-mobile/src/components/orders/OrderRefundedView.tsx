import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';

interface OrderRefundedViewProps {
  readonly productName: string;
  readonly price: number;
  readonly ticketCode: string;
  readonly orderId: string;
  readonly cancellationReason?: string | null;
  readonly hubName: string;
  readonly hubAddress: string;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly isPullRefreshing: boolean;
  readonly onRefresh: () => void;
  readonly onReturnHome: () => void;
}

function formatTimelineTimestamp(
  statusTimeline: OrderStatusHistoryTuple,
  statusKey: OrderStatus
): string | null {
  if (!Array.isArray(statusTimeline)) return null;
  const entry = statusTimeline.find((e) => e.status === statusKey);
  if (!entry?.timestamp) return null;
  const d = new Date(entry.timestamp);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Completed refund summary screen for REFUNDED orders, displaying refund breakdown,
 * hub badge, and cancellation/refund timeline.
 */
export const OrderRefundedView: React.FC<OrderRefundedViewProps> = ({
  productName,
  price,
  ticketCode,
  orderId,
  cancellationReason,
  hubName,
  hubAddress,
  statusTimeline,
  isPullRefreshing,
  onRefresh,
  onReturnHome,
}) => {
  const formattedPrice = price > 0 ? `₱${price.toLocaleString('en-US')}` : '—';
  const displayTicket = ticketCode || orderId || '—';
  const cancelledTime = formatTimelineTimestamp(statusTimeline, 'CANCELLED') || '—';
  const refundedTime = formatTimelineTimestamp(statusTimeline, 'REFUNDED') || '—';

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={onRefresh}
          tintColor="#2563eb"
          colors={['#2563eb']}
        />
      }
    >
      {/* Refund Issued Summary Card */}
      <View
        className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-3.5"
        style={{
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Header with green check */}
        <View className="flex-row items-center gap-3 pb-3.5 border-b border-[#f1f5f9]">
          <View className="w-10 h-10 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] items-center justify-center">
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-[#0f172a]">Refund Issued</Text>
            <Text className="text-[12px] text-[#64748b] mt-0.5">{displayTicket}</Text>
          </View>
        </View>

        {/* Refund Summary Breakdown */}
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mt-3.5 mb-2.5">
          REFUND SUMMARY
        </Text>

        <View className="gap-2.5">
          <View className="flex-row items-center justify-between py-[1px]">
            <Text className="text-[13.5px] text-[#64748b] font-normal">Product</Text>
            <Text
              numberOfLines={1}
              className="text-[13.5px] font-bold text-[#0f172a] flex-1 text-right ml-4"
            >
              {productName}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-[1px]">
            <Text className="text-[13.5px] text-[#64748b] font-normal">Order Amount</Text>
            <Text className="text-[13.5px] font-bold text-[#0f172a]">{formattedPrice}</Text>
          </View>

          <View className="flex-row items-center justify-between py-[1px]">
            <Text className="text-[13.5px] text-[#64748b] font-normal">Paid Amount</Text>
            <Text className="text-[13.5px] font-bold text-[#0f172a]">
              {price > 0 ? `${formattedPrice} (Paid)` : '—'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-[1px]">
            <Text className="text-[13.5px] text-[#64748b] font-normal">Refund Amount</Text>
            <Text className="text-[14px] font-bold text-[#10b981]">{formattedPrice}</Text>
          </View>

          <View className="border-t border-[#f1f5f9] pt-2.5 gap-2.5">
            <View className="flex-row items-center justify-between py-[1px]">
              <Text className="text-[13.5px] text-[#64748b] font-normal">Reason</Text>
              <Text
                numberOfLines={1}
                className="text-[13.5px] font-bold text-[#0f172a] flex-1 text-right ml-4"
              >
                {cancellationReason || '—'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-[1px]">
              <Text className="text-[13.5px] text-[#64748b] font-normal">Refund Ticket</Text>
              <Text className="text-[13.5px] font-bold text-[#2563eb]">{displayTicket}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Hub Card */}
      <View
        className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-3.5 flex-row items-center justify-between"
        style={{
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-[14.5px] font-bold text-[#0f172a] tracking-[-0.3px]">
            {hubName}
          </Text>
          <Text className="text-[12px] text-[#64748b] font-normal mt-0.5">{hubAddress}</Text>
        </View>

        <View className="flex-row items-center gap-[6px] px-[12px] py-[5px] rounded-full bg-[#ecfdf5] border border-[rgba(167,243,208,0.6)]">
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text className="text-[12px] font-bold text-[#10b981]">Refunded</Text>
        </View>
      </View>

      {/* Status Timeline Card */}
      <View
        className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-5"
        style={{
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mb-4">
          STATUS TIMELINE
        </Text>

        {/* Step 1: Order Cancelled */}
        <View className="flex-row gap-3.5 pb-5 relative">
          <View className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-[#10b981]" />
          <View className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center">
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke="#ffffff"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Cancelled</Text>
              <Text className="text-[11.5px] font-bold text-[#94a3b8]">{cancelledTime}</Text>
            </View>
            <Text className="text-[12px] text-[#64748b] mt-0.5">
              Refund pass verified by hub staff
            </Text>
          </View>
        </View>

        {/* Step 2: Refund Issued */}
        <View className="flex-row gap-3.5">
          <View className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center">
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke="#ffffff"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#10b981]">Refund Issued</Text>
              <Text className="text-[11.5px] font-bold text-[#10b981]">{refundedTime}</Text>
            </View>
            <Text className="text-[12px] text-[#64748b] mt-0.5">
              {price > 0 ? `${formattedPrice} returned to customer` : 'Refund returned to customer'}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Return to Home Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onReturnHome}
        className="w-full h-[48px] rounded-[12px] bg-[#2563eb] items-center justify-center"
        style={{
          shadowColor: '#2563eb',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Text className="text-white font-bold text-[14.5px]">Return to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default OrderRefundedView;
