import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../../types';
import { CheckCircle } from '../../common/Icons';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
}

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = ({
  order,
  onReturnHome,
}) => {
  return (
    <View className="space-y-4">
      {/* Card 2: CLAIM SUMMARY */}
      <View className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 shadow-xs">
        <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase mb-3">
          CLAIM STATUS
        </Text>

        <View className="flex-row items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-2">
          <CheckCircle size={22} color="#059669" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-emerald-900">
              Parcel Claimed Successfully
            </Text>
            <Text className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              This order has been released and finalized at the counter.
            </Text>
          </View>
        </View>

        {order.courierPaid && (
          <View className="flex-row items-center justify-between py-1.5 mt-2 border-t border-[#F8FAFC]">
            <Text className="text-xs text-[#64748B]">Courier Settlement</Text>
            <Text className="text-xs font-semibold text-[#059669]">Paid & Settled</Text>
          </View>
        )}
      </View>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onReturnHome}
        className="w-full bg-[#215CD4] active:bg-[#1d4ed8] py-4 rounded-xl items-center justify-center shadow-md mb-2"
      >
        <Text className="text-white font-bold text-sm">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
