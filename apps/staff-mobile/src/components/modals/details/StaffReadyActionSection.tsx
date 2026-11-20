import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder, JustUpdatedOrderInfo } from '../../../types';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { StaffActionButton, ButtonActionState } from '../../common/StaffActionButton';

interface StaffReadyActionSectionProps {
  order: StaffOrder;
  isReleasing: boolean;
  onRelease: (orderId: string) => Promise<void>;
  onReturnHome: () => void;
  onSuccessTransition?: (info: JustUpdatedOrderInfo) => void;
}

/**
 * Action Section for READY_TO_CLAIM status:
 * 1. Initial State (Figma 1343:1709): Payment summary card, disabled checkbox & button
 * 2. Active State (Figma 1352:2371): Payment summary card, Claiming Time Remaining card with countdown & Active badge
 */
export const StaffReadyActionSection: React.FC<StaffReadyActionSectionProps> = ({
  order,
  isReleasing,
  onRelease,
  onReturnHome,
  onSuccessTransition,
}) => {
  // Check if claim has actually been initiated by the customer
  const isInitiated = Boolean(
    order.isClaimActive || (order.claimRemainingSeconds !== undefined && order.claimRemainingSeconds > 0)
  );

  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    isInitiated && order.claimRemainingSeconds ? order.claimRemainingSeconds : 0
  );
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [btnState, setBtnState] = useState<ButtonActionState>('idle');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);

  useEffect(() => {
    setIsConfirmed(false);
    setIsLocked(false);
    setBtnState('idle');
    setHasError(false);
    setErrorMessage('');
  }, [order.id]);

  useEffect(() => {
    if (order.isClaimActive || (order.claimRemainingSeconds !== undefined && order.claimRemainingSeconds > 0)) {
      setSecondsRemaining(order.claimRemainingSeconds ?? 0);
    } else {
      setSecondsRemaining(0);
    }
  }, [order.isClaimActive, order.claimRemainingSeconds]);

  // Live countdown timer only runs when initiated and time is remaining
  useEffect(() => {
    if (!isInitiated || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isInitiated, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const isTimerExpired = isInitiated && secondsRemaining <= 0;

  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const paidAmount =
    typeof order.amountReceived === 'number'
      ? order.amountReceived
      : price;
  const change =
    typeof order.change === 'number'
      ? order.change
      : Math.max(0, paidAmount - price);

  const handleToggleConfirm = () => {
    if (isLocked || isReleasing || btnState !== 'idle') return;
    setIsConfirmed((prev) => {
      const next = !prev;
      if (next) {
        setHasError(false);
        setErrorMessage('');
      }
      return next;
    });
  };

  const handleRelease = async () => {
    if (isLocked || isReleasing || btnState !== 'idle') return;

    // 1. Context-aware validation: Claim initiated
    if (!isInitiated) {
      setHasError(true);
      setErrorMessage('Customer has not initiated the claim yet. Ask customer to tap Claim on their device.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    // 2. Context-aware validation: Timer expired
    if (isTimerExpired) {
      setHasError(true);
      setErrorMessage('Claiming window has expired. Ask customer to re-initiate.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    // 3. Context-aware validation: Confirmation checkbox
    if (!isConfirmed) {
      setHasError(true);
      setErrorMessage('Please check the confirmation box before submitting.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    // 4. Valid -> Loading -> Success Feedback
    setHasError(false);
    setErrorMessage('');
    setIsLocked(true);
    setBtnState('loading');

    try {
      await onRelease(order.id);
      onSuccessTransition?.({
        orderId: order.id,
        actionBadgeText: 'Released',
        targetBadgeText: 'Claimed',
        targetStatus: 'CLAIMED',
        targetTab: 'claimed',
      });
    } catch {
      setIsLocked(false);
      setBtnState('idle');
    }
  };

  return (
    <View>
      {/* Payment Summary Card matching Figma 1343:1709 & 1352:2371 */}
      <PaymentSummaryCard
        price={price}
        paidAmount={paidAmount}
        change={change}
        className="mb-4"
      />

      {/* Claiming Time Remaining Card when Active (Figma 1352:2371) */}
      {isInitiated && secondsRemaining > 0 && (
        <OrderCardContainer className="mb-4">
          <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
            CLAIMING TIME REMAINING
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[32px] font-bold text-[#15803D]">
              {formattedTimer}
            </Text>
            <View className="bg-[#DCFCE7] rounded-full px-3 py-1 items-center justify-center">
              <Text className="text-[11px] font-semibold text-[#15803D]">
                Active
              </Text>
            </View>
          </View>
          <Text className="text-[12px] font-normal text-[#64748B] mt-2">
            Releasing order is only valid with this timer on.
          </Text>
        </OrderCardContainer>
      )}

      {/* Claiming Time Remaining Card when Expired */}
      {isTimerExpired && (
        <OrderCardContainer className="mb-4">
          <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
            CLAIMING TIME REMAINING
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[32px] font-bold text-[#BE123C]">
              0:00
            </Text>
            <View className="bg-[#FFE4E6] rounded-full px-3 py-1">
              <Text className="text-[11px] font-semibold text-[#BE123C]">
                Expired
              </Text>
            </View>
          </View>
          <Text className="text-[12px] font-normal text-[#64748B] mt-2">
            Claiming window has expired. Ask customer to re-initiate.
          </Text>
        </OrderCardContainer>
      )}

      {/* Confirmation Card with Shake & Inline Error (Reference: button uncheck feedback.html) */}
      <OrderConfirmationCard
        checked={isConfirmed}
        onToggle={handleToggleConfirm}
        disabled={isLocked || isReleasing || btnState !== 'idle'}
        title="I confirm that I want to release the order"
        subtitle="Only initiate release when customer is physically claiming their order."
        hasError={hasError}
        errorMessage={errorMessage}
        shakeTrigger={shakeTrigger}
      />

      {/* State-driven Action Button: "Release Order" (Reference: button feedback 2.html) */}
      <View className="mt-2 mb-2">
        <StaffActionButton
          state={btnState}
          idleLabel="Release Order"
          loadingLabel="Releasing..."
          successLabel="Released"
          onPress={handleRelease}
          disabled={false}
        />
      </View>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        disabled={btnState === 'loading'}
        className="w-full py-2.5 items-center justify-center mt-1"
      >
        <Text className="text-[13px] font-bold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
