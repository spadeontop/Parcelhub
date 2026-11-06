import React from 'react';
import { View, Text, Image } from 'react-native';
import { StaffOrder } from '../../../types';
import { CheckCircle, ShieldCheck, Camera } from '../../common/Icons';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
}

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = ({ order }) => {
  return (
    <View className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-3 space-y-3">
      <View className="flex-row items-center gap-2">
        <ShieldCheck size={18} color="#34d399" />
        <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          Completed Parcel Handover
        </Text>
      </View>

      <View className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">Handover Status</Text>
          <View className="flex-row items-center gap-1.5">
            <CheckCircle size={13} color="#34d399" />
            <Text className="text-xs font-bold text-white">Successfully Released</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">Recipient</Text>
          <Text className="text-xs font-bold text-slate-200">{order.customer}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">Total Settled</Text>
          <Text className="text-xs font-mono font-bold text-emerald-400">₱{(order.amountToPay || 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Proof Photo thumbnail if available */}
      {order.proofImageUrl && (
        <View className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1.5">
          <View className="flex-row items-center gap-1.5">
            <Camera size={13} color="#94a3b8" />
            <Text className="text-[11px] font-semibold text-slate-300">Intake Proof Image</Text>
          </View>
          <Image
            source={{ uri: order.proofImageUrl }}
            className="w-full h-32 rounded-lg bg-slate-950"
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
};
