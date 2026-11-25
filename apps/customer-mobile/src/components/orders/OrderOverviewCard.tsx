import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus } from '../../types/api';
import { getStatusLabel, getStatusPillStyles } from '../../utils/statusHelpers';
import { CARD_SHADOW } from '../common/cardStyles';

interface OrderOverviewCardProps {
  readonly productName: string;
  readonly price: number;
  readonly amountReceived?: number | null;
  readonly recipientName: string;
  readonly trackingNumber: string;
  readonly status: OrderStatus;
  readonly change: number;
  readonly onCopyTracking: () => void;
}

const formatPeso = (amount: number): string => `₱${amount.toLocaleString('en-US')}`;

/**
 * Displays two cleanly grouped cards on OrderDetailsScreen:
 * 1. Order Details (product subject, status badge, recipient, copyable tracking number)
 * 2. Payment Summary (order total, cash paid, and balance due / cash change breakdown)
 */
export const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  productName,
  price,
  amountReceived,
  recipientName,
  trackingNumber,
  status,
  change,
  onCopyTracking,
}) => {
  const isUnpaid = status === 'PAYMENT_REQUIRED' || status === 'PENDING_INITIALIZATION';
  const isClaimed = status === 'CLAIMED';
  const paidDisplayAmount = amountReceived ?? price;
  const statusPill = getStatusPillStyles(status);
  const statusLabel = getStatusLabel(status);
  const formattedPrice = price > 0 ? formatPeso(price) : '—';

  const changeLabel = isClaimed
    ? 'Change Returned'
    : change > 0
    ? 'Change to Receive'
    : 'Cash Change';

  const changeSummaryBg = change > 0 ? '#ecfdf5' : '#f8fafc';
  const changeSummaryBorder = change > 0 ? '#d1fae5' : '#e2e8f0';

  return (
    <View className="gap-3.5 mb-3.5">
      {/* Card 1: Order & Parcel Details */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5"
        style={CARD_SHADOW}
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
            ORDER DETAILS
          </Text>
          <View
            className="px-2.5 py-0.5 rounded-full items-center justify-center"
            style={statusPill.containerStyle}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: statusPill.textColor }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Product Subject Block */}
        <View className="mt-3 pb-4 border-b border-[#f1f5f9]">
          <Text className="text-[11.5px] font-medium text-[#94a3b8] mb-1">
            Product
          </Text>
          <Text
            className="text-[15.5px] font-bold text-[#0f172a] leading-[22px] tracking-[-0.25px]"
            numberOfLines={2}
          >
            {productName}
          </Text>
        </View>

        {/* Parcel Metadata Rows */}
        <View className="pt-3.5 gap-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Recipient</Text>
            <Text
              className="text-[13.5px] font-semibold text-[#0f172a] flex-1 text-right ml-4"
              numberOfLines={1}
            >
              {recipientName}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Tracking No.</Text>
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
          </View>
        </View>
      </View>

      {/* Card 2: Payment Summary */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5"
        style={CARD_SHADOW}
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
            PAYMENT SUMMARY
          </Text>
          <View
            className="px-2.5 py-0.5 rounded-full"
            style={
              isUnpaid
                ? {
                    backgroundColor: '#fffbeb',
                    borderWidth: 1,
                    borderColor: '#fde68a',
                  }
                : {
                    backgroundColor: '#ecfdf5',
                    borderWidth: 1,
                    borderColor: '#d1fae5',
                  }
            }
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: isUnpaid ? '#b45309' : '#047857' }}
            >
              {isUnpaid ? 'Unpaid' : 'Paid'}
            </Text>
          </View>
        </View>

        {/* Financial Breakdown Rows */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Order Total</Text>
            <Text className="text-[14px] font-semibold text-[#0f172a]">
              {formattedPrice}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] text-[#64748b] font-medium">Cash Paid</Text>
            {isUnpaid ? (
              <Text className="text-[13.5px] font-medium text-[#94a3b8]">
                Not paid yet
              </Text>
            ) : (
              <Text className="text-[14px] font-semibold text-[#0f172a]">
                {formatPeso(paidDisplayAmount)}
              </Text>
            )}
          </View>

          {isUnpaid && (
            <View className="flex-row items-center justify-between">
              <Text className="text-[13.5px] text-[#64748b] font-medium">Cash Change</Text>
              <Text className="text-[13px] font-medium text-[#94a3b8]">
                Calculated at hub
              </Text>
            </View>
          )}
        </View>

        {/* Highlighted Settlement Strip */}
        <View
          className="mt-4 rounded-[12px] px-3.5 py-3 flex-row items-center justify-between"
          style={
            isUnpaid
              ? {
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }
              : {
                  backgroundColor: changeSummaryBg,
                  borderWidth: 1,
                  borderColor: changeSummaryBorder,
                }
          }
        >
          <Text
            className="text-[13.5px] font-semibold"
            style={{
              color: isUnpaid ? '#334155' : change > 0 ? '#065f46' : '#475569',
            }}
          >
            {isUnpaid ? 'Amount Due at Hub' : changeLabel}
          </Text>

          {isUnpaid ? (
            <Text className="text-[16px] font-extrabold text-[#215cd4]">
              {formattedPrice}
            </Text>
          ) : change > 0 ? (
            <Text className="text-[16px] font-extrabold text-[#059669]">
              {formatPeso(change)}
            </Text>
          ) : (
            <Text className="text-[13.5px] font-bold text-[#475569]">
              ₱0 · Exact
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
