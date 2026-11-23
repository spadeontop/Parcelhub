import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus } from '../../v1/types/api';

interface OrderOverviewCardProps {
  readonly productName: string;
  readonly price: number;
  readonly recipientName: string;
  readonly trackingNumber: string;
  readonly status: OrderStatus;
  readonly change: number;
  readonly onCopyTracking: () => void;
}

/**
 * Displays the order summary card (product, price, recipient, copyable tracking number,
 * paid amount, and cash change) on OrderDetailsScreen.
 */
export const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  productName,
  price,
  recipientName,
  trackingNumber,
  status,
  change,
  onCopyTracking,
}) => {
  return (
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
      <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mb-3">
        ORDER OVERVIEW
      </Text>

      <View className="space-y-2.5">
        {/* 1. Product */}
        <View className="flex-row items-center justify-between py-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Product</Text>
          <Text className="text-[14px] font-semibold text-[#111827] tracking-[-0.35px]">
            {productName}
          </Text>
        </View>

        {/* 2. Price */}
        <View className="flex-row items-center justify-between py-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Price</Text>
          <Text className="text-[14px] font-semibold text-[#111827]">
            {price > 0 ? `₱${price.toLocaleString('en-US')}` : '—'}
          </Text>
        </View>

        {/* 3. Recipient */}
        <View className="flex-row items-center justify-between py-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Recipient</Text>
          <Text className="text-[14px] font-medium text-[#1e293b]">
            {recipientName}
          </Text>
        </View>

        {/* 4. Tracking Number with Copy Badge */}
        <View className="flex-row items-center justify-between py-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Tracking Number</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCopyTracking}
            className="bg-[#f1f5f9] flex-row items-center gap-[6px] px-[10px] py-[4px] rounded-[6px]"
          >
            <Text className="font-mono font-bold text-[12px] text-[#334155]">
              {trackingNumber}
            </Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
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

        {/* 5. Paid Amount */}
        <View className="flex-row items-center justify-between py-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Paid Amount</Text>
          <Text className="text-[14px] font-semibold text-[#111827]">
            {status === 'PAYMENT_REQUIRED' ? '—' : `₱${price.toLocaleString('en-US')}`}
          </Text>
        </View>

        {/* 6. Change */}
        <View className="border-t border-[#f1f5f9] flex-row items-center justify-between pt-[11px] pb-[2px]">
          <Text className="text-[14px] text-[#64748b] font-normal">Change</Text>
          <Text className="text-[14px] font-bold text-[#1e293b]">
            {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : `₱${change.toLocaleString('en-US')}`}
          </Text>
        </View>
      </View>
    </View>
  );
};
