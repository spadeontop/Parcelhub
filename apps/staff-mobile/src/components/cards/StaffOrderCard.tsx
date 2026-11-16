import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../types';
import { StaffBadge } from '../common/StaffBadge';

interface StaffOrderCardProps {
  order: StaffOrder;
  onPress: (order: StaffOrder) => void;
  showDivider?: boolean;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = ({
  order,
  onPress,
  showDivider = true,
}) => {
  const formattedDate = (() => {
    const raw = order.timestamp || order.createdAt;
    if (!raw) return 'October 18, 2026';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'October 18, 2026';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const orderId = order.id || order.trackingId;
  const customerName = order.customer || order.productName || 'Customer';
  const amountStr = `₱${order.amountToPay.toLocaleString()}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(order)}
      className="py-2.5"
    >
      {/* Top Row: Order ID + Status badge */}
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold text-[#2563EB]">
          {orderId}
        </Text>
        <StaffBadge status={order.status} />
      </View>

      {/* Middle Row: Customer name */}
      <Text
        className="text-[12px] font-semibold text-[#1E293B] leading-[17px] mt-1"
        numberOfLines={1}
      >
        {customerName}
      </Text>

      {/* Bottom Row: Date + Price */}
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-[10px] font-normal text-[#64748B]">
          {formattedDate}
        </Text>
        <Text className="text-[11px] font-semibold text-[#334155]">
          {amountStr}
        </Text>
      </View>

      {/* Item Divider */}
      {showDivider && <View className="h-px bg-[#F1F5F9] mt-2.5" />}
    </TouchableOpacity>
  );
};
