import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useV1 } from '../../v1/context/V1Context';
import { CustomerOrderDetail } from '../../v1/types/api';
import { CopyIcon, QrCodeIcon, ClockIcon } from '../common/Icons';
import { AppHeader } from '../layout/AppHeader';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { getStatusLabel } from '../../utils/statusHelpers';

export const OrderDetailsScreen: React.FC = () => {
  const {
    selectedOrderId,
    selectedOrderTicketCode,
    orders,
    customer,
    fetchOrderDetail,
    claimCustomerOrder,
    openPodModal,
    navigateTo,
    showToast,
  } = useV1();

  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [isInitiatingClaim, setIsInitiatingClaim] = useState<boolean>(false);
  const [isClaimLocked, setIsClaimLocked] = useState<boolean>(false);
  const [isRefreshingRelease, setIsRefreshingRelease] = useState<boolean>(false);
  const [isPassDismissed, setIsPassDismissed] = useState<boolean>(false);
  const [isClaimSessionActive, setIsClaimSessionActive] = useState<boolean>(false);

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

  // Countdown seconds timer state
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const remainingSecsRef = useRef<number>(0);
  remainingSecsRef.current = remainingSecs;

  // Polling every 5 seconds with 3-second jitter buffer per Feature #8
  useEffect(() => {
    if (!selectedOrderId) return;
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const detail = await fetchOrderDetail(selectedOrderId);
        if (!isMounted) return;
        setOrderDetail(detail);

        const serverSeconds = detail.claimRemainingSeconds ?? 0;
        if (detail.isClaimActive && serverSeconds > 0) {
          const current = remainingSecsRef.current;
          const diff = Math.abs(current - serverSeconds);
          // Only hard update if difference is > 3 seconds to avoid flicking
          if (diff > 3 || current <= 0) {
            setRemainingSecs(serverSeconds);
          }
        } else if (!detail.isClaimActive) {
          setRemainingSecs(0);
        }
      } catch {
        // Network errors handled gracefully without disrupting current view
      }
    };

    fetchOrder();
    const pollInterval = setInterval(fetchOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [selectedOrderId, fetchOrderDetail]);

  // Local 1-second countdown decrement
  useEffect(() => {
    if (remainingSecs <= 0) return;
    const timer = setInterval(() => {
      setRemainingSecs((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSecs > 0]);

  // Reset confirmation checkbox whenever the viewed order changes
  useEffect(() => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    setIsPassDismissed(false);
    setIsClaimSessionActive(false);
  }, [selectedOrderId]);

  // Memoize the SVG QR code so it doesn't recalculate every second on timer ticks
  const qrIdentifier = ticketCode || orderId || 'PARCELHUB-RELEASE';
  const memoizedQr = useMemo(
    () => (
      <QRCode
        value={qrIdentifier}
        size={210}
        color="#0f172a"
        backgroundColor="#ffffff"
      />
    ),
    [qrIdentifier]
  );

  const mm = Math.floor(remainingSecs / 60);
  const ss = remainingSecs % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

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
  const isReleaseActive = isFocusedPassView && !isClaimed && !isReleaseExpired;
  const isExpiringSoon = isReleaseActive && remainingSecs <= 60;

  // Header subtitle label derived from status helper
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
  }, [isFocusedPassView]);

  // Handle hardware back on Android: dismiss the pass and return to Complete Details
  useEffect(() => {
    if (!isFocusedPassView) return;

    const onBackPress = () => {
      handleCloseFocusedPass();
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [isFocusedPassView]);

  const handleInitiateClaim = async () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    if (isInitiatingClaim || !orderId) return;

    setIsClaimLocked(true);
    setIsInitiatingClaim(true);
    try {
      const claimRes = await claimCustomerOrder(orderId);
      const initialSeconds = (claimRes.durationMinutes || 5) * 60;
      setRemainingSecs(initialSeconds);
      setIsPassDismissed(false);
      setIsClaimSessionActive(true);
      // Fetch fresh order
      const fresh = await fetchOrderDetail(orderId);
      setOrderDetail(fresh);
    } catch (err: any) {
      setIsClaimSessionActive(false);
      showToast(err?.message || 'Failed to initiate claim.');
    } finally {
      setIsInitiatingClaim(false);
    }
  };

  const handleRefreshRelease = async () => {
    if (isRefreshingRelease || !orderId) return;
    setIsRefreshingRelease(true);
    try {
      const claimRes = await claimCustomerOrder(orderId);
      const initialSeconds = (claimRes.durationMinutes || 5) * 60;
      setRemainingSecs(initialSeconds);
      setIsPassDismissed(false);
      setIsClaimSessionActive(true);
      const fresh = await fetchOrderDetail(orderId);
      setOrderDetail(fresh);
    } catch (err: any) {
      showToast(err?.message || 'Failed to refresh release window.');
    } finally {
      setIsRefreshingRelease(false);
    }
  };

  // Close the focused pass view and remain on Complete Details
  const handleCloseFocusedPass = () => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    setIsPassDismissed(true);
    setIsClaimSessionActive(false);
  };

  // Close the focused pass view and navigate back to Home
  const handleReturnHomeFromPass = () => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    setIsPassDismissed(true);
    setIsClaimSessionActive(false);
    navigateTo('home');
  };

  const handleCopyTracking = async () => {
    if (!trackingNumber || trackingNumber === '—') return;
    try {
      await Clipboard.setStringAsync(trackingNumber);
      showToast(`Copied Tracking Number (${trackingNumber}) to clipboard!`);
    } catch {
      showToast('Failed to copy tracking number.');
    }
  };

  // Stepper timeline completion checks
  const isStep1Done =
    status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep1Active = status === 'PAYMENT_REQUIRED';

  const isStep2Done = status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep2Active = status === 'AWAITING_PARCEL';

  const isStep3Done = status === 'CLAIMED';
  const isStep3Active = status === 'READY_TO_CLAIM';

  const isStep4Done = status === 'CLAIMED';

  // Format stepper timestamps from statusTimeline
  const formatTimelineTimestamp = (statusKey: string, fallback?: string): string => {
    if (!statusTimeline || !Array.isArray(statusTimeline)) {
      return fallback || '';
    }
    const entry = (statusTimeline as any[]).find((e: any) => e.status === statusKey);
    if (!entry?.timestamp) return fallback || '';
    try {
      const d = new Date(entry.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return fallback || '';
    }
  };

  // Helper for tracking node matching Figma node 8:2
  const renderStepNode = (isDone: boolean, isActive: boolean) => {
    if (isDone) {
      return (
        <View
          className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      );
    }
    if (isActive) {
      return (
        <View
          className="w-6 h-6 rounded-full bg-[#215cd4] items-center justify-center"
          style={{
            shadowColor: '#215cd4',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="w-2.5 h-2.5 rounded-full bg-white" />
        </View>
      );
    }
    return (
      <View className="w-6 h-6 rounded-full bg-[#f1f5f9] border-2 border-[#cbd5e1] items-center justify-center" />
    );
  };

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header matching Figma node 8:3 or 1308:177 */}
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
            {/* Go Back Button */}
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

            {/* Centered Title & Subtitle */}
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-[18px] font-bold text-white text-center">
                Ready For Release
              </Text>
              <Text className="text-[12px] font-normal text-[#DBEAFE] text-center mt-0.5">
                Pickup Pass
              </Text>
            </View>

            {/* Help Button */}
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
      ) : (
        <AppHeader
          title="Complete Details"
          subtitle={headerSubtitle}
          showBackButton
          centerTitle
          onBack={() => navigateTo('home')}
        />
      )}

      {/* Main Curved Transition Sheet matching Figma node 8:13 */}
      <View className="flex-1 bg-[#f1f5f9] rounded-t-[24px] pt-4 overflow-hidden">
        {isFocusedPassView ? (
          /* Full-screen Focused Claim Pass (Ready, Claimed, and Expired states) */
          <Animated.View
            style={{
              flex: 1,
              opacity: passFadeAnim,
              transform: [{ translateY: passSlideAnim }],
            }}
          >
            <ScrollView
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
            >
              <View className="items-center">
                {/* Main PassCard: White Surface, Rounded 24px, Shadow */}
                <View
                  style={{
                    shadowColor: '#215CD4',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.08,
                    shadowRadius: 30,
                    elevation: 4,
                  }}
                  className="w-full rounded-[24px] bg-white border border-[#f1f5f9] p-5 items-center mb-4"
                >
                  {/* PassCard Header: Ticket ID */}
                  <View className="w-full pb-3 border-b border-[#e2e8f0]">
                    <Text className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase">
                      TICKET
                    </Text>
                    <Text className="text-[15px] font-bold text-[#1e293b] mt-0.5">
                      {ticketCode || (orderDetail ? orderId : '...')}
                    </Text>
                  </View>

                  {/* Scannable High-Contrast QR Code Area */}
                  <View className="w-full items-center justify-center py-2 mt-2">
                    <View
                      style={{
                        width: 197,
                        height: 209,
                      }}
                      className="bg-white rounded-[16px] p-3 items-center justify-center relative overflow-hidden"
                    >
                      <View
                        style={{
                          opacity: isReleaseExpired || isClaimed ? 0.08 : 1,
                        }}
                      >
                        {memoizedQr}
                      </View>

                      {/* Claimed Overlay Badge */}
                      {isClaimed && (
                        <View className="absolute inset-0 items-center justify-center">
                          <View
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 40,
                              backgroundColor: '#ECFDF5',
                            }}
                            className="items-center justify-center"
                          >
                            <View
                              style={{
                                width: 57.5,
                                height: 57.5,
                                borderRadius: 28.75,
                                backgroundColor: '#D1FAE5',
                              }}
                              className="items-center justify-center"
                            >
                              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                                <Path
                                  d="M5 13l4 4L19 7"
                                  stroke="#059669"
                                  strokeWidth={2.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Expired Overlay Badge */}
                      {isReleaseExpired && (
                        <View className="absolute inset-0 items-center justify-center">
                          <View
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 40,
                              backgroundColor: '#FEF2F2',
                            }}
                            className="items-center justify-center"
                          >
                            <View
                              style={{
                                width: 57.5,
                                height: 57.5,
                                borderRadius: 28.75,
                                backgroundColor: '#FEE2E2',
                              }}
                              className="items-center justify-center"
                            >
                              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                                <Path
                                  d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                  stroke="#DC2626"
                                  strokeWidth={2}
                                />
                                <Path
                                  d="M12 6v6l4 2"
                                  stroke="#DC2626"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status / Timer Container */}
                  <View className="w-full mt-2">
                    <View className="border border-[rgba(33,92,212,0.1)] rounded-[16px] py-[15px] px-4 items-center justify-center">
                      {isClaimed ? (
                        <>
                          <Text className="text-[11px] font-bold text-[#215cd4] tracking-[1.1px] uppercase">
                            STATUS
                          </Text>
                          <Text className="text-[20px] font-bold text-[#10b981] tracking-[1px] mt-0.5">
                            Claimed
                          </Text>
                        </>
                      ) : isReleaseExpired ? (
                        <>
                          <Text className="text-[11px] font-bold text-[#215cd4] tracking-[1.1px] uppercase">
                            STATUS
                          </Text>
                          <Text className="text-[20px] font-bold text-[#dc2626] tracking-[1px] mt-0.5">
                            Claim Expired
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-[11px] font-bold text-[#215cd4] tracking-[1.1px] uppercase">
                            PROCEED TO THE HUB
                          </Text>
                          <Text
                            className={`text-[20px] font-bold tracking-[1px] mt-0.5 ${
                              isExpiringSoon ? 'text-[#e11d48]' : 'text-[#1e1e1e]'
                            }`}
                          >
                            {timeFormatted}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Explanatory Instructions */}
                  <View className="mt-4 px-3 items-center">
                    {isClaimed || isReleaseExpired ? (
                      <View className="items-center">
                        <Text className="text-[13px] text-[#6b7280] text-center leading-[21px]">
                          Your order has been successfully claimed
                        </Text>
                        <Text className="text-[13px] text-[#6b7280] text-center leading-[21px]">
                          You can safely exit this page
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[13px] text-[#6b7280] text-center leading-[21px] max-w-[280px]">
                        Please wait by the counter. Show this screen only if requested by staff.
                      </Text>
                    )}
                  </View>
                </View>

                {/* Order Details Card */}
                <View
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                  className="w-full rounded-[16px] bg-white border border-[#f1f5f9] p-4 mb-4"
                >
                  <Text className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase pb-2.5 border-b border-[#f1f5f9]">
                    ORDER DETAILS
                  </Text>

                  <View className="pt-3 gap-3">
                    {/* Item Row */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[12px] text-[#64748b]">Item</Text>
                      <Text
                        numberOfLines={1}
                        className="text-[13px] font-bold text-[#1e293b] flex-1 text-right ml-4"
                      >
                        {productName}
                      </Text>
                    </View>

                    {/* Cash Change Row */}
                    <View className="flex-row items-center justify-between pt-0.5">
                      <Text className="text-[12px] text-[#64748b]">Cash Change</Text>
                      <View className="bg-[#eff6ff] px-3 py-1 rounded-[8px] items-center justify-center">
                        <Text className="text-[13px] font-bold text-[#2563eb]">
                          {`₱${change.toLocaleString('en-US')}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ReleaseTimeout Reactivate Button */}
                {isReleaseExpired && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRefreshRelease}
                    disabled={isRefreshingRelease}
                    style={{
                      shadowColor: '#2563eb',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                    className="w-full h-[46px] rounded-[12px] bg-[#2563eb] items-center justify-center mb-3"
                  >
                    {isRefreshingRelease ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-white font-bold text-[14px] text-center">
                        Re-activate Release Window
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Return to Home Action Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleReturnHomeFromPass}
                  className="w-full py-3 items-center justify-center"
                >
                  <Text className="text-[14px] font-bold text-[#334155] text-center">
                    Return to Home
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        ) : (
          /* Dedicated Complete Details Stepper Page */
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Section 1: Order Overview Card */}
            <View
              className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-3.5"
              style={{
                shadowColor: '#111827',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px] mb-3">
                ORDER OVERVIEW
              </Text>

              <View className="space-y-2.5">
                {/* 1. Product */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Product</Text>
                  <Text className="text-[14px] font-bold text-[#111827] tracking-[-0.35px]">
                    {productName}
                  </Text>
                </View>

                {/* 2. Price */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Price</Text>
                  <Text className="text-[14px] font-semibold text-[#111827]">
                    {price > 0 ? `₱${price.toLocaleString('en-US')}` : '—'}
                  </Text>
                </View>

                {/* 3. Recipient */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Recipient</Text>
                  <Text className="text-[14px] font-medium text-[#1e293b]">
                    {recipientName}
                  </Text>
                </View>

                {/* 4. Tracking Number with Copy Badge */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Tracking Number</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCopyTracking}
                    className="bg-[#f1f5f9] flex-row items-center gap-[6px] px-[10px] py-[4px] rounded-[6px]"
                  >
                    <Text className="font-mono font-bold text-[12px] text-[#334155]">
                      {trackingNumber}
                    </Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.08 2.57A2 2 0 0 0 14.65 2H10a2 2 0 0 0-2 2z"
                        stroke="#64748b"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
                        stroke="#64748b"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>

                {/* 5. Paid Amount */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Paid Amount</Text>
                  <Text className="text-[14px] font-semibold text-[#111827]">
                    {status === 'PAYMENT_REQUIRED' ? '—' : `₱${price.toLocaleString('en-US')}`}
                  </Text>
                </View>

                {/* 6. Change */}
                <View className="border-t border-[#f1f5f9] flex-row items-center justify-between pt-[11px] pb-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Change</Text>
                  <Text className="text-[14px] font-bold text-[#1e293b]">
                    {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : `₱${change.toLocaleString('en-US')}`}
                  </Text>
                </View>
              </View>
            </View>

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

              {/* Status Pill: Open / Closed */}
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
            <View
              className="bg-white border border-[#f1f5f9] rounded-[16px] p-[17px] mb-4"
              style={{
                shadowColor: '#111827',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
                  TRACKING PROGRESS
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('qr_screen')}
                  className="w-7 h-7 rounded-[8px] bg-[#f1f5f9] items-center justify-center"
                  accessibilityLabel="View QR Code"
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"
                      stroke="#475569"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Stepper Vertical Timeline */}
              <View className="relative pl-[28px]">
                {/* Stepper Vertical Connecting Line */}
                <View className="absolute bg-[#e2e8f0] bottom-[14px] left-[11px] top-[10px] w-[2px]" />

                {/* Step 1: Order Placed */}
                <View className="relative mb-6">
                  <View className="absolute left-[-28px] top-[2px]">
                    {renderStepNode(isStep1Done, isStep1Active)}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-[14px] font-bold ${
                        isStep1Active ? 'text-[#215cd4]' : 'text-[#111827]'
                      }`}
                    >
                      Order Placed
                    </Text>
                    <Text
                      className={`text-[11px] font-medium ${
                        isStep1Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
                      }`}
                    >
                      {formatTimelineTimestamp('PENDING_INITIALIZATION') ||
                        formatTimelineTimestamp('PAYMENT_REQUIRED') ||
                        'Oct 18, 12:32 AM'}
                    </Text>
                  </View>
                  <Text className="text-[12px] font-normal text-[#64748b] mt-0.5">
                    Order by the user from the app
                  </Text>
                </View>

                {/* Step 2: Awaiting Parcel */}
                <View className="relative mb-6">
                  <View className="absolute left-[-28px] top-[2px]">
                    {renderStepNode(isStep2Done, isStep2Active)}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-[14px] font-bold ${
                        isStep2Active
                          ? 'text-[#215cd4]'
                          : isStep2Done
                          ? 'text-[#111827]'
                          : 'text-[#475569]'
                      }`}
                    >
                      Awaiting Parcel
                    </Text>
                    {(isStep2Done || isStep2Active) && (
                      <Text
                        className={`text-[11px] font-medium ${
                          isStep2Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
                        }`}
                      >
                        {formatTimelineTimestamp('AWAITING_PARCEL') || '02:32 AM'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-[12px] font-normal mt-0.5 ${
                      isStep2Active || isStep2Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
                    }`}
                  >
                    The hub is actively waiting for the product
                  </Text>
                </View>

                {/* Step 3: Ready to Claim */}
                <View className="relative mb-6">
                  <View className="absolute left-[-28px] top-[2px]">
                    {renderStepNode(isStep3Done, isStep3Active)}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-[14px] font-bold ${
                        isStep3Active
                          ? 'text-[#215cd4]'
                          : isStep3Done
                          ? 'text-[#111827]'
                          : 'text-[#475569]'
                      }`}
                    >
                      Ready to Claim
                    </Text>
                    {(isStep3Done || isStep3Active) && (
                      <Text
                        className={`text-[11px] font-semibold ${
                          isStep3Active ? 'text-[#215cd4]' : 'text-[#94a3b8]'
                        }`}
                      >
                        {formatTimelineTimestamp('READY_TO_CLAIM') || '06:32 AM'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-[12px] font-normal mt-0.5 ${
                      isStep3Active ? 'text-[#475569]' : isStep3Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
                    }`}
                  >
                    The product already is in the hub, waiting for claim
                  </Text>

                  {/* Proof of Delivery Link */}
                  {(isStep3Active || isStep3Done) && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={openPodModal}
                      className="flex-row items-center pt-[9px] pb-[3px]"
                    >
                      <Text className="text-[12px] font-semibold text-[#215cd4] mr-1">
                        View Proof of Delivery
                      </Text>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M9 18l6-6-6-6"
                          stroke="#215cd4"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Step 4: Parcel Claimed */}
                <View className={`relative ${isStep4Done ? '' : 'opacity-60'}`}>
                  <View className="absolute left-[-28px] top-[2px]">
                    {renderStepNode(isStep4Done, false)}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-[14px] font-medium ${
                        isStep4Done ? 'text-[#111827] font-bold' : 'text-[#475569]'
                      }`}
                    >
                      Parcel Claimed
                    </Text>
                    {isStep4Done && (
                      <Text className="text-[11px] font-medium text-[#94a3b8]">
                        {formatTimelineTimestamp('CLAIMED') || 'Oct 18, 08:11 AM'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-[12px] font-normal mt-0.5 ${
                      isStep4Done ? 'text-[#64748b]' : 'text-[#94a3b8]'
                    }`}
                  >
                    {isStep4Done
                      ? 'Handover verified. Cash change returned.'
                      : 'Confirmation pending customer claim'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 4: Confirmation & Dynamic Actions by Status */}
            <View className="pt-2 gap-4">
              {/* Payment Required State Action */}
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

              {/* Ready to Claim State Action */}
              {status === 'READY_TO_CLAIM' &&
                (hubOpen ? (
                  <View className="gap-3">
                    {/* Previous Window Elapsed Note */}
                    {orderDetail?.claimInitiatedAt && remainingSecs === 0 && (
                      <View className="bg-amber-50 py-2 px-3 rounded-xl border border-amber-200">
                        <Text className="text-[11px] text-amber-700 font-semibold text-center">
                          Previous claim window elapsed. Press Initiate Claim to unlock counter.
                        </Text>
                      </View>
                    )}

                    {/* Confirmation & Initiate Claim Action Section */}
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
                    <Text className="text-[12px] text-[#64748b] text-center">
                      Only initiate claim when you’re physically claiming at the hub
                    </Text>
                    <View className="w-full h-[48px] rounded-[12px] bg-[#94a3b8] opacity-75 items-center justify-center">
                      <Text className="text-white font-semibold text-[14px]">
                        Cannot initiate claim when the hub is closed
                      </Text>
                    </View>
                  </View>
                ))}

              {/* Return to Home Secondary Button */}
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
