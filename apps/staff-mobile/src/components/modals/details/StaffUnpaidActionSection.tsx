import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { DollarSign, CheckCircle } from '../../common/Icons';

interface StaffUnpaidActionSectionProps {
  order: StaffOrder;
  isSubmitting: boolean;
  onActivate: (orderId: string, amount: number) => Promise<void>;
}

export const StaffUnpaidActionSection: React.FC<StaffUnpaidActionSectionProps> = ({
  order,
  isSubmitting,
  onActivate,
}) => {
  const fee = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const [cashText, setCashText] = useState<string>('');

  const cashNum = parseFloat(cashText) || 0;
  const change = Math.max(0, cashNum - fee);
  const isSufficient = fee > 0 ? cashNum >= fee : (cashText.trim().length > 0 && cashNum >= 0);

  const handleQuickAdd = (add: number) => {
    const current = parseFloat(cashText) || 0;
    setCashText(String(current + add));
  };

  const handleExact = () => {
    setCashText(String(fee));
  };

  const handleSubmit = async () => {
    if (!isSufficient || isSubmitting) return;
    await onActivate(order.id, cashNum);
  };

  return (
    <View className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 mb-3 space-y-3">
      <View className="flex-row items-center gap-2">
        <DollarSign size={16} color="#f43f5e" />
        <Text className="text-xs font-bold text-rose-400 uppercase tracking-wider">
          Counter Payment Collection
        </Text>
      </View>

      <Text className="text-xs text-slate-300">
        Customer is required to deposit the COD / processing fee before parcel intake is activated.
      </Text>

      {/* Cash Input */}
      <View className="bg-slate-900 border border-slate-700/80 rounded-xl p-3">
        <Text className="text-[11px] text-slate-400 mb-1">Enter Cash Received from Customer</Text>
        <View className="flex-row items-center">
          <Text className="text-lg font-mono font-bold text-slate-300 mr-2">₱</Text>
          <TextInput
            value={cashText}
            onChangeText={setCashText}
            keyboardType="numeric"
            placeholder={String(fee)}
            placeholderTextColor="#64748b"
            className="flex-1 text-lg font-mono font-bold text-white py-1"
          />
        </View>
      </View>

      {/* Quick Denomination Shortcuts */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleExact}
          className="flex-1 bg-slate-800 border border-slate-700 py-1.5 rounded-lg items-center active:bg-slate-700"
        >
          <Text className="text-xs font-mono font-semibold text-slate-300">Exact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickAdd(100)}
          className="flex-1 bg-slate-800 border border-slate-700 py-1.5 rounded-lg items-center active:bg-slate-700"
        >
          <Text className="text-xs font-mono font-semibold text-slate-300">+₱100</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickAdd(500)}
          className="flex-1 bg-slate-800 border border-slate-700 py-1.5 rounded-lg items-center active:bg-slate-700"
        >
          <Text className="text-xs font-mono font-semibold text-slate-300">+₱500</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleQuickAdd(1000)}
          className="flex-1 bg-slate-800 border border-slate-700 py-1.5 rounded-lg items-center active:bg-slate-700"
        >
          <Text className="text-xs font-mono font-semibold text-slate-300">+₱1,000</Text>
        </TouchableOpacity>
      </View>

      {/* Change Calculation Box */}
      {cashNum > 0 && (
        <View className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex-row justify-between items-center">
          <Text className="text-xs text-slate-400">Calculated Change</Text>
          <Text className={`text-sm font-mono font-black ${isSufficient ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSufficient ? `₱${change.toLocaleString()}` : `Insufficient Cash (Need ₱${(fee - cashNum).toLocaleString()} more)`}
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isSufficient || isSubmitting}
        className={`py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${
          isSufficient && !isSubmitting
            ? 'bg-rose-600 active:bg-rose-700'
            : 'bg-slate-800 opacity-50'
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <CheckCircle size={16} color="#ffffff" />
            <Text className="text-white font-bold text-xs uppercase tracking-wider">
              Collect Payment & Activate Order
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
