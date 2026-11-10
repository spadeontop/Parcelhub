import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StaffOrder } from '../../../types';
import { Copy, Check } from '../../common/Icons';

interface StaffOrderOverviewCardProps {
  order: StaffOrder;
  showFinancials?: boolean;
}

export const StaffOrderOverviewCard: React.FC<StaffOrderOverviewCardProps> = ({
  order,
  showFinancials = true,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!order.trackingId) return;
    await Clipboard.setStringAsync(order.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paidAmount = order.amountReceived ?? (order.amountToPay + (order.change || 0));
  const price = order.amountToPay;
  const change = order.change || 0;

  return (
    <View className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 shadow-xs">
      <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
        ORDER OVERVIEW
      </Text>

      {/* Order ID */}
      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-xs text-[#64748B] font-medium">Order ID</Text>
        <Text className="text-xs font-bold text-[#0F172A] font-mono">
          {order.id}
        </Text>
      </View>

      {/* Recipient */}
      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-xs text-[#64748B] font-medium">Recipient</Text>
        <Text className="text-xs font-semibold text-[#0F172A]">
          {order.customer}
        </Text>
      </View>

      {/* Tracking Number with Copy Action */}
      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-xs text-[#64748B] font-medium">Tracking Number</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCopy}
          className="flex-row items-center gap-1.5 bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]/60 active:bg-slate-200"
        >
          <Text className="text-[11px] font-mono font-bold text-[#0F172A]">
            {order.trackingId || 'N/A'}
          </Text>
          {copied ? (
            <Check size={12} color="#059669" />
          ) : (
            <Copy size={12} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Paid Amount / Price / Change */}
      {showFinancials && (
        <>
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-xs text-[#64748B] font-medium">Paid Amount</Text>
            <Text className="text-xs font-bold text-[#0F172A]">
              ₱{(paidAmount || 0).toLocaleString()}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-1.5 border-b border-[#F8FAFC]">
            <Text className="text-xs text-[#64748B] font-medium">Price</Text>
            <Text className="text-xs font-bold text-[#0F172A]">
              ₱{(price || 0).toLocaleString()}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-xs text-[#64748B] font-medium">Change</Text>
            <Text className="text-xs font-bold text-[#0F172A]">
              ₱{(change || 0).toLocaleString()}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};
