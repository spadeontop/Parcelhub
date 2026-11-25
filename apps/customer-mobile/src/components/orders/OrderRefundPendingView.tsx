import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';

interface OrderRefundPendingViewProps {
  readonly productName: string;
  readonly price: number;
  readonly paidAmount: number;
  readonly refundAmount: number;
  readonly ticketCode: string;
  readonly orderId: string;
  readonly cancellationReason?: string | null;
  readonly hubName: string;
  readonly hubAddress: string;
  readonly hubOpen: boolean;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly cancelledAt?: string | null;
  readonly isPullRefreshing: boolean;
  readonly isConfirmed: boolean;
  readonly onConfirmedChange: (checked: boolean) => void;
  readonly isLoading?: boolean;
  readonly onRefresh: () => void;
  readonly onInitiateRefund: () => void;
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
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatIsoTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Fallback view for CANCELLED orders that are refund-eligible (e.g. cancelled while
 * away from the hub or after a refund pass window expired) so customers can
 * confirm and initiate their hub cash refund when ready.
 */
export const OrderRefundPendingView: React.FC<OrderRefundPendingViewProps> = ({
  productName,
  price,
  paidAmount,
  refundAmount,
  ticketCode,
  orderId,
  cancellationReason,
  hubName,
  hubAddress,
  hubOpen,
  statusTimeline,
  cancelledAt,
  isPullRefreshing,
  isConfirmed,
  onConfirmedChange,
  isLoading = false,
  onRefresh,
  onInitiateRefund,
  onReturnHome,
}) => {
  const formattedPrice = price > 0 ? `₱${price.toLocaleString('en-US')}` : '—';
  const formattedPaid = paidAmount > 0 ? `₱${paidAmount.toLocaleString('en-US')} (Paid)` : '—';
  const formattedRefund =
    refundAmount > 0 ? `₱${refundAmount.toLocaleString('en-US')}` : '—';
  const displayTicket = ticketCode || orderId || '—';
  const cancelledTime =
    formatTimelineTimestamp(statusTimeline, 'CANCELLED') ||
    formatIsoTime(cancelledAt) ||
    '—';

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
      {/* Refund Summary Card */}
      <View
        className="bg-white rounded-[20px] p-5 mb-3.5"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Card Header */}
        <View className="flex-row items-center gap-3 pb-[14px] border-b border-[#f1f5f9]">
          <View className="w-10 h-10 rounded-[12px] bg-[#eff6ff] border border-[#bfdbfe] items-center justify-center">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="#2563eb"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-extrabold text-[#0f172a]">
              Refund Pending
            </Text>
            <Text className="text-[12px] font-medium text-[#64748b] mt-0.5">
              {displayTicket}
            </Text>
          </View>
        </View>

        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px] mt-3.5 mb-3">
          REFUND SUMMARY
        </Text>

        <View className="gap-2.5">
          <View className="flex-row items-center justify-between">
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
            <Text className="text-[13.5px] font-semibold text-[#0f172a]">
              {formattedPrice}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Paid Amount</Text>
            <Text className="text-[13.5px] font-semibold text-[#0f172a]">
              {formattedPaid}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Refund Amount</Text>
            <Text className="text-[14px] font-bold text-[#2563eb]">
              {formattedRefund}
            </Text>
          </View>

          <View className="h-px bg-[#f1f5f9] my-1" />

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Reason</Text>
            <Text
              className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4"
              numberOfLines={2}
            >
              {cancellationReason || 'Changed my mind'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Refund Ticket</Text>
            <Text className="text-[13.5px] font-bold text-[#2563eb]">
              {displayTicket}
            </Text>
          </View>
        </View>
      </View>

      {/* Hub Card */}
      <View
        className="bg-white rounded-[20px] px-5 py-[18px] mb-3.5 flex-row items-center justify-between"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-[14.5px] font-bold text-[#0f172a]">{hubName}</Text>
          <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
            {hubAddress}
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
        className="bg-white rounded-[20px] p-5 mb-4"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px] mb-4">
          STATUS TIMELINE
        </Text>

        <View className="relative pl-[38px]">
          <View className="absolute bg-[#e2e8f0] left-[11px] top-[24px] bottom-[24px] w-[2px]" />

          {/* Step 1: Order Cancelled */}
          <View className="relative pb-5">
            <View className="absolute left-[-38px] top-[1px] w-6 h-6 rounded-full bg-[#ef4444] items-center justify-center">
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
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Cancelled</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">
                {cancelledTime}
              </Text>
            </View>
            <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
              Cancelled by customer; awaiting hub refund
            </Text>
          </View>

          {/* Step 2: Refund Issued (Pending) */}
          <View className="relative">
            <View className="absolute left-[-38px] top-[1px] w-6 h-6 rounded-full bg-white border-2 border-[#cbd5e1]" />
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-bold text-[#64748b]">Refund Issued</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">Pending</Text>
            </View>
            <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
              {formattedRefund} to be returned at hub counter
            </Text>
          </View>
        </View>
      </View>

      {/* Confirmation Checkbox & Initiate Refund */}
      <View className="gap-3">
        <ConfirmationSubmitSection
          title="I confirm that I want to initiate the refund"
          subtitle="Only initiate refund when you’re physically at the hub counter"
          buttonLabel="Initiate Refund"
          errorMessage="Please check the confirmation box before initiating refund."
          isChecked={isConfirmed}
          onCheckedChange={onConfirmedChange}
          onSubmit={onInitiateRefund}
          isLoading={isLoading}
          themeColor="#2563eb"
        />

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isLoading}
          onPress={onReturnHome}
          className="items-center justify-center py-2"
        >
          <Text className="text-[13.5px] font-semibold text-[#475569] text-center">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
