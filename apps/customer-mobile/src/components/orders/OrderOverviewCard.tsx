import React from 'react';
import { View } from 'react-native';
import { OrderStatus } from '../../types/api';
import { formatPeso, formatPesoOrDash } from '../../utils/currency';
import {
  OrderAmountRow,
  OrderCodeBadge,
  OrderDetailRow,
  OrderProductBlock,
  OrderSectionCard,
} from './OrderDetailPrimitives';

interface OrderOverviewCardProps {
  readonly productName: string;
  readonly price: number;
  readonly amountReceived?: number | null;
  readonly recipientName: string;
  readonly trackingNumber: string;
  readonly status: OrderStatus;
  readonly change: number;
  readonly onCopyTracking: () => void;
}

/**
 * Displays Order Details and (once paid) Payment Summary cards on OrderDetailsScreen.
 * While unpaid, Amount Due sits cleanly inside Order Details to avoid a solo card.
 */
export const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  productName,
  price,
  amountReceived,
  recipientName,
  trackingNumber,
  status,
  change,
  onCopyTracking,
}) => {
  const isUnpaid = status === 'PAYMENT_REQUIRED' || status === 'PENDING_INITIALIZATION';
  const isClaimed = status === 'CLAIMED';
  const paidDisplayAmount = amountReceived ?? price;
  const formattedPrice = formatPesoOrDash(price);
  const changeLabel = isClaimed ? 'Change Returned' : 'Change';

  return (
    <View>
      <OrderSectionCard title="ORDER DETAILS">
        <OrderProductBlock productName={productName} />

        <View className="pt-3.5 gap-3.5">
          <OrderDetailRow label="Recipient" value={recipientName} />
          <OrderDetailRow
            label="Tracking No."
            value={<OrderCodeBadge code={trackingNumber} onCopy={onCopyTracking} />}
          />
        </View>

        {isUnpaid && (
          <View className="mt-4">
            <OrderAmountRow
              label="Amount Due"
              value={formattedPrice}
              emphasized
              withTopDivider
            />
          </View>
        )}
      </OrderSectionCard>

      {!isUnpaid && (
        <OrderSectionCard title="PAYMENT SUMMARY">
          <View className="mt-3.5 gap-3">
            <OrderAmountRow label="Order Total" value={formattedPrice} />
            <OrderAmountRow label="Amount Paid" value={formatPeso(paidDisplayAmount)} />
            <OrderAmountRow
              label={changeLabel}
              value={formatPeso(change)}
              emphasized
              tone={change > 0 ? 'default' : 'muted'}
              withTopDivider
            />
          </View>
        </OrderSectionCard>
      )}
    </View>
  );
};
