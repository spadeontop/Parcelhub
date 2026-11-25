import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { StaffOrder, JustUpdatedOrderInfo } from '../../../types';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { StaffActionButton, ButtonActionState } from '../../common/StaffActionButton';
import { useDeadlineCountdown } from '../../../hooks/useDeadlineCountdown';

interface StaffCancelledActionSectionProps {
  order: StaffOrder;
  isRefunding: boolean;
  onRefund: (orderId: string) => Promise<void>;
  onReturnHome: () => void;
  onSuccessTransition?: (info: JustUpdatedOrderInfo) => void;
}

const CANCEL_REASON_LABELS: Record<string, string> = {
  CUSTOMER_CHANGED_MIND: 'Customer changed mind',
  DUPLICATE_ORDER: 'Duplicate order',
  WRONG_DETAILS: 'Wrong order details',
  MERCHANT_CANCELLED: 'Merchant / seller cancelled',
  PARCEL_NOT_RECEIVED: 'Parcel not received',
  AUTO_CANCELLED_DUPLICATE: 'Auto-cancelled duplicate unpaid order',
  OTHER: 'Other',
};

function formatDateTime(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatActorRole(role?: string | null): string {
  if (!role) return 'System';
  if (role === 'CUSTOMER') return 'Customer';
  if (role === 'STAFF') return 'Staff';
  if (role === 'SYSTEM') return 'System';
  return role;
}

export const StaffCancelledActionSection: React.FC<StaffCancelledActionSectionProps> = ({
  order,
  isRefunding,
  onRefund,
  onReturnHome,
  onSuccessTransition,
}) => {
  // Financial Invariant A: cash refund is always order price / refundAmount, never amountReceived.
  const refundableAmount =
    typeof order.refundAmount === 'number'
      ? order.refundAmount
      : typeof order.amountToPay === 'number'
        ? order.amountToPay
        : 0;
  const isRefundEligible = Boolean(order.isRefundEligible) && refundableAmount > 0;

  const isRefundInitiated = Boolean(
    order.isRefundActive ||
      (order.refundRemainingSeconds !== undefined && order.refundRemainingSeconds > 0)
  );

  const secondsRemaining = useDeadlineCountdown({
    isActive: isRefundEligible && isRefundInitiated,
    initialSeconds: order.refundRemainingSeconds,
    fallbackActiveSeconds: order.isRefundActive ? 300 : 0,
  });

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

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const isTimerExpired = isRefundInitiated && secondsRemaining <= 0;

  const reasonLabel =
    (order.cancelReasonCode && CANCEL_REASON_LABELS[order.cancelReasonCode]) ||
    order.cancelReasonCode ||
    'Not specified';

  const handleToggleConfirm = () => {
    if (isLocked || isRefunding || btnState !== 'idle') return;
    setIsConfirmed((prev) => {
      const next = !prev;
      if (next) {
        setHasError(false);
        setErrorMessage('');
      }
      return next;
    });
  };

  const handleReleaseRefund = async () => {
    if (isLocked || isRefunding || btnState !== 'idle') return;

    if (!isRefundInitiated) {
      setHasError(true);
      setErrorMessage(
        'Customer has not initiated the refund pass yet. Ask customer to tap Request Refund on their device.'
      );
      setShakeTrigger((c) => c + 1);
      return;
    }

    if (isTimerExpired) {
      setHasError(true);
      setErrorMessage('Refund pass window has expired. Ask customer to re-initiate.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    if (!isConfirmed) {
      setHasError(true);
      setErrorMessage('Please check the confirmation box before releasing cash refund.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    setHasError(false);
    setErrorMessage('');
    setIsLocked(true);
    setBtnState('loading');

    try {
      await onRefund(order.id);
      onSuccessTransition?.({
        orderId: order.id,
        actionBadgeText: 'Refunded',
        targetBadgeText: 'Refunded',
        targetStatus: 'REFUNDED',
        targetTab: 'refunded',
      });
    } catch (err: any) {
      setIsLocked(false);
      setBtnState('idle');
      Alert.alert(
        'Refund Failed',
        err?.message || 'Unable to release cash refund. Please try again.'
      );
    }
  };

  return (
    <View>
      {/* Cancellation Metadata Card */}
      <OrderCardContainer className="mb-4">
        <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-2.5">
          CANCELLATION DETAILS
        </Text>
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#64748B]">Cancelled By</Text>
            <Text className="text-[12px] font-semibold text-[#0F172A]">
              {formatActorRole(order.cancelledByRole)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#64748B]">Reason</Text>
            <Text className="text-[12px] font-semibold text-[#0F172A] text-right flex-1 ml-4">
              {reasonLabel}
            </Text>
          </View>
          {order.cancelReason ? (
            <View className="bg-[#F8FAFC] rounded-xl p-2.5 border border-[#E2E8F0] mt-1">
              <Text className="text-[12px] text-[#334155] leading-[18px]">
                {order.cancelReason}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#64748B]">Cancelled At</Text>
            <Text className="text-[12px] font-medium text-[#334155]">
              {formatDateTime(order.cancelledAt || order.timestamp)}
            </Text>
          </View>
        </View>
      </OrderCardContainer>

      {!isRefundEligible ? (
        <View>
          <OrderCardContainer className="mb-4">
            <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1.5">
              REFUND STATUS
            </Text>
            <Text className="text-[13px] font-semibold text-[#0F172A]">
              No cash refund required
            </Text>
            <Text className="text-[12px] text-[#64748B] mt-1 leading-[18px]">
              No counter deposit held — no cash refund required for this cancelled order.
            </Text>
          </OrderCardContainer>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onReturnHome}
            className="w-full py-2.5 items-center justify-center mt-1"
          >
            <Text className="text-[13px] font-bold text-[#475569]">Return to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Refund Amount Card */}
          <OrderCardContainer className="mb-4">
            <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
              REFUNDABLE DEPOSIT
            </Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-[28px] font-bold text-[#7E22CE]">
                ₱{refundableAmount.toLocaleString()}
              </Text>
              <View className="bg-[#F3E8FF] rounded-full px-3 py-1">
                <Text className="text-[11px] font-semibold text-[#7E22CE]">
                  Refund Eligible
                </Text>
              </View>
            </View>
            <Text className="text-[12px] text-[#64748B] mt-2 leading-[18px]">
              Hand back the exact order deposit amount in cash once the customer activates their refund pass.
            </Text>
          </OrderCardContainer>

          {/* Refund Pass Time Remaining Card (Active) */}
          {isRefundInitiated && secondsRemaining > 0 && (
            <OrderCardContainer className="mb-4">
              <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
                REFUND PASS TIME REMAINING
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-[32px] font-bold text-[#7E22CE]">
                  {formattedTimer}
                </Text>
                <View className="bg-[#F3E8FF] rounded-full px-3 py-1 items-center justify-center">
                  <Text className="text-[11px] font-semibold text-[#7E22CE]">Active</Text>
                </View>
              </View>
              <Text className="text-[12px] font-normal text-[#64748B] mt-2">
                Releasing cash refund is only valid while this timer is active.
              </Text>
            </OrderCardContainer>
          )}

          {/* Refund Pass Time Remaining Card (Expired) */}
          {isTimerExpired && (
            <OrderCardContainer className="mb-4">
              <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-1">
                REFUND PASS TIME REMAINING
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-[32px] font-bold text-[#BE123C]">0:00</Text>
                <View className="bg-[#FFE4E6] rounded-full px-3 py-1">
                  <Text className="text-[11px] font-semibold text-[#BE123C]">Expired</Text>
                </View>
              </View>
              <Text className="text-[12px] font-normal text-[#64748B] mt-2">
                Refund pass window has expired. Ask customer to re-initiate.
              </Text>
            </OrderCardContainer>
          )}

          <OrderConfirmationCard
            checked={isConfirmed}
            onToggle={handleToggleConfirm}
            disabled={isLocked || isRefunding || btnState !== 'idle'}
            title={`I confirm I handed ₱${refundableAmount.toLocaleString()} cash refund to the customer`}
            subtitle="Only release the cash refund when the customer is physically present at the counter."
            hasError={hasError}
            errorMessage={errorMessage}
            shakeTrigger={shakeTrigger}
          />

          <View className="mt-2 mb-2">
            <StaffActionButton
              state={btnState}
              idleLabel="Release Cash Refund"
              loadingLabel="Refunding..."
              successLabel="Refunded"
              onPress={handleReleaseRefund}
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
        </View>
      )}
    </View>
  );
};
