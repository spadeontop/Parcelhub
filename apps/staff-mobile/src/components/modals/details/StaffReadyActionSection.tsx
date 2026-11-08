import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { Check } from '../../common/Icons';

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

  return (
    <View className="space-y-4">
      {/* Card 2: CLAIMING TIME REMAINING */}
      <View className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 shadow-xs">
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

      {/* Confirmation Checkbox matching ready-to-claim.png */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (isInitiated && !isTimerExpired) {
            setIsConfirmed((prev) => !prev);
          }
        }}
        disabled={!isInitiated || isTimerExpired}
        className={`flex-row items-start gap-3 px-1 mb-5 ${
          !isInitiated || isTimerExpired ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <View
          className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
            isConfirmed ? 'bg-[#215CD4]' : 'bg-white border-2 border-[#CBD5E1]'
          }`}
        >
          {isConfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-[#0F172A]">
            I confirm that I want to release the order
          </Text>
          <Text className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
            Only initiate release when customer is physically claiming their order.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onRelease(order.id)}
        disabled={!canRelease}
        className={`w-full py-4 rounded-xl items-center justify-center shadow-md mb-2 ${
          canRelease ? 'bg-[#215CD4] active:bg-[#1d4ed8]' : 'bg-[#94A3B8]'
        }`}
      >
        {isReleasing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-sm">
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
        <Text className="text-xs font-semibold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
