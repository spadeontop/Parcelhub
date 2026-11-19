import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../../types';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { StaffActionButton, ButtonActionState } from '../../common/StaffActionButton';

export interface StaffUnpaidActionSectionProps {
  order: StaffOrder;
  isSubmitting: boolean;
  onActivate: (orderId: string, amount: number) => Promise<void>;
  onReturnHome: () => void;
}

export const StaffUnpaidActionSection: React.FC<StaffUnpaidActionSectionProps> = ({
  order,
  isSubmitting,
  onActivate,
  onReturnHome,
}) => {
  const fee = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const [cashText, setCashText] = useState<string>(
    typeof order.amountReceived === 'number' && order.amountReceived > 0
      ? String(order.amountReceived)
      : ''
  );
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [btnState, setBtnState] = useState<ButtonActionState>('idle');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [hasCardError, setHasCardError] = useState<boolean>(false);
  const [cardErrorMessage, setCardErrorMessage] = useState<string>('');
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setIsConfirmed(false);
    setIsLocked(false);
    setBtnState('idle');
    setAmountError(null);
    setHasCardError(false);
    setCardErrorMessage('');
    setCashText(
      typeof order.amountReceived === 'number' && order.amountReceived > 0
        ? String(order.amountReceived)
        : ''
    );
  }, [order.id, order.amountReceived]);

  const cashNum = parseFloat(cashText) || 0;
  const change = cashNum > 0 ? Math.max(0, cashNum - fee) : 0;
  const isSufficient = fee > 0 ? cashNum >= fee : cashNum > 0;

  // Feedback states following AuthInput.tsx
  const hasInput = cashText.trim().length > 0;
  const isError = Boolean(amountError) || (hasInput && !isSufficient);
  const isValid = hasInput && isSufficient;

  // Border & text colors: red on error (#EF4444), green on sufficient (#16A34A), blue on focus (#2563EB)
  const borderColor = isError
    ? '#EF4444'
    : isValid
    ? '#16A34A'
    : isInputFocused
    ? '#2563EB'
    : '#CBD5E1';

  const labelColor = isError
    ? '#DC2626'
    : isInputFocused
    ? '#2563EB'
    : '#64748B';

  const handleToggleConfirm = () => {
    if (isLocked || isSubmitting || btnState !== 'idle') return;
    setIsConfirmed((prev) => {
      const next = !prev;
      if (next) {
        setHasCardError(false);
        setCardErrorMessage('');
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isLocked || isSubmitting || btnState !== 'idle') return;

    // 1. Context-aware validation: check cash amount first
    if (!isSufficient) {
      const msg = fee > 0
        ? (cashText.trim().length === 0
            ? 'Please enter the amount received.'
            : `Amount is not enough. Minimum required is ₱${fee.toLocaleString()}.`)
        : 'Please enter a valid received amount.';
      setAmountError(msg);
      setHasCardError(false);
      setCardErrorMessage('');
      inputRef.current?.focus();
      return;
    }

    setAmountError(null);

    // 2. Context-aware validation: check confirmation checkbox
    if (!isConfirmed) {
      setHasCardError(true);
      setCardErrorMessage('Please check the confirmation box before submitting.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    // 3. Clear errors and proceed to loading & backend response
    setHasCardError(false);
    setCardErrorMessage('');
    setIsLocked(true);
    setBtnState('loading');

    try {
      await onActivate(order.id, cashNum);
      // Stay in success state until staff returns home or goes back
      setBtnState('success');
    } catch {
      setIsLocked(false);
      setBtnState('idle');
    }
  };

  const activeErrorMessage = amountError
    ? amountError
    : isError
    ? (fee > 0
        ? `Amount is not enough. Minimum required is ₱${fee.toLocaleString()}.`
        : 'Please enter a valid amount.')
    : null;

  return (
    <View className="gap-4">
      {/* Card: AMOUNT RECEIVED (Card_Amount_Received in Figma 1343:1662) */}
      <OrderCardContainer className="mb-4">
        <Text
          style={{ color: labelColor }}
          className="text-[11px] font-bold tracking-wider uppercase mb-2.5"
        >
          AMOUNT RECEIVED
        </Text>

        {/* Currency Input Field with interactive feedback */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (btnState === 'idle' && !isLocked) {
              inputRef.current?.focus();
            }
          }}
          style={{
            borderColor,
            backgroundColor: isError ? '#FFF9F9' : '#FFFFFF',
            borderWidth: isInputFocused ? 2 : 1,
            opacity: btnState === 'success' ? 0.6 : 1,
          }}
          className="rounded-xl px-4 py-2.5 flex-row items-center justify-between"
        >
          <Text
            style={{ color: isError ? '#DC2626' : '#64748B' }}
            className="text-[18px] font-bold"
          >
            ₱
          </Text>
          <TextInput
            ref={inputRef}
            value={cashText}
            editable={btnState === 'idle' && !isLocked}
            onChangeText={(txt) => {
              setCashText(txt);
              if (amountError) setAmountError(null);
              if (hasCardError) {
                setHasCardError(false);
                setCardErrorMessage('');
              }
            }}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', padding: 0 }}
            className="flex-1 text-right text-[18px] font-bold text-[#0F172A]"
          />
        </TouchableOpacity>

        {/* Error Feedback Message matching AuthInput.tsx */}
        {activeErrorMessage ? (
          <View style={{ marginTop: 4, marginLeft: 4, marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 11,
                color: '#DC2626',
                fontWeight: '500',
              }}
            >
              {activeErrorMessage}
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 12 }} />
        )}

        {/* Horizontal Divider */}
        <View className="h-px bg-[#F1F5F9] my-2" />

        {/* Two Columns: Amount to Pay & Change with vertical divider */}
        <View className="flex-row items-center justify-between py-2">
          {/* Amount to Pay Column */}
          <View className="flex-1">
            <Text className="text-[12px] font-normal text-[#64748B]">
              Amount to Pay
            </Text>
            <Text className="text-[18px] font-bold text-[#0F172A] mt-0.5">
              ₱{fee.toLocaleString()}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View className="w-px h-9 bg-[#F1F5F9] mx-4" />

          {/* Change Column */}
          <View className="flex-1 items-end">
            <Text className="text-[12px] font-normal text-[#64748B]">
              Change
            </Text>
            <Text className="text-[18px] font-bold text-[#2563EB] mt-0.5">
              ₱{change.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Change Policy Disclaimer */}
        <Text className="text-[12px] font-normal text-[#64748B] mt-2 leading-[18px]">
          Change is only given alongside the order parcel&apos;s receiving.
        </Text>
      </OrderCardContainer>

      {/* Confirmation Card with Shake & Inline Error (Reference: button uncheck feedback.html) */}
      <OrderConfirmationCard
        checked={isConfirmed}
        onToggle={handleToggleConfirm}
        title={
          cashNum > 0
            ? `I confirm that I received exactly ₱${cashNum.toLocaleString()}`
            : 'I confirm that I received the payment'
        }
        subtitle="Only activate the order if you received the exact or more compared to the specified amount."
        disabled={isLocked || isSubmitting || btnState !== 'idle'}
        hasError={hasCardError}
        errorMessage={cardErrorMessage}
        shakeTrigger={shakeTrigger}
      />

      {/* Action Buttons: State-driven Action Button & Return to Home */}
      <View className="mt-3">
        <StaffActionButton
          state={btnState}
          idleLabel="Activate Order"
          loadingLabel="Activating..."
          successLabel="✓ Order Activated"
          onPress={handleSubmit}
          disabled={false}
        />

        {/* Return to Home Secondary Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          disabled={btnState === 'loading'}
          className="w-full py-3 items-center justify-center mt-2"
        >
          <Text className="text-[13px] font-bold text-[#475569]">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
