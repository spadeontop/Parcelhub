import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { JustUpdatedOrderInfo } from '../../../types';
import { Camera, Check, X, Upload } from '../../common/Icons';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { StaffActionButton, ButtonActionState } from '../../common/StaffActionButton';
import { compressStaffProof } from '../../../utils/imageCompression';

const sampleWaybill = require('../../../../assets/parcelhub/sample_parcel_waybill.png');

interface ProofPhotoAttachStepProps {
  orderId: string;
  initialProofImageUrl?: string;
  isAttachingPhoto: boolean;
  onAttachPhoto: (orderId: string, imageUrl?: string) => Promise<void>;
  onReturnHome: () => void;
  onSuccessTransition?: (info: JustUpdatedOrderInfo) => void;
}

export const ProofPhotoAttachStep: React.FC<ProofPhotoAttachStepProps> = ({
  orderId,
  initialProofImageUrl,
  isAttachingPhoto,
  onAttachPhoto,
  onReturnHome,
  onSuccessTransition,
}) => {
  const [hasPhoto, setHasPhoto] = useState<boolean>(Boolean(initialProofImageUrl));
  const [photoUri, setPhotoUri] = useState<string | null>(initialProofImageUrl || null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [photoValidationState, setPhotoValidationState] = useState<'VALID' | 'INVALID'>('VALID');
  const [isPhotoConfirmed, setIsPhotoConfirmed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [btnState, setBtnState] = useState<ButtonActionState>('idle');
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);

  const photoConfirmClickCountRef = useRef<number>(0);
  const photoConfirmLastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    setHasPhoto(Boolean(initialProofImageUrl));
    setPhotoUri(initialProofImageUrl || null);
    setPhotoBase64(null);
    setPhotoValidationState('VALID');
    setIsPhotoConfirmed(false);
    setIsLocked(false);
    setBtnState('idle');
    setHasError(false);
    setErrorMessage('');
    photoConfirmClickCountRef.current = 0;
    photoConfirmLastClickTimeRef.current = 0;
  }, [orderId, initialProofImageUrl]);

  const handleTakePhoto = async () => {
    try {
      let pickerResult = null;
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });
      }

      if (pickerResult && !pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        setIsCompressing(true);

        const compressed = await compressStaffProof(asset.uri, asset.width, asset.height);

        setPhotoUri(compressed.uri);
        setPhotoBase64(compressed.base64);
        setHasPhoto(true);
        setPhotoValidationState('VALID');
        setIsPhotoConfirmed(false);
        setHasError(false);
        setErrorMessage('');
        photoConfirmClickCountRef.current = 0;
        photoConfirmLastClickTimeRef.current = 0;
      }
    } catch (err: any) {
      console.warn('Camera / compression error:', err);
      setPhotoUri(null);
      setPhotoBase64(null);
      setHasPhoto(false);
      setIsPhotoConfirmed(false);
      Alert.alert(
        'Photo Capture Failed',
        err?.message || 'Unable to capture or process proof photo. Please try again.'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRetake = () => {
    setHasPhoto(false);
    setPhotoUri(null);
    setPhotoBase64(null);
    setPhotoValidationState('VALID');
    setIsPhotoConfirmed(false);
    setIsLocked(false);
    setHasError(false);
    setErrorMessage('');
    photoConfirmClickCountRef.current = 0;
    photoConfirmLastClickTimeRef.current = 0;
  };

  const handleTogglePhotoConfirm = () => {
    if (isLocked || isAttachingPhoto || btnState !== 'idle') return;

    const isPhotoAttached = Boolean(hasPhoto || photoUri || photoBase64);
    if (!isPhotoAttached) {
      const now = Date.now();
      if (now - photoConfirmLastClickTimeRef.current > 2500) {
        photoConfirmClickCountRef.current = 1;
      } else {
        photoConfirmClickCountRef.current += 1;
      }
      photoConfirmLastClickTimeRef.current = now;

      if (photoConfirmClickCountRef.current >= 3 || hasError) {
        setHasError(true);
        setErrorMessage('Please take or attach a parcel waybill photo first.');
        setShakeTrigger((c) => c + 1);
      }
      return;
    }

    setIsPhotoConfirmed((prev) => {
      const next = !prev;
      if (next) {
        setHasError(false);
        setErrorMessage('');
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isLocked || isAttachingPhoto || btnState !== 'idle' || isCompressing) return;

    if (!hasPhoto && !photoBase64) {
      setHasError(true);
      setErrorMessage('Please take or attach a parcel waybill photo first.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    if (photoValidationState !== 'VALID') {
      setHasError(true);
      setErrorMessage('Photo is marked invalid. Please retake photo.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    if (!isPhotoConfirmed) {
      setHasError(true);
      setErrorMessage('Please check the confirmation box before submitting.');
      setShakeTrigger((c) => c + 1);
      return;
    }

    setHasError(false);
    setErrorMessage('');
    setIsLocked(true);
    setBtnState('loading');

    try {
      const payloadUrl = (photoBase64 || photoUri || '').trim();
      if (!payloadUrl) {
        setHasError(true);
        setErrorMessage('Please take or attach a parcel waybill photo first.');
        setShakeTrigger((c) => c + 1);
        setIsLocked(false);
        setBtnState('idle');
        return;
      }
      await onAttachPhoto(orderId, payloadUrl);
      onSuccessTransition?.({
        orderId,
        actionBadgeText: 'Proof Attached',
        targetBadgeText: 'Ready to Claim',
        targetStatus: 'READY_TO_CLAIM',
        targetTab: 'ready',
      });
    } catch (err: any) {
      setIsLocked(false);
      setBtnState('idle');
      Alert.alert(
        'Upload Failed',
        err?.message || 'Unable to attach proof of delivery. Please try again.'
      );
    }
  };

  return (
    <>
      <OrderCardContainer className="mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-bold text-[#1E293B] uppercase tracking-wide">
            Proof of delivery
          </Text>

          {!hasPhoto ? (
            <View className="bg-[#F1F5F9] rounded-[10px] px-2.5 py-0.5">
              <Text className="text-[9.5px] font-semibold text-[#475569]">Required</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRetake}
              className="flex-row items-center gap-1.5 py-0.5"
            >
              <Camera size={14} color="#2563EB" />
              <Text className="text-[12.5px] font-bold text-[#2563EB]">Retake</Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasPhoto ? (
          <>
            <Text className="text-[11px] font-normal text-[#64748B] mt-1 mb-4">
              A parcel photo is required to confirm receipt.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTakePhoto}
              disabled={isCompressing}
              className="bg-[#F8FAFC] border border-[#CBD5E1] border-dashed rounded-[12px] py-7 items-center justify-center"
            >
              {isCompressing ? (
                <View className="items-center justify-center py-2">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-[12px] font-semibold text-[#2563EB] mt-2">
                    Compressing image (WebP)...
                  </Text>
                </View>
              ) : (
                <>
                  <View className="relative w-12 h-12 items-center justify-center mb-1">
                    <View className="w-12 h-12 rounded-full bg-white border border-[#E2E8F0] items-center justify-center shadow-xs">
                      <Camera size={22} color="#64748B" />
                    </View>
                    <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#2563EB] items-center justify-center">
                      <Upload size={9} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  </View>

                  <Text className="text-[13px] font-semibold text-[#2563EB] mt-1.5">
                    Take Photo
                  </Text>
                  <Text className="text-[11px] font-normal text-[#64748B] mt-0.5">
                    Tap to take a clear photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View
              className={`rounded-[6px] px-2.5 py-1 flex-row items-center gap-1.5 self-start mt-2.5 mb-3.5 border ${
                photoValidationState === 'VALID'
                  ? 'bg-[#ECFDF3] border-[#ABEFC6]'
                  : 'bg-[#FEF3F2] border-[#FECDCA]'
              }`}
            >
              <View
                className={`w-3.5 h-3.5 rounded-full items-center justify-center ${
                  photoValidationState === 'VALID' ? 'bg-[#067647]' : 'bg-[#B42318]'
                }`}
              >
                {photoValidationState === 'VALID' ? (
                  <Check size={9} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <X size={9} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <Text
                className={`text-[12px] font-semibold ${
                  photoValidationState === 'VALID' ? 'text-[#067647]' : 'text-[#B42318]'
                }`}
              >
                {photoValidationState === 'VALID' ? 'Photo verified' : 'Invalid photo'}
              </Text>
            </View>

            <View className="bg-[#F8FAFC] rounded-[12px] p-4 items-center justify-center border border-[#F1F5F9]">
              <View className="bg-white rounded-lg p-3 shadow-xs items-center justify-center w-full max-w-[220px]">
                <Image
                  source={photoUri ? { uri: photoUri } : sampleWaybill}
                  style={{ width: 170, height: 110, borderRadius: 6 }}
                  resizeMode="cover"
                />
                <Text className="text-[10px] font-bold text-[#64748B] text-center mt-2.5">
                  Parcel Waybill Photo
                </Text>
              </View>
            </View>
          </>
        )}
      </OrderCardContainer>

      <OrderConfirmationCard
        checked={isPhotoConfirmed}
        onToggle={handleTogglePhotoConfirm}
        disabled={isLocked || isAttachingPhoto || btnState !== 'idle'}
        title="I confirm that I attached a valid photo"
        subtitle="Only confirm after paying the courier the exact amount and receiving the parcel."
        hasError={hasError}
        errorMessage={errorMessage}
        shakeTrigger={shakeTrigger}
      />

      <View className="mt-2 mb-2">
        <StaffActionButton
          state={btnState}
          idleLabel="Order Claimed & Paid"
          loadingLabel="Submitting Proof..."
          successLabel="Proof Attached"
          onPress={handleSubmit}
          disabled={false}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onReturnHome}
        disabled={btnState === 'loading'}
        className="w-full py-2.5 items-center justify-center mt-1"
      >
        <Text className="text-[13px] font-bold text-[#475569]">Return to Home</Text>
      </TouchableOpacity>
    </>
  );
};
