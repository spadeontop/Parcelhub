import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { CARD_SHADOW } from '../common/cardStyles';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { OrderHubCard } from './OrderHubCard';

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
  const formattedPaid = paidAmount > 0 ? `₱${paidAmount.toLocaleString('en-US')}` : '—';
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
            <Text className="text-[13.5px] font-medium text-[#64748b]">Refund Ticket</Text>
            <View className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-[8px]">
              <Text className="font-mono text-[12px] font-bold text-[#1e293b]">
                {displayTicket}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Reason</Text>
            <Text
              className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4 leading-[19px]"
              numberOfLines={2}
            >
              {cancellationReason || 'Changed my mind'}
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
            <Text className="text-[13.5px] font-medium text-[#64748b]">Order Total</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedPrice}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-medium text-[#64748b]">Amount Paid</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedPaid}
            </Text>
          </View>

          <View className="border-t border-[#f1f5f9] pt-3 flex-row items-baseline justify-between">
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              Refundable Amount
            </Text>
            <Text className="text-[16px] font-bold text-[#215cd4]">
              {formattedRefund}
            </Text>
          </View>
        </View>
      </View>

      {/* Card 3: Hub Location */}
      <OrderHubCard hubName={hubName} hubAddress={hubAddress} hubOpen={hubOpen} />

      {/* Card 4: Status Timeline */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-4"
        style={CARD_SHADOW}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px] mb-4">
          STATUS TIMELINE
        </Text>

        {/* Step 1: Order Cancelled */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#ef4444] items-center justify-center mt-0.5">
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
              <Text className="text-[14px] font-bold text-[#0f172a]">Order Cancelled</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">
                {cancelledTime}
              </Text>
            </View>
            <Text className="text-[12.5px] font-normal text-[#64748b] mt-0.5">
              Cancelled by customer; awaiting hub refund
            </Text>
          </View>
        </View>

        {/* Step 2: Refund Issued (Pending) */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="w-6 h-6 rounded-full bg-[#f8fafc] border-2 border-[#cbd5e1] mt-0.5" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-semibold text-[#64748b]">Refund Issued</Text>
              <Text className="text-[11.5px] font-semibold text-[#94a3b8]">Pending</Text>
            </View>
            <Text className="text-[12.5px] font-normal text-[#64748b] mt-0.5">
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
          themeColor="#215cd4"
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
