import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { Camera, Check, CheckCircle, AlertCircle } from '../../common/Icons';

interface StaffActiveActionSectionProps {
  order: StaffOrder;
  isPayingCourier: boolean;
  isAttachingPhoto: boolean;
  onPayCourier: (orderId: string) => Promise<void>;
  onAttachPhoto: (orderId: string, imageUrl?: string) => Promise<void>;
  onReturnHome: () => void;
}

export const StaffActiveActionSection: React.FC<StaffActiveActionSectionProps> = ({
  order,
  isPayingCourier,
  isAttachingPhoto,
  onPayCourier,
  onAttachPhoto,
  onReturnHome,
}) => {
  // Step 1: Courier Payment state. If order.courierPaid is already true, staff can proceed to Step 2 (Photo Upload).
  // Otherwise, staff must complete Step 1 (Awaiting Parcel 1: Confirm payment to courier).
  const isCourierPaid = Boolean(order.courierPaid);

  // Step 1 checkbox state (Awaiting Parcel 1: "I confirm that I received the order")
  const [isReceivedConfirmed, setIsReceivedConfirmed] = useState<boolean>(true);
  const [isPayingStep1, setIsPayingStep1] = useState<boolean>(false);

  // Step 2: Photo Upload state (Awaiting Parcel 2)
  const [hasPhoto, setHasPhoto] = useState<boolean>(Boolean(order.proofImageUrl));
  const [photoValidationState, setPhotoValidationState] = useState<'VALID' | 'INVALID'>('VALID');
  const [isPhotoConfirmed, setIsPhotoConfirmed] = useState<boolean>(true);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState<boolean>(false);

  const sampleWaybill = require('../../../../assets/parcelhub/sample_parcel_waybill.png');

  // Handle Step 1: Pay Courier & Confirm Received (POST /api/staff/orders/{id}/make-claimable/pay)
  const handlePayCourierStep = async () => {
    if (!isReceivedConfirmed || isPayingStep1 || isPayingCourier) return;
    setIsPayingStep1(true);
    try {
      await onPayCourier(order.id);
    } catch {
      // Error handled in context toast
    } finally {
      setIsPayingStep1(false);
    }
  };

  // Step 2 handlers
  const handleTakePhoto = () => {
    setHasPhoto(true);
    setPhotoValidationState('VALID');
    setIsPhotoConfirmed(true);
  };

  const handleRetake = () => {
    setHasPhoto(false);
    setIsPhotoConfirmed(false);
  };

  const toggleValidationState = () => {
    setPhotoValidationState((prev) => (prev === 'VALID' ? 'INVALID' : 'VALID'));
  };

  const isStep2Valid = hasPhoto && photoValidationState === 'VALID' && isPhotoConfirmed;

  // Handle Step 2: Attach Photo & Complete (POST /api/staff/orders/{id}/make-claimable/attach-photo)
  const handleFinalClaimAndPaid = async () => {
    if (!isStep2Valid || isFinalSubmitting || isAttachingPhoto) return;
    setIsFinalSubmitting(true);
    try {
      await onAttachPhoto(order.id, 'mock://ai-verified-parcel-proof.jpg');
      onReturnHome();
    } catch {
      // Error handled in context toast
    } finally {
      setIsFinalSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 1 UI: Awaiting Parcel 1 (Courier Payment Required First)
  // -------------------------------------------------------------
  if (!isCourierPaid) {
    const canPay = isReceivedConfirmed && !isPayingStep1 && !isPayingCourier;

    return (
      <View className="space-y-4">
        {/* Confirmation Checkbox matching awaiting parcel 1/image.png */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsReceivedConfirmed((prev) => !prev)}
          className="flex-row items-start gap-3 px-1 mb-5"
        >
          <View
            className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
              isReceivedConfirmed ? 'bg-[#215CD4]' : 'bg-white border-2 border-[#CBD5E1]'
            }`}
          >
            {isReceivedConfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-[#0F172A]">
              I confirm that I received the order
            </Text>
            <Text className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
              Only initiate claim & paid when you already paid the courier exact amount and received the parcel.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Primary Claim Button (Triggers POST /make-claimable/pay) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePayCourierStep}
          disabled={!canPay}
          className={`w-full py-4 rounded-xl items-center justify-center shadow-md mb-2 ${
            canPay ? 'bg-[#215CD4] active:bg-[#1d4ed8]' : 'bg-[#94A3B8]'
          }`}
        >
          {isPayingStep1 || isPayingCourier ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-sm">
              Order Claimed & Paid
            </Text>
          )}
        </TouchableOpacity>

        {/* Return to Home Secondary Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="w-full py-3 items-center justify-center"
        >
          <Text className="text-xs font-semibold text-[#475569]">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // STEP 2 UI: Awaiting Parcel 2 (Courier Paid -> Upload Proof of Delivery)
  // -------------------------------------------------------------------------
  return (
    <View className="space-y-4">
      {/* Card: PROOF OF DELIVERY matching awaiting parcel 2 */}
      <View className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-4 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase">
            PROOF OF DELIVERY
          </Text>

          {hasPhoto && (
            <TouchableOpacity
              onPress={handleRetake}
              className="flex-row items-center gap-1 active:opacity-75"
            >
              <Camera size={13} color="#215CD4" />
              <Text className="text-xs font-bold text-[#215CD4]">Retake</Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasPhoto ? (
          /* Empty / Take Photo State (matching awaiting parcel 2/image2.png) */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTakePhoto}
            className="border-2 border-dashed border-[#CBD5E1] rounded-2xl py-10 items-center justify-center bg-[#F8FAFC] active:bg-slate-100"
          >
            <View className="w-12 h-12 rounded-full bg-white border border-[#E2E8F0] items-center justify-center mb-2 shadow-xs">
              <Camera size={22} color="#64748B" />
            </View>
            <Text className="text-sm font-bold text-[#0F172A]">Take Photo</Text>
            <Text className="text-xs text-[#64748B] mt-0.5 font-medium">
              Press to take a photo
            </Text>
          </TouchableOpacity>
        ) : (
          /* Photo Attached State (matching image3.png & image4.png) */
          <View className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-slate-100">
            <Image
              source={sampleWaybill}
              style={{ width: '100%', height: 210 }}
              resizeMode="cover"
            />

            {/* Floating AI Verification Badge */}
            <View className="absolute top-3 left-3">
              {photoValidationState === 'VALID' ? (
                /* Valid AI Verified Badge (image3.png) */
                <View className="flex-row items-center gap-1.5 bg-[#059669] px-3 py-1.5 rounded-full shadow-md">
                  <CheckCircle size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[11px] font-bold">
                    AI Verified: Clear & Valid Parcel
                  </Text>
                </View>
              ) : (
                /* Invalid Image Badge (image4.png) */
                <View className="flex-row items-center gap-1.5 bg-[#FFE4E6] border border-[#FDA4AF] px-3 py-1.5 rounded-full shadow-md">
                  <AlertCircle size={14} color="#BE123C" strokeWidth={2.5} />
                  <Text className="text-[#BE123C] text-[11px] font-bold">
                    Invalid Image: Blurry, No Waybill, No Parcel
                  </Text>
                </View>
              )}
            </View>

            {/* Verification State Switcher for test/demo */}
            <TouchableOpacity
              onPress={toggleValidationState}
              className="absolute bottom-2 right-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
            >
              <Text className="text-[10px] font-bold text-slate-200">
                Switch State: {photoValidationState === 'VALID' ? 'Valid (Click for Invalid)' : 'Invalid (Click for Valid)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Confirmation Checkbox matching awaiting parcel 2 */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsPhotoConfirmed((prev) => !prev)}
        className="flex-row items-start gap-3 px-1 mb-5"
      >
        <View
          className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
            isPhotoConfirmed ? 'bg-[#215CD4]' : 'bg-white border-2 border-[#CBD5E1]'
          }`}
        >
          {isPhotoConfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-[#0F172A]">
            I confirm that I attached valid photo
          </Text>
          <Text className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
            Only initiate claim & paid when you already paid the courier exact amount and received the parcel.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Primary Action Button (Triggers POST /make-claimable/attach-photo) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleFinalClaimAndPaid}
        disabled={!isStep2Valid || isFinalSubmitting || isAttachingPhoto}
        className={`w-full py-4 rounded-xl items-center justify-center shadow-md mb-2 ${
          isStep2Valid && !isFinalSubmitting && !isAttachingPhoto ? 'bg-[#215CD4] active:bg-[#1d4ed8]' : 'bg-[#94A3B8]'
        }`}
      >
        {isFinalSubmitting || isAttachingPhoto ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-sm">
            Order Claimed & Paid
          </Text>
        )}
      </TouchableOpacity>

      {/* Return to Home Secondary Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        className="w-full py-3 items-center justify-center"
      >
        <Text className="text-xs font-semibold text-[#475569]">
          Return to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
