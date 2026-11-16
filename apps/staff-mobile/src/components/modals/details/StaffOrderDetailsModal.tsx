import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  ScrollView,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { useStaff } from '../../../context/StaffContext';
import { OrderDetailsHeader } from './OrderDetailsHeader';
import { StaffOrderOverviewCard } from './StaffOrderOverviewCard';
import { StaffReadyActionSection } from './StaffReadyActionSection';
import { StaffUnpaidActionSection } from './StaffUnpaidActionSection';
import { StaffActiveActionSection } from './StaffActiveActionSection';
import { StaffClaimedSummarySection } from './StaffClaimedSummarySection';

interface StaffOrderDetailsModalProps {
  order: StaffOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffOrderDetailsModal: React.FC<StaffOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const {
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
    showToast,
  } = useStaff();

  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isPayingCourier, setIsPayingCourier] = useState<boolean>(false);
  const [isAttachingPhoto, setIsAttachingPhoto] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  if (!order) return null;

  const handleActivate = async (orderId: string, amount: number) => {
    setIsActivating(true);
    try {
      await activateOrder(orderId, amount);
      onClose();
    } finally {
      setIsActivating(false);
    }
  };

  const handlePayCourier = async (orderId: string) => {
    setIsPayingCourier(true);
    try {
      await payCourier(orderId);
    } finally {
      setIsPayingCourier(false);
    }
  };

  const handleAttachPhoto = async (orderId: string, imageUrl?: string) => {
    setIsAttachingPhoto(true);
    try {
      await attachPhoto(orderId, imageUrl);
    } finally {
      setIsAttachingPhoto(false);
    }
  };

  const handleRelease = async (orderId: string) => {
    setIsReleasing(true);
    try {
      await claimOrder(orderId);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      showToast(err?.message || 'Failed to release order', 'error');
    } finally {
      setIsReleasing(false);
    }
  };

  const isClaimedReceipt = order.status === 'CLAIMED';

  // Determine Title & Subtitle from Status matching Figma 1343:1662 & 1346:2288
  const getHeaderInfo = () => {
    switch (order.status) {
      case 'READY_TO_CLAIM':
        return { title: 'Order Details', subtitle: 'Ready To Claim' };
      case 'PAYMENT_REQUIRED':
        return { title: 'Order Details', subtitle: 'Unpaid Order' };
      case 'AWAITING_PARCEL':
        return {
          title: order.courierPaid ? 'Order Details' : 'Complete details',
          subtitle: 'Awaiting Parcel',
        };
      case 'CLAIMED':
        return { title: 'Order Details', subtitle: 'Claimed' };
      default:
        return { title: 'Order Details', subtitle: 'Order Details' };
    }
  };

  const { title: headerTitle, subtitle: headerSubtitle } = getHeaderInfo();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Top Header matching Figma 1343:1662 & 1346:2288 */}
        <OrderDetailsHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          onBack={onClose}
        />

        {/* Content Sheet with curved top corners */}
        <View
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          className="flex-1 bg-[#F8FAFC] overflow-hidden"
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Overview Card (matching Figma 1346:2358) */}
            <StaffOrderOverviewCard
              order={order}
              showFinancials={false}
            />

            {/* Status-specific Action Section */}
            {order.status === 'PAYMENT_REQUIRED' && (
              <StaffUnpaidActionSection
                order={order}
                isSubmitting={isActivating}
                onActivate={handleActivate}
                onReturnHome={onClose}
              />
            )}

            {order.status === 'READY_TO_CLAIM' && (
              <StaffReadyActionSection
                order={order}
                isReleasing={isReleasing}
                onRelease={handleRelease}
                onReturnHome={onClose}
              />
            )}

            {order.status === 'AWAITING_PARCEL' && (
              <StaffActiveActionSection
                order={order}
                isPayingCourier={isPayingCourier}
                isAttachingPhoto={isAttachingPhoto}
                onPayCourier={handlePayCourier}
                onAttachPhoto={handleAttachPhoto}
                onReturnHome={onClose}
              />
            )}

            {order.status === 'CLAIMED' && (
              <StaffClaimedSummarySection
                order={order}
                onReturnHome={onClose}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
