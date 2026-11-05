import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { CopyIcon } from '../common/Icons';

export const QrScreen: React.FC = () => {
  const { getCurrentOrder, copyToClipboard, navigateTo, showToast } = useApp();
  const order = getCurrentOrder();

  const handleSavePhoto = () => {
    showToast('Pickup QR pass saved to device photo storage!');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Unified Header */}
      <BrandHeader showBack={true} backTarget="home" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Center QR Card */}
        <View className="mt-3 items-center">
          <View className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm items-center w-full max-w-xs">
            <View className="bg-white p-4 rounded-2xl items-center justify-center border border-gray-100">
              <QRCode
                value={order.alphanumericKey || order.refCode || 'PARCELHUB-DEMO'}
                size={190}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            </View>

            {/* Ticket box */}
            <View className="mt-4 w-full bg-blue-50/80 border border-blue-200/70 rounded-2xl p-3 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold text-blue-900 uppercase">
                  TICKET
                </Text>
                <Text className="text-base font-black font-mono text-[#163b86]">
                  {order.alphanumericKey}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => copyToClipboard(order.alphanumericKey, 'Ticket')}
                className="p-1.5 rounded-lg bg-white border border-blue-100"
              >
                <CopyIcon size={16} color="#163b86" />
              </TouchableOpacity>
            </View>

            <Text className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
              Present this pass at Lily’s Catering Hub counter for scanning &amp; package release.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSavePhoto}
            className="w-full max-w-xs mt-4 py-3 bg-gray-100 rounded-2xl items-center border border-gray-200"
          >
            <Text className="text-gray-800 font-bold text-xs">
              💾 Save Pass to Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateTo('home')}
            className="py-3 mt-1"
          >
            <Text className="text-xs font-semibold text-gray-600">
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </View>
  );
};

