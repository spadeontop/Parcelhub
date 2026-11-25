import React, { useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatPeso } from '../../utils/currency';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { FieldError } from '../common/FieldError';
import {
  OrderAmountRow,
  OrderDetailRow,
  OrderProductBlock,
  OrderSectionCard,
} from './OrderDetailPrimitives';

export const CANCELLATION_REASONS = [
  'Changed my mind',
  'Ordered wrong item or variant',
  'Hub waiting time is too long',
  'Found a better alternative',
] as const;

interface CancelOrderViewProps {
  readonly productName: string;
  readonly hubName: string;
  readonly refundableAmount: number;
  readonly selectedReason: string | null;
  readonly onSelectReason: (reason: string) => void;
  readonly additionalNotes: string;
  readonly onChangeNotes: (notes: string) => void;
  readonly isConfirmed: boolean;
  readonly onConfirmedChange: (checked: boolean) => void;
  readonly onInitiateRefund: () => void;
  readonly onKeepOrder: () => void;
  readonly isLoading?: boolean;
  readonly slideAnim: Animated.Value;
  readonly fadeAnim: Animated.Value;
}

/**
 * Cancel Order form for AWAITING_PARCEL orders, featuring item summary,
 * required cancellation reason selection, optional notes, and policy confirmation.
 */
export const CancelOrderView: React.FC<CancelOrderViewProps> = ({
  productName,
  hubName,
  refundableAmount,
  selectedReason,
  onSelectReason,
  additionalNotes,
  onChangeNotes,
  isConfirmed,
  onConfirmedChange,
  onInitiateRefund,
  onKeepOrder,
  isLoading = false,
  slideAnim,
  fadeAnim,
}) => {
  const [reasonError, setReasonError] = useState<string | null>(null);

  const handleSelectReason = (reason: string) => {
    onSelectReason(reason);
    if (reasonError) {
      setReasonError(null);
    }
  };

  const handleValidate = () => {
    if (!selectedReason) {
      setReasonError('Please select a cancellation reason.');
      return false;
    }
    setReasonError(null);
    return true;
  };

  const formattedAmount = formatPeso(refundableAmount);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Item Summary Card */}
        <OrderSectionCard title="ITEM TO CANCEL">
          <OrderProductBlock productName={productName} />

          <View className="pt-3.5 gap-3">
            <OrderDetailRow label="Hub Location" value={hubName} />
            <OrderAmountRow
              label="Refundable Amount"
              value={formattedAmount}
              emphasized
              withTopDivider
            />
          </View>
        </OrderSectionCard>

        {/* Reason Selection Card */}
        <View
          className={`bg-white rounded-[16px] p-[17px] mb-3.5 border ${
            reasonError ? 'border-[#fecaca]' : 'border-[#f1f5f9]'
          }`}
          style={{
            shadowColor: '#111827',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mb-3">
            SELECT CANCELLATION REASON
          </Text>

          <View className="gap-2.5">
            {CANCELLATION_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.75}
                  onPress={() => handleSelectReason(reason)}
                  className={`flex-row items-center justify-between px-3.5 py-3 rounded-[12px] border ${
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
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#2563eb',
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {reasonError ? <FieldError message={reasonError} /> : null}

          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mt-4 mb-2">
            ADDITIONAL NOTES (OPTIONAL)
          </Text>

          <TextInput
            value={additionalNotes}
            onChangeText={onChangeNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Write any extra details for the hub or seller..."
            placeholderTextColor="#94a3b8"
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-3 text-[12.5px] text-[#0f172a] min-h-[76px]"
          />
        </View>

        {/* Confirmation & Actions */}
        <View className="pt-1 gap-3">
          <ConfirmationSubmitSection
            title="I confirm that these order details are correct"
            subtitle={`Since your parcel is still in Awaiting status, cancelling will make your ${formattedAmount} refund available to claim at the hub counter.`}
            buttonLabel="Confirm Cancellation"
            errorMessage="Please check the confirmation box before cancelling order."
            isChecked={isConfirmed}
            onCheckedChange={onConfirmedChange}
            onValidate={handleValidate}
            onSubmit={onInitiateRefund}
            isLoading={isLoading}
            themeColor="#2563eb"
            buttonColor="#ef4444"
          />

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isLoading}
            onPress={onKeepOrder}
            className="items-center justify-center py-2"
          >
            <Text className="text-[13.5px] font-semibold text-[#475569] text-center">
              Keep Order
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default CancelOrderView;
