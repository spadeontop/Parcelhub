import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { X, Barcode, Search } from '../common/Icons';
import { StaffOrder } from '../../types';

interface StaffManualLookupModalProps {
  isOpen: boolean;
  orders: StaffOrder[];
  onClose: () => void;
  onSelectOrder: (order: StaffOrder) => void;
  onNotFound: (query: string) => void;
}

export const StaffManualLookupModal: React.FC<StaffManualLookupModalProps> = ({
  isOpen,
  orders,
  onClose,
  onSelectOrder,
  onNotFound,
}) => {
  const [lookupText, setLookupText] = useState<string>('');

  const handleLookup = () => {
    const q = lookupText.trim().toLowerCase();
    if (!q) return;

    const matched = orders.find((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingId.toLowerCase();
      return id === q || track === q || id.includes(q) || track.includes(q);
    });

    if (matched) {
      onSelectOrder(matched);
      onClose();
      setLookupText('');
    } else {
      onNotFound(lookupText.trim());
    }
  };

  const handleQuickLookup = (code: string) => {
    setLookupText(code);
    const matched = orders.find((o) => o.trackingId === code || o.id === code);
    if (matched) {
      onSelectOrder(matched);
      onClose();
      setLookupText('');
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-center px-4">
        <View className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Barcode size={18} color="#60a5fa" />
              <Text className="text-white font-bold text-sm">Manual Barcode / ID Lookup</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-400 mb-3">
            Enter tracking number or Order ID to directly jump to parcel management.
          </Text>

          <View className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 flex-row items-center mb-4">
            <Search size={16} color="#64748b" />
            <TextInput
              value={lookupText}
              onChangeText={setLookupText}
              placeholder="e.g. PH2696153366792H or ORD-402"
              placeholderTextColor="#64748b"
              className="flex-1 ml-2 text-white font-mono text-xs py-1"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLookup}
            />
          </View>

          {/* Quick presets */}
          <View className="mb-4">
            <Text className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
              Sample Quick Lookup Codes
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => handleQuickLookup('PH2696153366792H')}
                className="bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg active:bg-slate-700"
              >
                <Text className="text-[10px] font-mono text-blue-400">PH2696153366792H</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLookup('PH90823411293K')}
                className="bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg active:bg-slate-700"
              >
                <Text className="text-[10px] font-mono text-blue-400">PH90823411293K</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickLookup('PH883904421101N')}
                className="bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg active:bg-slate-700"
              >
                <Text className="text-[10px] font-mono text-blue-400">PH883904421101N</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-slate-800 py-2.5 rounded-xl items-center"
            >
              <Text className="text-slate-300 font-semibold text-xs">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLookup}
              className="flex-1 bg-blue-600 active:bg-blue-700 py-2.5 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Find Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
