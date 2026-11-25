import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { StaffOrder, StaffTab, JustUpdatedOrderInfo } from '../../../types';
import { useStaffOrderActions } from '../../../hooks/useStaffOrderActions';
import { OrderDetailsHeader } from './OrderDetailsHeader';
import { StaffOrderOverviewCard } from './StaffOrderOverviewCard';
import { StaffReadyActionSection } from './StaffReadyActionSection';
import { StaffUnpaidActionSection } from './StaffUnpaidActionSection';
import { StaffActiveActionSection } from './StaffActiveActionSection';
import { StaffClaimedSummarySection } from './StaffClaimedSummarySection';
import { ZoomableImageViewer } from '../ZoomableImageViewer';
import { staffApi } from '../../../services/staffApi';

interface StaffOrderDetailsModalProps {
  order: StaffOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (order: StaffOrder) => void;
  onSelectTab: (tab: StaffTab) => void;
  onJustUpdated: (info: JustUpdatedOrderInfo) => void;
}

export const StaffOrderDetailsModal: React.FC<StaffOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  onSelectTab,
  onJustUpdated,
}) => {
  const {
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
  } = useStaffOrderActions(onOrderUpdated);

  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isPayingCourier, setIsPayingCourier] = useState<boolean>(false);
  const [isAttachingPhoto, setIsAttachingPhoto] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [isPodViewerOpen, setIsPodViewerOpen] = useState<boolean>(false);
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(order?.proofImageUrl || null);
  const [loadingPhoto, setLoadingPhoto] = useState<boolean>(false);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    setProofPhotoUrl(order?.proofImageUrl || null);
    setLoadingPhoto(false);
    setIsPodViewerOpen(false);
  }, [order?.id]);

  useEffect(() => {
    if (order?.proofImageUrl) {
      setProofPhotoUrl(order.proofImageUrl);
      setLoadingPhoto(false);
    }
  }, [order?.proofImageUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!isPodViewerOpen || !order) {
      setLoadingPhoto(false);
      return;
    }
    if (order.proofImageUrl || proofPhotoUrl) {
      setLoadingPhoto(false);
      return;
    }
    setLoadingPhoto(true);
    (async () => {
      try {
        const photoData = await staffApi.getOrderPhoto(order.id, 'proof');
        if (!cancelled) {
          const url = photoData.proofImageUrl || photoData.imageUrl;
          if (url) setProofPhotoUrl(url);
        }
      } catch (err) {
        console.warn('[Staff Proof] Failed to fetch photo:', err);
      } finally {
        if (!cancelled) setLoadingPhoto(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPodViewerOpen, order?.id]);

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  if (!order) return null;

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSuccessTransition = (info: JustUpdatedOrderInfo) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // 1. Immediately switch to the updated pill tabs while still covered by the modal
    onSelectTab(info.targetTab);

    // 2. Smoothly slide the Order Details modal downward off the screen (translateY(100%), 350ms ease-in-out)
    // so when it slides down, the Home screen is already on the updated pill tabs
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      onJustUpdated(info);
    });
  };

  const handleActivate = async (orderId: string, amount: number) => {
    setIsActivating(true);
    try {
      await activateOrder(orderId, amount);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
          title: 'Order Details',
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
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: '#000000',
            transform: [{ translateY }],
          }}
        >
          {/* Top Header matching Figma 1343:1662 & 1346:2288 */}
          <OrderDetailsHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            onBack={handleClose}
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
                  onReturnHome={handleClose}
                  onSuccessTransition={handleSuccessTransition}
                />
              )}

              {order.status === 'READY_TO_CLAIM' && (
                <StaffReadyActionSection
                  order={order}
                  isReleasing={isReleasing}
                  onRelease={handleRelease}
                  onReturnHome={handleClose}
                  onSuccessTransition={handleSuccessTransition}
                />
              )}

              {order.status === 'AWAITING_PARCEL' && (
                <StaffActiveActionSection
                  order={order}
                  isPayingCourier={isPayingCourier}
                  isAttachingPhoto={isAttachingPhoto}
                  onPayCourier={handlePayCourier}
                  onAttachPhoto={handleAttachPhoto}
                  onReturnHome={handleClose}
                  onSuccessTransition={handleSuccessTransition}
                />
              )}

              {order.status === 'CLAIMED' && (
                <StaffClaimedSummarySection
                  order={order}
                  onReturnHome={handleClose}
                  onViewProof={() => setIsPodViewerOpen(true)}
                />
              )}
            </ScrollView>
          </View>
        </Animated.View>

        <ZoomableImageViewer
          visible={isPodViewerOpen}
          imageUri={proofPhotoUrl || order.proofImageUrl}
          loading={loadingPhoto}
          fallbackLabel={order.trackingId || order.id}
          onClose={() => setIsPodViewerOpen(false)}
        />
      </View>
    </Modal>
  );
};
