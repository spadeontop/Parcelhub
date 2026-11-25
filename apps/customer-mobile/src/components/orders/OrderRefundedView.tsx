import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
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

interface OrderRefundedViewProps {
  readonly productName: string;
  readonly price: number;
  readonly orderPrice?: number;
  readonly paidAmount?: number;
  readonly ticketCode: string;
  readonly orderId: string;
  readonly cancellationReason?: string | null;
  readonly hubName: string;
  readonly hubAddress: string;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly isPullRefreshing: boolean;
  readonly onRefresh: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Completed refund summary screen for REFUNDED orders, composed from
 * shared order detail, hub, and status timeline primitives.
 */
export const OrderRefundedView: React.FC<OrderRefundedViewProps> = ({
  productName,
  price,
  orderPrice,
  paidAmount,
  ticketCode,
  orderId,
  cancellationReason,
  hubName,
  hubAddress,
  statusTimeline,
  isPullRefreshing,
  onRefresh,
  onReturnHome,
}) => {
  const formattedRefundAmount = formatPesoOrDash(price);
  const displayTicket = ticketCode || orderId || '—';
  const cancelledTime = getTimelineEntryTime(statusTimeline, 'CANCELLED') || '—';
  const refundedTime = getTimelineEntryTime(statusTimeline, 'REFUNDED') || '—';

  const timelineSteps: OrderTimelineStepItem[] = [
    {
      key: 'cancelled',
      title: 'Order Cancelled',
      description: 'Refund pass verified by hub staff',
      timestamp: cancelledTime,
      variant: 'done',
    },
    {
      key: 'refunded',
      title: 'Refund Issued',
      description:
        price > 0
          ? `${formattedRefundAmount} returned to customer`
          : 'Refund returned to customer',
      timestamp: refundedTime,
      variant: 'done',
      titleTone: 'success',
      timestampTone: 'success',
    },
  ];

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isPullRefreshing}
          onRefresh={onRefresh}
          tintColor="#215cd4"
          colors={['#215cd4']}
        />
      }
    >
      <OrderSectionCard title="ORDER DETAILS">
        <OrderProductBlock productName={productName} />

        <View className="pt-3.5 gap-3.5">
          <OrderDetailRow
            label="Refund Ticket"
            value={<OrderCodeBadge code={displayTicket} />}
          />
          <OrderDetailRow
            label="Reason"
            value={cancellationReason || '—'}
            alignTop
            valueNumberOfLines={2}
          />
        </View>
      </OrderSectionCard>

      <OrderSectionCard title="REFUND SUMMARY">
        <View className="mt-3.5 gap-3">
          <OrderAmountRow
            label="Order Total"
            value={formatPesoOrDash(orderPrice ?? price)}
          />
          <OrderAmountRow
            label="Amount Paid"
            value={formatPesoOrDash(paidAmount ?? price)}
          />
          <OrderAmountRow
            label="Refund Returned"
            value={formattedRefundAmount}
            emphasized
            withTopDivider
          />
        </View>
      </OrderSectionCard>

      <OrderHubCard
        hubName={hubName}
        hubAddress={hubAddress}
        statusOverride="refunded"
      />

      <OrderStatusTimeline steps={timelineSteps} style={{ marginBottom: 16 }} />

      <ReturnHomeLink onPress={onReturnHome} />
    </ScrollView>
  );
};

export default OrderRefundedView;
