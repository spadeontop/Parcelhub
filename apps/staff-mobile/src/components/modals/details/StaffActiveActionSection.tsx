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
  // Attached photo state: whether photo is present
  const [hasPhoto, setHasPhoto] = useState<boolean>(
    Boolean(order.proofImageUrl || order.courierPaid)
  );

  // User instructed: "just make both valid and invalid UI for every attached photo, just assume it is always valid. In functionality in the api call, just send a mock string as url"
  const [photoValidationState, setPhotoValidationState] = useState<'VALID' | 'INVALID'>('VALID');

  const [isConfirmed, setIsConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fallback / bundled sample parcel waybill image
  const sampleWaybill = require('../../../../assets/parcelhub/sample_parcel_waybill.png');

  const handleTakePhoto = () => {
    setHasPhoto(true);
    setPhotoValidationState('VALID'); // assume valid by default
    setIsConfirmed(true);
  };

  const handleRetake = () => {
    setHasPhoto(false);
    setIsConfirmed(false);
  };

  const toggleValidationState = () => {
    setPhotoValidationState((prev) => (prev === 'VALID' ? 'INVALID' : 'VALID'));
  };

  const isFormValid = hasPhoto && photoValidationState === 'VALID' && isConfirmed;

  const handleClaimAndPaid = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 1. Mark courier paid if not already paid
      if (!order.courierPaid) {
        await onPayCourier(order.id);
      }
      // 2. Attach mock proof URL as instructed by user
      await onAttachPhoto(order.id, 'mock://ai-verified-parcel-proof.jpg');
      onReturnHome();
    } catch {
      // Handled in context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="space-y-4">
      {/* Card 2: PROOF OF DELIVERY */}
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
          /* Empty / Take Photo State (matching image2.png) */
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

            {/* Verification State Switcher (allows demoing both Valid & Invalid states per user prompt) */}
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

      {/* Confirmation Checkbox */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsConfirmed((prev) => !prev)}
        className="flex-row items-start gap-3 px-1 mb-5"
      >
        <View
          className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${
            isConfirmed ? 'bg-[#215CD4]' : 'bg-white border-2 border-[#CBD5E1]'
          }`}
        >
          {isConfirmed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
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

      {/* Primary Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleClaimAndPaid}
        disabled={!isFormValid || isSubmitting}
        className={`w-full py-4 rounded-xl items-center justify-center shadow-md mb-2 ${
          isFormValid && !isSubmitting ? 'bg-[#215CD4] active:bg-[#1d4ed8]' : 'bg-[#94A3B8]'
        }`}
      >
        {isSubmitting || isPayingCourier || isAttachingPhoto ? (
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
