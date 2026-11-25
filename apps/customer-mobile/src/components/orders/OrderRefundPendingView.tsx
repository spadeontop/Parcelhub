import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { OrderStatusHistoryTuple } from '../../types/api';
import { formatPesoOrDash } from '../../utils/currency';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
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
  formatShortTime,
  getTimelineEntryTime,
  OrderStatusTimeline,
  OrderTimelineStepItem,
} from './OrderStatusTimeline';

interface OrderRefundPendingViewProps {
  readonly productName: string;
  readonly price: number;
  readonly paidAmount: number;
  readonly refundAmount: number;
  readonly ticketCode: string;
  readonly orderId: string;
  readonly cancellationReason?: string | null;
  readonly hubName: string;
  readonly hubAddress: string;
  readonly hubOpen: boolean;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly cancelledAt?: string | null;
  readonly isPullRefreshing: boolean;
  readonly isConfirmed: boolean;
  readonly onConfirmedChange: (checked: boolean) => void;
  readonly isLoading?: boolean;
  readonly onRefresh: () => void;
  readonly onInitiateRefund: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Fallback view for CANCELLED orders that are refund-eligible so customers can
 * confirm and initiate their hub cash refund when ready.
 */
export const OrderRefundPendingView: React.FC<OrderRefundPendingViewProps> = ({
  productName,
  price,
  paidAmount,
  refundAmount,
  ticketCode,
  orderId,
  cancellationReason,
  hubName,
  hubAddress,
  hubOpen,
  statusTimeline,
  cancelledAt,
  isPullRefreshing,
  isConfirmed,
  onConfirmedChange,
  isLoading = false,
  onRefresh,
  onInitiateRefund,
  onReturnHome,
}) => {
  const formattedRefund = formatPesoOrDash(refundAmount);
  const displayTicket = ticketCode || orderId || '—';
  const cancelledTime =
    getTimelineEntryTime(statusTimeline, 'CANCELLED') ||
    formatShortTime(cancelledAt) ||
    '—';

  const timelineSteps: OrderTimelineStepItem[] = [
    {
      key: 'cancelled',
      title: 'Order Cancelled',
      description: 'Cancelled by customer; awaiting hub refund',
      timestamp: cancelledTime,
      variant: 'cancelled',
    },
    {
      key: 'refund_pending',
      title: 'Refund Issued',
      description: `${formattedRefund} to be returned at hub counter`,
      timestamp: 'Pending',
      variant: 'pending',
      titleTone: 'muted',
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
            value={cancellationReason || 'Changed my mind'}
            alignTop
            valueNumberOfLines={2}
          />
        </View>
      </OrderSectionCard>

      <OrderSectionCard title="REFUND SUMMARY">
        <View className="mt-3.5 gap-3">
          <OrderAmountRow label="Order Total" value={formatPesoOrDash(price)} />
          <OrderAmountRow label="Amount Paid" value={formatPesoOrDash(paidAmount)} />
          <OrderAmountRow
            label="Refundable Amount"
            value={formattedRefund}
            emphasized
            tone="brand"
            withTopDivider
          />
        </View>
      </OrderSectionCard>

      <OrderHubCard hubName={hubName} hubAddress={hubAddress} hubOpen={hubOpen} />

      <OrderStatusTimeline steps={timelineSteps} style={{ marginBottom: 16 }} />

      <View className="gap-3">
        <ConfirmationSubmitSection
          title="I confirm that I want to initiate the refund"
          subtitle="Only initiate refund when you’re physically at the hub counter"
          buttonLabel="Initiate Refund"
          errorMessage="Please check the confirmation box before initiating refund."
          isChecked={isConfirmed}
          onCheckedChange={onConfirmedChange}
          onSubmit={onInitiateRefund}
          isLoading={isLoading}
          themeColor="#215cd4"
        />

        <ReturnHomeLink onPress={onReturnHome} disabled={isLoading} />
      </View>
    </ScrollView>
  );
};
