import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { OrderConfirmationCheckbox } from './OrderConfirmationCheckbox';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { PaymentSummaryCard } from './PaymentSummaryCard';

interface StaffReadyActionSectionProps {
  order: StaffOrder;
  isReleasing: boolean;
  onRelease: (orderId: string) => Promise<void>;
  onReturnHome: () => void;
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

  useEffect(() => {
    setIsConfirmed(false);
    setIsLocked(false);
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
  const canRelease = isInitiated && isConfirmed && secondsRemaining > 0 && !isReleasing;

  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 480;
  const paidAmount =
    typeof order.amountReceived === 'number'
      ? order.amountReceived
      : Math.max(500, price);
  const change =
    typeof order.change === 'number'
      ? order.change
      : Math.max(0, paidAmount - price);

  const handleRelease = async () => {
    if (!canRelease || isLocked) return;
    setIsLocked(true);
    await onRelease(order.id);
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

      {/* Confirmation Checkbox */}
      <OrderConfirmationCheckbox
        checked={isConfirmed}
        onToggle={() => {
          if (!isLocked && !isReleasing && isInitiated && !isTimerExpired) {
            setIsConfirmed((prev) => !prev);
          }
        }}
        disabled={isLocked || isReleasing || !isInitiated || isTimerExpired}
        title="I confirm that I want to release the order"
        subtitle="Only initiate release when customer is physically claiming their order."
      />

      {/* Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleRelease}
        disabled={!canRelease || isReleasing || isLocked}
        className={`w-full h-[48px] rounded-xl items-center justify-center mb-2 shadow-sm ${
          canRelease && !isReleasing && !isLocked
            ? 'bg-black active:bg-neutral-800'
            : 'bg-[#94A3B8]'
        }`}
      >
        {isReleasing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-[15px]">
            Release Order
          </Text>
        )}
      </TouchableOpacity>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        className="w-full py-2.5 items-center justify-center mt-1"
      >
        <Text className="text-[13px] font-bold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
