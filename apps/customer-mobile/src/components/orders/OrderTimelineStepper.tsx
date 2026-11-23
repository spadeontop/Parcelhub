import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { OrderStatus, OrderStatusHistoryTuple } from '../../v1/types/api';

interface OrderTimelineStepperProps {
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly onViewQr: () => void;
  readonly onOpenPod: () => void;
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
    <View className="w-6 h-6 rounded-full bg-[#f1f5f9] border-2 border-[#cbd5e1] items-center justify-center" />
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
      className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-4"
      style={{
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
          TRACKING PROGRESS
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewQr}
          className="w-7 h-7 rounded-[8px] bg-[#f1f5f9] items-center justify-center"
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
      <View className="relative pl-[28px]">
        {/* Stepper Vertical Connecting Line */}
        <View className="absolute bg-[#e2e8f0] bottom-[14px] left-[11px] top-[10px] w-[2px]" />

        {/* Step 1: Order Placed */}
        <View className="relative mb-6">
          <View className="absolute left-[-28px] top-[2px]">
            {renderStepNode(isStep1Done, isStep1Active)}
          </View>
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`text-[14px] font-bold ${
                isStep1Active ? 'text-[#215cd4]' : 'text-[#111827]'
              }`}
            >
              Order Placed
            </Text>
            <Text
              className={`text-[11px] font-medium ${
                isStep1Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
              }`}
            >
              {step1Timestamp}
            </Text>
          </View>
          <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
            Order by the user from the app
          </Text>
        </View>

        {/* Step 2: Awaiting Parcel */}
        <View className="relative mb-6">
          <View className="absolute left-[-28px] top-[2px]">
            {renderStepNode(isStep2Done, isStep2Active)}
          </View>
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`text-[14px] font-bold ${
                isStep2Active
                  ? 'text-[#215cd4]'
                  : isStep2Done
                  ? 'text-[#111827]'
                  : 'text-[#475569]'
              }`}
            >
              Awaiting
            </Text>
            {(isStep2Done || isStep2Active) && (
              <Text
                className={`text-[11px] font-medium ${
                  isStep2Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
                }`}
              >
                {step2Timestamp}
              </Text>
            )}
          </View>
          <Text
            className={`text-[12px] font-normal mt-0.5 ${
              isStep2Active || isStep2Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
            }`}
          >
            The hub is actively waiting for the product
          </Text>
        </View>

        {/* Step 3: Ready to Claim */}
        <View className="relative mb-6">
          <View className="absolute left-[-28px] top-[2px]">
            {renderStepNode(isStep3Done, isStep3Active)}
          </View>
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`text-[14px] font-bold ${
                isStep3Active
                  ? 'text-[#215cd4]'
                  : isStep3Done
                  ? 'text-[#111827]'
                  : 'text-[#475569]'
              }`}
            >
              Claimable
            </Text>
            {(isStep3Done || isStep3Active) && (
              <Text
                className={`text-[11px] font-semibold ${
                  isStep3Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
                }`}
              >
                {step3Timestamp}
              </Text>
            )}
          </View>
          <Text
            className={`text-[12px] font-normal mt-0.5 ${
              isStep3Active ? 'text-[#475569]' : isStep3Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
            }`}
          >
            The product already is in the hub, waiting for claim
          </Text>

          {/* Proof of Delivery Link */}
          {(isStep3Active || isStep3Done) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenPod}
              className="flex-row items-center pt-[9px] pb-[3px]"
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

        {/* Step 4: Parcel Claimed */}
        <View className={`relative ${isStep4Done ? '' : 'opacity-60'}`}>
          <View className="absolute left-[-28px] top-[2px]">
            {renderStepNode(isStep4Done, false)}
          </View>
          <View className="flex-row items-baseline justify-between">
            <Text
              className={`text-[14px] font-medium ${
                isStep4Done ? 'text-[#111827] font-bold' : 'text-[#475569]'
              }`}
            >
              Parcel Claimed
            </Text>
            {isStep4Done && (
              <Text className="text-[11px] font-medium text-[#94a3b8]">
                {step4Timestamp}
              </Text>
            )}
          </View>
          <Text
            className={`text-[12px] font-normal mt-0.5 ${
              isStep4Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
            }`}
          >
            {isStep4Done
              ? 'Handover verified. Cash change returned.'
              : 'Confirmation pending customer claim'}
          </Text>
        </View>
      </View>
    </View>
  );
};
