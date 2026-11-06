import React from 'react';
import { View, Text } from 'react-native';
import { StaffOrder } from '../../../types';
import { Package, User, Truck, Info } from '../../common/Icons';

interface StaffParcelInfoSectionProps {
  order: StaffOrder;
}

export const StaffParcelInfoSection: React.FC<StaffParcelInfoSectionProps> = ({ order }) => {
  return (
    <View className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-3 space-y-3">
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Parcel & Recipient Details
      </Text>

      <View className="flex-row items-start gap-2.5">
        <Package size={15} color="#60a5fa" className="mt-0.5" />
        <View className="flex-1">
          <Text className="text-[11px] text-slate-400">Product / Package</Text>
          <Text className="text-xs font-bold text-white">{order.productName || 'General Goods Parcel'}</Text>
        </View>
      </View>

      <View className="flex-row items-start gap-2.5">
        <User size={15} color="#60a5fa" className="mt-0.5" />
        <View className="flex-1">
          <Text className="text-[11px] text-slate-400">Customer / Recipient</Text>
          <Text className="text-xs font-bold text-white">{order.customer}</Text>
        </View>
      </View>

      <View className="flex-row items-start gap-2.5">
        <Truck size={15} color="#60a5fa" className="mt-0.5" />
        <View className="flex-1">
          <Text className="text-[11px] text-slate-400">Hub Location</Text>
          <Text className="text-xs font-medium text-slate-300">Lily's Catering Hub • Yati, Liloan, Cebu</Text>
        </View>
      </View>
    </View>
  );
};
