import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';

interface OrderCancelledViewProps {
  readonly trackingNumber: string;
  readonly productName: string;
  readonly price: number;
  readonly reason: string;
  readonly hubOpen: boolean;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly cancelledTimeFallback: string;
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
 * Displays Cancellation Summary (No Refund Required), Hub Card, and Status Timeline.
 */
export const OrderCancelledView: React.FC<OrderCancelledViewProps> = ({
  trackingNumber,
  productName,
  price,
  reason,
  hubOpen,
  statusTimeline,
  cancelledTimeFallback,
  onReturnHome,
}) => {
  const placedTime =
    formatTimelineTime(statusTimeline, 'PENDING_INITIALIZATION') ||
    formatTimelineTime(statusTimeline, 'PAYMENT_REQUIRED') ||
    '—';
  const cancelledTime =
    formatTimelineTime(statusTimeline, 'CANCELLED') || cancelledTimeFallback;

  return (
    <ScrollView
      className="flex-1 px-[18px]"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 4, gap: 14 }}
    >
      {/* Cancellation Summary Card */}
      <View
        className="bg-white rounded-[20px] p-5 gap-[13px]"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="border-b border-[#f1f5f9] pb-[14px]">
          <Text className="text-[15px] font-extrabold text-[#0f172a]">
            Order Voided
          </Text>
          <Text className="text-[12px] font-semibold text-[#64748b] mt-0.5">
            {trackingNumber}
          </Text>
        </View>

        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px]">
          CANCELLATION SUMMARY
        </Text>

        <View className="flex-row items-center justify-between pt-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Product</Text>
          <Text
            className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4"
            numberOfLines={1}
          >
            {productName}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Order Amount</Text>
          <Text className="text-[13.5px] font-semibold text-[#0f172a] text-right">
            ₱{price}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Paid Amount</Text>
          <Text className="text-[13.5px] font-semibold text-[#0f172a] text-right">
            — (Unpaid)
          </Text>
        </View>

        <View className="flex-row items-center justify-between pb-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Refund Due</Text>
          <Text className="text-[13.5px] font-semibold text-[#64748b] text-right">
            ₱0 (None)
          </Text>
        </View>

        <View className="h-px bg-[#f1f5f9] w-full" />

        <View className="flex-row items-center justify-between pt-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Reason</Text>
          <Text
            className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4"
            numberOfLines={2}
          >
            {reason}
          </Text>
        </View>
      </View>

      {/* Hub Card */}
      <View
        className="bg-white rounded-[20px] px-5 py-[18px] flex-row items-center justify-between"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-[14.5px] font-bold text-[#0f172a]">
            Lily’s Catering Hub
          </Text>
          <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
            Yati, Liloan, Cebu, 6002
          </Text>
        </View>

        <View
          className={`flex-row items-center gap-[6px] px-3 py-[6px] rounded-full ${
            hubOpen ? 'bg-[#ecfdf5]' : 'bg-[#fef2f2]'
          }`}
        >
          <View
            className={`w-[7px] h-[7px] rounded-full ${
              hubOpen ? 'bg-[#10b981]' : 'bg-[#ef4444]'
            }`}
          />
          <Text
            className={`text-[12px] font-semibold ${
              hubOpen ? 'text-[#10b981]' : 'text-[#dc2626]'
            }`}
          >
            {hubOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Status Timeline Card */}
      <View
        className="bg-white rounded-[20px] p-5 gap-4"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px]">
          STATUS TIMELINE
        </Text>

        <View className="relative pl-[38px]">
          {/* Vertical Connecting Line */}
          <View className="absolute bg-[#e2e8f0] left-[11px] top-[24px] bottom-[24px] w-[2px]" />

          {/* Step 1: Order Placed */}
          <View className="relative pb-5">
            <View className="absolute left-[-38px] top-[1px] w-6 h-6 rounded-full bg-[#10b981] items-center justify-center">
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
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Placed</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">
                {placedTime}
              </Text>
            </View>
            <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
              Order by the user from the app
            </Text>
          </View>

          {/* Step 2: Order Cancelled */}
          <View className="relative">
            <View className="absolute left-[-38px] top-[1px] w-6 h-6 rounded-full bg-[#ef4444] items-center justify-center">
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
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#dc2626]">
                Order Cancelled
              </Text>
              <Text className="text-[11.5px] font-semibold text-[#dc2626]">
                {cancelledTime}
              </Text>
            </View>
            <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
              Voided by customer prior to payment
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action */}
      <View className="pt-4">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onReturnHome}
          className="w-full bg-[#2563eb] rounded-[14px] p-[15px] items-center justify-center"
          style={{
            shadowColor: '#2563eb',
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
