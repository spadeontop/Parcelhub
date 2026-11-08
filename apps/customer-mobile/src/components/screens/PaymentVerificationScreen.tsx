import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { QrCodeIcon } from '../common/Icons';

export const PaymentVerificationScreen: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2 justify-between">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="py-4">
          <View className="rounded-3xl border border-gray-200 bg-white p-7 items-center shadow-sm">
            <Text className="text-2xl font-bold text-gray-900">
              Awaiting Payment
            </Text>

            <Text className="text-base font-bold text-[#10b780] mt-3">
              Order created successfully!
            </Text>

            <Text className="text-sm text-[#215cd4] font-medium text-center leading-relaxed mt-4 max-w-xs">
              <Text className="font-bold">Next step:</Text> Please head to Lily’s Catering Hub to complete the cash payment. We will begin tracking your parcel once the payment is verified.
            </Text>

            {/* Learn more toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('faq')}
              className="mt-5 flex-row items-center gap-1.5"
            >
              <Text className="text-xs text-gray-500 font-semibold">
                ℹ️ Hub Policy &amp; Information
              </Text>
            </TouchableOpacity>

            {/* Generate QR Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('qr_screen')}
              className="w-full mt-7 py-3.5 px-6 rounded-2xl bg-[#215cd4] shadow-md flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-bold text-sm tracking-wide">
                Generate QR Pass
              </Text>
              <QrCodeIcon size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Return to Home Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigateTo('home')}
            className="items-center mt-6 mb-4"
          >
            <Text className="text-sm font-semibold text-gray-700">
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

