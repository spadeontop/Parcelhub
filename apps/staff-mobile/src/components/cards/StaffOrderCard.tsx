import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../types';
import { StaffBadge } from '../common/StaffBadge';

interface StaffOrderCardProps {
  order: StaffOrder;
  onPress: (order: StaffOrder) => void;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = ({ order, onPress }) => {
  // Compute contextual label on the right side of bottom row
  const getRightContext = () => {
    switch (order.status) {
      case 'READY_TO_CLAIM':
        if (order.isClaimActive && order.claimRemainingSeconds) {
          const mins = Math.floor(order.claimRemainingSeconds / 60);
          const secs = String(order.claimRemainingSeconds % 60).padStart(2, '0');
          return (
            <Text className="text-xs font-bold text-[#059669]">
              Timer: {mins}:{secs}
            </Text>
          );
        }
        return null;

      case 'AWAITING_PARCEL':
        return (
          <Text className="text-xs font-medium text-[#D97706]">
            {order.courierPaid ? 'Parcel Arrived' : `COD: ₱${order.amountToPay.toLocaleString()}`}
          </Text>
        );

      case 'PAYMENT_REQUIRED':
        return (
          <Text className="text-xs font-bold text-[#D97706]">
            Due: ₱{order.amountToPay.toLocaleString()}
          </Text>
        );

      case 'CLAIMED':
        return (
          <Text className="text-xs text-[#64748B]">
            Claimed
          </Text>
        );

      default:
        return (
          <Text className="text-xs text-[#64748B]">
            ₱{order.amountToPay.toLocaleString()}
          </Text>
        );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(order)}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3 shadow-xs active:bg-slate-50"
    >
      {/* Top Row: Title & Status Badge */}
      <View className="flex-row items-center justify-between">
        <Text
          className="text-sm font-bold text-[#0F172A] flex-1 mr-2 font-mono"
          numberOfLines={1}
        >
          {order.id}
        </Text>
        <StaffBadge status={order.status} variant="card" />
      </View>

      {/* Divider */}
      <View className="h-px bg-[#F1F5F9] my-3" />

      {/* Bottom Row: Recipient & Context Info */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-[#475569] font-medium" numberOfLines={1}>
          {order.customer || 'Customer'}
        </Text>
        {getRightContext()}
      </View>
    </TouchableOpacity>
  );
};
