import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { CARD_SHADOW } from '../common/cardStyles';

interface OrderTimelineStepperProps {
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly onViewQr: () => void;
  readonly onOpenPod: () => void;
  readonly onCancelOrder?: () => void;
}

function formatTimelineTimestamp(
  statusTimeline: OrderStatusHistoryTuple,
  statusKey: OrderStatus
): string | null {
  if (!Array.isArray(statusTimeline)) return null;
  const entry = statusTimeline.find((e) => e.status === statusKey);
  if (!entry?.timestamp) return null;
  const d = new Date(entry.timestamp);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderStepNode(isDone: boolean, isActive: boolean) {
  if (isDone) {
    return (
      <View
        className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 6L9 17L4 12"
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }
  if (isActive) {
    return (
      <View
        className="w-6 h-6 rounded-full bg-[#215cd4] items-center justify-center"
        style={{
          shadowColor: '#215cd4',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="w-2.5 h-2.5 rounded-full bg-white" />
      </View>
    );
  }
  return (
    <View className="w-6 h-6 rounded-full bg-[#f8fafc] border-2 border-[#cbd5e1] items-center justify-center" />
  );
}

/**
 * 4-step vertical tracking progress timeline displaying real formatted
 * status timestamps (or 'Pending' / '—' when unavailable).
 */
export const OrderTimelineStepper: React.FC<OrderTimelineStepperProps> = ({
  status,
  statusTimeline,
  onViewQr,
  onOpenPod,
  onCancelOrder,
}) => {
  const isStep1Done =
    status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep1Active = status === 'PAYMENT_REQUIRED';

  const isStep2Done = status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep2Active = status === 'AWAITING_PARCEL';

  const isStep3Done = status === 'CLAIMED';
  const isStep3Active = status === 'READY_TO_CLAIM';

  const isStep4Done = status === 'CLAIMED';

  const step1Timestamp =
    formatTimelineTimestamp(statusTimeline, 'PENDING_INITIALIZATION') ||
    formatTimelineTimestamp(statusTimeline, 'PAYMENT_REQUIRED') ||
    'Pending';
  const step2Timestamp = formatTimelineTimestamp(statusTimeline, 'AWAITING_PARCEL') || '—';
  const step3Timestamp = formatTimelineTimestamp(statusTimeline, 'READY_TO_CLAIM') || '—';
  const step4Timestamp = formatTimelineTimestamp(statusTimeline, 'CLAIMED') || '—';

  return (
    <View
      className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-4"
      style={CARD_SHADOW}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
          TRACKING PROGRESS
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewQr}
          className="w-8 h-8 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] items-center justify-center"
          accessibilityLabel="View QR Code"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"
              stroke="#475569"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Stepper Vertical Timeline */}
      <View>
        {/* Step 1: Order Placed */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="mt-0.5">{renderStepNode(isStep1Done, isStep1Active)}</View>
            <View
              className="flex-1 w-[2px] my-1.5"
              style={{ backgroundColor: isStep1Done ? '#10b981' : '#e2e8f0' }}
            />
          </View>
          <View className="flex-1 pb-6">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text
                className="text-[14px] font-bold"
                style={{ color: isStep1Active ? '#215cd4' : '#0f172a' }}
              >
                Order Placed
              </Text>
              <Text
                className="text-[11.5px] font-semibold"
                style={{ color: isStep1Active ? '#215cd4' : '#94a3b8' }}
              >
                {step1Timestamp}
              </Text>
            </View>
            <Text className="text-[12.5px] font-normal text-[#64748b] mt-1 leading-[18px]">
              Order by the user from the app
            </Text>
            {status === 'PAYMENT_REQUIRED' && onCancelOrder && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onCancelOrder}
                className="self-start mt-2.5 px-3 py-1.5 rounded-[8px] bg-[#fef2f2] border border-[#fecaca]"
              >
                <Text className="text-[12px] font-bold text-[#dc2626]">
                  Cancel Order
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Step 2: Awaiting Parcel */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="mt-0.5">{renderStepNode(isStep2Done, isStep2Active)}</View>
            <View
              className="flex-1 w-[2px] my-1.5"
              style={{ backgroundColor: isStep2Done ? '#10b981' : '#e2e8f0' }}
            />
          </View>
          <View className="flex-1 pb-6">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text
                className="text-[14px] font-bold"
                style={{
                  color: isStep2Active
                    ? '#215cd4'
                    : isStep2Done
                    ? '#0f172a'
                    : '#475569',
                }}
              >
                Awaiting
              </Text>
              {(isStep2Done || isStep2Active) && (
                <Text
                  className="text-[11.5px] font-semibold"
                  style={{ color: isStep2Active ? '#215cd4' : '#94a3b8' }}
                >
                  {step2Timestamp}
                </Text>
              )}
            </View>
            <Text
              className="text-[12.5px] font-normal mt-1 leading-[18px]"
              style={{ color: isStep2Active || isStep2Done ? '#64748b' : '#94a3b8' }}
            >
              The hub is actively waiting for the product
            </Text>
          </View>
        </View>

        {/* Step 3: Ready to Claim */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="mt-0.5">{renderStepNode(isStep3Done, isStep3Active)}</View>
            <View
              className="flex-1 w-[2px] my-1.5"
              style={{ backgroundColor: isStep3Done ? '#10b981' : '#e2e8f0' }}
            />
          </View>
          <View className="flex-1 pb-6">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text
                className="text-[14px] font-bold"
                style={{
                  color: isStep3Active
                    ? '#215cd4'
                    : isStep3Done
                    ? '#0f172a'
                    : '#475569',
                }}
              >
                Claimable
              </Text>
              {(isStep3Done || isStep3Active) && (
                <Text
                  className="text-[11.5px] font-semibold"
                  style={{ color: isStep3Active ? '#215cd4' : '#94a3b8' }}
                >
                  {step3Timestamp}
                </Text>
              )}
            </View>
            <Text
              className="text-[12.5px] font-normal mt-1 leading-[18px]"
              style={{
                color: isStep3Active
                  ? '#475569'
                  : isStep3Done
                  ? '#64748b'
                  : '#94a3b8',
              }}
            >
              The product is at the hub, ready for claim
            </Text>

            {/* Proof of Delivery Link */}
            {(isStep3Active || isStep3Done) && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onOpenPod}
                className="flex-row items-center self-start mt-2.5 px-3 py-1.5 rounded-[8px] bg-[#eff6ff] border border-[#dbeafe]"
              >
                <Text className="text-[12px] font-semibold text-[#215cd4] mr-1">
                  View Proof of Delivery
                </Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke="#215cd4"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Step 4: Parcel Claimed */}
        <View className="flex-row">
          <View className="items-center mr-3.5" style={{ width: 24 }}>
            <View className="mt-0.5">{renderStepNode(isStep4Done, false)}</View>
          </View>
          <View className="flex-1">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text
                className="text-[14px]"
                style={{
                  color: isStep4Done ? '#0f172a' : '#64748b',
                  fontWeight: isStep4Done ? '700' : '600',
                }}
              >
                Parcel Claimed
              </Text>
              {isStep4Done && (
                <Text className="text-[11.5px] font-semibold text-[#94a3b8]">
                  {step4Timestamp}
                </Text>
              )}
            </View>
            <Text
              className="text-[12.5px] font-normal mt-1 leading-[18px]"
              style={{ color: isStep4Done ? '#64748b' : '#94a3b8' }}
            >
              {isStep4Done
                ? 'Handover verified. Cash change returned.'
                : 'Confirmation pending customer claim'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
