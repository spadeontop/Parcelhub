import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BackArrowIcon, CopyIcon, QrCodeIcon } from '../common/Icons';

export const OrderDetailsScreen: React.FC = () => {
  const {
    getCurrentOrder,
    hubOpen,
    claimConfirmed,
    setClaimConfirmed,
    navigateTo,
    copyToClipboard,
    openProofOfDeliveryModal,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    showToast,
  } = useApp();

  const order = getCurrentOrder();
  const status = order.status;

  const isClaimActive = isOrderClaimUnlocked(order);
  const remainingSecs = getOrderClaimRemainingSeconds(order);
  const mm = Math.floor(remainingSecs / 60);
  const ss = remainingSecs % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  // Banner styles depending on status
  let bannerBg = 'bg-[#c58b12]'; // Default Gold for Payment Required
  let bannerTitle = 'Complete Details';
  let bannerSubtitle = 'Payment Required';

  if (status === 'AWAITING_PARCEL') {
    bannerBg = 'bg-[#1b65e8]';
    bannerSubtitle = 'Awaiting Parcel';
  } else if (status === 'READY_TO_CLAIM') {
    bannerBg = 'bg-[#10b780]';
    bannerSubtitle = 'Ready To Claim';
  } else if (status === 'CLAIMED') {
    bannerBg = 'bg-white border-b border-gray-100';
    bannerSubtitle = 'Claimed';
  }

  const handleInitiateClaim = () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    customerInitiateClaim(order.id);
  };

  // Stepper completion checks
  const isStep1Done = status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep1Active = status === 'PAYMENT_REQUIRED';

  const isStep2Done = status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep2Active = status === 'AWAITING_PARCEL';

  const isStep3Done = status === 'CLAIMED';
  const isStep3Active = status === 'READY_TO_CLAIM';

  const isStep4Done = status === 'CLAIMED';

  // Helper for tracking node (hollow green check for completed)
  const renderStepNode = (isDone: boolean, isActive: boolean, activeColor: string, activeRing: string) => {
    if (isDone) {
      return (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            borderWidth: 2,
            borderColor: '#10b780',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#10b780', fontSize: 11, fontWeight: 'bold', lineHeight: 12 }}>✓</Text>
        </View>
      );
    }
    if (isActive) {
      return (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: activeColor,
            borderWidth: 3,
            borderColor: activeRing,
          }}
        />
      );
    }
    return (
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#ffffff',
          borderWidth: 2,
          borderColor: '#cbd5e1',
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white">
      {isClaimActive ? (
        /* Focused Active Claim Counter Pass */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Top Emerald Status Banner */}
          <View className="bg-[#10b780] py-4 px-5 items-center relative">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('home')}
              className="absolute left-4 top-4 w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center"
              accessibilityLabel="Back to Home"
            >
              <BackArrowIcon size={16} color="#ffffff" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-white/20">
              <View className="w-2 h-2 rounded-full bg-white" />
              <Text className="text-white text-xs font-bold font-mono">
                Claim Window Active: {timeFormatted}
              </Text>
            </View>

            <Text className="text-xl font-bold text-white tracking-tight mt-2 text-center">
              Staff counter unlocked!
            </Text>
            <Text className="text-xs text-white/90 text-center leading-relaxed mt-1 max-w-xs">
              Claiming is now valid. Staff can now interact with your order and release your package.
            </Text>
          </View>

          {/* Minimal Essential Content - Single Glance */}
          <View className="px-4 pt-4 pb-6 space-y-3.5">
            <Text className="text-xs font-semibold text-center text-[#10b780]">
              Present this pass or your pickup key to the counter staff.
            </Text>

            {/* Minimal Essential Order Card */}
            <View className="bg-[#f8fafc] rounded-2xl border border-gray-200 p-4 shadow-sm mb-3.5">
              <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Product
              </Text>
              <Text className="text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {order.product}
              </Text>

              <View className="flex-row justify-between pt-2.5 border-t border-gray-200 mt-2.5">
                <View>
                  <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    TICKET
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Text className="text-base font-black font-mono text-[#163b86] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {order.alphanumericKey}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(order.alphanumericKey, 'Ticket')}
                      className="p-1 rounded-lg"
                      accessibilityLabel="Copy Ticket"
                    >
                      <CopyIcon size={14} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Cash Change
                  </Text>
                  <Text className="text-lg font-black font-mono text-[#10b780] mt-1">
                    {order.change || '₱0.00'}
                  </Text>
                </View>
              </View>

              <View className="pt-2 border-t border-gray-200 mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">
                  Tracking ID: <Text className="font-mono font-medium text-gray-700">{order.trackingNumber}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                  className="p-0.5"
                  accessibilityLabel="Copy Tracking Number"
                >
                  <CopyIcon size={14} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            {/* View QR Code Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('qr_screen')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1b65e8] active:bg-[#1652be] shadow-md flex-row items-center justify-center gap-2 mb-3"
            >
              <Text className="text-white font-bold text-sm tracking-wide">
                View QR Code
              </Text>
              <QrCodeIcon size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Footer Hub Info & Return to Home */}
            <View className="pt-3 pb-1">
              <Text className="text-center text-xs text-gray-500 mb-2">
                📍 Lily’s Catering Hub • Yati, Liloan
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo('home')}
                className="items-center py-1"
              >
                <Text className="text-sm font-semibold text-gray-700">
                  Return to Home
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Normal Progress Stepper & Action Area when not claim active */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Top Colored Status Banner with Circular Back Button */}
          <View className={`${bannerBg} py-5 px-6 items-center relative shadow-xs`}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('home')}
              className={`absolute left-4 top-4 w-8 h-8 rounded-full items-center justify-center ${
                status === 'CLAIMED'
                  ? 'bg-gray-100 border border-gray-200'
                  : 'bg-white/20 border border-white/30'
              }`}
              accessibilityLabel="Back to Home"
            >
              <BackArrowIcon size={16} color={status === 'CLAIMED' ? '#181b20' : '#ffffff'} />
            </TouchableOpacity>

            <Text
              className={`text-2xl font-bold tracking-tight ${
                status === 'CLAIMED' ? 'text-gray-900' : 'text-white'
              }`}
            >
              {bannerTitle}
            </Text>
            <Text
              className={`text-sm font-medium mt-0.5 ${
                status === 'CLAIMED' ? 'text-gray-500' : 'text-white/90'
              }`}
            >
              {bannerSubtitle}
            </Text>
          </View>

          <View className="px-4 pt-4 pb-8">
            {/* Card 1: Order Overview */}
            <View
              style={{
                marginBottom: 14,
                backgroundColor: '#fafbfd',
                borderColor: '#f1f5f9',
              }}
              className="rounded-2xl border p-4"
            >
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                ORDER OVERVIEW
              </Text>

              {/* 1. Product */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Product</Text>
                <Text className="text-sm font-bold text-gray-900">{order.product}</Text>
              </View>

              {/* 2. Price */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Price</Text>
                <Text className="text-xs font-bold font-mono text-gray-900">
                  {order.codAmount || '—'}
                </Text>
              </View>

              {/* 3. Recipient */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Recipient</Text>
                <Text className="text-xs font-semibold text-gray-800">{order.recipient}</Text>
              </View>

              {/* 4. Tracking Number */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Tracking Number</Text>
                <View className="flex-row items-center gap-1.5 bg-gray-200 px-2 py-0.5 rounded-md">
                  <Text className="text-xs font-mono font-semibold text-gray-900">
                    {order.trackingNumber}
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                    className="p-0.5"
                    accessibilityLabel="Copy Tracking Number"
                  >
                    <CopyIcon size={12} color="#4b5563" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. Paid Amount */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Paid Amount</Text>
                <Text className="text-xs font-bold font-mono text-gray-900">
                  {order.paidAmount || '—'}
                </Text>
              </View>

              {/* 6. Change */}
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-gray-500 font-medium">Change</Text>
                <Text className="text-xs font-bold font-mono text-gray-900">
                  {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : order.change}
                </Text>
              </View>
            </View>

            {/* Card 2: Pick-up Hub Location */}
            <View
              style={{
                marginBottom: 14,
                backgroundColor: '#fafbfd',
                borderColor: '#f1f5f9',
              }}
              className="rounded-2xl border p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-900">Lily’s Catering Hub</Text>
                <View className="flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}`}
                  />
                  <Text
                    className={`text-[11px] font-bold ${hubOpen ? 'text-emerald-700' : 'text-red-600'}`}
                  >
                    {hubOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500 mt-1">Yati, Liloan, Cebu, 6002</Text>
            </View>

            {/* Card 3: Tracking Progress Stepper */}
            <View
              style={{
                marginBottom: 14,
                backgroundColor: '#fafbfd',
                borderColor: '#f1f5f9',
              }}
              className="rounded-2xl border p-4"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  TRACKING PROGRESS
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('qr_screen')}
                  className="p-1 rounded bg-gray-100"
                  accessibilityLabel="View QR Code"
                >
                  <QrCodeIcon size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Vertical Timeline Stepper */}
              <View className="relative pl-7">
                <View
                  style={{
                    position: 'absolute',
                    left: 9,
                    top: 6,
                    bottom: 12,
                    width: 2,
                    backgroundColor: '#e2e8f0',
                  }}
                />

                {/* Step 1: Order Placed */}
                <View className="relative mb-5">
                  <View
                    style={{
                      position: 'absolute',
                      left: -28,
                      top: 1,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderStepNode(isStep1Done, isStep1Active, '#c58b12', '#fef08a')}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-sm font-bold ${
                        isStep1Active ? 'text-[#c58b12]' : 'text-gray-900'
                      }`}
                    >
                      Order Placed
                    </Text>
                    <Text
                      className={`text-[11px] font-mono ${
                        isStep1Active ? 'text-[#c58b12] font-bold' : 'text-gray-500'
                      }`}
                    >
                      {order.orderPlacedTime}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 mt-0.5">Order by the user from the app</Text>
                </View>

                {/* Step 2: Awaiting Parcel */}
                <View className="relative mb-5">
                  <View
                    style={{
                      position: 'absolute',
                      left: -28,
                      top: 1,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderStepNode(isStep2Done, isStep2Active, '#1b65e8', '#bfdbfe')}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-sm font-bold ${
                        isStep2Active
                          ? 'text-[#1b65e8]'
                          : isStep2Done
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      Awaiting Parcel
                    </Text>
                    {(isStep2Done || isStep2Active) && (
                      <Text
                        className={`text-[11px] font-mono ${
                          isStep2Active ? 'text-[#1b65e8] font-bold' : 'text-gray-500'
                        }`}
                      >
                        {order.awaitingParcelTime || '17 Oct 18:32'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-xs mt-0.5 ${
                      isStep2Active || isStep2Done ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    The hub is actively waiting for the product
                  </Text>
                </View>

                {/* Step 3: Ready to Claim */}
                <View className="relative mb-5">
                  <View
                    style={{
                      position: 'absolute',
                      left: -28,
                      top: 1,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderStepNode(isStep3Done, isStep3Active, '#10b780', '#bbf7d0')}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-sm font-bold ${
                        isStep3Active
                          ? 'text-[#10b780]'
                          : isStep3Done
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      Ready to Claim
                    </Text>
                    {(isStep3Done || isStep3Active) && (
                      <Text
                        className={`text-[11px] font-mono ${
                          isStep3Active ? 'text-[#10b780] font-bold' : 'text-gray-500'
                        }`}
                      >
                        {order.readyToClaimTime || '17 Oct 22:32'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={`text-xs mt-0.5 ${
                      isStep3Active || isStep3Done ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    The product already is in the hub, waiting for claim
                  </Text>
                  {(isStep3Active || isStep3Done) && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={openProofOfDeliveryModal}
                      className="mt-1"
                    >
                      <Text className="text-xs font-semibold text-[#1b65e8]">
                        View Proof of Delivery
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Step 4: Parcel Claimed */}
                <View className="relative">
                  <View
                    style={{
                      position: 'absolute',
                      left: -28,
                      top: 1,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderStepNode(isStep4Done, false, '#10b780', '#bbf7d0')}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text
                      className={`text-sm font-bold ${
                        isStep4Done ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      Parcel Claimed
                    </Text>
                    {isStep4Done && (
                      <Text className="text-[11px] font-mono text-gray-500">
                        {order.claimedTime || '18 Oct 08:11'}
                      </Text>
                    )}
                  </View>
                  {isStep4Done && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      Handover verified. Cash change returned.
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Dynamic Action Area by Status */}
            <View className="pt-1 space-y-3">
              {status === 'PAYMENT_REQUIRED' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigateTo('qr_screen')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#1b65e8] active:bg-[#1652be] shadow-md flex-row items-center justify-center gap-2"
                >
                  <Text className="text-white font-bold text-sm tracking-wide">
                    Generate QR
                  </Text>
                  <QrCodeIcon size={20} color="#ffffff" />
                </TouchableOpacity>
              )}

              {status === 'READY_TO_CLAIM' &&
                (hubOpen ? (
                  <View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setClaimConfirmed(!claimConfirmed)}
                      style={{ marginBottom: 14 }}
                      className="flex-row items-start gap-2.5 pt-1"
                    >
                      <View
                        className={`w-4 h-4 mt-0.5 rounded border items-center justify-center ${
                          claimConfirmed ? 'bg-[#1b65e8] border-[#1b65e8]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {claimConfirmed && (
                          <Text className="text-white text-[10px] font-bold">✓</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">
                          I confirm that I want to claim the order
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Only initiate claim when you’re physically claiming at the hub
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View>
                      {order.claimInitiatedAt && (
                        <View className="bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-200 mb-2.5">
                          <Text className="text-xs text-amber-600 font-semibold text-center">
                            Previous claim window elapsed. Press Initiate Claim to unlock counter.
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleInitiateClaim}
                        disabled={!claimConfirmed}
                        className={`w-full py-3.5 px-6 rounded-2xl shadow-md items-center justify-center ${
                          claimConfirmed ? 'bg-[#1b65e8] active:bg-[#1652be]' : 'bg-gray-300 opacity-80'
                        }`}
                      >
                        <Text className="text-white font-bold text-sm tracking-wide text-center">
                          Initiate Claim
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="space-y-2">
                    <Text className="text-xs text-gray-500 text-center">
                      Only initiate claim when you’re physically claiming at the hub
                    </Text>
                    <View className="w-full py-3.5 px-6 rounded-2xl bg-[#647b92] opacity-80 items-center justify-center">
                      <Text className="text-white font-semibold text-sm tracking-wide text-center">
                        Cannot initiate claim when the hub is closed
                      </Text>
                    </View>
                  </View>
                ))}

              {/* Return to Home link */}
              <View className="items-center pt-2 pb-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('home')}
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    Return to Home
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default OrderDetailsScreen;
