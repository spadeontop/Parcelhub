import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { BackArrowIcon } from '../common/Icons';
import Svg, { Path } from 'react-native-svg';

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, loadSampleReceipt, showToast } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Unified Header */}
      <BrandHeader showBack={true} backTarget="home" />

      <View className="flex-row items-center justify-between mt-2 mb-2">
        <Text className="text-xl font-bold text-gray-900">Create an Order</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo('home')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-sm font-semibold text-gray-700">Back</Text>
          <BackArrowIcon size={14} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Upload Dropzone Card */}
        <View className="mt-2 flex-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              showToast('Select an image from gallery or tap sample receipt.');
            }}
            className="min-h-[300px] border-2 border-dashed border-gray-300 rounded-3xl items-center justify-center p-6 bg-[#f8f8f8]"
          >
            <View className="w-16 h-16 rounded-2xl bg-white border border-gray-200 items-center justify-center mb-3 shadow-sm">
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  stroke="#215cd4"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </Svg>
            </View>

            <Text className="text-base font-bold text-gray-900 text-center">
              Tap to upload receipt image
            </Text>
            <Text className="text-xs text-gray-400 mt-1 text-center">
              Supports Shopee, Lazada, TikTok Shop screenshots
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={loadSampleReceipt}
              className="mt-5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm"
            >
              <Text className="text-xs font-bold text-gray-800">
                ⚡ Use Sample Shopee Receipt
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <Text className="text-center text-xs font-medium text-gray-500 mt-3">
            Screenshot of Receipt
          </Text>

          {/* Next Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('confirm_order')}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] shadow-md items-center mb-4"
          >
            <Text className="text-white font-bold text-sm tracking-wide">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </View>
  );
};

