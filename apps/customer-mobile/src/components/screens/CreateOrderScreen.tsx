import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { CreateOrderStepRow } from '../orders/CreateOrderStepRow';
import { CreateOrderReceiptCard } from '../orders/CreateOrderReceiptCard';
import {
  CreateOrderDetailsCard,
  CreateOrderFieldErrors,
} from '../orders/CreateOrderDetailsCard';

const BRAND_BLUE = '#215cd4';

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
  const isMountedRef = useRef(true);
  const receiptShakeAnim = useRef(new Animated.Value(0)).current;
  const detailsShakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [missingTrackingApp, setMissingTrackingApp] =
    useState<ScreenshotSourceApp | null>(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateOrderFieldErrors>({});

  // Subtle red highlight & feedback states (always targeting the needed section only)
  const [receiptHighlight, setReceiptHighlight] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);
  const [detailsHighlight, setDetailsHighlight] = useState(false);
  const [detailsFeedback, setDetailsFeedback] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
    setReceiptFeedback(null);
    setDetailsHighlight(false);
    setDetailsFeedback(null);
  };

  const scheduleFeedbackReset = () => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setReceiptHighlight(false);
      setReceiptFeedback(null);
      setDetailsHighlight(false);
      setDetailsFeedback(null);
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
      if (!isMountedRef.current) return;
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
      if (err?.message !== 'Please log in again') {
        showToast(err?.message || 'Failed to read receipt. Please try another screenshot.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
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

  const highlightNeededReceipt = () => {
    clearTransientFeedback();
    if (isScanning) {
      setReceiptFeedback('Scanning receipt, please wait...');
      scheduleFeedbackReset();
      return;
    }
    const message = missingTrackingApp
      ? 'Please upload a receipt showing the tracking number.'
      : hasPhoto && !isOrderReady
      ? 'Please retry scanning or replace the receipt photo.'
      : 'Please attach a receipt photo first.';
    setReceiptHighlight(true);
    setReceiptFeedback(message);
    runHorizontalShake(receiptShakeAnim);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    scheduleFeedbackReset();
  };

  const validateForm = (): boolean => {
    const errors: CreateOrderFieldErrors = {};

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
      clearTransientFeedback();
      setDetailsHighlight(true);
      setDetailsFeedback('Please fill in all required order details.');
      runHorizontalShake(detailsShakeAnim);
      scheduleFeedbackReset();
      return false;
    }

    return true;
  };

  const handleCompleteOrder = async () => {
    if (!isDetailsActive || isSubmitting) return;

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
      if (!isMountedRef.current) return;
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
      } else if (
        !(
          err?.statusCode === 400 &&
          (err?.error === 'OrderNotEditable' ||
            err?.message?.includes('Only PENDING_INITIALIZATION'))
        ) &&
        err?.message !== 'Please log in again'
      ) {
        showToast(err?.message || 'Failed to submit order.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const connectorColor = isOrderReady ? BRAND_BLUE : '#e2e8f0';
  const canRetryScan =
    (scanFailed || (hasPhoto && !isOrderReady)) &&
    !missingTrackingApp &&
    !isScanning &&
    Boolean(orderDraft.imageUrl);

  return (
    <View className="flex-1 bg-[#215cd4]">
      <StatusBar style="light" />

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
            contentContainerStyle={{ paddingTop: 14, paddingBottom: 12 }}
          >
            {/* Step 1: Receipt Screenshot */}
            <CreateOrderStepRow
              stepNumber={1}
              isDone={isOrderReady}
              isActive={!isOrderReady}
              isError={receiptHighlight}
              bottomLineColor={connectorColor}
              contentPaddingBottom={10}
            >
              <CreateOrderReceiptCard
                previewSourceUri={previewSourceUri}
                isOrderReady={isOrderReady}
                isPicking={isPicking}
                isScanning={isScanning}
                isSubmitting={isSubmitting}
                canRetry={canRetryScan}
                missingTrackingApp={missingTrackingApp}
                isHighlighted={receiptHighlight}
                feedbackMessage={receiptFeedback}
                shakeAnim={receiptShakeAnim}
                onUploadPress={handleUploadPress}
                onRetryScan={handleRetryScan}
              />
            </CreateOrderStepRow>

            {/* Step 2: Order Details */}
            <CreateOrderStepRow
              stepNumber={2}
              isActive={isDetailsActive}
              isError={detailsHighlight}
              topLineColor={connectorColor}
            >
              <CreateOrderDetailsCard
                isActive={isDetailsActive}
                isScanning={isScanning}
                isHighlighted={detailsHighlight}
                feedbackMessage={detailsFeedback}
                shakeAnim={detailsShakeAnim}
                product={product}
                recipient={recipient}
                totalAmount={totalAmount}
                trackingId={trackingId}
                isTrackingIdLocked={isTrackingIdLocked}
                fieldErrors={fieldErrors}
                amountError={amountError}
                trackingError={trackingError}
                onChangeProduct={(text) => {
                  if (fieldErrors.product) {
                    setFieldErrors((prev) => ({ ...prev, product: undefined }));
                  }
                  updateOrderDraft({ productName: text });
                }}
                onChangeRecipient={(text) => {
                  if (fieldErrors.recipient) {
                    setFieldErrors((prev) => ({ ...prev, recipient: undefined }));
                  }
                  updateOrderDraft({ recipientName: text });
                }}
                onChangeAmount={(text) => {
                  if (fieldErrors.amount) {
                    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                  updateOrderDraft({ totalAmount: text });
                }}
                onChangeTrackingId={(text) => {
                  if (isTrackingIdLocked) return;
                  if (fieldErrors.trackingId) {
                    setFieldErrors((prev) => ({ ...prev, trackingId: undefined }));
                  }
                  if (trackingError) setTrackingError(null);
                  updateOrderDraft({ trackingId: text });
                }}
                onLockedPress={highlightNeededReceipt}
              />
            </CreateOrderStepRow>
          </ScrollView>

          {/* Sticky Bottom Action Area using shared ConfirmationSubmitSection */}
          <View className="px-4 pt-2 pb-5">
            <ConfirmationSubmitSection
              title="I confirm that these order details are correct"
              subtitle="Please ensure parcel amount and tracking number match your delivery receipt."
              buttonLabel="Complete Order"
              errorMessage="Please check the confirmation box before submitting."
              isChecked={isConfirmed}
              onCheckedChange={setIsConfirmed}
              onValidate={validateForm}
              onSubmit={handleCompleteOrder}
              isLoading={isSubmitting}
              isLocked={!isDetailsActive}
              onLockedPress={highlightNeededReceipt}
              validateBeforeCheck
              themeColor={BRAND_BLUE}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
