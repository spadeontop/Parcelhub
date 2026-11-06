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
    <View className="bg-slate-900 border-b border-slate-800/80 px-2 py-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 6 }}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              className={`flex-row items-center gap-2 px-3.5 py-1.5 rounded-xl border ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500/60'
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
              <View
                className={`px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-blue-500/30'
                    : 'bg-slate-700/60'
                }`}
              >
                <Text
                  className={`text-[10px] font-mono font-bold ${
                    isSelected ? 'text-blue-300' : 'text-slate-400'
                  }`}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
