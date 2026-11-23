import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { AppHeader } from '../layout/AppHeader';

export const PaymentVerificationScreen: React.FC = () => {
  const { navigateTo } = useNavigationUi();
  const { refetchOrders } = useCustomerOrders();

  const handleReturnHome = () => {
    refetchOrders().catch(() => {});
    navigateTo('home');
  };

  return (
    <View className="flex-1 bg-[#215cd4]">
      <StatusBar style="light" />

      {/* Screen Title & Header matching Figma 1319:356 / 1320:20 */}
      <AppHeader
        title="Order Status"
        subtitle="Lily's Catering Hub"
        showBackButton
        centerTitle
        backgroundColor="#215cd4"
        onBack={handleReturnHome}
        onHelp={() => navigateTo('faq')}
      />

      {/* Main Sheet with Curved Transition (matching Figma 1320:25) */}
      <View className="flex-1 bg-[#f1f5f9] rounded-t-[24px] overflow-hidden">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          {/* Payment Details Section (matching Figma 1320:26) */}
          <View className="w-full gap-4">
            {/* Payment Status Card (matching Figma 1320:27) */}
            <View className="w-full bg-white rounded-[16px] px-5 py-6 gap-6">
              {/* Order Confirmation Heading & Status Icon (matching Figma 1320:28) */}
              <View className="w-full gap-4 items-start">
                {/* Order Created Green Badge (matching Figma 1320:29) */}
                <View className="w-12 h-12 rounded-full bg-[#ecfdf5] items-center justify-center">
                  <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                    <Path
                      d="M15 24.5L21 30.5L33.5 18"
                      stroke="#059669"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>

                {/* Payment Headings (matching Figma 1320:30) */}
                <View className="w-full gap-1.5 items-start">
                  <Text className="text-[24px] font-bold text-[#24364b] leading-[30px]">
                    Awaiting Payment
                  </Text>
                  <Text className="text-[14px] font-medium text-[#047857] leading-[20px]">
                    Order created successfully!
                  </Text>
                </View>
              </View>

              {/* Card Divider (matching Figma 1320:33) */}
              <View className="w-full h-px bg-[#e2e8f0]" />

              {/* Next Step Instructions (matching Figma 1320:34) */}
              <View className="w-full gap-2 items-start">
                <Text className="text-[12px] font-bold text-[#64748b] leading-[18px]">
                  Next step:
                </Text>
                <Text className="text-[15px] font-normal text-[#24364b] leading-[23px]">
                  Please head to Lily's Catering Hub to complete the cash payment. We will begin tracking your parcel once the payment is verified.
                </Text>
              </View>
            </View>

            {/* Hub Policy & Information Card (matching Figma 1320:37) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('faq')}
              className="w-full bg-white rounded-[16px] px-5 py-4 flex-row items-center justify-between"
            >
              <Text className="text-[14px] font-medium text-[#24364b] leading-[20px]">
                Hub Policy &amp; Information
              </Text>
              <Svg width={6} height={10} viewBox="0 0 5.6 9.6" fill="none">
                <Path
                  d="M0.8 0.8L4.8 4.8L0.8 8.8"
                  stroke="#94a3b8"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Payment Actions Section (matching Figma 1320:39) */}
          <View className="w-full gap-2 pt-6">
            {/* Generate QR Pass Primary Action (matching Figma 1320:40) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('qr_screen')}
              className="w-full py-4 px-5 rounded-[12px] bg-[#215cd4] flex-row items-center justify-center gap-2.5"
            >
              <Text className="text-[15px] font-bold text-white leading-[22px]">
                Generate QR Pass
              </Text>
              <Svg width={18} height={18} viewBox="0 0 17.6 17.6" fill="none">
                <Path
                  d="M1.8 0.8H5.8C6.35228 0.8 6.8 1.24772 6.8 1.8V5.8C6.35228 6.35228 6.35228 6.8 5.8 6.8H1.8C1.24772 6.8 0.8 6.35228 0.8 5.8V1.8C0.8 1.24772 1.24772 0.8 1.8 0.8Z"
                  stroke="white"
                  strokeWidth={1.6}
                />
                <Path
                  d="M11.8 0.8H15.8C16.3523 0.8 16.8 1.24772 16.8 1.8V5.8C16.8 6.35228 16.3523 6.8 15.8 6.8H11.8C11.2477 6.8 10.8 6.35228 10.8 5.8V1.8C10.8 1.24772 11.2477 0.8 11.8 0.8Z"
                  stroke="white"
                  strokeWidth={1.6}
                />
                <Path
                  d="M1.8 10.8H5.8C6.35228 10.8 6.8 11.2477 6.8 11.8V15.8C6.8 16.3523 6.35228 16.8 5.8 16.8H1.8C1.24772 16.8 0.8 16.3523 0.8 15.8V11.8C0.8 11.2477 1.24772 10.8 1.8 10.8Z"
                  stroke="white"
                  strokeWidth={1.6}
                />
                <Path d="M13.3 10.8H10.8V13.3H13.3V10.8Z" fill="white" />
                <Path d="M16.8 14.3H14.3V16.8H16.8V14.3Z" fill="white" />
                <Path d="M16.8 10.8H14.3V13.3H16.8V10.8Z" fill="white" />
                <Path d="M13.3 14.3H10.8V16.8H13.3V14.3Z" fill="white" />
              </Svg>
            </TouchableOpacity>

            {/* Return to Home Secondary Action (matching Figma 1320:42) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReturnHome}
              className="w-full py-3.5 items-center justify-center"
            >
              <Text className="text-[14px] font-medium text-[#64748b] leading-[20px] text-center">
                Return to Home
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default PaymentVerificationScreen;
