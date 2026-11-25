import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { CARD_SHADOW } from '../common/cardStyles';
import { OrderHubCard } from './OrderHubCard';

interface OrderRefundedViewProps {
  readonly productName: string;
  readonly price: number;
  readonly orderPrice?: number;
  readonly paidAmount?: number;
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

const formatPesoOrDash = (amount: number): string =>
  amount > 0 ? `₱${amount.toLocaleString('en-US')}` : '—';

/**
 * Completed refund summary screen for REFUNDED orders, displaying grouped
 * order details, refund breakdown, hub badge, and cancellation/refund timeline.
 */
export const OrderRefundedView: React.FC<OrderRefundedViewProps> = ({
  productName,
  price,
  orderPrice,
  paidAmount,
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
  const resolvedOrderPrice = orderPrice ?? price;
  const resolvedPaidAmount = paidAmount ?? price;
  const formattedOrderPrice = formatPesoOrDash(resolvedOrderPrice);
  const formattedPaidAmount = formatPesoOrDash(resolvedPaidAmount);
  const formattedRefundAmount = formatPesoOrDash(price);
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
      {/* Card 1: Order Details */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-3.5"
        style={CARD_SHADOW}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
          ORDER DETAILS
        </Text>

        {/* Product Title */}
        <View className="mt-2.5 pb-4 border-b border-[#f1f5f9]">
          <Text
            className="text-[15.5px] font-bold text-[#0f172a] leading-[22px] tracking-[-0.25px]"
            numberOfLines={2}
          >
            {productName}
          </Text>
        </View>

        {/* Ticket & Reason */}
        <View className="pt-3.5 gap-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Refund Ticket</Text>
            <View className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-[8px]">
              <Text className="font-mono text-[12px] font-bold text-[#1e293b]">
                {displayTicket}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Reason</Text>
            <Text
              numberOfLines={2}
              className="text-[13.5px] font-semibold text-[#0f172a] flex-1 text-right ml-4 leading-[19px]"
            >
              {cancellationReason || '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Card 2: Refund Summary */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-3.5"
        style={CARD_SHADOW}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px] mb-3.5">
          REFUND SUMMARY
        </Text>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Order Total</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedOrderPrice}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Amount Paid</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedPaidAmount}
            </Text>
          </View>

          <View className="border-t border-[#f1f5f9] pt-3 flex-row items-baseline justify-between">
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              Refund Returned
            </Text>
            <Text className="text-[16px] font-bold text-[#0f172a]">
              {formattedRefundAmount}
            </Text>
          </View>
        </View>
      </View>

      {/* Card 3: Hub Location */}
      <OrderHubCard
        hubName={hubName}
        hubAddress={hubAddress}
        statusOverride="refunded"
      />

      {/* Card 4: Status Timeline */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-5"
        style={CARD_SHADOW}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px] mb-4">
          STATUS TIMELINE
        </Text>

        {/* Step 1: Order Cancelled */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center mt-0.5">
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
            <View className="flex-1 w-[2px] bg-[#e2e8f0] my-1.5" />
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Cancelled</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">{cancelledTime}</Text>
            </View>
            <Text className="text-[12.5px] text-[#64748b] mt-0.5">
              Refund pass verified by hub staff
            </Text>
          </View>
        </View>

        {/* Step 2: Refund Issued */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center mt-0.5">
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
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#059669]">Refund Issued</Text>
              <Text className="text-[11.5px] font-semibold text-[#059669]">{refundedTime}</Text>
            </View>
            <Text className="text-[12.5px] text-[#64748b] mt-0.5">
              {price > 0
                ? `${formattedRefundAmount} returned to customer`
                : 'Refund returned to customer'}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Return to Home Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onReturnHome}
        className="w-full h-[48px] rounded-[12px] bg-[#215cd4] items-center justify-center"
        style={{
          shadowColor: '#215cd4',
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
