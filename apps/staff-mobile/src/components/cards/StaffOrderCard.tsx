import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../types';
import { StaffBadge } from '../common/StaffBadge';
import { Clock } from '../common/Icons';

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

  // Check if claim is active/initiated by customer
  const isClaimInitiated = Boolean(
    order.isClaimActive ||
      (order.claimRemainingSeconds !== undefined && order.claimRemainingSeconds > 0)
  );

  const [remainingSecs, setRemainingSecs] = useState<number>(
    order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0)
  );

  useEffect(() => {
    setRemainingSecs(
      order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0)
    );
  }, [order.claimRemainingSeconds, order.isClaimActive]);

  // Live countdown timer for active claim
  useEffect(() => {
    if (!isClaimInitiated || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClaimInitiated, remainingSecs]);

  // Renders live timer when claim is active, or price otherwise
  const renderPriceOrTimer = () => {
    if (isClaimInitiated && remainingSecs > 0) {
      const mins = Math.floor(remainingSecs / 60);
      const secs = String(remainingSecs % 60).padStart(2, '0');
      return (
        <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <Clock size={11} color="#059669" />
          <Text className="text-[11px] font-bold text-[#059669]">
            Timer: {mins}:{secs}
          </Text>
        </View>
      );
    }

    if (isClaimInitiated && remainingSecs <= 0) {
      return (
        <View className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          <Text className="text-[10px] font-bold text-rose-600">
            Timer Expired
          </Text>
        </View>
      );
    }

    return (
      <Text className="text-[11px] font-semibold text-[#334155]">
        {amountStr}
      </Text>
    );
  };

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

      {/* Bottom Row: Date + Price or Countdown Timer */}
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-[10px] font-normal text-[#64748B]">
          {formattedDate}
        </Text>
        {renderPriceOrTimer()}
      </View>

      {/* Item Divider */}
      {showDivider && <View className="h-px bg-[#F1F5F9] mt-2.5" />}
    </TouchableOpacity>
  );
};
