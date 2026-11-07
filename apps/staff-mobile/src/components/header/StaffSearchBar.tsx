import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from '../common/Icons';

interface StaffSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onClear: () => void;
  onOpenLookup?: () => void;
}

export const StaffSearchBar: React.FC<StaffSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
}) => {
  return (
    <View className="mt-2.5">
      <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-xs">
        <Search size={15} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search by tracking, order ID, or name..."
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 ml-2 text-xs text-[#0F172A] font-medium p-0"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            className="w-5 h-5 rounded-full bg-slate-100 items-center justify-center ml-1"
          >
            <X size={11} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
