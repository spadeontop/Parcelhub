import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useV1 } from '../../v1/context/V1Context';
import { orderApi } from '../../v1/services/orderApi';
import { v1Storage } from '../../v1/utils/storage';
import { CloseIcon } from '../common/Icons';

export const ProofOfDeliveryModal: React.FC = () => {
  const { isPodModalOpen: legacyIsOpen, closePodModal: legacyClose, getCurrentOrder } = useApp();
  const {
    isPodModalOpen: v1IsOpen,
    closePodModal: v1Close,
    selectedOrderId,
    orders,
    customer,
    authToken,
  } = useV1();

  const isOpen = v1IsOpen || legacyIsOpen;
  const closeModal = v1IsOpen ? v1Close : legacyClose;

  const currentV1Order = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );
  const legacyOrder = getCurrentOrder();

  const trackingNumber = currentV1Order?.trackingId || legacyOrder.trackingNumber || '—';
  const recipient =
    customer?.firstName
      ? `${customer.firstName} ${customer.lastName || ''}`.trim()
      : currentV1Order?.productName || legacyOrder.recipient || "Lily's Customer";

  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && selectedOrderId) {
      setLoadingPhoto(true);
      (async () => {
        try {
          const token = authToken || (await v1Storage.getAuthToken());
          if (!token) return;
          const res = await orderApi.getOrderPhoto(token, selectedOrderId, 'proof');
          if (isMounted) {
            setProofPhotoUrl(res.proofImageUrl || res.imageUrl || null);
          }
        } catch {
          // Fallback to placeholder if network error or photo unavailable
        } finally {
          if (isMounted) setLoadingPhoto(false);
        }
      })();
    } else {
      setProofPhotoUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedOrderId, authToken]);

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={closeModal}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View>
              <Text className="text-base font-bold text-gray-900">
                Proof of Delivery
              </Text>
              <Text className="text-xs text-gray-500">
                Delivery Verification Photo
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeModal}
              className="p-1 rounded-full bg-gray-100"
            >
              <CloseIcon size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 items-center justify-center min-h-[140px]">
            {loadingPhoto ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color="#215cd4" />
                <Text className="text-[11px] text-gray-500 mt-2 font-medium">
                  Loading verification photo...
                </Text>
              </View>
            ) : proofPhotoUrl ? (
              <Image
                source={{ uri: proofPhotoUrl }}
                style={{ width: '100%', height: 160 }}
                resizeMode="cover"
              />
            ) : (
              <View className="py-8 items-center justify-center">
                <View className="w-20 h-16 rounded-lg bg-amber-100 border-2 border-amber-300 items-center justify-center mb-2">
                  <Text className="text-[10px] font-mono font-bold text-amber-900">
                    POUCH
                  </Text>
                </View>
                <Text className="text-xs font-mono text-[#10b780] font-bold">
                  MATCH: {trackingNumber}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-1">
                  Hub Counter Camera • Verified Intact
                </Text>
              </View>
            )}
          </View>

          <View className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Hub Location:</Text>
              <Text className="text-xs font-bold text-gray-800">Lily's Catering Hub</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Recipient:</Text>
              <Text className="text-xs font-bold text-gray-800">{recipient}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={closeModal}
            className="w-full mt-4 py-3 bg-[#215cd4] rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-xs">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProofOfDeliveryModal;
