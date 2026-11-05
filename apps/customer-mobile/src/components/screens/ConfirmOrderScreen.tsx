import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BackArrowIcon } from '../common/Icons';

export const ConfirmOrderScreen: React.FC = () => {
  const {
    draftOrder,
    updateDraftOrder,
    submitDraftOrder,
    navigateTo,
    showToast,
  } = useApp();
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!isConfirmed) {
      showToast('Please check the confirmation box to proceed.');
      return;
    }
    submitDraftOrder();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Screen Title & Navigation */}
      <View className="flex-row items-center justify-between py-2 mb-2 border-b border-gray-100/90 pb-3">
        <Text className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
          Confirm Order Details
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('create_order')}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100"
          accessibilityLabel="Back to Upload"
        >
          <BackArrowIcon size={14} color="#374151" />
          <Text className="text-xs font-semibold text-gray-700">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="space-y-2.5 mt-1">
          {/* Product Field */}
          <View className="p-3.5 rounded-2xl border border-gray-200 bg-white mb-2">
            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Product
            </Text>
            <TextInput
              value={draftOrder.product}
              onChangeText={(text) => updateDraftOrder({ product: text })}
              className="w-full text-base font-semibold text-gray-900 mt-0.5 py-1"
              placeholder="e.g. Wireless Mouse"
            />
          </View>

          {/* Receiver's Name Field */}
          <View className="p-3.5 rounded-2xl border border-gray-200 bg-white mb-2">
            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Receiver’s Name
            </Text>
            <TextInput
              value={draftOrder.recipient}
              onChangeText={(text) => updateDraftOrder({ recipient: text })}
              className="w-full text-base font-semibold text-gray-900 mt-0.5 py-1"
              placeholder="Recipient name"
            />
          </View>

          {/* Total COD Amount Field */}
          <View className="p-3.5 rounded-2xl border border-gray-200 bg-white mb-2">
            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Amount
            </Text>
            <TextInput
              value={draftOrder.totalAmount}
              onChangeText={(text) => updateDraftOrder({ totalAmount: text })}
              className="w-full text-base font-bold text-gray-900 font-mono mt-0.5 py-1"
              placeholder="₱480"
            />
          </View>

          {/* Tracking ID Field */}
          <View className="p-3.5 rounded-2xl border border-gray-200 bg-white mb-2">
            <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Tracking ID
            </Text>
            <TextInput
              value={draftOrder.trackingId}
              onChangeText={(text) => updateDraftOrder({ trackingId: text })}
              className="w-full text-base font-mono font-semibold text-gray-900 mt-0.5 py-1"
              placeholder="PH2696153366792H"
            />
          </View>
        </View>

        {/* Receipt Thumbnail Preview */}
        <View className="mt-3 items-center">
          <View className="w-28 h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 items-center justify-center p-2">
            <Text className="text-[11px] font-mono text-gray-400 text-center">
              📄 Shopee Receipt OCR Verified
            </Text>
          </View>
          <Text className="text-xs font-medium text-gray-500 mt-1.5">
            Screenshot of Receipt
          </Text>
        </View>

        {/* Hub Policy link */}
        <TouchableOpacity
          onPress={() => navigateTo('faq')}
          className="mt-3 items-center"
        >
          <Text className="text-xs text-[#215cd4] font-semibold">
            View Hub Policy &amp; Cash Escrow Details
          </Text>
        </TouchableOpacity>

        {/* Confirmation Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsConfirmed(!isConfirmed)}
          className="mt-3 flex-row items-center justify-center gap-2"
        >
          <View
            className={`w-5 h-5 rounded border items-center justify-center ${
              isConfirmed
                ? 'bg-[#215cd4] border-[#215cd4]'
                : 'border-gray-400 bg-white'
            }`}
          >
            {isConfirmed && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-xs font-semibold text-gray-800">
            I confirm that these order details are correct
          </Text>
        </TouchableOpacity>

        {/* Create Order Button */}
        <TouchableOpacity
          activeOpacity={isConfirmed ? 0.8 : 1}
          disabled={!isConfirmed}
          onPress={handleSubmit}
          className={`w-full mt-4 py-3.5 px-6 rounded-2xl shadow-md items-center mb-6 ${isConfirmed ? 'bg-[#215cd4] active:bg-[#194cb5]' : 'bg-gray-300 opacity-80'}`}
        >
          <Text className="text-white font-bold text-sm tracking-wide">
            Submit Order &amp; Proceed to Payment
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

