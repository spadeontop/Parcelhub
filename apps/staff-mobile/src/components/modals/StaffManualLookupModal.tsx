import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, QrCode, Search, Check } from '../common/Icons';
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
      <View className="flex-1 bg-black/50 justify-center px-5">
        <View className="bg-white rounded-3xl p-6 shadow-xl border border-[#E2E8F0]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-[#DBEAFE] items-center justify-center">
                <QrCode size={18} color="#215CD4" />
              </View>
              <Text className="text-sm font-bold text-[#0F172A]">
                Scan & Manual Lookup
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-[#F1F5F9] items-center justify-center"
            >
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-[#64748B] mb-3">
            Enter tracking barcode or order ID to instantly open details:
          </Text>

          {/* Input field */}
          <View className="flex-row items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 mb-3">
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={lookupText}
              onChangeText={setLookupText}
              placeholder="e.g. PH2696153366792H or ORD-392"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              autoCorrect={false}
              className="flex-1 ml-2 text-xs font-mono font-bold text-[#0F172A] p-0"
            />
            {lookupText.length > 0 && (
              <TouchableOpacity onPress={() => setLookupText('')}>
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLookup}
            disabled={!lookupText.trim()}
            className={`py-3.5 rounded-xl items-center justify-center shadow-xs mb-3 ${
              lookupText.trim()
                ? 'bg-[#215CD4] active:bg-[#1d4ed8]'
                : 'bg-[#94A3B8]'
            }`}
          >
            <Text className="text-white font-bold text-xs">
              Lookup & Open Details
            </Text>
          </TouchableOpacity>

          {/* Quick Click Suggestions */}
          {orders.length > 0 && (
            <View className="mt-2 border-t border-[#F1F5F9] pt-3">
              <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                Recent Queue Parcels
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {orders.slice(0, 4).map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    onPress={() => handleQuickLookup(o.id)}
                    className="bg-[#F1F5F9] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] active:bg-slate-200"
                  >
                    <Text className="text-[11px] font-mono font-semibold text-[#0F172A]">
                      {o.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
