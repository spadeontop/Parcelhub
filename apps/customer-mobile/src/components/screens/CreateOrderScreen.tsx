import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useOrderDraft } from '../../context/OrderDraftContext';
import { useCustomerOrderActions } from '../../hooks/useCustomerOrders';
import { compressCustomerScreenshot } from '../../utils/imageCompression';
import { ScreenshotSourceApp } from '../../types/api';
import { AppHeader } from '../layout/AppHeader';

const TRACKING_TUTORIAL_BY_APP: Record<
  ScreenshotSourceApp,
  { title: string; steps: string }
> = {
  shopee: {
    title: 'Shopee Tracking Number Not Found',
    steps:
      'Open Shopee → Me → To Receive → tap your order → tap "Shipping Information" so the SPX/courier tracking number is visible, then take a screenshot.',
  },
  lazada: {
    title: 'Lazada Tracking Number Not Found',
    steps:
      'Open Lazada → Account → To Receive → tap your order → tap "Track Package" so the LEX/courier tracking number is visible, then take a screenshot.',
  },
  tiktok: {
    title: 'TikTok Shop Tracking Number Not Found',
    steps:
      'Open TikTok → Profile → Your Orders → tap your order → tap "Shipping details" so the courier tracking number is visible, then take a screenshot.',
  },
  unknown: {
    title: 'Tracking Number Not Visible',
    steps:
      'Please upload a clear order or shipping details screenshot from Shopee, Lazada, or TikTok Shop that clearly shows the courier tracking number.',
  },
};

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, goBack } = useNavigationUi();
  const { showToast } = useToast();
  const { customer } = useAuthSession();
  const { orderDraft, updateOrderDraft } = useOrderDraft();
  const { initializeCustomerOrder } = useCustomerOrderActions();

  const [isInitializing, setIsInitializing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [missingTrackingApp, setMissingTrackingApp] = useState<ScreenshotSourceApp | null>(null);

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
        setMissingTrackingApp(null);
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

    setMissingTrackingApp(null);
    setIsInitializing(true);
    try {
      await initializeCustomerOrder(orderDraft.imageUrl);
    } catch (err: any) {
      if (err?.error === 'TrackingIdMissing') {
        const app: ScreenshotSourceApp =
          err?.sourceApp === 'shopee' ||
          err?.sourceApp === 'lazada' ||
          err?.sourceApp === 'tiktok'
            ? err.sourceApp
            : 'unknown';
        setMissingTrackingApp(app);
      }
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
        title="New Order"
        showBackButton
        centerTitle
        onBack={goBack}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] overflow-hidden">
        {/* Minimalist 2-Step Progress Bar */}
        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[12px] font-semibold text-[#2563eb]">
              Step 1 of 2 · Receipt
            </Text>
            <Text className="text-[12px] font-medium text-[#94a3b8]">
              Next: Details
            </Text>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 h-1 rounded-full bg-[#2563eb]" />
            <View className="flex-1 h-1 rounded-full bg-[#e2e8f0]" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }}
        >
          {/* Upload Dropzone / Preview */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleUploadPress}
            disabled={isInitializing || isPicking}
            className="rounded-[24px] bg-white overflow-hidden mb-4"
            style={{
              borderWidth: hasUploadedReceipt ? 1 : 1.5,
              borderStyle: hasUploadedReceipt ? 'solid' : 'dashed',
              borderColor: hasUploadedReceipt ? '#e2e8f0' : '#cbd5e1',
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            {hasUploadedReceipt && previewSourceUri ? (
              <View className="w-full h-[320px] bg-[#f1f5f9] relative">
                <Image
                  source={{ uri: previewSourceUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />

                {/* Top-left subtle attached pill */}
                <View
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex-row items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)' }}
                >
                  <View className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  <Text className="text-[11px] font-semibold text-white">
                    Receipt attached
                  </Text>
                </View>

                {/* Bottom-right replace pill */}
                <View
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
                >
                  {isPicking ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                  <Text className="text-[12px] font-semibold text-white">
                    {isPicking ? 'Selecting...' : 'Change photo'}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="items-center justify-center py-16 px-6">
                <View className="mb-4 items-center justify-center">
                  {isPicking ? (
                    <ActivityIndicator size="large" color="#2563eb" />
                  ) : (
                    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="#2563eb"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </View>

                <Text className="text-[16px] font-bold text-[#0f172a] text-center">
                  {isPicking ? 'Opening photo library...' : 'Upload order screenshot'}
                </Text>
                <Text className="text-[13px] font-normal text-[#64748b] text-center mt-1.5">
                  Shopee · Lazada · TikTok Shop
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* App-Specific Tracking ID Guidance (shown on 422 TrackingIdMissing) */}
          {missingTrackingApp ? (
            <View className="rounded-[18px] bg-[#fffbeb] border border-[#fde68a] p-4 mb-4">
              <Text className="text-[13px] font-bold text-[#92400e] mb-1">
                {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].title}
              </Text>
              <Text className="text-[12px] font-normal text-[#78350f] leading-5">
                {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].steps}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-start gap-2.5 px-1">
              <View className="mt-0.5">
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text className="flex-1 text-[12px] text-[#64748b] leading-[18px]">
                Make sure the courier tracking number is clearly visible in your screenshot so we can auto-fill your order.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky Bottom CTA */}
        <View className="px-5 pt-3 pb-7 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            disabled={isNextDisabled}
            className="w-full h-[52px] rounded-[16px] bg-[#2563eb] items-center justify-center flex-row"
            style={{
              opacity: isNextDisabled ? 0.45 : 1,
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isNextDisabled ? 0 : 0.22,
              shadowRadius: 10,
              elevation: isNextDisabled ? 0 : 4,
            }}
          >
            {isInitializing ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-bold text-[15px]">
                  Reading receipt...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-[15px]">
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CreateOrderScreen;
