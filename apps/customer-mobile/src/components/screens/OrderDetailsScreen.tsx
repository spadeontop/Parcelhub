import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BackArrowIcon, CopyIcon, QrCodeIcon } from '../common/Icons';

export const OrderDetailsScreen: React.FC = () => {
  const {
    getCurrentOrder,
    claimConfirmed,
    setClaimConfirmed,
    navigateTo,
    copyToClipboard,
    openProofOfDeliveryModal,
    openEscrowModal,
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

  let bannerBg = 'bg-[#c58b12]';
  let bannerSubtitle = 'Payment Required';

  if (status === 'AWAITING_PARCEL') {
    bannerBg = 'bg-[#215cd4]';
    bannerSubtitle = 'Awaiting Parcel';
  } else if (status === 'READY_TO_CLAIM') {
    bannerBg = 'bg-[#10b780]';
    bannerSubtitle = 'Ready To Claim';
  } else if (status === 'CLAIMED') {
    bannerBg = 'bg-gray-800';
    bannerSubtitle = 'Claimed';
  }

  const handleInitiateClaim = () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    customerInitiateClaim(order.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white">
      {isClaimActive ? (
        /* Focused Active Claim Counter Pass */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-[#10b780] py-6 px-5 items-center relative">
            <TouchableOpacity
              onPress={() => navigateTo('home')}
              className="absolute left-4 top-6 p-2 rounded-full bg-white/20"
              accessibilityLabel="Back to Home"
            >
              <BackArrowIcon size={16} color="#ffffff" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 px-3 py-1 rounded-full bg-white/20 mt-2">
              <View className="w-2 h-2 rounded-full bg-white" />
              <Text className="text-white text-xs font-bold font-mono">
                Claim Window Active: {timeFormatted}
              </Text>
            </View>

            <Text className="text-xl font-bold text-white tracking-tight mt-3">
              Staff counter unlocked!
            </Text>
            <Text className="text-xs text-white/90 text-center leading-relaxed mt-1 max-w-xs">
              Claiming is now valid. Staff can now interact with your order and release your package.
            </Text>
          </View>

          <View className="px-5 pt-4 pb-8 space-y-4">
            <Text className="text-xs font-semibold text-center text-[#10b780]">
              Present this pass or your pickup key to the counter staff.
            </Text>

            {/* Essential Order Card */}
            <View className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Product
              </Text>
              <Text className="text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {order.product}
              </Text>

              <View className="flex-row justify-between pt-3 border-t border-gray-100 mt-3">
                <View>
                  <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Pickup Key
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Text className="text-base font-black font-mono text-[#163b86] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {order.alphanumericKey}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(order.alphanumericKey, 'Pickup Key')}
                      className="p-1"
                    >
                      <CopyIcon size={16} color="#475569" />
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

              <View className="pt-2.5 border-t border-gray-100 mt-3 flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">
                  Tracking ID: <Text className="font-mono text-gray-700">{order.trackingNumber}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                  className="p-1"
                >
                  <CopyIcon size={14} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* View QR Code Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('qr_screen')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] shadow-md flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-bold text-sm tracking-wide">
                View QR Code
              </Text>
              <QrCodeIcon size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Proof of Delivery */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openProofOfDeliveryModal}
              className="w-full py-3 px-4 rounded-xl bg-gray-100 items-center justify-center"
            >
              <Text className="text-xs font-bold text-gray-700">
                📷 View Intake Photo / Proof of Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo('home')}
              className="items-center py-2"
            >
              <Text className="text-xs font-semibold text-gray-500">
                Return to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Standard Order Details Flow */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View className={`${bannerBg} py-5 px-5 items-center relative shadow-sm`}>
            <TouchableOpacity
              onPress={() => navigateTo('home')}
              className="absolute left-4 top-5 p-1.5 rounded-full bg-white/20"
            >
              <BackArrowIcon size={16} color="#ffffff" />
            </TouchableOpacity>

            <Text className="text-white text-base font-bold">Complete Details</Text>
            <Text className="text-white/80 text-xs font-semibold tracking-wider uppercase mt-0.5">
              {bannerSubtitle}
            </Text>
          </View>

          <View className="p-5 space-y-4">
            {/* Tracking and Ref Box */}
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <View className="flex-row items-center justify-between pb-2 border-b border-gray-200">
                <Text className="text-xs text-gray-500 font-semibold">TRACKING NO.</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-mono font-bold text-gray-900">{order.trackingNumber}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}>
                    <CopyIcon size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-2">
                <Text className="text-xs text-gray-500 font-semibold">REF CODE</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-mono font-bold text-gray-900">{order.refCode}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(order.refCode, 'Ref Code')}>
                    <CopyIcon size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Product Card */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</Text>
              <Text className="text-base font-bold text-gray-900 mt-0.5">{order.product}</Text>
              <Text className="text-xs text-gray-500 mt-1">Carrier: {order.carrier}</Text>
              <Text className="text-xs text-gray-500">Hub: {order.hubLocation}</Text>
            </View>

            {/* Financial Summary */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2">
              <Text className="text-xs font-bold text-gray-900 mb-1">Financial Summary</Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Stated COD Fee:</Text>
                <Text className="text-xs font-mono font-bold text-gray-900">{order.codAmount}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Amount Paid:</Text>
                <Text className="text-xs font-mono font-bold text-gray-900">{order.paidAmount || '₱0.00'}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-100">
                <Text className="text-xs font-bold text-gray-700">Estimated Change:</Text>
                <Text className="text-xs font-mono font-bold text-[#10b780]">{order.change || '₱0.00'}</Text>
              </View>
            </View>

            {/* Status-specific action buttons */}
            {status === 'READY_TO_CLAIM' && (
              <View className="space-y-3 pt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setClaimConfirmed(!claimConfirmed)}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className={`w-5 h-5 rounded border items-center justify-center ${
                      claimConfirmed ? 'bg-[#10b780] border-[#10b780]' : 'border-gray-400 bg-white'
                    }`}
                  >
                    {claimConfirmed && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <Text className="text-xs text-gray-700 font-semibold flex-1">
                    I am physically present at Lily’s Catering Hub counter
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleInitiateClaim}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#10b780] shadow-md items-center"
                >
                  <Text className="text-white font-bold text-sm tracking-wide">
                    Initiate Counter Claim (5 Min Pass)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigateTo('qr_screen')}
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-gray-700">
                    View QR Pickup Pass
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'PAYMENT_REQUIRED' && (
              <View className="space-y-2 pt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigateTo('payment_verification')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] shadow-md items-center"
                >
                  <Text className="text-white font-bold text-sm tracking-wide">
                    Deposit Instructions &amp; QR
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'CLAIMED' && (
              <View className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 items-center">
                <Text className="text-[#10b780] font-bold text-sm">
                  ✔ Parcel Handover Completed
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Claimed on: {order.claimedTime || 'October 17, 2026'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={openEscrowModal}
              className="items-center py-2"
            >
              <Text className="text-xs text-gray-500 font-medium">
                Hub Escrow &amp; Security Policy
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

