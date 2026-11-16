import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { OrderConfirmationCheckbox } from './OrderConfirmationCheckbox';

interface StaffReadyActionSectionProps {
  order: StaffOrder;
  isReleasing: boolean;
  onRelease: (orderId: string) => Promise<void>;
  onReturnHome: () => void;
}

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

  const handleRelease = async () => {
    if (!canRelease || isLocked) return;
    setIsLocked(true);
    await onRelease(order.id);
  };

  return (
    <View className="space-y-4">
      {/* Card: CLAIMING TIME REMAINING */}
      <View className="bg-white border border-[#E2E8F0] rounded-[20px] p-5 mb-4 shadow-sm">
        <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1">
          CLAIMING TIME REMAINING
        </Text>
        {isInitiated ? (
          <>
            <Text className="text-4xl font-extrabold text-[#059669] my-1">
              {formattedTimer}
            </Text>
            <Text className="text-xs text-[#64748B]">
              {isTimerExpired
                ? 'Claiming window has expired. Ask customer to re-initiate.'
                : 'Releasing order is only valid with this timer on.'}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-sm font-semibold text-[#64748B] my-2">
              Claim has not been initiated by the customer
            </Text>
            <Text className="text-xs text-[#94A3B8]">
              The countdown timer will start once the customer initiates the claim on their app.
            </Text>
          </>
        )}
      </View>

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
        className={`w-full h-[48px] rounded-xl items-center justify-center shadow-sm mb-2 ${
          canRelease && !isReleasing && !isLocked ? 'bg-black active:bg-neutral-800' : 'bg-[#94A3B8]'
        }`}
      >
        {isReleasing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-[15px]">
            {!isInitiated
              ? 'Awaiting Customer Initiation'
              : isTimerExpired
              ? 'Claim Window Expired'
              : 'Release Order'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        className="w-full py-3 items-center justify-center"
      >
        <Text className="text-[13px] font-bold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
