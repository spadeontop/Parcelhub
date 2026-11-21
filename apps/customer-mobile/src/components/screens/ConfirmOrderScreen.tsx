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
import { useV1 } from '../../v1/context/V1Context';
import { AppHeader } from '../layout/AppHeader';
import { AuthInput } from '../common/AuthInput';
import { ConfirmationSubmitSection } from '../common/ConfirmationSubmitSection';
import { parseCurrency } from '../../v1/utils/currency';

export const ConfirmOrderScreen: React.FC = () => {
  const {
    orderDraft,
    updateOrderDraft,
    confirmCustomerOrder,
    navigateTo,
    showToast,
  } = useV1();

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

  // Amount validation logic
  const rawAmountNumber = parseCurrency(totalAmount);
  const isAmountValid =
    totalAmount.trim().length > 0 && rawAmountNumber > 0 && !isNaN(rawAmountNumber);
  const isAmountFilled = totalAmount.trim().length > 0;
  const amountError =
    isAmountFilled && !isAmountValid ? 'Please enter a valid amount (e.g. 500)' : '';

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
        title="Confirm Order Details"
        showBackButton
        centerTitle
        onBack={() => navigateTo('create_order')}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Order Summary Card */}
          <View
            className="rounded-[24px] bg-white border border-[#f1f5f9] p-4 mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {/* Card Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#f1f5f9]">
              <Text className="text-[12px] font-bold text-[#64748b] tracking-wider uppercase">
                ORDER SUMMARY
              </Text>
            </View>

            {/* Floating AuthInput components with reactive animation & states */}
            <View className="space-y-1">
              {/* 1. Product Field */}
              <AuthInput
                label="Product"
                value={product}
                error={fieldErrors.product}
                onChangeText={(text) => {
                  if (fieldErrors.product) {
                    setFieldErrors((prev) => ({ ...prev, product: undefined }));
                  }
                  updateOrderDraft({ productName: text });
                }}
                showSuccessCheck={false}
              />

              {/* 2. Receiver's Name Field */}
              <AuthInput
                label="Receiver's Name"
                value={recipient}
                error={fieldErrors.recipient}
                onChangeText={(text) => {
                  if (fieldErrors.recipient) {
                    setFieldErrors((prev) => ({ ...prev, recipient: undefined }));
                  }
                  updateOrderDraft({ recipientName: text });
                }}
                showSuccessCheck={false}
              />

              {/* 3. Total Amount Field with Validation */}
              <AuthInput
                label="Total Amount"
                value={totalAmount}
                error={fieldErrors.amount || amountError}
                isValid={isAmountValid}
                onChangeText={(text) => {
                  if (fieldErrors.amount) {
                    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                  updateOrderDraft({ totalAmount: text });
                }}
                keyboardType="numeric"
                showSuccessCheck={false}
              />

              {/* 4. Tracking ID Field */}
              <AuthInput
                label="Tracking ID"
                value={trackingId}
                error={fieldErrors.trackingId || trackingError || undefined}
                onChangeText={(text) => {
                  if (fieldErrors.trackingId) {
                    setFieldErrors((prev) => ({ ...prev, trackingId: undefined }));
                  }
                  if (trackingError) setTrackingError(null);
                  updateOrderDraft({ trackingId: text });
                }}
                autoCapitalize="characters"
                showSuccessCheck={false}
              />
            </View>
          </View>

          {/* Receipt Info Card */}
          <View
            className="rounded-[20px] bg-white border border-[#f1f5f9] p-3.5 mb-4 flex-row items-center"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Receipt Thumbnail / Document Icon Box */}
            <View className="w-16 h-16 rounded-[14px] bg-[#f8fafc] border border-[#e2e8f0] items-center justify-center mr-3.5 shrink-0 overflow-hidden">
              {orderDraft.previewUri || orderDraft.imageUrl ? (
                <Image
                  source={{ uri: (orderDraft.previewUri || orderDraft.imageUrl) as string }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="#64748b"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                      stroke="#64748b"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text className="text-[9px] font-bold text-[#64748b] mt-0.5">Receipt</Text>
                </>
              )}
            </View>

            {/* Receipt Details & Status */}
            <View className="flex-1 justify-center">
              <Text className="text-[14px] font-bold text-[#1e293b]">
                Screenshot of Receipt
              </Text>
              <View className="flex-row items-center gap-1.5 mt-1">
                <View className="w-4 h-4 rounded-full bg-[#ecfdf5] items-center justify-center">
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#059669"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text className="text-[11px] font-bold text-[#059669]">
                  Receipt Verified
                </Text>
              </View>

              {/* Hub Policy Link */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('faq')}
                className="mt-1"
              >
                <Text className="text-[12px] font-bold text-[#2563eb]">
                  View Hub Policy &amp; Cash Escrow Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmation & Submit Action Section */}
          <ConfirmationSubmitSection
            title="I confirm that these order details are correct"
            subtitle="Please ensure parcel amount and tracking number match your delivery receipt."
            buttonLabel="Submit Order & Proceed to Payment"
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
