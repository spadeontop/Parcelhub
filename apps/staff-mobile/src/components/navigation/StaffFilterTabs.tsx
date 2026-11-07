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
  badgeCounts,
  onSelectTab,
}) => {
  const tabs: { key: StaffTab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: badgeCounts.active },
    { key: 'ready', label: 'Ready', count: badgeCounts.ready },
    { key: 'unpaid', label: 'Unpaid', count: badgeCounts.unpaid },
    { key: 'claimed', label: 'Claimed', count: badgeCounts.claimed },
  ];

  return (
    <View className="px-5 my-2">
      <View className="bg-[#F1F5F9] rounded-xl p-1 flex-row items-center">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center py-2 px-1 rounded-lg ${
                isSelected ? 'bg-white shadow-xs' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected ? 'text-[#0F172A] font-bold' : 'text-[#64748B]'
                }`}
              >
                {tab.label}
              </Text>

              {/* Badge Counter matching home.png */}
              <View
                className={`ml-1.5 px-1.5 py-0.2 rounded-full min-w-[18px] items-center justify-center ${
                  isSelected
                    ? 'bg-[#DBEAFE]'
                    : tab.key === 'active'
                    ? 'bg-[#1E1E1E]'
                    : 'bg-[#E2E8F0]'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isSelected
                      ? 'text-[#215CD4]'
                      : tab.key === 'active'
                      ? 'text-white'
                      : 'text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
