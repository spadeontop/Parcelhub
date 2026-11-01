import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const EscrowPolicyModal: React.FC = () => {
  const { isEscrowModalOpen, closeEscrowModal } = useApp();

  if (!isEscrowModalOpen) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isEscrowModalOpen}
      onRequestClose={closeEscrowModal}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[85%]">
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <Text className="text-base font-bold text-gray-900">
              ParcelHub Counter Policy
            </Text>
            <TouchableOpacity
              onPress={closeEscrowModal}
              className="p-1 rounded-full bg-gray-100"
            >
              <CloseIcon size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            <View className="p-3 bg-blue-50 border border-blue-100 rounded-2xl mb-2.5">
              <Text className="font-bold text-[#163b86] mb-1 text-xs">
                Exact Payment Rule
              </Text>
              <Text className="text-blue-900 text-xs leading-relaxed">
                The amount paid to the courier matches the exact price on your order receipt. Any excess cash deposit is safely kept and returned to you as change when you pick up your parcel.
              </Text>
            </View>

            <View className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200 mb-2.5">
              <Text className="font-bold text-gray-900 mb-1 text-xs">
                Cash On Delivery Ready
              </Text>
              <Text className="text-gray-600 text-xs leading-relaxed">
                Cash is deposited at Lily’s Catering Hub counter so our staff can receive and pay for your delivery as soon as the courier arrives.
              </Text>
            </View>

            <View className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200 mb-2.5">
              <Text className="font-bold text-gray-900 mb-1 text-xs">
                Safe Cash Handling
              </Text>
              <Text className="text-gray-600 text-xs leading-relaxed">
                Your exact cash deposit is safely kept at the counter and any change is returned to you upon pickup.
              </Text>
            </View>

            <View className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200 mb-4">
              <Text className="font-bold text-gray-900 mb-1 text-xs">
                6-Digit MPIN Verification
              </Text>
              <Text className="text-gray-600 text-xs leading-relaxed">
                Parcels are only released at the counter when verified with your personal 6-digit MPIN for full security.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={closeEscrowModal}
            className="w-full mt-2 py-3 bg-[#215cd4] rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-xs">Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

