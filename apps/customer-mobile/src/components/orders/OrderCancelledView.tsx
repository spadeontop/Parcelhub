import React from 'react';
import { ScrollView, View } from 'react-native';
import { OrderStatusHistoryTuple } from '../../types/api';
import { formatPesoOrDash } from '../../utils/currency';
import {
  OrderAmountRow,
  OrderCodeBadge,
  OrderDetailRow,
  OrderProductBlock,
  OrderSectionCard,
  ReturnHomeLink,
} from './OrderDetailPrimitives';
import { OrderHubCard } from './OrderHubCard';
import {
  getTimelineEntryTime,
  OrderStatusTimeline,
  OrderTimelineStepItem,
} from './OrderStatusTimeline';

interface OrderCancelledViewProps {
  readonly trackingNumber: string;
  readonly productName: string;
  readonly price: number;
  readonly reason: string;
  readonly hubOpen: boolean;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly cancelledTimeFallback: string;
  readonly onCopyTracking?: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Summary screen for an unpaid order that has been voided/cancelled.
 * Composed from shared order detail, hub, and status timeline primitives.
 */
export const OrderCancelledView: React.FC<OrderCancelledViewProps> = ({
  trackingNumber,
  productName,
  price,
  reason,
  hubOpen,
  statusTimeline,
  cancelledTimeFallback,
  onCopyTracking,
  onReturnHome,
}) => {
  const placedTime =
    getTimelineEntryTime(statusTimeline, 'PENDING_INITIALIZATION') ||
    getTimelineEntryTime(statusTimeline, 'PAYMENT_REQUIRED') ||
    '—';
  const cancelledTime =
    getTimelineEntryTime(statusTimeline, 'CANCELLED') || cancelledTimeFallback;

  const timelineSteps: OrderTimelineStepItem[] = [
    {
      key: 'placed',
      title: 'Order Placed',
      description: 'Order by the user from the app',
      timestamp: placedTime,
      variant: 'done',
    },
    {
      key: 'cancelled',
      title: 'Order Cancelled',
      description: 'Voided by customer prior to payment',
      timestamp: cancelledTime,
      variant: 'cancelled',
      titleTone: 'danger',
      timestampTone: 'danger',
    },
  ];

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <OrderSectionCard title="ORDER DETAILS">
        <OrderProductBlock productName={productName} />

        <View className="pt-3.5 gap-3.5">
          <OrderDetailRow
            label="Tracking No."
            value={<OrderCodeBadge code={trackingNumber} onCopy={onCopyTracking} />}
          />
          <OrderDetailRow
            label="Reason"
            value={reason}
            alignTop
            valueNumberOfLines={2}
          />
        </View>
      </OrderSectionCard>

      <OrderSectionCard title="PAYMENT SUMMARY">
        <View className="mt-3.5 gap-3">
          <OrderAmountRow label="Order Total" value={formatPesoOrDash(price)} />
          <OrderAmountRow
            label="Refund Due"
            value="₱0"
            emphasized
            tone="muted"
            withTopDivider
          />
        </View>
      </OrderSectionCard>

      <OrderHubCard hubOpen={hubOpen} />

      <OrderStatusTimeline steps={timelineSteps} style={{ marginBottom: 16 }} />

      <View className="pt-2">
        <ReturnHomeLink onPress={onReturnHome} />
      </View>
    </ScrollView>
  );
};
