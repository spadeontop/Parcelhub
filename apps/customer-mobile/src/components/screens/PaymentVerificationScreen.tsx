import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { AppHeader } from '../layout/AppHeader';

export const PaymentVerificationScreen: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Screen Title & Header */}
      <AppHeader
        title="Order Status"
        subtitle="Lily's Catering Hub"
        showBackButton
        centerTitle
        onBack={() => navigateTo('home')}
        onHelp={() => navigateTo('faq')}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Status Card */}
          <View
            className="rounded-[24px] bg-white border border-[#f1f5f9] p-6 items-center mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            {/* Status Title */}
            <Text className="text-[22px] font-bold text-[#1e293b] text-center">
              Awaiting Payment
            </Text>

            {/* Success Status Subtitle */}
            <Text className="text-[13px] font-bold text-[#059669] text-center mt-1">
              Order created successfully!
            </Text>

            {/* Hero Circular Icon Badge with Green Checkmark (matching Figma 1235:741) */}
            <View className="my-6 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-[#ecfdf5] items-center justify-center border-4 border-[#d1fae5]">
                <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke="#059669"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            {/* Next Step Callout Box */}
            <View className="w-full bg-[#eff6ff] rounded-[16px] border border-[#dbeafe] p-4 items-center">
              <Text className="text-[12px] text-[#1e293b] text-center leading-[18px]">
                <Text className="font-bold text-[#1e40af]">Next step: </Text>
                Please head to Lily's Catering Hub to complete the cash payment. We will begin tracking your parcel once the payment is verified.
              </Text>
            </View>

            {/* Hub Policy & Information Link Row with Information Circle (i / !) Icon */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('faq')}
              className="mt-5 flex-row items-center justify-center gap-1.5"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth={2} />
                <Path d="M12 16v-4M12 8h.01" stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text className="text-[12px] font-bold text-[#64748b]">
                Hub Policy &amp; Information
              </Text>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Generate QR Pass Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('qr_screen')}
              className="w-full mt-6 h-[50px] rounded-[16px] bg-[#2563eb] flex-row items-center justify-center gap-2"
              style={{
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text className="text-white font-bold text-[14px] tracking-wide">
                Generate QR Pass
              </Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Return to Home Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigateTo('home')}
            className="w-full h-[50px] rounded-[16px] bg-white border border-[#cbd5e1] items-center justify-center mb-6"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text className="text-[14px] font-bold text-[#334155] tracking-wide">
              Return to Home
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default PaymentVerificationScreen;
