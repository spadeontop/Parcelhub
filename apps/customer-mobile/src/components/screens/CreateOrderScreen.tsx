import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useOrderDraft } from '../../context/OrderDraftContext';
import { useCustomerOrderActions } from '../../hooks/useCustomerOrders';
import { compressCustomerScreenshot } from '../../utils/imageCompression';
import { ScreenshotSourceApp } from '../../types/api';
import { parseCurrency } from '../../utils/currency';
import { AppHeader } from '../layout/AppHeader';
import { FloatingInput } from '../common/FloatingInput';

const TRACKING_TUTORIAL_BY_APP: Record<
  ScreenshotSourceApp,
  { title: string; steps: string }
> = {
  shopee: {
    title: 'Shopee Tracking Number Not Found',
    steps:
      'Open Shopee → Me → To Receive → tap your order → tap "Shipping Information" so the SPX/courier tracking number is visible, then upload that screenshot.',
  },
  lazada: {
    title: 'Lazada Tracking Number Not Found',
    steps:
      'Open Lazada → Account → To Receive → tap your order → tap "Track Package" so the LEX/courier tracking number is visible, then upload that screenshot.',
  },
  tiktok: {
    title: 'TikTok Shop Tracking Number Not Found',
    steps:
      'Open TikTok → Profile → Your Orders → tap your order → tap "Shipping details" so the courier tracking number is visible, then upload that screenshot.',
  },
  unknown: {
    title: 'Tracking Number Not Visible',
    steps:
      'Please upload a clear order or shipping details screenshot from Shopee, Lazada, or TikTok Shop that clearly shows the courier tracking number.',
  },
};

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, goBack } = useNavigationUi();
  const { showToast } = useToast();
  const { customer } = useAuthSession();
  const { orderDraft, updateOrderDraft } = useOrderDraft();
  const { initializeCustomerOrder, confirmCustomerOrder } = useCustomerOrderActions();

  const scrollViewRef = useRef<any>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [missingTrackingApp, setMissingTrackingApp] = useState<ScreenshotSourceApp | null>(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    product?: string;
    recipient?: string;
    amount?: string;
    trackingId?: string;
  }>({});

  const previewSourceUri = orderDraft.previewUri || orderDraft.imageUrl || null;
  const hasPhoto = Boolean(previewSourceUri);
  const isOrderReady = Boolean(orderDraft.orderId);
  const isDetailsActive = isOrderReady && !isScanning && !isPicking;

  const product = orderDraft.productName || '';
  const recipient = orderDraft.recipientName || '';
  const totalAmount = orderDraft.totalAmount || '';
  const trackingId = orderDraft.trackingId || '';

  const rawAmountNumber = parseCurrency(totalAmount);
  const isAmountValid =
    totalAmount.trim().length > 0 && rawAmountNumber >= 0 && !isNaN(rawAmountNumber);
  const isAmountFilled = totalAmount.trim().length > 0;
  const amountError =
    isDetailsActive && isAmountFilled && !isAmountValid
      ? 'Please enter a valid amount (e.g. 0 or 500)'
      : '';
  const isTrackingIdLocked = Boolean(orderDraft.trackingIdLocked && trackingId.trim());

  const runReceiptScan = async (imageBase64: string) => {
    setMissingTrackingApp(null);
    setScanFailed(false);
    setTrackingError(null);
    setFieldErrors({});
    setIsScanning(true);

    try {
      await initializeCustomerOrder(imageBase64, { navigateOnSuccess: false });
    } catch (err: any) {
      setScanFailed(true);
      if (err?.error === 'TrackingIdMissing') {
        const app: ScreenshotSourceApp =
          err?.sourceApp === 'shopee' ||
          err?.sourceApp === 'lazada' ||
          err?.sourceApp === 'tiktok'
            ? err.sourceApp
            : 'unknown';
        setMissingTrackingApp(app);
      }
      showToast(err?.message || 'Failed to read receipt. Please try another screenshot.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUploadPress = async () => {
    if (isScanning || isPicking || isSubmitting) return;

    if (customer?.blacklisted) {
      showToast(
        customer.blacklistReason || 'Your account is suspended from creating new orders.'
      );
      return;
    }

    try {
      setIsPicking(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo library permission is required to select a receipt.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const compressed = await compressCustomerScreenshot(
          asset.uri,
          asset.width,
          asset.height
        );

        // Reset previous initialized draft before scanning new receipt
        setIsConfirmed(false);
        setConfirmError(false);
        updateOrderDraft({
          orderId: null,
          ticketCode: null,
          imageUrl: compressed.base64,
          previewUri: compressed.uri,
          trackingId: '',
          productName: '',
          recipientName: '',
          price: 0,
          totalAmount: '',
          trackingIdLocked: false,
          sourceApp: undefined,
        });

        setIsPicking(false);
        await runReceiptScan(compressed.base64);
        return;
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to select image.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleRetryScan = async () => {
    if (!orderDraft.imageUrl || isScanning || isPicking || isSubmitting) return;
    await runReceiptScan(orderDraft.imageUrl);
  };

  const validateForm = (): boolean => {
    const errors: {
      product?: string;
      recipient?: string;
      amount?: string;
      trackingId?: string;
    } = {};

    if (!product.trim()) {
      errors.product = 'Please enter the product name.';
    }

    if (!recipient.trim()) {
      errors.recipient = "Please enter the receiver's name.";
    }

    if (!totalAmount.trim()) {
      errors.amount = 'Please enter the total amount.';
    } else if (!isAmountValid) {
      errors.amount = 'Please enter a valid amount (e.g. 500)';
    }

    if (!trackingId.trim()) {
      errors.trackingId = 'Please enter the tracking ID.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }
    return true;
  };

  const handleCompleteOrder = async () => {
    if (!isDetailsActive || isSubmitting) return;

    const isFormValid = validateForm();
    if (!isConfirmed) {
      setConfirmError(true);
      return;
    }
    if (!isFormValid) {
      return;
    }

    setConfirmError(false);
    setTrackingError(null);
    setIsSubmitting(true);
    try {
      await confirmCustomerOrder({
        trackingId: trackingId.trim(),
        productName: product.trim(),
        recipientName: recipient.trim(),
        price: rawAmountNumber,
      });
    } catch (err: any) {
      if (
        err?.statusCode === 409 ||
        err?.status === 409 ||
        err?.error === 'Conflict' ||
        err?.message?.toLowerCase().includes('duplicate') ||
        err?.message?.toLowerCase().includes('already registered')
      ) {
        setTrackingError(
          err?.message || 'Tracking number is already registered to a paid active parcel'
        );
      } else {
        showToast(err?.message || 'Failed to submit order.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleteDisabled = !isDetailsActive || isSubmitting;

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Header */}
      <AppHeader
        title="Create Order"
        showBackButton
        centerTitle
        onBack={goBack}
      />

      {/* Main Curved Sheet */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 36 }}
          >
            {/* 2-Step Live Breadcrumb */}
            <View className="flex-row items-center px-1 pt-1 pb-4">
              {/* Step 1: Receipt */}
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  style={{
                    backgroundColor: isOrderReady ? '#10b981' : '#2563eb',
                  }}
                >
                  {isOrderReady ? (
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17L4 12"
                        stroke="#ffffff"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Text className="text-[11px] font-bold text-white">1</Text>
                  )}
                </View>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: isOrderReady ? '#0f172a' : '#2563eb' }}
                >
                  Attach Receipt
                </Text>
              </View>

              {/* Divider Line */}
              <View
                className="flex-1 mx-3 rounded-full"
                style={{
                  height: 2,
                  backgroundColor: isOrderReady ? '#2563eb' : '#e2e8f0',
                }}
              />

              {/* Step 2: Details */}
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  style={{
                    backgroundColor: isDetailsActive ? '#2563eb' : '#e2e8f0',
                  }}
                >
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: isDetailsActive ? '#ffffff' : '#94a3b8' }}
                  >
                    2
                  </Text>
                </View>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: isDetailsActive ? '#2563eb' : '#94a3b8' }}
                >
                  Order Details
                </Text>
              </View>
            </View>

            {/* Section 1: Receipt Attachment Card */}
            <View
              className="rounded-[20px] bg-white border border-[#e2e8f0] p-4 mb-3.5"
              style={{
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase">
                  1. RECEIPT SCREENSHOT
                </Text>
                {isOrderReady && !isScanning && (
                  <View className="bg-[#ecfdf5] px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-[#059669]">
                      Scanned
                    </Text>
                  </View>
                )}
              </View>

              {hasPhoto && previewSourceUri ? (
                <View className="flex-row items-center">
                  {/* Compact Thumbnail */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleUploadPress}
                    disabled={isScanning || isPicking || isSubmitting}
                    className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] mr-3.5"
                  >
                    <Image
                      source={{ uri: previewSourceUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Status Info */}
                  <View className="flex-1 mr-2">
                    {isScanning ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text className="text-[14px] font-bold text-[#0f172a]">
                          Scanning receipt...
                        </Text>
                      </View>
                    ) : isOrderReady ? (
                      <>
                        <Text className="text-[14px] font-bold text-[#0f172a]">
                          Receipt attached
                        </Text>
                        <Text className="text-[12px] text-[#64748b] mt-0.5">
                          Details auto-filled below
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-[14px] font-bold text-[#b45309]">
                          Could not read receipt
                        </Text>
                        <Text className="text-[12px] text-[#64748b] mt-0.5">
                          {missingTrackingApp
                            ? 'Tracking number missing'
                            : 'Tap retry or upload another'}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-2">
                    {scanFailed && !missingTrackingApp && !isScanning && (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={handleRetryScan}
                        className="px-3 py-1.5 rounded-full bg-[#eff6ff]"
                      >
                        <Text className="text-[12px] font-semibold text-[#2563eb]">
                          Retry
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleUploadPress}
                      disabled={isScanning || isPicking || isSubmitting}
                      className="px-3 py-1.5 rounded-full bg-[#f1f5f9]"
                    >
                      <Text className="text-[12px] font-semibold text-[#334155]">
                        Replace
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUploadPress}
                  disabled={isPicking || isScanning}
                  className="rounded-[14px] bg-[#f8fafc] border border-dashed border-[#cbd5e1] py-5 px-4 flex-row items-center"
                >
                  <View className="w-11 h-11 rounded-full bg-[#eff6ff] items-center justify-center mr-3.5">
                    {isPicking ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                          stroke="#2563eb"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#0f172a]">
                      {isPicking ? 'Opening gallery...' : 'Attach receipt photo'}
                    </Text>
                    <Text className="text-[12px] text-[#64748b] mt-0.5">
                      Shopee · Lazada · TikTok Shop
                    </Text>
                  </View>

                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 18l6-6-6-6"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
            </View>

            {/* App-Specific Tracking Guidance on 422 TrackingIdMissing */}
            {missingTrackingApp && (
              <View className="rounded-[16px] bg-[#fffbeb] border border-[#fde68a] p-3.5 mb-3.5">
                <Text className="text-[13px] font-bold text-[#92400e] mb-1">
                  {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].title}
                </Text>
                <Text className="text-[12px] text-[#78350f] leading-[18px]">
                  {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].steps}
                </Text>
              </View>
            )}

            {/* Section 2: Order Details Card (Disabled until receipt is attached & scanned) */}
            <View
              className="rounded-[20px] bg-white border border-[#e2e8f0] p-4 mb-4"
              style={{
                opacity: isDetailsActive ? 1 : 0.55,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#f1f5f9]">
                <Text className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase">
                  2. ORDER DETAILS
                </Text>
                <Text className="text-[11px] font-medium text-[#94a3b8]">
                  {isScanning
                    ? 'Auto-filling...'
                    : isDetailsActive
                    ? 'Review & edit if needed'
                    : 'Attach photo to unlock'}
                </Text>
              </View>

              <View pointerEvents={isDetailsActive ? 'auto' : 'none'}>
                <FloatingInput
                  label="Product"
                  value={product}
                  editable={isDetailsActive}
                  error={fieldErrors.product}
                  onChangeText={(text) => {
                    if (fieldErrors.product) {
                      setFieldErrors((prev) => ({ ...prev, product: undefined }));
                    }
                    updateOrderDraft({ productName: text });
                  }}
                />

                <FloatingInput
                  label="Receiver's Name"
                  value={recipient}
                  editable={isDetailsActive}
                  error={fieldErrors.recipient}
                  onChangeText={(text) => {
                    if (fieldErrors.recipient) {
                      setFieldErrors((prev) => ({ ...prev, recipient: undefined }));
                    }
                    updateOrderDraft({ recipientName: text });
                  }}
                />

                <FloatingInput
                  label="Total Amount"
                  value={totalAmount}
                  editable={isDetailsActive}
                  error={fieldErrors.amount || amountError}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    if (fieldErrors.amount) {
                      setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                    }
                    updateOrderDraft({ totalAmount: text });
                  }}
                />

                <FloatingInput
                  label="Tracking ID"
                  value={trackingId}
                  editable={isDetailsActive && !isTrackingIdLocked}
                  error={fieldErrors.trackingId || trackingError || undefined}
                  autoCapitalize="characters"
                  containerStyle={{ marginBottom: 4 }}
                  onChangeText={(text) => {
                    if (isTrackingIdLocked) return;
                    if (fieldErrors.trackingId) {
                      setFieldErrors((prev) => ({ ...prev, trackingId: undefined }));
                    }
                    if (trackingError) setTrackingError(null);
                    updateOrderDraft({ trackingId: text });
                  }}
                  rightElement={
                    isTrackingIdLocked ? (
                      <View className="bg-[#eff6ff] px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-[#2563eb]">
                          Verified
                        </Text>
                      </View>
                    ) : undefined
                  }
                />
              </View>
            </View>

            {/* Confirmation Checkbox & Policy Link */}
            <View
              className="mb-4"
              style={{ opacity: isDetailsActive ? 1 : 0.5 }}
              pointerEvents={isDetailsActive ? 'auto' : 'none'}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const next = !isConfirmed;
                  setIsConfirmed(next);
                  if (next) setConfirmError(false);
                }}
                className="flex-row items-start p-3.5 rounded-[14px] bg-white border"
                style={{
                  borderColor: confirmError
                    ? '#dc2626'
                    : isConfirmed
                    ? '#2563eb'
                    : '#e2e8f0',
                }}
              >
                <View
                  className="w-5 h-5 rounded-[5px] items-center justify-center mt-0.5 mr-3 border"
                  style={{
                    backgroundColor: isConfirmed ? '#2563eb' : '#ffffff',
                    borderColor: confirmError
                      ? '#dc2626'
                      : isConfirmed
                      ? '#2563eb'
                      : '#cbd5e1',
                  }}
                >
                  {isConfirmed && (
                    <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M2.5 7.5L5.5 10.5L11.5 3.5"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-[#0f172a] leading-[18px]">
                    I confirm these order details match my receipt
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigateTo('faq')}
                    className="mt-1 self-start"
                  >
                    <Text className="text-[12px] font-semibold text-[#2563eb]">
                      View Hub Policy &amp; Cash Escrow
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {confirmError && (
                <Text className="text-[12px] font-semibold text-[#dc2626] mt-1.5 px-1">
                  Please confirm that the order details are correct.
                </Text>
              )}
            </View>

            {/* Primary CTA: Complete Order */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCompleteOrder}
              disabled={isCompleteDisabled}
              className="w-full h-[52px] rounded-[16px] bg-[#2563eb] items-center justify-center flex-row"
              style={{
                opacity: isCompleteDisabled ? 0.45 : 1,
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isCompleteDisabled ? 0 : 0.22,
                shadowRadius: 10,
                elevation: isCompleteDisabled ? 0 : 4,
              }}
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-bold text-[15px]">
                    Submitting Order...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-[15px]">
                  Complete Order
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
