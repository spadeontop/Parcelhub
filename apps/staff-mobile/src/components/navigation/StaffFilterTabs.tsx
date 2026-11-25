import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StaffTab, StaffBadgeCounts } from '../../types';

interface StaffFilterTabsProps {
  activeTab: StaffTab;
  badgeCounts: StaffBadgeCounts;
  onSelectTab: (tab: StaffTab) => void;
}

export const StaffFilterTabs: React.FC<StaffFilterTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: { key: StaffTab; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'ready', label: 'Ready to Claim' },
    { key: 'active', label: 'Awaiting Parcel' },
    { key: 'unpaid', label: 'Payment Required' },
    { key: 'claimed', label: 'Claimed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'refunded', label: 'Refunded' },
  ];

  return (
    <View className="py-1.5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.key)}
              className={`rounded-[14px] px-3.5 py-2 ${
                isSelected
                  ? 'bg-[#2563EB] shadow-xs'
                  : 'bg-white border border-[#E2E8F0]'
              }`}
            >
              <Text
                className={`text-[12px] font-bold text-center ${
                  isSelected ? 'text-white' : 'text-[#475569]'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
