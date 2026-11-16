import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
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
    seenClaimedPassOrders,
    markClaimedPassSeen,
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
  const hasSeenClaimedPass = Boolean(seenClaimedPassOrders[order.id]);

  // Show the Claimed QR pass only once right after handover; subsequent visits open the dedicated Complete Details stepper page
  const isClaimedPassVisible = isClaimed && !hasSeenClaimedPass;
  const isReleaseActive = status === 'READY_TO_CLAIM' && isClaimActive && remainingSecs > 0;
  const isReleaseExpired =
    status === 'READY_TO_CLAIM' && Boolean(order.claimInitiatedAt) && remainingSecs === 0;
  const isExpiringSoon = isReleaseActive && remainingSecs <= 60;

  // Whether to show the focused release/claim pass vs the dedicated complete details page
  const isFocusedPassView = isReleaseActive || isReleaseExpired || isClaimedPassVisible;

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

  const handleInitiateClaim = async () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    if (isInitiatingClaim) return;

    setIsClaimLocked(true);
    setIsInitiatingClaim(true);
    try {
      await Promise.all([
        customerInitiateClaim(order.id),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    } catch {
      // Handled in context toast
    } finally {
      setIsInitiatingClaim(false);
    }
  };

  const handleRefreshRelease = async () => {
    if (isRefreshingRelease) return;
    setIsRefreshingRelease(true);
    try {
      await customerInitiateClaim(order.id);
    } catch {
      // Handled in context toast
    } finally {
      setIsRefreshingRelease(false);
    }
  };

  const handleExitFocusedPass = () => {
    setClaimConfirmed(false);
    setIsClaimLocked(false);
    setIsInitiatingClaim(false);
    if (isClaimed) {
      markClaimedPassSeen(order.id);
    }
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

      {/* Top Header matching Figma node 8:3 */}
      <AppHeader
        title="Complete Details"
        subtitle={headerSubtitle}
        showBackButton
        centerTitle
        onBack={() => navigateTo('home')}
      />

      {/* Main Curved Transition Sheet matching Figma node 8:13 */}
      <View className="flex-1 bg-[#f1f5f9] rounded-t-[24px] pt-4 overflow-hidden">
        {isFocusedPassView ? (
          /* Full-screen Focused Claim Pass (Ready, Expiring Soon, Expired, and Claimed states) */
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
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View className="items-center py-4">
                {/* Hero Status Callout Badge */}
                <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-3">
                  <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Text className="text-xs font-bold text-emerald-700 tracking-wide">
                    {isClaimed
                      ? 'PARCEL CLAIMED'
                      : isReleaseExpired
                      ? 'RELEASE EXPIRED'
                      : isExpiringSoon
                      ? 'EXPIRING SOON'
                      : 'PASS UNLOCKED'}
                  </Text>
                </View>

                <Text className="text-2xl font-black text-gray-900 tracking-tight text-center">
                  {isClaimed
                    ? 'Claim Successful!'
                    : isReleaseExpired
                    ? 'Release Timed Out'
                    : 'Ready for Release'}
                </Text>

                <Text className="text-xs text-gray-500 font-medium text-center mt-1 max-w-[280px]">
                  {isClaimed
                    ? 'The hub manager has verified your identity and released the parcel.'
                    : isReleaseExpired
                    ? 'Your release window elapsed. Tap refresh to unlock a new 5-minute counter.'
                    : 'Show this QR pass or Ticket ID to the hub operator at the counter.'}
                </Text>

                {/* Main QR Card */}
                <View
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                  className="w-full max-w-[320px] rounded-3xl bg-white border border-[#f0f1f3] p-6 items-center mt-5 mb-4"
                >
                  <View className="items-center mb-3">
                    <Text className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                      TICKET ID
                    </Text>
                    <Text className="text-base font-bold font-mono text-[#0f172a] mt-0.5">
                      {order.id}
                    </Text>
                  </View>

                  <View
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    className="w-[230px] h-[230px] rounded-2xl bg-white border border-[#f0f1f3] p-4 items-center justify-center relative overflow-hidden"
                  >
                    <View
                      style={{
                        opacity: isReleaseExpired || isClaimed ? 0.1 : 1,
                      }}
                    >
                      {memoizedQr}
                    </View>

                    {/* Expired Overlay */}
                    {isReleaseExpired && (
                      <View className="absolute inset-0 bg-white/95 items-center justify-center p-4">
                        <ClockIcon size={40} color="#e11d48" />
                        <Text className="text-sm font-bold text-rose-600 mt-2 text-center">
                          Pass Expired
                        </Text>
                        <Text className="text-[11px] text-gray-500 text-center mt-1">
                          Press refresh below to regenerate
                        </Text>
                      </View>
                    )}

                    {/* Claimed Overlay */}
                    {isClaimed && (
                      <View className="absolute inset-0 bg-white/95 items-center justify-center p-4">
                        <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mb-2">
                          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M20 6L9 17L4 12"
                              stroke="#059669"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                        <Text className="text-sm font-bold text-emerald-700 text-center">
                          Claim Verified
                        </Text>
                        <Text className="text-[11px] text-gray-500 text-center mt-0.5">
                          {order.claimedTime || 'Handover Complete'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 5-minute Countdown Timer (Only when release is active) */}
                  {isReleaseActive && (
                    <View
                      className={`mt-4 px-4 py-2 rounded-xl flex-row items-center gap-2 ${
                        isExpiringSoon
                          ? 'bg-rose-50 border border-rose-200'
                          : 'bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      <ClockIcon size={16} color={isExpiringSoon ? '#e11d48' : '#059669'} />
                      <Text
                        className={`text-xs font-mono font-bold ${
                          isExpiringSoon ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
                        }`}
                      >
                        {timeFormatted} remaining
                      </Text>
                    </View>
                  )}
                </View>

                {/* Refresh Release Window Button (Only if Expired) */}
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
                    className="w-full max-w-[320px] py-3.5 px-6 rounded-2xl bg-[#2563eb] flex-row items-center justify-center gap-2 mb-4"
                  >
                    {isRefreshingRelease ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                            stroke="#ffffff"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                        <Text className="text-white font-bold text-sm tracking-wide">
                          Unlock New 5-Minute Pass
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Order Summary Card */}
                <View className="w-full max-w-[320px] rounded-2xl bg-white border border-[#f1f5f9] p-4 gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-gray-500 font-normal">Item</Text>
                    <Text className="text-sm font-bold text-[#0f172a]">{order.product}</Text>
                  </View>

                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs text-gray-500 font-normal">Cash Change</Text>
                    <Text className="text-sm font-bold text-[#2563eb] font-mono">
                      {order.change || '₱0.00'}
                    </Text>
                  </View>
                </View>

                {/* Return to Home Action Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleExitFocusedPass}
                  className="w-full max-w-[320px] py-3.5 mt-4 items-center justify-center rounded-xl"
                >
                  <Text className="text-sm font-semibold text-[#64748b]">
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
                    {order.claimInitiatedAt && (
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
