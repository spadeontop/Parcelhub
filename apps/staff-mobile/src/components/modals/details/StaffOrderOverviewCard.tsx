import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StaffOrder } from '../../../types';
import { StaffBadge } from '../../common/StaffBadge';
import { Copy, Check } from '../../common/Icons';

export interface StaffOrderOverviewCardProps {
  order: StaffOrder;
  showFinancials?: boolean;
}

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
    <View className="bg-white border border-[#E2E8F0] rounded-[20px] p-5 mb-4 shadow-sm">
      {/* Top Row: Order ticket label + Status badge */}
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-normal text-[#64748B]">
          Order ticket
        </Text>
        <StaffBadge status={order.status} variant="modal" />
      </View>

      {/* Big Order ID */}
      <Text className="text-[22px] font-bold text-[#0F172A] mt-1 tracking-tight">
        {orderId}
      </Text>

      {/* Recipient Section */}
      <View className="mt-3">
        <Text className="text-[12px] font-normal text-[#64748B]">
          Recipient
        </Text>
        <Text className="text-[15px] font-bold text-[#0F172A] mt-0.5">
          {recipientName}
        </Text>
      </View>

      {/* Tracking Number Section */}
      <View className="mt-3">
        <Text className="text-[12px] font-normal text-[#64748B]">
          Tracking Number
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopy}
          className="bg-[#F1F5F9] rounded-xl px-4 py-3 flex-row items-center justify-between mt-1 active:bg-slate-200"
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
    </View>
  );
};
