import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StaffOrder } from '../../../types';
import { StaffBadge } from '../../common/StaffBadge';
import { Copy, Check } from '../../common/Icons';
import { OrderCardContainer } from '../../common/OrderCardContainer';

export interface StaffOrderOverviewCardProps {
  order: StaffOrder;
  showFinancials?: boolean;
}

/**
 * Order Overview Card strictly conforming to Figma node 1346:2252.
 * Uses OrderCardContainer for zero-border, rounded-16px, soft-shadow aesthetics.
 */
export const StaffOrderOverviewCard: React.FC<StaffOrderOverviewCardProps> = ({
  order,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!order.trackingId) return;
    await Clipboard.setStringAsync(order.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orderId = order.id || order.trackingId;
  const recipientName = order.customer || order.productName || 'John Doe';
  const trackingNumber = order.trackingId || 'PH2696153368792H';

  return (
    <OrderCardContainer className="mb-4">
      {/* Top Row: Order ticket + Order ID on left, Status badge on right (Figma 1346:2253-2256) */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-medium text-[#64748B]">
            Order ticket
          </Text>
          <Text className="text-[23px] font-bold text-[#0F172A] mt-0.5 tracking-tight">
            {orderId}
          </Text>
        </View>
        <StaffBadge status={order.status} variant="modal" />
      </View>

      {/* Order Owner Section (Figma 1346:2257-2258) */}
      <View className="mt-4">
        <Text className="text-[11px] font-normal text-[#64748B]">
          Order owner
        </Text>
        <Text className="text-[16px] font-semibold text-[#1E293B] mt-0.5">
          {recipientName}
        </Text>
      </View>

      {/* Tracking Number Section (Figma 1346:2259-2262) */}
      <View className="mt-4">
        <Text className="text-[11px] font-normal text-[#64748B]">
          Tracking Number
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopy}
          className="bg-[#F1F5F9] rounded-xl px-4 py-3 flex-row items-center justify-between mt-1.5 active:bg-slate-200"
          accessibilityLabel="Copy tracking number"
        >
          <Text className="text-[13px] font-bold text-[#334155] font-mono">
            {trackingNumber}
          </Text>
          <View className="p-0.5">
            {copied ? (
              <Check size={16} color="#059669" strokeWidth={2.5} />
            ) : (
              <Copy size={16} color="#64748B" />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </OrderCardContainer>
  );
};
