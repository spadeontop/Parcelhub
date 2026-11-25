import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus } from '../../types/api';
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
 * Displays two minimalist grouped cards on OrderDetailsScreen:
 * 1. Order Details (product title, recipient, copyable tracking number)
 * 2. Payment Summary (status-relevant payment figures without redundant notes)
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
  const formattedPrice = price > 0 ? formatPeso(price) : '—';

  const changeLabel = isClaimed ? 'Change Returned' : 'Change';

  return (
    <View className="gap-3.5 mb-3.5">
      {/* Card 1: Order Details */}
      <View
        className="bg-white border border-[#edf2f7] rounded-[20px] p-5"
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

        {/* Parcel Metadata */}
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
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px] mb-3.5">
          PAYMENT SUMMARY
        </Text>

        {isUnpaid ? (
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] text-[#64748b] font-medium">Amount Due</Text>
            <Text className="text-[18px] font-bold text-[#0f172a] tracking-[-0.3px]">
              {formattedPrice}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13.5px] text-[#64748b] font-medium">Order Total</Text>
              <Text className="text-[14px] font-semibold text-[#0f172a]">
                {formattedPrice}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-[13.5px] text-[#64748b] font-medium">Amount Paid</Text>
              <Text className="text-[14px] font-semibold text-[#0f172a]">
                {formatPeso(paidDisplayAmount)}
              </Text>
            </View>

            <View className="border-t border-[#f1f5f9] pt-3 flex-row items-baseline justify-between">
              <Text className="text-[14px] font-semibold text-[#0f172a]">
                {changeLabel}
              </Text>
              <Text
                className="text-[16px] font-bold"
                style={{ color: change > 0 ? '#0f172a' : '#64748b' }}
              >
                {formatPeso(change)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
