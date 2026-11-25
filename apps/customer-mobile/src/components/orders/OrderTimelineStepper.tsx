import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { ChevronRightIcon, QrCodeIcon } from '../common/Icons';
import {
  getTimelineEntryTime,
  OrderStatusTimeline,
  OrderTimelineStepItem,
} from './OrderStatusTimeline';

interface OrderTimelineStepperProps {
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly onViewQr: () => void;
  readonly onOpenPod: () => void;
  readonly onCancelOrder?: () => void;
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
    getTimelineEntryTime(statusTimeline, 'PENDING_INITIALIZATION') ||
    getTimelineEntryTime(statusTimeline, 'PAYMENT_REQUIRED') ||
    'Pending';
  const step2Timestamp = getTimelineEntryTime(statusTimeline, 'AWAITING_PARCEL') || '—';
  const step3Timestamp = getTimelineEntryTime(statusTimeline, 'READY_TO_CLAIM') || '—';
  const step4Timestamp = getTimelineEntryTime(statusTimeline, 'CLAIMED') || '—';

  const steps: OrderTimelineStepItem[] = [
    {
      key: 'placed',
      title: 'Order Placed',
      description: 'Order by the user from the app',
      timestamp: step1Timestamp,
      variant: isStep1Done ? 'done' : isStep1Active ? 'active' : 'pending',
      action:
        status === 'PAYMENT_REQUIRED' && onCancelOrder ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancelOrder}
            className="self-start mt-2 py-0.5"
          >
            <Text className="text-[12.5px] font-semibold text-[#dc2626]">
              Cancel Order
            </Text>
          </TouchableOpacity>
        ) : undefined,
    },
    {
      key: 'awaiting',
      title: 'Awaiting',
      description: 'The hub is actively waiting for the product',
      timestamp: isStep2Done || isStep2Active ? step2Timestamp : null,
      variant: isStep2Done ? 'done' : isStep2Active ? 'active' : 'pending',
    },
    {
      key: 'claimable',
      title: 'Claimable',
      description: 'The product is at the hub, ready for claim',
      timestamp: isStep3Done || isStep3Active ? step3Timestamp : null,
      variant: isStep3Done ? 'done' : isStep3Active ? 'active' : 'pending',
      action:
        isStep3Active || isStep3Done ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenPod}
            className="flex-row items-center self-start mt-2 py-0.5"
          >
            <Text className="text-[12.5px] font-semibold text-[#215cd4] mr-1">
              View Proof of Delivery
            </Text>
            <ChevronRightIcon size={14} color="#215cd4" />
          </TouchableOpacity>
        ) : undefined,
    },
    {
      key: 'claimed',
      title: 'Parcel Claimed',
      description: isStep4Done
        ? 'Handover verified. Cash change returned.'
        : 'Confirmation pending customer claim',
      timestamp: isStep4Done ? step4Timestamp : null,
      variant: isStep4Done ? 'done' : 'pending',
      titleTone: isStep4Done ? 'default' : 'muted',
    },
  ];

  const qrButton = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onViewQr}
      className="w-8 h-8 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] items-center justify-center"
      accessibilityLabel="View QR Code"
    >
      <QrCodeIcon size={16} color="#475569" />
    </TouchableOpacity>
  );

  return (
    <OrderStatusTimeline
      title="TRACKING PROGRESS"
      headerRight={qrButton}
      steps={steps}
      style={{ marginBottom: 16 }}
    />
  );
};
