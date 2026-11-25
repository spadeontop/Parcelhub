import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export const UNPAID_CANCELLATION_REASONS = [
  'Changed my mind',
  'Ordered wrong item or details',
  'Will pay / reorder later',
  'Hub location too far',
] as const;

interface UnpaidCancelOrderViewProps {
  readonly productName: string;
  readonly selectedReason: string;
  readonly notes: string;
  readonly onSelectReason: (reason: string) => void;
  readonly onChangeNotes: (text: string) => void;
  readonly onConfirmCancel: () => void;
  readonly onKeepOrder: () => void;
  readonly isLoading?: boolean;
}

/**
 * Unpaid (PAYMENT_REQUIRED) order cancellation form.
 * UI-only flow for voiding an order prior to payment.
 */
export const UnpaidCancelOrderView: React.FC<UnpaidCancelOrderViewProps> = ({
  productName,
  selectedReason,
  notes,
  onSelectReason,
  onChangeNotes,
  onConfirmCancel,
  onKeepOrder,
  isLoading = false,
}) => {
  return (
    <ScrollView
      className="flex-1 px-[18px]"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 4, gap: 14 }}
    >
      {/* Order Summary Card */}
      <View
        className="bg-white rounded-[20px] px-5 pt-[19px] pb-5 gap-[13px]"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px]">
          ORDER SUMMARY
        </Text>

        <View className="flex-row items-center justify-between pt-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Product</Text>
          <Text
            className="text-[13.5px] font-semibold text-[#0f172a] text-right flex-1 ml-4"
            numberOfLines={1}
          >
            {productName}
          </Text>
        </View>

        <View className="flex-row items-center justify-between pb-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Payment Status</Text>
          <View className="bg-[#fef3c7] border border-[#fde68a] rounded-full px-[10px] py-[4px]">
            <Text className="text-[12px] font-bold text-[#b45309]">Unpaid</Text>
          </View>
        </View>

        <View className="h-px bg-[#f1f5f9] w-full" />

        <View className="flex-row items-center justify-between pt-px">
          <Text className="text-[13.5px] font-medium text-[#64748b]">Paid Amount</Text>
          <Text className="text-[13.5px] font-semibold text-[#0f172a] text-right">
            No payment collected
          </Text>
        </View>
      </View>

      {/* Reason Selection & Additional Notes Card */}
      <View
        className="bg-white rounded-[20px] px-5 pt-[19px] pb-[26px] gap-2"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px]">
          SELECT CANCELLATION REASON
        </Text>

        <View className="gap-[10px] pt-[6px]">
          {UNPAID_CANCELLATION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                activeOpacity={0.75}
                onPress={() => onSelectReason(reason)}
                className={`flex-row items-center justify-between px-[14px] py-[13px] rounded-[12px] border ${
                  isSelected
                    ? 'bg-[#eff6ff] border-[#2563eb]'
                    : 'bg-white border-[#e2e8f0]'
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold flex-1 pr-3 ${
                    isSelected ? 'text-[#1d4ed8]' : 'text-[#1e293b]'
                  }`}
                >
                  {reason}
                </Text>
                <View
                  className={`w-[18px] h-[18px] rounded-full border-2 items-center justify-center ${
                    isSelected ? 'border-[#2563eb]' : 'border-[#cbd5e1]'
                  }`}
                >
                  {isSelected && (
                    <View className="w-[9px] h-[9px] rounded-full bg-[#2563eb]" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.66px] pt-[7px]">
          ADDITIONAL NOTES (OPTIONAL)
        </Text>

        <TextInput
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="Write any extra details (optional)..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-3 min-h-[76px] text-[12.5px] text-[#0f172a]"
        />
      </View>

      {/* Bottom Actions */}
      <View className="gap-3 pt-2 items-center">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isLoading}
          onPress={onConfirmCancel}
          className={`w-full rounded-[14px] p-[15px] flex-row items-center justify-center gap-2 ${
            isLoading ? 'bg-[#fca5a5]' : 'bg-[#ef4444]'
          }`}
          style={{
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text className="text-[14px] font-bold text-white text-center">
            {isLoading ? 'Cancelling Order...' : 'Confirm Cancellation'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isLoading}
          onPress={onKeepOrder}
          className="px-3 pt-[3px] pb-[4px] rounded-[8px] items-center justify-center"
        >
          <Text className="text-[13.5px] font-semibold text-[#475569] text-center">
            Keep Order
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
