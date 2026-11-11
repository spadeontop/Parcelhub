import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { useStaff } from '../../../context/StaffContext';
import { ArrowLeft, ChevronLeft } from '../../common/Icons';
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

  // Determine Subtitle from Status matching Figma
  const getSubtitle = () => {
    switch (order.status) {
      case 'READY_TO_CLAIM':
        return 'Ready To Claim';
      case 'PAYMENT_REQUIRED':
        return 'Unpaid Order';
      case 'AWAITING_PARCEL':
        return 'Awaiting Parcel';
      case 'CLAIMED':
        return 'CLAIMED & PAID';
      default:
        return 'Order Details';
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#F8FAFC]">
        {isClaimedReceipt ? (
          /* White Receipt Header matching Figma Frame 2 */
          <View
            className="bg-white pt-12 pb-5 px-5 rounded-b-[32px] relative z-10"
            style={{
              shadowColor: '#111827',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-[#F1F5F9] items-center justify-center"
                accessibilityLabel="Return to Home"
              >
                <ChevronLeft size={20} color="#0F172A" strokeWidth={2.5} />
              </TouchableOpacity>

              <View className="items-center flex-1 pr-10">
                <Text className="text-[19px] font-bold text-[#0F172A] leading-6 text-center tracking-tight">
                  Complete Details
                </Text>
                <Text className="text-[10.5px] font-bold text-[#215CD4] leading-[13px] tracking-wider uppercase text-center mt-0.5">
                  CLAIMED &amp; PAID
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Top Header matching Figma curved blue bar */
          <View
            className="bg-[#215CD4] pt-12 pb-7 px-5 rounded-b-[32px] shadow-sm relative z-10"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-between">
              {/* Go Back circular button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:bg-white/25"
                accessibilityLabel="Return to Home"
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Title Header */}
              <View className="items-center flex-1 pr-10">
                <Text className="text-lg font-bold text-white tracking-tight">
                  Complete Details
                </Text>
                <Text className="text-xs text-white/80 font-medium mt-0.5">
                  {getSubtitle()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5 pt-5"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Overview Card */}
          <StaffOrderOverviewCard
            order={order}
            showFinancials={order.status !== 'PAYMENT_REQUIRED'}
          />

          {/* Status-specific Action Section */}
          {order.status === 'READY_TO_CLAIM' && (
            <StaffReadyActionSection
              order={order}
              isReleasing={isReleasing}
              onRelease={handleRelease}
              onReturnHome={onClose}
            />
          )}

          {order.status === 'PAYMENT_REQUIRED' && (
            <StaffUnpaidActionSection
              order={order}
              isSubmitting={isActivating}
              onActivate={handleActivate}
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
    </Modal>
  );
};
