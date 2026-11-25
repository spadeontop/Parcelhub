import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
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

const BRAND_BLUE = '#215cd4';

const CARD_SHADOW = {
  shadowColor: '#111827',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

const FOOTER_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 8,
};

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

function runHorizontalShake(anim: Animated.Value) {
  anim.setValue(0);
  Animated.sequence([
    Animated.timing(anim, { toValue: -6, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 6, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: -5, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 5, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: -2, duration: 45, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 0, duration: 45, useNativeDriver: true }),
  ]).start();
}

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, goBack } = useNavigationUi();
  const { showToast } = useToast();
  const { customer } = useAuthSession();
  const { orderDraft, updateOrderDraft } = useOrderDraft();
  const { initializeCustomerOrder, confirmCustomerOrder } = useCustomerOrderActions();

  const scrollViewRef = useRef<any>(null);
  const receiptShakeAnim = useRef(new Animated.Value(0)).current;
  const detailsShakeAnim = useRef(new Animated.Value(0)).current;
  const confirmShakeAnim = useRef(new Animated.Value(0)).current;
  const submitShakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [missingTrackingApp, setMissingTrackingApp] = useState<ScreenshotSourceApp | null>(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    product?: string;
    recipient?: string;
    amount?: string;
    trackingId?: string;
  }>({});

  // Subtle red highlight & feedback states for locked/incomplete presses
  const [receiptHighlight, setReceiptHighlight] = useState(false);
  const [detailsHighlight, setDetailsHighlight] = useState(false);
  const [detailsFeedback, setDetailsFeedback] = useState<string | null>(null);
  const [confirmHighlight, setConfirmHighlight] = useState(false);
  const [footerFeedback, setFooterFeedback] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const clearTransientFeedback = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    setReceiptHighlight(false);
    setDetailsHighlight(false);
    setDetailsFeedback(null);
    setConfirmHighlight(false);
    setFooterFeedback(null);
  };

  const scheduleFeedbackReset = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setReceiptHighlight(false);
      setDetailsHighlight(false);
      setDetailsFeedback(null);
      setConfirmHighlight(false);
      setFooterFeedback(null);
      feedbackTimerRef.current = null;
    }, 2800);
  };

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
    clearTransientFeedback();
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

        clearTransientFeedback();
        setIsConfirmed(false);
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

  const handleLockedDetailsPress = () => {
    if (isScanning) {
      setDetailsFeedback('Scanning receipt, please wait...');
      scheduleFeedbackReset();
      return;
    }
    setDetailsHighlight(true);
    setReceiptHighlight(true);
    setDetailsFeedback('Attach a receipt photo first to unlock details.');
    runHorizontalShake(detailsShakeAnim);
    runHorizontalShake(receiptShakeAnim);
    scheduleFeedbackReset();
  };

  const handleToggleConfirm = () => {
    if (isSubmitting) return;

    if (!isDetailsActive) {
      setConfirmHighlight(true);
      setReceiptHighlight(true);
      setFooterFeedback(
        isScanning
          ? 'Please wait for receipt scanning to finish.'
          : 'Attach a receipt photo first before confirming.'
      );
      runHorizontalShake(confirmShakeAnim);
      if (!isScanning) {
        runHorizontalShake(receiptShakeAnim);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      scheduleFeedbackReset();
      return;
    }

    const next = !isConfirmed;
    setIsConfirmed(next);
    if (next) {
      setConfirmHighlight(false);
      setFooterFeedback(null);
    }
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
    return Object.keys(errors).length === 0;
  };

  const handleCompleteOrder = async () => {
    if (isSubmitting) return;

    if (!isDetailsActive) {
      setReceiptHighlight(true);
      setDetailsHighlight(true);
      setFooterFeedback(
        isScanning
          ? 'Scanning receipt, please wait a moment.'
          : 'Attach a receipt photo to complete your order.'
      );
      runHorizontalShake(submitShakeAnim);
      if (!isScanning) {
        runHorizontalShake(receiptShakeAnim);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      scheduleFeedbackReset();
      return;
    }

    const isFormValid = validateForm();
    if (!isFormValid) {
      setDetailsHighlight(true);
      setDetailsFeedback('Please fill in all required order details.');
      setFooterFeedback('Complete the highlighted fields above.');
      runHorizontalShake(detailsShakeAnim);
      runHorizontalShake(submitShakeAnim);
      scheduleFeedbackReset();
      return;
    }

    if (!isConfirmed) {
      setConfirmHighlight(true);
      setFooterFeedback('Please check the confirmation box first.');
      runHorizontalShake(confirmShakeAnim);
      scheduleFeedbackReset();
      return;
    }

    clearTransientFeedback();
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
        runHorizontalShake(detailsShakeAnim);
      } else {
        showToast(err?.message || 'Failed to submit order.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#215cd4]">
      <StatusBar style="light" />

      {/* Header matching Customer UI */}
      <AppHeader
        title="Create Order"
        subtitle="Lily's Catering Hub"
        subtitleUppercase={false}
        showBackButton
        centerTitle
        backgroundColor={BRAND_BLUE}
        onBack={goBack}
        onHelp={() => navigateTo('faq')}
      />

      {/* Main Curved Sheet */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] overflow-hidden">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {/* Scrollable Vertical (1) -> (2) Flow */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 18, paddingBottom: 20 }}
          >
            {/* STEP 1 ROW: Left (1) Node + Vertical Line | Right Receipt Card */}
            <View className="flex-row items-stretch">
              {/* Left Vertical Stepper Rail - Step 1 */}
              <View className="w-7 items-center mr-2.5">
                <View className="mt-4">
                  {isOrderReady ? (
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
                      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17L4 12"
                          stroke="#ffffff"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  ) : (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: receiptHighlight ? '#dc2626' : BRAND_BLUE,
                        shadowColor: receiptHighlight ? '#dc2626' : BRAND_BLUE,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text className="text-[11px] font-bold text-white">1</Text>
                    </View>
                  )}
                </View>

                {/* Connecting Vertical Line down to Step 2 */}
                <View
                  className="flex-1 w-[2px] mt-1.5"
                  style={{
                    backgroundColor: isOrderReady ? '#10b981' : '#e2e8f0',
                  }}
                />
              </View>

              {/* Step 1 Content: Receipt Card (+ Tracking Guidance if 422) */}
              <View className="flex-1 pb-3.5">
                <Animated.View
                  style={{ transform: [{ translateX: receiptShakeAnim }] }}
                >
                  <View
                    className="rounded-[16px] p-[17px] border"
                    style={[
                      CARD_SHADOW,
                      {
                        backgroundColor: receiptHighlight ? '#fff5f5' : '#ffffff',
                        borderColor: receiptHighlight ? '#fca5a5' : '#f1f5f9',
                      },
                    ]}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
                        RECEIPT SCREENSHOT
                      </Text>
                      {isOrderReady && !isScanning ? (
                        <Text className="text-[11px] font-semibold text-[#059669]">
                          Scanned
                        </Text>
                      ) : receiptHighlight ? (
                        <Text className="text-[11px] font-semibold text-[#dc2626]">
                          Required
                        </Text>
                      ) : null}
                    </View>

                    {hasPhoto && previewSourceUri ? (
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleUploadPress}
                          disabled={isScanning || isPicking || isSubmitting}
                          className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] mr-3"
                        >
                          <Image
                            source={{ uri: previewSourceUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>

                        <View className="flex-1 mr-2">
                          {isScanning ? (
                            <View className="flex-row items-center gap-2">
                              <ActivityIndicator size="small" color={BRAND_BLUE} />
                              <Text className="text-[13.5px] font-semibold text-[#111827]">
                                Scanning receipt...
                              </Text>
                            </View>
                          ) : isOrderReady ? (
                            <>
                              <Text className="text-[13.5px] font-semibold text-[#111827]">
                                Receipt attached
                              </Text>
                              <Text className="text-[12px] text-[#64748b] mt-0.5">
                                Details auto-filled below
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="text-[13.5px] font-semibold text-[#b45309]">
                                Could not read receipt
                              </Text>
                              <Text className="text-[12px] text-[#64748b] mt-0.5">
                                {missingTrackingApp
                                  ? 'Tracking number missing'
                                  : 'Tap retry or replace photo'}
                              </Text>
                            </>
                          )}
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {scanFailed && !missingTrackingApp && !isScanning && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={handleRetryScan}
                              className="px-2.5 py-1.5 rounded-[8px] bg-[#eff6ff]"
                            >
                              <Text className="text-[12px] font-semibold text-[#215cd4]">
                                Retry
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleUploadPress}
                            disabled={isScanning || isPicking || isSubmitting}
                            className="px-2.5 py-1.5 rounded-[8px] bg-[#f1f5f9]"
                          >
                            <Text className="text-[12px] font-semibold text-[#475569]">
                              Replace
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={handleUploadPress}
                        disabled={isPicking || isScanning}
                        className="rounded-[12px] border border-dashed py-4 px-3.5 flex-row items-center"
                        style={{
                          backgroundColor: receiptHighlight ? '#fef2f2' : '#f8fafc',
                          borderColor: receiptHighlight ? '#f87171' : '#cbd5e1',
                        }}
                      >
                        <View className="mr-3 items-center justify-center">
                          {isPicking ? (
                            <ActivityIndicator size="small" color={BRAND_BLUE} />
                          ) : (
                            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                                stroke={receiptHighlight ? '#dc2626' : BRAND_BLUE}
                                strokeWidth={1.9}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          )}
                        </View>

                        <View className="flex-1">
                          <Text className="text-[13.5px] font-semibold text-[#111827]">
                            {isPicking ? 'Opening gallery...' : 'Attach receipt photo'}
                          </Text>
                          <Text className="text-[12px] text-[#64748b] mt-0.5">
                            Shopee · Lazada · TikTok Shop
                          </Text>
                        </View>

                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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
                </Animated.View>

                {/* App-Specific Tracking Guidance on 422 TrackingIdMissing */}
                {missingTrackingApp && (
                  <View className="rounded-[14px] bg-[#fffbeb] border border-[#fde68a] p-3.5 mt-2.5">
                    <Text className="text-[12.5px] font-bold text-[#92400e] mb-1">
                      {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].title}
                    </Text>
                    <Text className="text-[12px] text-[#78350f] leading-[18px]">
                      {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].steps}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* STEP 2 ROW: Left (2) Node | Right Order Details Card */}
            <View className="flex-row items-stretch">
              {/* Left Vertical Stepper Rail - Step 2 */}
              <View className="w-7 items-center mr-2.5">
                {/* Top stub connecting continuously from Step 1's line */}
                <View
                  className="w-[2px] h-4"
                  style={{
                    backgroundColor: isOrderReady ? '#10b981' : '#e2e8f0',
                  }}
                />

                {isDetailsActive ? (
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: detailsHighlight ? '#dc2626' : BRAND_BLUE,
                      shadowColor: detailsHighlight ? '#dc2626' : BRAND_BLUE,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-[11px] font-bold text-white">2</Text>
                  </View>
                ) : (
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center border-2"
                    style={{
                      backgroundColor: detailsHighlight ? '#fef2f2' : '#f1f5f9',
                      borderColor: detailsHighlight ? '#f87171' : '#cbd5e1',
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: detailsHighlight ? '#dc2626' : '#94a3b8' }}
                    >
                      2
                    </Text>
                  </View>
                )}
              </View>

              {/* Step 2 Content: Order Details Card */}
              <View className="flex-1">
                <Animated.View
                  style={{ transform: [{ translateX: detailsShakeAnim }] }}
                >
                  <View
                    className="rounded-[16px] p-[17px] border relative"
                    style={[
                      CARD_SHADOW,
                      {
                        backgroundColor: detailsHighlight ? '#fff5f5' : '#ffffff',
                        borderColor: detailsHighlight ? '#fca5a5' : '#f1f5f9',
                      },
                    ]}
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
                        ORDER DETAILS
                      </Text>
                      <Text
                        className="text-[11px] font-medium"
                        style={{
                          color: detailsHighlight
                            ? '#dc2626'
                            : isDetailsActive
                            ? '#64748b'
                            : '#94a3b8',
                        }}
                      >
                        {isScanning
                          ? 'Auto-filling...'
                          : isDetailsActive
                          ? 'Edit if needed'
                          : 'Attach photo first'}
                      </Text>
                    </View>

                    {/* Form Fields */}
                    <View
                      style={{ opacity: isDetailsActive ? 1 : 0.48 }}
                      pointerEvents={isDetailsActive ? 'auto' : 'none'}
                    >
                      <FloatingInput
                        label="Product"
                        value={product}
                        editable={isDetailsActive}
                        focusedBorderColor={BRAND_BLUE}
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
                        focusedBorderColor={BRAND_BLUE}
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
                        focusedBorderColor={BRAND_BLUE}
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
                        focusedBorderColor={BRAND_BLUE}
                        error={fieldErrors.trackingId || trackingError || undefined}
                        autoCapitalize="characters"
                        containerStyle={{ marginBottom: 0 }}
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
                              <Text className="text-[10px] font-bold text-[#215cd4]">
                                Verified
                              </Text>
                            </View>
                          ) : undefined
                        }
                      />
                    </View>

                    {/* Small Inline Feedback Message */}
                    {detailsFeedback ? (
                      <Text className="text-[11.5px] font-medium text-[#dc2626] mt-2.5">
                        {detailsFeedback}
                      </Text>
                    ) : null}

                    {/* Transparent Tap-Capture Overlay when Locked */}
                    {!isDetailsActive && (
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleLockedDetailsPress}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />
                    )}
                  </View>
                </Animated.View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Nav-Area Footer: Confirmation + Complete Order */}
          <View
            className="bg-white border-t border-[#f1f5f9] px-4 pt-3 pb-5"
            style={FOOTER_SHADOW}
          >
            {/* Confirmation Checkbox Card (always tappable for shake feedback) */}
            <Animated.View
              style={{
                transform: [{ translateX: confirmShakeAnim }],
                opacity: isDetailsActive || confirmHighlight ? 1 : 0.6,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleToggleConfirm}
                className="flex-row items-center p-3 rounded-[12px] border-[1.5px]"
                style={{
                  backgroundColor: confirmHighlight
                    ? '#fef2f2'
                    : isConfirmed
                    ? '#fafafa'
                    : '#ffffff',
                  borderColor: confirmHighlight
                    ? '#fca5a5'
                    : isConfirmed
                    ? BRAND_BLUE
                    : '#e4e4e7',
                }}
              >
                <View
                  className="w-[18px] h-[18px] rounded-[5px] items-center justify-center border-[1.5px] mr-2.5"
                  style={{
                    backgroundColor:
                      isConfirmed && !confirmHighlight ? BRAND_BLUE : '#ffffff',
                    borderColor: confirmHighlight
                      ? '#dc2626'
                      : isConfirmed
                      ? BRAND_BLUE
                      : '#cbd5e1',
                  }}
                >
                  {isConfirmed && (
                    <Svg width={11} height={11} viewBox="0 0 14 14" fill="none">
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

                <Text className="flex-1 text-[12.5px] font-semibold text-[#111827] leading-[17px]">
                  I confirm these order details are correct
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('faq')}
                  className="pl-2 py-0.5"
                >
                  <Text className="text-[11.5px] font-semibold text-[#215cd4]">
                    Policy
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>

            {/* Small Subtle Feedback Message */}
            {footerFeedback ? (
              <Text className="text-[11.5px] font-medium text-[#dc2626] mt-1.5 px-0.5">
                {footerFeedback}
              </Text>
            ) : null}

            {/* Complete Order Button (always tappable for shake feedback) */}
            <Animated.View
              style={{
                transform: [{ translateX: submitShakeAnim }],
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCompleteOrder}
                disabled={isSubmitting}
                className="w-full h-[48px] rounded-[12px] items-center justify-center flex-row"
                style={{
                  backgroundColor: BRAND_BLUE,
                  opacity: isDetailsActive ? (isSubmitting ? 0.85 : 1) : 0.45,
                  shadowColor: BRAND_BLUE,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDetailsActive ? 0.25 : 0,
                  shadowRadius: 10,
                  elevation: isDetailsActive ? 3 : 0,
                }}
              >
                {isSubmitting ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#ffffff" size="small" />
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
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
