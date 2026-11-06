import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../types';
import { StaffBadge } from '../common/StaffBadge';
import { Barcode, User, ChevronRight, Clock, AlertCircle } from '../common/Icons';

interface StaffOrderCardProps {
  order: StaffOrder;
  onPress: (order: StaffOrder) => void;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = ({ order, onPress }) => {
  const isUnpaid = order.status === 'PAYMENT_REQUIRED';
  const displayAmount = isUnpaid
    ? `Fee: ₱${(order.amountToPay || 0).toLocaleString()}`
    : `COD: ₱${(order.amountToPay || 0).toLocaleString()}`;

  const hasClaimCountdown = order.status === 'READY_TO_CLAIM' && order.isClaimActive;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(order)}
      className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 mb-2.5 shadow-sm active:border-blue-500/70"
    >
      {/* Top Row: Badge, ID, Amount */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <StaffBadge status={order.status} variant="card" />
          <Text className="text-xs font-mono font-bold text-slate-300">{order.id}</Text>
        </View>
        <Text className="text-xs font-mono font-bold text-white font-mono-numbers">{displayAmount}</Text>
      </View>

      {/* Middle Row: Product Title & Active Claim Banner */}
      <View className="mb-2">
        <Text className="text-white font-bold text-sm leading-snug" numberOfLines={1}>
          {order.productName || 'General Parcel Item'}
        </Text>

        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-1.5">
            <Barcode size={13} color="#60a5fa" />
            <Text className="text-[11px] font-mono text-blue-400 font-mono-numbers">{order.trackingId}</Text>
          </View>

          {hasClaimCountdown && (
            <View className="flex-row items-center gap-1 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
              <Clock size={11} color="#34d399" />
              <Text className="text-[10px] font-mono font-bold text-emerald-400">
                Pass Active: {Math.floor((order.claimRemainingSeconds || 0) / 60)}:
                {String((order.claimRemainingSeconds || 0) % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Notes preview if present */}
      {order.notes ? (
        <View className="bg-amber-950/40 border border-amber-900/40 rounded-lg px-2 py-1 mb-2 flex-row items-center gap-1">
          <AlertCircle size={11} color="#f59e0b" />
          <Text className="text-[10px] text-amber-300 font-medium truncate flex-1" numberOfLines={1}>
            {order.notes}
          </Text>
        </View>
      ) : null}

      {/* Bottom Row: Recipient & Drilldown affordance */}
      <View className="flex-row items-center justify-between pt-2 border-t border-slate-700/50">
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          <User size={13} color="#94a3b8" />
          <Text className="text-[11px] text-slate-300 font-medium" numberOfLines={1}>
            {order.customer}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="text-[11px] font-semibold text-blue-400">Manage</Text>
          <ChevronRight size={13} color="#60a5fa" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
