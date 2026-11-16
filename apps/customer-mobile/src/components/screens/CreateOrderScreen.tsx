import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, draftOrder, loadSampleReceipt, showToast } = useApp();
  const hasUploadedReceipt = Boolean(draftOrder.receiptUri);

  const handleUploadPress = () => {
    // When user taps dropzone, attach the receipt image
    loadSampleReceipt();
  };

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Screen Title & Navigation Header */}
      <AppHeader
        title="Create an Order"
        showBackButton
        centerTitle
        onBack={() => navigateTo('home')}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Upload Card */}
          <View
            className="rounded-[24px] bg-white border border-[#f1f5f9] p-4 mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {/* UploadCard Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#f1f5f9]">
              <Text className="text-[12px] font-bold text-[#64748b] tracking-wider uppercase">
                SCREENSHOT OF RECEIPT
              </Text>
              {hasUploadedReceipt && (
                <View className="flex-row items-center gap-1 bg-[#ecfdf5] px-2 py-0.5 rounded-full">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <Text className="text-[10px] font-bold text-[#059669]">Attached</Text>
                </View>
              )}
            </View>

            {/* Upload Dropzone */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUploadPress}
              className="bg-[#f8fafc] border-[1.5px] border-dashed border-[#cbd5e1] rounded-[20px] items-center justify-center py-12 px-4"
            >
              {/* Dropzone Icon Badge */}
              <View
                className="w-14 h-14 rounded-2xl bg-white border border-[#e2e8f0] items-center justify-center mb-3.5"
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    stroke="#2563eb"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </Svg>
              </View>

              <Text className="text-[16px] font-bold text-[#1e293b] text-center">
                {hasUploadedReceipt ? 'Receipt image loaded' : 'Tap to upload receipt image'}
              </Text>
              <Text className="text-[12px] font-normal text-[#64748b] text-center mt-1">
                Supports Shopee, Lazada, TikTok Shop screenshots
              </Text>
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!hasUploadedReceipt) {
                // If tapped Next without uploading yet, auto-attach receipt & proceed
                loadSampleReceipt();
              } else {
                navigateTo('confirm_order');
              }
            }}
            className="w-full h-[52px] rounded-[16px] bg-[#2563eb] items-center justify-center flex-row shadow-sm mt-2"
            style={{
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-[15px] tracking-wide">
              Next
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
