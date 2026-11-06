import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Search, X, Barcode } from '../common/Icons';

interface StaffSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onOpenLookup: () => void;
  onClear: () => void;
}

export const StaffSearchBar: React.FC<StaffSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenLookup,
  onClear,
}) => {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 flex-row items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 focus:border-blue-500">
        <Search size={16} color="#94a3b8" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search ID, Tracking #, or Customer..."
          placeholderTextColor="#64748b"
          className="flex-1 ml-2 text-white text-xs py-1"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClear} className="p-1">
            <X size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={onOpenLookup}
        className="flex-row items-center gap-1.5 bg-blue-600/20 border border-blue-500/40 px-3 py-2 rounded-xl active:bg-blue-600/30"
        accessibilityLabel="Manual Tracking Lookup"
      >
        <Barcode size={15} color="#60a5fa" />
        <Text className="text-blue-400 font-semibold text-xs">Lookup</Text>
      </TouchableOpacity>
    </View>
  );
};
