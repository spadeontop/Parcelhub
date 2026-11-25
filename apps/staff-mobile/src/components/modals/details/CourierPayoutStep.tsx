import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { StaffActionButton, ButtonActionState } from '../../common/StaffActionButton';

interface CourierPayoutStepProps {
  orderId: string;
  isPayingCourier: boolean;
  onPayCourier: (orderId: string) => Promise<void>;
  onPaidSuccess: () => void;
  onReturnHome: () => void;
}

export const CourierPayoutStep: React.FC<CourierPayoutStepProps> = ({
  orderId,
  isPayingCourier,
  onPayCourier,
  onPaidSuccess,
  onReturnHome,
}) => {
  const [isReceivedConfirmed, setIsReceivedConfirmed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [btnState, setBtnState] = useState<ButtonActionState>('idle');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);

  useEffect(() => {
    setIsReceivedConfirmed(false);
    setIsLocked(false);
    setBtnState('idle');
    setHasError(false);
    setErrorMessage('');
  }, [orderId]);

  const handleToggleConfirm = () => {
    if (isLocked || isPayingCourier || btnState !== 'idle') return;
    setIsReceivedConfirmed((prev) => {
      const next = !prev;
      if (next) {
        setHasError(false);
        setErrorMessage('');
      }
      return next;
    });
  };

  const handlePayCourierStep = async () => {
    if (isLocked || isPayingCourier || btnState !== 'idle') return;

    if (!isReceivedConfirmed) {
      setHasError(true);
      setErrorMessage('Please check the confirmation box before submitting.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    setHasError(false);
    setErrorMessage('');
    setIsLocked(true);
    setBtnState('loading');

    try {
      await onPayCourier(orderId);
      onPaidSuccess();
    } catch (err: any) {
      setIsLocked(false);
      setBtnState('idle');
      Alert.alert(
        'Payout Failed',
        err?.message || 'Unable to record courier payout. Please try again.'
      );
    }
  };

  return (
    <>
      <OrderConfirmationCard
        checked={isReceivedConfirmed}
        onToggle={handleToggleConfirm}
        disabled={isLocked || isPayingCourier || btnState !== 'idle'}
        title="I confirm that I received the order"
        subtitle="Only confirm after paying the courier the exact amount and receiving the parcel."
        hasError={hasError}
        errorMessage={errorMessage}
        shakeTrigger={shakeTrigger}
      />

      <View className="mt-2 mb-2">
        <StaffActionButton
          state={btnState}
          idleLabel="Order Claimed & Paid"
          loadingLabel="Recording Payout..."
          successLabel="Courier Paid"
          onPress={handlePayCourierStep}
          disabled={false}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        disabled={btnState === 'loading'}
        className="w-full py-2.5 items-center justify-center mt-1"
      >
        <Text className="text-[13px] font-bold text-[#475569]">Return to Home</Text>
      </TouchableOpacity>
    </>
  );
};
