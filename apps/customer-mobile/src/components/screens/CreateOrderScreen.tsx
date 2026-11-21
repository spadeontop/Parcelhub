import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useV1 } from '../../v1/context/V1Context';
import { compressCustomerScreenshot } from '../../v1/utils/imageCompression';
import { AppHeader } from '../layout/AppHeader';

export const CreateOrderScreen: React.FC = () => {
  const {
    navigateTo,
    orderDraft,
    updateOrderDraft,
    initializeCustomerOrder,
    showToast,
    goBack,
    customer,
  } = useV1();

  const [isInitializing, setIsInitializing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const previewSourceUri = orderDraft.previewUri || orderDraft.imageUrl || null;
  const hasUploadedReceipt = Boolean(previewSourceUri);

  const handleUploadPress = async () => {
    if (isInitializing || isPicking) return;

    try {
      setIsPicking(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo library permission is required to select a receipt.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        showToast('Compressing receipt image...');
        const compressed = await compressCustomerScreenshot(
          asset.uri,
          asset.width,
          asset.height
        );
        updateOrderDraft({
          imageUrl: compressed.base64,
          previewUri: compressed.uri,
        });
        showToast('Receipt attached successfully!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to select image.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleNext = async () => {
    if (!hasUploadedReceipt || !orderDraft.imageUrl) {
      showToast('Please attach a receipt screenshot first.');
      return;
    }

    if (customer?.blacklisted) {
      showToast(
        customer.blacklistReason || 'Your account is suspended from creating new orders.'
      );
      return;
    }

    setIsInitializing(true);
    try {
      await initializeCustomerOrder(orderDraft.imageUrl);
    } catch (err: any) {
      showToast(err?.message || 'Failed to initialize order.');
    } finally {
      setIsInitializing(false);
    }
  };

  const isNextDisabled = !hasUploadedReceipt || isInitializing || isPicking;

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Screen Title & Navigation Header */}
      <AppHeader
        title="Create an Order"
        showBackButton
        centerTitle
        onBack={goBack}
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
              disabled={isInitializing || isPicking}
              className={`bg-[#f8fafc] border-[1.5px] border-dashed border-[#cbd5e1] rounded-[20px] items-center justify-center px-4 overflow-hidden ${
                hasUploadedReceipt && previewSourceUri ? 'py-4' : 'py-12'
              }`}
            >
              {hasUploadedReceipt && previewSourceUri ? (
                <View className="w-full items-center">
                  {/* Attached Image Preview */}
                  <View className="w-full h-[220px] rounded-[14px] overflow-hidden bg-slate-100 items-center justify-center mb-3 border border-[#e2e8f0]">
                    <Image
                      source={{ uri: previewSourceUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <View className="w-4 h-4 rounded-full bg-[#ecfdf5] items-center justify-center">
                      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17L4 12"
                          stroke="#059669"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                    <Text className="text-[13px] font-bold text-[#1e293b]">
                      {isPicking ? 'Selecting new image...' : 'Receipt attached'}
                    </Text>
                  </View>
                  <Text className="text-[12px] font-semibold text-[#2563eb] text-center mt-1">
                    Tap to change receipt image
                  </Text>
                </View>
              ) : (
                <>
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
                    {isPicking ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                        <Path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          stroke="#2563eb"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </Svg>
                    )}
                  </View>

                  <Text className="text-[16px] font-bold text-[#1e293b] text-center">
                    {isPicking
                      ? 'Selecting image...'
                      : 'Tap to upload receipt image'}
                  </Text>
                  <Text className="text-[12px] font-normal text-[#64748b] text-center mt-1">
                    Supports Shopee, Lazada, TikTok Shop screenshots
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={isNextDisabled}
            className={`w-full h-[52px] rounded-[16px] bg-[#2563eb] items-center justify-center flex-row shadow-sm mt-2 ${
              isNextDisabled ? 'opacity-50' : ''
            }`}
            style={{
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {isInitializing ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-bold text-[15px] tracking-wide">
                  Initializing Order...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-[15px] tracking-wide">
                Next
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
