import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useOrderDraft } from '../../context/OrderDraftContext';
import { useCustomerOrderActions } from '../../hooks/useCustomerOrders';
import { AppHeader } from '../layout/AppHeader';
import { FloatingInput } from '../common/FloatingInput';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { parseCurrency } from '../../utils/currency';

export const ConfirmOrderScreen: React.FC = () => {
  const { navigateTo, goBack } = useNavigationUi();
  const { showToast } = useToast();
  const { orderDraft, updateOrderDraft } = useOrderDraft();
  const { confirmCustomerOrder } = useCustomerOrderActions();

  const scrollViewRef = useRef<any>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    product?: string;
    recipient?: string;
    amount?: string;
    trackingId?: string;
  }>({});

  const product = orderDraft.productName || '';
  const recipient = orderDraft.recipientName || '';
  const totalAmount = orderDraft.totalAmount || '';
  const trackingId = orderDraft.trackingId || '';

  // Amount validation logic (supports >= 0 for prepaid/non-COD parcels as well as COD)
  const rawAmountNumber = parseCurrency(totalAmount);
  const isAmountValid =
    totalAmount.trim().length > 0 && rawAmountNumber >= 0 && !isNaN(rawAmountNumber);
  const isAmountFilled = totalAmount.trim().length > 0;
  const amountError =
    isAmountFilled && !isAmountValid ? 'Please enter a valid amount (e.g. 0 or 500)' : '';
  const isTrackingIdLocked = Boolean(orderDraft.trackingIdLocked && trackingId.trim());

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

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!orderDraft.orderId) {
      showToast('No active order to confirm. Please start again.');
      navigateTo('create_order');
      return;
    }
    if (!validateForm()) {
      return;
    }
    if (!isConfirmed) {
      return;
    }

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

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Screen Title & Navigation Header */}
      <AppHeader
        title="Confirm Details"
        showBackButton
        centerTitle
        onBack={goBack}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] overflow-hidden">
        {/* Minimalist 2-Step Progress Bar */}
        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[12px] font-semibold text-[#2563eb]">
              Step 2 of 2 · Details
            </Text>
            <Text className="text-[12px] font-medium text-[#10b981]">
              Receipt scanned
            </Text>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 h-1 rounded-full bg-[#2563eb]" />
            <View className="flex-1 h-1 rounded-full bg-[#2563eb]" />
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 36 }}
        >
          {/* Compact Receipt Strip */}
          <View
            className="rounded-[18px] bg-white border border-[#e2e8f0] p-3 mb-4 flex-row items-center"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <View className="w-11 h-11 rounded-[10px] bg-[#f1f5f9] border border-[#e2e8f0] items-center justify-center mr-3 shrink-0 overflow-hidden">
              {orderDraft.previewUri || orderDraft.imageUrl ? (
                <Image
                  source={{ uri: (orderDraft.previewUri || orderDraft.imageUrl) as string }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-[13px] font-bold text-[#0f172a]">
                Order Receipt
              </Text>
              <Text className="text-[11px] font-semibold text-[#059669] mt-0.5">
                Verified
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('faq')}
              className="px-2.5 py-1.5"
            >
              <Text className="text-[12px] font-semibold text-[#2563eb]">
                Hub Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Order Details Card */}
          <View
            className="rounded-[22px] bg-white border border-[#e2e8f0] p-4 mb-4"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-[#f1f5f9]">
              <Text className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase">
                ORDER DETAILS
              </Text>
              <Text className="text-[11px] font-medium text-[#94a3b8]">
                Edit if needed
              </Text>
            </View>

            <View className="space-y-1">
              {/* 1. Product Field */}
              <FloatingInput
                label="Product"
                value={product}
                error={fieldErrors.product}
                onChangeText={(text) => {
                  if (fieldErrors.product) {
                    setFieldErrors((prev) => ({ ...prev, product: undefined }));
                  }
                  updateOrderDraft({ productName: text });
                }}
              />

              {/* 2. Receiver's Name Field */}
              <FloatingInput
                label="Receiver's Name"
                value={recipient}
                error={fieldErrors.recipient}
                onChangeText={(text) => {
                  if (fieldErrors.recipient) {
                    setFieldErrors((prev) => ({ ...prev, recipient: undefined }));
                  }
                  updateOrderDraft({ recipientName: text });
                }}
              />

              {/* 3. Total Amount Field with Validation */}
              <FloatingInput
                label="Total Amount"
                value={totalAmount}
                error={fieldErrors.amount || amountError}
                onChangeText={(text) => {
                  if (fieldErrors.amount) {
                    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                  updateOrderDraft({ totalAmount: text });
                }}
                keyboardType="numeric"
              />

              {/* 4. Tracking ID Field */}
              <FloatingInput
                label="Tracking ID"
                value={trackingId}
                error={fieldErrors.trackingId || trackingError || undefined}
                autoCapitalize="characters"
                editable={!isTrackingIdLocked}
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
                      <Text className="text-[10px] font-bold text-[#2563eb]">Verified</Text>
                    </View>
                  ) : undefined
                }
              />
            </View>
          </View>

          {/* Confirmation & Submit Action Section */}
          <ConfirmationSubmitSection
            title="I confirm that these order details are correct"
            subtitle="Ensure the amount and tracking number match your delivery receipt."
            buttonLabel="Submit & Proceed to Payment"
            errorMessage="Please check the confirmation box before submitting."
            isChecked={isConfirmed}
            onCheckedChange={setIsConfirmed}
            onValidate={validateForm}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            themeColor="#2563eb"
            className="mb-4"
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default ConfirmOrderScreen;
