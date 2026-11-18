import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X, QrCode } from '../common/Icons';

interface StaffSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onClear: () => void;
  onOpenLookup: () => void;
}

export const StaffSearchBar: React.FC<StaffSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
  onOpenLookup,
}) => {
  return (
    <View className="flex-row items-center gap-2.5 px-5 pt-4 pb-2">
      {/* Main Search Field */}
      <View className="flex-1 bg-white border border-[#E2E8F0] rounded-[16px] h-[40px] flex-row items-center px-3.5 shadow-xs">
        <Search size={16} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="order , tracking, waybill..."
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 ml-2 text-[12px] text-[#0F172A] p-0 font-normal"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-5 h-5 rounded-full bg-slate-100 items-center justify-center ml-1"
            accessibilityLabel="Clear search"
          >
            <X size={12} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Standalone QR Wing Button */}
      <TouchableOpacity
        onPress={onOpenLookup}
        activeOpacity={0.85}
        className="bg-[#0F172A] w-[40px] h-[40px] rounded-[16px] items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
        accessibilityRole="button"
        accessibilityLabel="Scan QR or enter waybill lookup"
      >
        <QrCode size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};
