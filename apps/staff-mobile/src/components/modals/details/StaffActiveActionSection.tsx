import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { StaffOrder, JustUpdatedOrderInfo } from '../../../types';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { CourierPayoutStep } from './CourierPayoutStep';
import { ProofPhotoAttachStep } from './ProofPhotoAttachStep';

interface StaffActiveActionSectionProps {
  order: StaffOrder;
  isPayingCourier: boolean;
  isAttachingPhoto: boolean;
  onPayCourier: (orderId: string) => Promise<void>;
  onAttachPhoto: (orderId: string, imageUrl?: string) => Promise<void>;
  onReturnHome: () => void;
  onSuccessTransition?: (info: JustUpdatedOrderInfo) => void;
}

export const StaffActiveActionSection: React.FC<StaffActiveActionSectionProps> = ({
  order,
  isPayingCourier,
  isAttachingPhoto,
  onPayCourier,
  onAttachPhoto,
  onReturnHome,
  onSuccessTransition,
}) => {
  const [localCourierPaid, setLocalCourierPaid] = useState<boolean>(
    Boolean(order.courierPaid)
  );

  useEffect(() => {
    setLocalCourierPaid(Boolean(order.courierPaid));
  }, [order.id, order.courierPaid]);

  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const paidAmount = typeof order.amountReceived === 'number' ? order.amountReceived : price;
  const change =
    typeof order.change === 'number' ? order.change : Math.max(0, paidAmount - price);

  return (
    <View>
      <PaymentSummaryCard
        price={price}
        paidAmount={paidAmount}
        change={change}
        className="mb-4"
      />

      {!localCourierPaid ? (
        <CourierPayoutStep
          orderId={order.id}
          isPayingCourier={isPayingCourier}
          onPayCourier={onPayCourier}
          onPaidSuccess={() => setLocalCourierPaid(true)}
          onReturnHome={onReturnHome}
        />
      ) : (
        <ProofPhotoAttachStep
          orderId={order.id}
          initialProofImageUrl={order.proofImageUrl}
          isAttachingPhoto={isAttachingPhoto}
          onAttachPhoto={onAttachPhoto}
          onReturnHome={onReturnHome}
          onSuccessTransition={onSuccessTransition}
        />
      )}
    </View>
  );
};
