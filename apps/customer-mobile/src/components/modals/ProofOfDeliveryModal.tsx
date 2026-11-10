import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const ProofOfDeliveryModal: React.FC = () => {
  const { isPodModalOpen, closePodModal, getCurrentOrder } = useApp();
  const order = getCurrentOrder();

  if (!isPodModalOpen) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isPodModalOpen}
      onRequestClose={closePodModal}
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
              onPress={closePodModal}
              className="p-1 rounded-full bg-gray-100"
            >
              <CloseIcon size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <View className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 items-center justify-center py-8">
            <View className="w-20 h-16 rounded-lg bg-amber-100 border-2 border-amber-300 items-center justify-center mb-2">
              <Text className="text-[10px] font-mono font-bold text-amber-900">
                📦 POUCH
              </Text>
            </View>
            <Text className="text-xs font-mono text-[#10b780] font-bold">
              MATCH: {order.trackingNumber}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-1">
              Hub Counter Camera • Verified Intact
            </Text>
          </View>

          <View className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Hub Location:</Text>
              <Text className="text-xs font-bold text-gray-800">Lily's Catering Hub</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Recipient:</Text>
              <Text className="text-xs font-bold text-gray-800">{order.recipient}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={closePodModal}
            className="w-full mt-4 py-3 bg-[#215cd4] rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-xs">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

