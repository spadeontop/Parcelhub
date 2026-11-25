import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../types';
import { StaffBadge } from '../common/StaffBadge';
import { Clock } from '../common/Icons';
import { useDeadlineCountdown } from '../../hooks/useDeadlineCountdown';

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
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const orderTicket = order.ticketCode || order.id || order.trackingId;
  const customerName = order.customer || 'Customer';
  const amountStr = `₱${order.amountToPay.toLocaleString()}`;

  // Check if claim is active/initiated by customer
  const isClaimInitiated = Boolean(
    order.isClaimActive ||
    (order.claimRemainingSeconds !== undefined && order.claimRemainingSeconds > 0)
  );

  const remainingSecs = useDeadlineCountdown({
    isActive: isClaimInitiated,
    initialSeconds: order.claimRemainingSeconds,
    fallbackActiveSeconds: order.isClaimActive ? 300 : 0,
  });

  // Check if refund pass is active on a cancelled order
  const isRefundInitiated =
    order.status === 'CANCELLED' &&
    Boolean(
      order.isRefundActive ||
        (order.refundRemainingSeconds !== undefined && order.refundRemainingSeconds > 0)
    );

  const refundRemainingSecs = useDeadlineCountdown({
    isActive: isRefundInitiated,
    initialSeconds: order.refundRemainingSeconds,
    fallbackActiveSeconds: order.isRefundActive ? 300 : 0,
  });

  // Renders live timer when claim or refund pass is active, or price otherwise
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

    if (isRefundInitiated && refundRemainingSecs > 0) {
      const mins = Math.floor(refundRemainingSecs / 60);
      const secs = String(refundRemainingSecs % 60).padStart(2, '0');
      return (
        <View className="flex-row items-center gap-1 bg-[#F3E8FF] px-2 py-0.5 rounded-full border border-[#D8B4FE]">
          <Clock size={11} color="#7E22CE" />
          <Text className="text-[11px] font-bold text-[#7E22CE]">
            Refund: {mins}:{secs}
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
      style={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: '#F1F5F9',
        height: 92,
        justifyContent: 'space-between',
      }}
    >
      {/* Top Row: Order ID + Status badge */}
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold text-[#2563EB]">
          {orderTicket}
        </Text>
        <StaffBadge status={order.status} />
      </View>

      {/* Middle Row: Customer name */}
      <Text
        className="text-[12px] font-semibold text-[#1E293B] leading-[18px] mt-1 mb-0.5"
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
    </TouchableOpacity>
  );
};
