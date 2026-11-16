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
import { useApp } from '../../context/AppContext';
import { CopyIcon, QrCodeIcon, ClockIcon } from '../common/Icons';
import { AppHeader } from '../layout/AppHeader';
import { getStatusLabel } from '../../utils/statusHelpers';

export const OrderDetailsScreen: React.FC = () => {
  const {
    getCurrentOrder,
    hubOpen,
    navigateTo,
    copyToClipboard,
    openProofOfDeliveryModal,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    showToast,
    activeClaimPassOrderId,
    dismissedClaimPasses,
    openClaimPass,
    closeClaimPass,
  } = useApp();

  const order = getCurrentOrder();
  const status = order.status;

  // Memoize the SVG QR code so it doesn't recalculate every second on timer ticks
  const memoizedQr = useMemo(
    () => (
      <QRCode
        value={order.id || 'PARCELHUB-RELEASE'}
        size={210}
        color="#0f172a"
        backgroundColor="#ffffff"
      />
    ),
    [order.id]
  );

  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [isInitiatingClaim, setIsInitiatingClaim] = useState<boolean>(false);
  const [isClaimLocked, setIsClaimLocked] = useState<boolean>(false);
  const [isRefreshingRelease, setIsRefreshingRelease] = useState<boolean>(false);

  // Reset confirmation checkbox whenever the viewed order changes
  useEffect(() => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
  }, [order.id]);

  const isClaimActive = isOrderClaimUnlocked(order);
  const remainingSecs = getOrderClaimRemainingSeconds(order);
  const mm = Math.floor(remainingSecs / 60);
  const ss = remainingSecs % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  // State calculations for the focused release / claim view
  const isClaimed = status === 'CLAIMED';

  // Focused release pass is ONLY visible when explicitly initiated by the user for this order
  // and has not been closed/dismissed. Once closed, neither Claimed nor Expired pass displays again.
  const isPassActiveForThisOrder = activeClaimPassOrderId === order.id;
  const isPassDismissed = Boolean(dismissedClaimPasses[order.id]);
  const isFocusedPassView = isPassActiveForThisOrder && !isPassDismissed;

  const isReleaseExpired =
    (status === 'READY_TO_CLAIM' || isFocusedPassView) && remainingSecs === 0 && !isClaimed;
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
  }, [isFocusedPassView, order.id, closeClaimPass]);

  const handleInitiateClaim = async () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    if (isInitiatingClaim) return;

    setIsClaimLocked(true);
    setIsInitiatingClaim(true);
    try {
      openClaimPass(order.id);
      await Promise.all([
        customerInitiateClaim(order.id),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    } catch {
      closeClaimPass(order.id);
      // Handled in context toast
    } finally {
      setIsInitiatingClaim(false);
    }
  };

  const handleRefreshRelease = async () => {
    if (isRefreshingRelease) return;
    setIsRefreshingRelease(true);
    try {
      openClaimPass(order.id);
      await customerInitiateClaim(order.id);
    } catch {
      // Handled in context toast
    } finally {
      setIsRefreshingRelease(false);
    }
  };

  // Close the focused pass view and remain on Complete Details (Figma 8:2)
  const handleCloseFocusedPass = () => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    closeClaimPass(order.id);
  };

  // Close the focused pass view and navigate back to Home
  const handleReturnHomeFromPass = () => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    closeClaimPass(order.id);
    navigateTo('home');
  };

  // Stepper completion checks
  const isStep1Done =
    status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep1Active = status === 'PAYMENT_REQUIRED';

  const isStep2Done = status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep2Active = status === 'AWAITING_PARCEL';

  const isStep3Done = status === 'CLAIMED';
  const isStep3Active = status === 'READY_TO_CLAIM';

  const isStep4Done = status === 'CLAIMED';

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
          /* Full-screen Focused Claim Pass (Ready, Claimed, and Expired states - Figma 1308:177, 1309:187, 1309:235) */
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
                      {order.id}
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

                      {/* Claimed Overlay Badge - Figma 1309:187 Frame 3 (80x80) */}
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

                      {/* Expired Overlay Badge - Figma 1309:235 Frame 3 (80x80) */}
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

                {/* ClaimSuccess_OrderCard (Figma 1308:231, 1309:214, 1309:262) */}
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
                        {order.product}
                      </Text>
                    </View>

                    {/* Cash Change Row */}
                    <View className="flex-row items-center justify-between pt-0.5">
                      <Text className="text-[12px] text-[#64748b]">Cash Change</Text>
                      <View className="bg-[#eff6ff] px-3 py-1 rounded-[8px] items-center justify-center">
                        <Text className="text-[13px] font-bold text-[#2563eb]">
                          {order.change || '₱20'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ReleaseTimeout_Button_Reactivate (Only in Expired state - Figma 1309:290) */}
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

                {/* Return to Home Action Button (Figma 1308:288, 1309:223, 1309:271) */}
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
          /* Dedicated Complete Details Stepper Page (Figma node 8:2) */
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Section 1: Order Overview Card (Figma node 8:14) */}
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
                    {order.product}
                  </Text>
                </View>

                {/* 2. Price */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Price</Text>
                  <Text className="text-[14px] font-semibold text-[#111827]">
                    {order.codAmount || '—'}
                  </Text>
                </View>

                {/* 3. Recipient */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Recipient</Text>
                  <Text className="text-[14px] font-medium text-[#1e293b]">
                    {order.recipient}
                  </Text>
                </View>

                {/* 4. Tracking Number with Copy Badge */}
                <View className="flex-row items-center justify-between py-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Tracking Number</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                    className="bg-[#f1f5f9] flex-row items-center gap-[6px] px-[10px] py-[4px] rounded-[6px]"
                  >
                    <Text className="font-mono font-bold text-[12px] text-[#334155]">
                      {order.trackingNumber}
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
                    {order.paidAmount || '—'}
                  </Text>
                </View>

                {/* 6. Change */}
                <View className="border-t border-[#f1f5f9] flex-row items-center justify-between pt-[11px] pb-[2px]">
                  <Text className="text-[14px] text-[#64748b] font-normal">Change</Text>
                  <Text className="text-[14px] font-bold text-[#1e293b]">
                    {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : order.change || '₱0'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 2: Hub Location Card (Figma node 8:52) */}
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

            {/* Section 3: Tracking Progress Card (Figma node 8:63) */}
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
                      {order.orderPlacedTime || 'Oct 18, 12:32 AM'}
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
                        {order.awaitingParcelTime || '02:32 AM'}
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
                        {order.readyToClaimTime || '06:32 AM'}
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
                      onPress={openProofOfDeliveryModal}
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
                        {order.claimedTime || 'Oct 18, 08:11 AM'}
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
                    {/* Confirmation Checkbox matching Figma node 8:117 */}
                    <TouchableOpacity
                      activeOpacity={isClaimLocked || isInitiatingClaim ? 1 : 0.8}
                      disabled={isClaimLocked || isInitiatingClaim}
                      onPress={() => {
                        if (!isClaimLocked && !isInitiatingClaim) {
                          setClaimConfirmed(!claimConfirmed);
                        }
                      }}
                      className="flex-row items-start gap-3 px-1"
                    >
                      <View
                        className={`w-[22px] h-[22px] rounded-[4px] items-center justify-center mt-0.5 border ${
                          claimConfirmed
                            ? 'bg-[#215cd4] border-[#215cd4]'
                            : 'border-[#cbd5e1] bg-white'
                        }`}
                      >
                        {claimConfirmed && (
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M20 6L9 17L4 12"
                              stroke="#ffffff"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-bold text-[#111827]">
                          I confirm that I want to claim the order
                        </Text>
                        <Text className="text-[12px] text-[#64748b] font-normal leading-[16.5px] mt-0.5">
                          Only initiate claim when you’re physically claiming at the hub
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Previous Window Elapsed Note */}
                    {order.claimInitiatedAt && remainingSecs === 0 && (
                      <View className="bg-amber-50 py-2 px-3 rounded-xl border border-amber-200">
                        <Text className="text-[11px] text-amber-700 font-semibold text-center">
                          Previous claim window elapsed. Press Initiate Claim to unlock counter.
                        </Text>
                      </View>
                    )}

                    {/* Primary Claim Button matching Figma node 8:127 */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleInitiateClaim}
                      disabled={!claimConfirmed || isInitiatingClaim}
                      className={`w-full h-[48px] rounded-[12px] items-center justify-center ${
                        !claimConfirmed
                          ? 'bg-[#cbd5e1]'
                          : isInitiatingClaim
                          ? 'bg-[#215cd4] opacity-85'
                          : 'bg-[#215cd4]'
                      }`}
                      style={
                        claimConfirmed
                          ? {
                              shadowColor: '#215cd4',
                              shadowOffset: { width: 0, height: 8 },
                              shadowOpacity: 0.35,
                              shadowRadius: 20,
                              elevation: 4,
                            }
                          : undefined
                      }
                    >
                      {isInitiatingClaim ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text
                          className={`font-bold text-[14px] tracking-[0.35px] text-center ${
                            claimConfirmed ? 'text-white' : 'text-[#64748b]'
                          }`}
                        >
                          Initiate Claim
                        </Text>
                      )}
                    </TouchableOpacity>
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

              {/* Return to Home Secondary Button matching Figma node 8:130 */}
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
    </View>
  );
};

export default OrderDetailsScreen;
