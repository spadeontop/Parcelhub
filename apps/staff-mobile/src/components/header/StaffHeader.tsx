import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { ChevronDown } from '../common/Icons';
import { ParcelHubLogo } from '../auth/ParcelHubLogo';

interface StaffHeaderProps {
  onOpenAccount: () => void;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ onOpenAccount }) => {
  const { staffUser } = useStaff();

  const staffName = staffUser?.name || 'John Doe';
  const staffId = staffUser?.id || 'STF-1991';
  const hubName = staffUser?.hubName || "LILY'S CATERING HUB";

  return (
    <View
      style={{ minHeight: 80 }}
      className="bg-black px-5 pt-5 pb-7 flex-row items-center justify-between"
    >
      {/* Brand Identity: Logo + Hub Name */}
      <View className="flex-row items-center gap-2.5">
        <ParcelHubLogo size={36} />
        <View>
          <Text className="text-[18px] font-bold text-white tracking-tight leading-5">
            ParcelHub
          </Text>
          <Text className="text-[11px] font-bold text-[#DBEAFE] tracking-wider uppercase mt-0.5">
            {hubName}
          </Text>
        </View>
      </View>

      {/* Staff account — signed in button */}
      <TouchableOpacity
        onPress={onOpenAccount}
        activeOpacity={0.8}
        className="bg-[#151A23] border border-[#303846] rounded-[12px] px-3 py-1.5 flex-row items-center gap-2"
        accessibilityRole="button"
        accessibilityLabel={`Signed in as ${staffName}, ${staffId}. Open account menu`}
      >
        {/* Status dot (green online) */}
        <View className="w-[7px] h-[7px] rounded-full bg-[#10B981]" />

        {/* Staff details */}
        <View className="items-start">
          <Text
            className="text-[11px] font-semibold text-white leading-tight max-w-[80px]"
            numberOfLines={1}
          >
            {staffName}
          </Text>
          <Text className="text-[9px] font-normal text-[#B8C4D4] leading-tight">
            {staffId}
          </Text>
        </View>

        {/* Dropdown indicator */}
        <ChevronDown size={14} color="#B8C4D4" />
      </TouchableOpacity>
    </View>
  );
};
