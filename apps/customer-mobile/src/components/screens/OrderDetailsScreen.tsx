import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useCustomerOrders, useCustomerOrderActions } from '../../hooks/useCustomerOrders';
import { customerQueryKeys } from '../../query/queryClient';
import { useCustomerOrderDetailQuery } from '../../query/useCustomerQueries';
import { QrCodeIcon } from '../common/Icons';
import { AppHeader } from '../layout/AppHeader';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { getStatusLabel } from '../../utils/statusHelpers';
import { useClaimCountdown } from '../orders/useClaimCountdown';
import { ClaimPassView } from '../orders/ClaimPassView';
import { OrderCancelledView } from '../orders/OrderCancelledView';
import { OrderOverviewCard } from '../orders/OrderOverviewCard';
import { OrderTimelineStepper } from '../orders/OrderTimelineStepper';
import {
  UNPAID_CANCELLATION_REASONS,
  UnpaidCancelOrderView,
} from '../orders/UnpaidCancelOrderView';

type UnpaidViewMode = 'details' | 'cancel' | 'cancelled';

export const OrderDetailsScreen: React.FC = () => {
  const {
    selectedOrderId,
    selectedOrderTicketCode,
    openPodModal,
    navigateTo,
    goBack,
  } = useNavigationUi();
  const { showToast } = useToast();
  const { authToken, customer } = useAuthSession();
  const { orders } = useCustomerOrders();
  const { claimCustomerOrder } = useCustomerOrderActions();

  const queryClient = useQueryClient();
  const { data: orderDetail, refetch } = useCustomerOrderDetailQuery(authToken, selectedOrderId);

  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [isInitiatingClaim, setIsInitiatingClaim] = useState<boolean>(false);
  const [isClaimLocked, setIsClaimLocked] = useState<boolean>(false);
  const [isRefreshingRelease, setIsRefreshingRelease] = useState<boolean>(false);
  const [isPassDismissed, setIsPassDismissed] = useState<boolean>(false);
  const [isClaimSessionActive, setIsClaimSessionActive] = useState<boolean>(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);
  const [unpaidViewMode, setUnpaidViewMode] = useState<UnpaidViewMode>('details');
  const [cancelReason, setCancelReason] = useState<string>(UNPAID_CANCELLATION_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState<string>('');
  const [cancelledTimeFallback, setCancelledTimeFallback] = useState<string>('—');

  // Hub status defaults to open
  const hubOpen = true;

  // Cached summary fallback
  const cachedSummary = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );

  const orderId = orderDetail?.id || cachedSummary?.id || selectedOrderId || '';
  const ticketCode =
    selectedOrderTicketCode ||
    orderDetail?.ticketCode ||
    cachedSummary?.ticketCode ||
    '';
  const status = orderDetail?.status || cachedSummary?.status || 'PENDING_INITIALIZATION';
  const productName = orderDetail?.productName || cachedSummary?.productName || 'Order Item';
  const recipientName =
    orderDetail?.recipientName ||
    (customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : 'Recipient');
  const price = orderDetail?.price ?? 0;
  const change = orderDetail?.change ?? 0;
  const trackingNumber = orderDetail?.trackingId || cachedSummary?.trackingId || '—';
  const statusTimeline = orderDetail?.statusTimeline || [];

  const { remainingSecs, timeFormatted, startLocalWindow, resetCountdown } = useClaimCountdown({
    isClaimActive: orderDetail?.isClaimActive,
    claimExpiresAt: orderDetail?.claimExpiresAt,
    claimRemainingSeconds: orderDetail?.claimRemainingSeconds,
  });

  // Reset local interaction state and countdown whenever the viewed order changes
  useEffect(() => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    setIsPassDismissed(false);
    setIsClaimSessionActive(false);
    setUnpaidViewMode('details');
    setCancelReason(UNPAID_CANCELLATION_REASONS[0]);
    setCancelNotes('');
    setCancelledTimeFallback('—');
    resetCountdown();
  }, [selectedOrderId, resetCountdown]);

  const qrIdentifier = ticketCode || orderId || 'PARCELHUB-RELEASE';
  const isClaimed = status === 'CLAIMED';
  const isServerClaimActive = Boolean(orderDetail?.isClaimActive) && remainingSecs > 0;
  const isFocusedPassView =
    (isServerClaimActive || isClaimSessionActive) && !isPassDismissed;

  const isReleaseExpired =
    (status === 'READY_TO_CLAIM' || isFocusedPassView) &&
    remainingSecs === 0 &&
    !isClaimed &&
    !isInitiatingClaim &&
    !isRefreshingRelease;
  const isExpiringSoon =
    isFocusedPassView && !isClaimed && !isReleaseExpired && remainingSecs <= 60;

  const headerSubtitle = getStatusLabel(status);

  // Transition animation values when entering focused pass view (Ready for Release)
  const passFadeAnim = useRef(new Animated.Value(isFocusedPassView ? 1 : 0)).current;
  const passSlideAnim = useRef(new Animated.Value(isFocusedPassView ? 0 : 12)).current;

  useEffect(() => {
    if (isFocusedPassView) {
      passFadeAnim.setValue(0);
      passSlideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(passFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(passSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocusedPassView, passFadeAnim, passSlideAnim]);

  const handleCloseFocusedPass = useCallback(() => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    setIsPassDismissed(true);
    setIsClaimSessionActive(false);
  }, []);

  const isUnpaidCancelledView =
    !isFocusedPassView && (status === 'CANCELLED' || unpaidViewMode === 'cancelled');
  const isUnpaidCancelView =
    !isFocusedPassView && !isUnpaidCancelledView && unpaidViewMode === 'cancel';

  const unpaidSlideAnim = useRef(new Animated.Value(0)).current;
  const unpaidFadeAnim = useRef(new Animated.Value(1)).current;

  const animateUnpaidTransition = useCallback(
    (direction: 'forward' | 'back') => {
      unpaidSlideAnim.setValue(direction === 'forward' ? 28 : -28);
      unpaidFadeAnim.setValue(0.35);
      Animated.parallel([
        Animated.timing(unpaidSlideAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(unpaidFadeAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [unpaidSlideAnim, unpaidFadeAnim]
  );

  const handleOpenUnpaidCancel = useCallback(() => {
    setUnpaidViewMode('cancel');
    animateUnpaidTransition('forward');
  }, [animateUnpaidTransition]);

  const handleKeepUnpaidOrder = useCallback(() => {
    setUnpaidViewMode('details');
    animateUnpaidTransition('back');
  }, [animateUnpaidTransition]);

  const handleConfirmUnpaidCancel = useCallback(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setCancelledTimeFallback(now);
    setUnpaidViewMode('cancelled');
    animateUnpaidTransition('forward');
  }, [animateUnpaidTransition]);

  // Handle hardware back on Android: dismiss the pass and return to Complete Details or previous screen
  useEffect(() => {
    const onBackPress = () => {
      if (isFocusedPassView) {
        handleCloseFocusedPass();
        return true;
      }
      if (isUnpaidCancelView) {
        handleKeepUnpaidOrder();
        return true;
      }
      if (isUnpaidCancelledView) {
        navigateTo('home');
        return true;
      }
      goBack();
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [
    isFocusedPassView,
    handleCloseFocusedPass,
    isUnpaidCancelView,
    handleKeepUnpaidOrder,
    isUnpaidCancelledView,
    navigateTo,
    goBack,
  ]);

  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch]);

  const activateClaimWindow = useCallback(
    async (targetOrderId: string) => {
      const claimRes = await claimCustomerOrder(targetOrderId);
      const initialSeconds = (claimRes.durationMinutes || 5) * 60;
      startLocalWindow(initialSeconds);
      setIsPassDismissed(false);
      setIsClaimSessionActive(true);
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.orders() });
      await refetch();
    },
    [claimCustomerOrder, startLocalWindow, queryClient, refetch]
  );

  const handleInitiateClaim = useCallback(async () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    if (isInitiatingClaim || isClaimLocked || !orderId) return;

    setIsClaimLocked(true);
    setIsInitiatingClaim(true);
    try {
      await activateClaimWindow(orderId);
    } catch (err: any) {
      setIsClaimSessionActive(false);
      setIsClaimLocked(false);
      showToast(err?.message || 'Failed to initiate claim.');
    } finally {
      setIsInitiatingClaim(false);
    }
  }, [claimConfirmed, isInitiatingClaim, isClaimLocked, orderId, activateClaimWindow, showToast]);

  const handleRefreshRelease = useCallback(async () => {
    if (isRefreshingRelease || !orderId) return;
    setIsRefreshingRelease(true);
    try {
      await activateClaimWindow(orderId);
    } catch (err: any) {
      showToast(err?.message || 'Failed to refresh release window.');
    } finally {
      setIsRefreshingRelease(false);
    }
  }, [isRefreshingRelease, orderId, activateClaimWindow, showToast]);

  const handleReturnHomeFromPass = useCallback(() => {
    handleCloseFocusedPass();
    navigateTo('home');
  }, [handleCloseFocusedPass, navigateTo]);

  const handleCopyTracking = useCallback(async () => {
    if (!trackingNumber || trackingNumber === '—') return;
    try {
      await Clipboard.setStringAsync(trackingNumber);
      showToast(`Copied Tracking Number (${trackingNumber}) to clipboard!`);
    } catch {
      showToast('Failed to copy tracking number.');
    }
  }, [trackingNumber, showToast]);

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header */}
      {isFocusedPassView ? (
        <View
          style={{
            backgroundColor: '#2563EB',
            paddingTop: 36,
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
        >
          <View className="flex-row items-center justify-between relative min-h-[40px]">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseFocusedPass}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              accessibilityLabel="Go Back"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-[18px] font-bold text-white text-center">
                Ready For Release
              </Text>
              <Text className="text-[12px] font-normal text-[#DBEAFE] text-center mt-0.5">
                Pickup Pass
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('faq')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              accessibilityLabel="Help"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      ) : isUnpaidCancelView ? (
        <AppHeader
          title="Cancel Order"
          subtitle={trackingNumber}
          showBackButton
          centerTitle
          onBack={handleKeepUnpaidOrder}
        />
      ) : isUnpaidCancelledView ? (
        <AppHeader
          title="Order Cancelled"
          subtitle="No Refund Required"
          showBackButton
          centerTitle
          onBack={() => navigateTo('home')}
        />
      ) : (
        <AppHeader
          title="Complete Details"
          subtitle={headerSubtitle}
          showBackButton
          centerTitle
          onBack={goBack}
        />
      )}

      {/* Main Curved Transition Sheet */}
      <View className="flex-1 bg-[#f1f5f9] rounded-t-[24px] pt-4 overflow-hidden">
        {isFocusedPassView ? (
          <ClaimPassView
            ticketCode={ticketCode}
            orderId={orderId}
            hasOrderDetail={Boolean(orderDetail)}
            productName={productName}
            change={change}
            qrIdentifier={qrIdentifier}
            timeFormatted={timeFormatted}
            isClaimed={isClaimed}
            isReleaseExpired={isReleaseExpired}
            isExpiringSoon={isExpiringSoon}
            isRefreshingRelease={isRefreshingRelease}
            isPullRefreshing={isPullRefreshing}
            passFadeAnim={passFadeAnim}
            passSlideAnim={passSlideAnim}
            onRefresh={handlePullRefresh}
            onRefreshRelease={handleRefreshRelease}
            onReturnHome={handleReturnHomeFromPass}
          />
        ) : isUnpaidCancelView ? (
          <Animated.View
            className="flex-1"
            style={{
              opacity: unpaidFadeAnim,
              transform: [{ translateX: unpaidSlideAnim }],
            }}
          >
            <UnpaidCancelOrderView
              productName={productName}
              selectedReason={cancelReason}
              notes={cancelNotes}
              onSelectReason={setCancelReason}
              onChangeNotes={setCancelNotes}
              onConfirmCancel={handleConfirmUnpaidCancel}
              onKeepOrder={handleKeepUnpaidOrder}
            />
          </Animated.View>
        ) : isUnpaidCancelledView ? (
          <Animated.View
            className="flex-1"
            style={{
              opacity: unpaidFadeAnim,
              transform: [{ translateX: unpaidSlideAnim }],
            }}
          >
            <OrderCancelledView
              trackingNumber={trackingNumber}
              productName={productName}
              price={price}
              reason={cancelReason}
              hubOpen={hubOpen}
              statusTimeline={statusTimeline}
              cancelledTimeFallback={cancelledTimeFallback}
              onReturnHome={() => navigateTo('home')}
            />
          </Animated.View>
        ) : (
          <Animated.View
            className="flex-1"
            style={{
              opacity: unpaidFadeAnim,
              transform: [{ translateX: unpaidSlideAnim }],
            }}
          >
            <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
                tintColor="#2563eb"
                colors={['#2563eb']}
              />
            }
          >
            {/* Section 1: Order Overview Card */}
            <OrderOverviewCard
              productName={productName}
              price={price}
              recipientName={recipientName}
              trackingNumber={trackingNumber}
              status={status}
              change={change}
              onCopyTracking={handleCopyTracking}
            />

            {/* Section 2: Hub Location Card */}
            <View
              className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-3.5 flex-row items-center justify-between"
              style={{
                shadowColor: '#111827',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-[14px] font-bold text-[#111827] tracking-[-0.35px]">
                  Lily’s Catering Hub
                </Text>
                <Text className="text-[12px] text-[#64748b] font-normal mt-0.5">
                  Yati, Liloan, Cebu, 6002
                </Text>
              </View>

              <View
                className={`flex-row items-center gap-[6px] px-[13px] py-[5px] rounded-full border ${
                  hubOpen
                    ? 'bg-[#ecfdf5] border-[rgba(167,243,208,0.6)]'
                    : 'bg-[#fef2f2] border-[#fecaca]'
                }`}
              >
                <View
                  className={`w-2 h-2 rounded-full ${
                    hubOpen ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                  }`}
                />
                <Text
                  className={`text-[12px] font-semibold ${
                    hubOpen ? 'text-[#059669]' : 'text-[#dc2626]'
                  }`}
                >
                  {hubOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            {/* Section 3: Tracking Progress Card */}
            <OrderTimelineStepper
              status={status}
              statusTimeline={statusTimeline}
              onViewQr={() => navigateTo('qr_screen')}
              onOpenPod={openPodModal}
              onCancelOrder={status === 'PAYMENT_REQUIRED' ? handleOpenUnpaidCancel : undefined}
            />

            {/* Section 4: Confirmation & Dynamic Actions by Status */}
            <View className="pt-2 gap-4">
              {status === 'PAYMENT_REQUIRED' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigateTo('qr_screen')}
                  className="w-full h-[48px] rounded-[12px] bg-[#215cd4] flex-row items-center justify-center gap-2"
                  style={{
                    shadowColor: '#215cd4',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                >
                  <Text className="text-white font-bold text-[14px] tracking-[0.35px]">
                    Generate QR Pass
                  </Text>
                  <QrCodeIcon size={18} color="#ffffff" />
                </TouchableOpacity>
              )}

              {status === 'READY_TO_CLAIM' &&
                (hubOpen ? (
                  <View className="gap-3">
                    {orderDetail?.claimInitiatedAt && remainingSecs === 0 && (
                      <View className="bg-amber-50 py-2 px-3 rounded-xl border border-amber-200">
                        <Text className="text-[11px] text-amber-700 font-semibold text-center">
                          Previous claim window elapsed. Press Initiate Claim to unlock counter.
                        </Text>
                      </View>
                    )}

                    <ConfirmationSubmitSection
                      title="I confirm that I want to claim the order"
                      subtitle="Only initiate claim when you’re physically claiming at the hub"
                      buttonLabel="Initiate Claim"
                      errorMessage="Please check the confirmation box before initiating claim."
                      isChecked={claimConfirmed}
                      onCheckedChange={setClaimConfirmed}
                      onSubmit={handleInitiateClaim}
                      isLoading={isInitiatingClaim}
                      themeColor="#215cd4"
                    />
                  </View>
                ) : (
                  <View className="gap-2">
                    <Text className="text-[12px] font-normal text-[#64748b] text-center">
                      Only initiate claim when you’re physically claiming at the hub
                    </Text>
                    <View className="w-full h-[48px] rounded-[12px] bg-[#94a3b8] opacity-75 items-center justify-center">
                      <Text className="text-white font-semibold text-[14px]">
                        Cannot initiate claim when the hub is closed
                      </Text>
                    </View>
                  </View>
                ))}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('home')}
                className="items-center justify-center py-2"
              >
                <Text className="text-[12px] font-semibold text-[#475569] text-center">
                  Return to Home
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Full-Screen Loading Overlay for Claim Initiation / Refresh */}
      {(isInitiatingClaim || isRefreshingRelease) && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              marginHorizontal: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 5,
              width: 260,
            }}
          >
            <ActivityIndicator size="large" color="#2563eb" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#1e293b',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {isRefreshingRelease ? 'Refreshing Pass...' : 'Preparing Pickup Pass...'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#64748b',
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Securing claim release timer...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrderDetailsScreen;
