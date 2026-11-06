import React from 'react';
import { View, Text } from 'react-native';
import { StaffOrder } from '../../../types';
import { StaffBadge } from '../../common/StaffBadge';
import { Barcode, Clock } from '../../common/Icons';

interface StaffOrderHeroBannerProps {
  order: StaffOrder;
}

export const StaffOrderHeroBanner: React.FC<StaffOrderHeroBannerProps> = ({ order }) => {
  return (
    <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-mono font-black text-white">{order.id}</Text>
          <StaffBadge status={order.status} variant="modal" />
        </View>
        <Text className="text-xs font-mono font-bold text-blue-400">
          ₱{(order.amountToPay || 0).toLocaleString()}
        </Text>
      </View>

      <View className="flex-row items-center justify-between pt-2 border-t border-slate-700/60">
        <View className="flex-row items-center gap-1.5">
          <Barcode size={14} color="#94a3b8" />
          <Text className="text-xs font-mono text-slate-300 font-mono-numbers">{order.trackingId}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color="#64748b" />
          <Text className="text-[11px] text-slate-400 font-medium">{order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</Text>
        </View>
      </View>
    </View>
  );
};
