import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { CARD_SHADOW } from '../common/cardStyles';
import { OrderHubCard } from './OrderHubCard';

interface OrderCancelledViewProps {
  readonly trackingNumber: string;
  readonly productName: string;
  readonly price: number;
  readonly reason: string;
  readonly hubOpen: boolean;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly cancelledTimeFallback: string;
  readonly onCopyTracking?: () => void;
  readonly onReturnHome: () => void;
}

function formatTimelineTime(
  statusTimeline: OrderStatusHistoryTuple,
  statusKey: OrderStatus
): string | null {
  if (!Array.isArray(statusTimeline)) return null;
  const entry = statusTimeline.find((e) => e.status === statusKey);
  if (!entry?.timestamp) return null;
  const d = new Date(entry.timestamp);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Summary screen for an unpaid order that has been voided/cancelled.
 * Displays grouped Order & Cancellation Details, Payment Summary, Hub Card, and Status Timeline.
 */
export const OrderCancelledView: React.FC<OrderCancelledViewProps> = ({
  trackingNumber,
  productName,
  price,
  reason,
  hubOpen,
  statusTimeline,
  cancelledTimeFallback,
  onCopyTracking,
  onReturnHome,
}) => {
  const placedTime =
    formatTimelineTime(statusTimeline, 'PENDING_INITIALIZATION') ||
    formatTimelineTime(statusTimeline, 'PAYMENT_REQUIRED') ||
    '—';
  const cancelledTime =
    formatTimelineTime(statusTimeline, 'CANCELLED') || cancelledTimeFallback;
  const formattedPrice = price > 0 ? `₱${price.toLocaleString('en-US')}` : '—';

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Card 1: Order & Cancellation Details */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-3.5"
        style={CARD_SHADOW}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pb-3.5 border-b border-[#f1f5f9]">
          <View className="flex-row items-center gap-3 flex-1 pr-2">
            <View className="w-10 h-10 rounded-[12px] bg-[#fef2f2] border border-[#fecaca] items-center justify-center">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#dc2626"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-extrabold text-[#0f172a]">
                Order Voided
              </Text>
              <Text className="text-[12px] font-medium text-[#64748b] mt-0.5">
                Cancelled prior to payment
              </Text>
            </View>
          </View>
          <View
            className="px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: '#fef2f2',
              borderWidth: 1,
              borderColor: '#fecaca',
            }}
          >
            <Text className="text-[11px] font-semibold text-[#b91c1c]">Voided</Text>
          </View>
        </View>

        {/* Product Subject */}
        <View className="mt-3.5 pb-3.5 border-b border-[#f1f5f9]">
          <Text className="text-[11.5px] font-medium text-[#94a3b8] mb-1">
            Product
          </Text>
          <Text
            className="text-[15px] font-bold text-[#0f172a] leading-[21px]"
            numberOfLines={2}
          >
            {productName}
          </Text>
        </View>

        {/* Cancellation Metadata */}
        <View className="pt-3.5 gap-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Tracking No.</Text>
            {onCopyTracking ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCopyTracking}
                className="bg-[#f8fafc] border border-[#e2e8f0] flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-[8px]"
              >
                <Text className="font-mono font-bold text-[12px] text-[#1e293b]">
                  {trackingNumber}
                </Text>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.08 2.57A2 2 0 0 0 14.65 2H10a2 2 0 0 0-2 2z"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ) : (
              <View className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-[8px]">
                <Text className="font-mono font-bold text-[12px] text-[#1e293b]">
                  {trackingNumber}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-start justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Reason</Text>
            <Text
              className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4 leading-[19px]"
              numberOfLines={2}
            >
              {reason}
            </Text>
          </View>
        </View>
      </View>

      {/* Card 2: Payment Summary */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-3.5"
        style={CARD_SHADOW}
      >
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
            PAYMENT SUMMARY
          </Text>
          <View
            className="px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: '#fffbeb',
              borderWidth: 1,
              borderColor: '#fde68a',
            }}
          >
            <Text className="text-[11px] font-semibold text-[#b45309]">Unpaid</Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Order Total</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedPrice}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Cash Paid</Text>
            <Text className="text-[13.5px] font-medium text-[#94a3b8]">
              No payment collected
            </Text>
          </View>
        </View>

        <View
          className="mt-4 rounded-[12px] px-3.5 py-3 flex-row items-center justify-between"
          style={{
            backgroundColor: '#f8fafc',
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <Text className="text-[13.5px] font-semibold text-[#475569]">Refund Due</Text>
          <Text className="text-[14px] font-bold text-[#475569]">₱0 · None</Text>
        </View>
      </View>

      {/* Card 3: Hub Location */}
      <OrderHubCard hubOpen={hubOpen} />

      {/* Card 4: Status Timeline */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-4"
        style={CARD_SHADOW}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px] mb-4">
          STATUS TIMELINE
        </Text>

        {/* Step 1: Order Placed */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center mt-0.5">
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View className="flex-1 w-[2px] bg-[#e2e8f0] my-1.5" />
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Placed</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">
                {placedTime}
              </Text>
            </View>
            <Text className="text-[12.5px] font-normal text-[#64748b] mt-0.5">
              Order by the user from the app
            </Text>
          </View>
        </View>

        {/* Step 2: Order Cancelled */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#ef4444] items-center justify-center mt-0.5">
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
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
              <Text className="text-[14px] font-bold text-[#dc2626]">
                Order Cancelled
              </Text>
              <Text className="text-[11.5px] font-semibold text-[#dc2626]">
                {cancelledTime}
              </Text>
            </View>
            <Text className="text-[12.5px] font-normal text-[#64748b] mt-0.5">
              Voided by customer prior to payment
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action */}
      <View className="pt-2">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onReturnHome}
          className="w-full h-[48px] bg-[#215cd4] rounded-[12px] items-center justify-center"
          style={{
            shadowColor: '#215cd4',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-[14px] font-bold text-white text-center">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
