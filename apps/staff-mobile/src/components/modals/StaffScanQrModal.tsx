import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StaffOrder } from '../../types';
import { StaffHeader } from '../header/StaffHeader';
import { ArrowLeft, Search, X, Check } from '../common/Icons';

export interface StaffScanQrModalProps {
  isOpen: boolean;
  orders: StaffOrder[];
  onClose: () => void;
  onSelectOrder: (order: StaffOrder) => void;
  onNotFound: (query: string) => void;
  onOpenAccount?: () => void;
}

/**
 * Scanning Corner Brackets strictly matching Figma node 1355:35
 */
const ScanningCorners: React.FC<{ width?: number; height?: number }> = ({
  width = 240,
  height = 224,
}) => (
  <Svg width={width} height={height} viewBox="0 0 240 224" fill="none">
    <Path
      d="M1 33V17C1 6.33333 6.33333 1 17 1H33M207 1H223C233.667 1 239 6.33333 239 17V33M239 191V207C239 217.667 233.667 223 223 223H207M33 223H17C6.33333 223 1 217.667 1 207V191"
      stroke="#60A5FA"
      strokeWidth={3}
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Center QR Symbol strictly matching Figma node 1355:37
 */
const QrScanSymbol: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M6 10V8C6 6.89617 6.89617 6 8 6H10M20 6H22C23.1038 6 24 6.89617 24 8V10M24 20V22C24 23.1038 23.1038 24 22 24H20M10 24H8C6.89617 24 6 23.1038 6 22V20"
      stroke="#E2E8F0"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.8}
    />
    <Path
      d="M15 14H17C17.5519 14 18 14.4481 18 15V17C18 17.5519 17.5519 18 17 18H15C14.4481 18 14 17.5519 14 17V15C14 14.4481 14.4481 14 15 14V14"
      fill="#E2E8F0"
      fillOpacity={0.4}
      stroke="#E2E8F0"
      strokeWidth={3}
    />
    <Path
      d="M27 26H29C29.5519 26 30 26.4481 30 27V29C30 29.5519 29.5519 30 29 30H27C26.4481 30 26 29.5519 26 29V27C26 26.4481 26.4481 26 27 26V26"
      fill="#E2E8F0"
      fillOpacity={0.4}
      stroke="#E2E8F0"
      strokeWidth={3}
    />
  </Svg>
);

/**
 * Full-screen QR Scanning modal strictly conforming to Figma node 1355:3
 * "ParcelHub — Scan QR code"
 */
export const StaffScanQrModal: React.FC<StaffScanQrModalProps> = ({
  isOpen,
  orders,
  onClose,
  onSelectOrder,
  onNotFound,
  onOpenAccount,
}) => {
  const [isManualSearchVisible, setIsManualSearchVisible] = useState<boolean>(false);
  const [lookupText, setLookupText] = useState<string>('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Animate the laser scan line vertically across the viewfinder
  useEffect(() => {
    if (!isOpen) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isOpen]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 150],
  });

  const handleLookup = () => {
    const q = lookupText.trim().toLowerCase();
    if (!q) return;

    const matched = orders.find((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingId.toLowerCase();
      return id === q || track === q || id.includes(q) || track.includes(q);
    });

    if (matched) {
      onSelectOrder(matched);
      onClose();
      setLookupText('');
      setIsManualSearchVisible(false);
    } else {
      onNotFound(lookupText.trim());
    }
  };

  const handleSimulatedScan = () => {
    if (orders.length > 0) {
      // Pick first or random active order for simulated scan
      const target = orders[0];
      onSelectOrder(target);
      onClose();
    } else {
      Alert.alert('No Orders Available', 'Queue is currently empty.');
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Top Header matching Figma 1355:4 / StaffHeader */}
        <StaffHeader onOpenAccount={onOpenAccount || onClose} />

        {/* Curved Content Sheet matching Figma 1355:5 */}
        <View
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          className="flex-1 bg-[#F8FAFC] overflow-hidden"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Scanner Navigation (Figma 1355:6) */}
            <View className="flex-row items-center mb-5">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                accessibilityLabel="Back to orders"
                className="w-[44px] h-[44px] rounded-[14px] bg-white border border-[#E2E8F0] items-center justify-center shadow-xs active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#0F172A" />
              </TouchableOpacity>
              <Text className="text-[20px] font-bold text-[#0F172A] leading-7 ml-3.5">
                Scan QR code
              </Text>
            </View>

            {/* 2. Scan Instructions (Figma 1355:7) */}
            <View className="mb-5">
              <Text className="text-[13px] font-normal text-[#64748B] leading-[20px]">
                Align the parcel’s QR code inside the frame to find its order details.
              </Text>
            </View>

            {/* 3. Camera Preview Box (Figma 1355:8) */}
            <View className="bg-[#111827] h-[340px] rounded-[24px] overflow-hidden items-center justify-between py-5 mb-5 relative">
              {/* Camera Preview Label Badge (Figma 1355:32) */}
              <View className="bg-[#1E293B] rounded-full px-4 py-1.5">
                <Text className="text-[10px] font-semibold text-[#CBD5E1] tracking-wider text-center uppercase">
                  CAMERA PREVIEW
                </Text>
              </View>

              {/* QR Alignment Guide Viewfinder (Figma 1355:34) */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSimulatedScan}
                accessibilityLabel="Camera viewfinder. Tap to simulate QR code scan."
                className="w-[240px] h-[224px] rounded-[20px] bg-[#182235] items-center justify-center relative overflow-hidden my-auto"
              >
                {/* Corner Brackets (Figma 1355:35) */}
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  <ScanningCorners width={240} height={224} />
                </View>

                {/* Center QR Scan Symbol (Figma 1355:37) */}
                <View className="items-center justify-center mb-1">
                  <QrScanSymbol size={48} />
                </View>

                {/* Animated Horizontal Laser Scan Line (Figma 1355:41) */}
                <Animated.View
                  style={{
                    transform: [{ translateY }],
                  }}
                  className="absolute left-4 right-4 h-[2px] bg-[#60A5FA] rounded-full shadow-sm"
                />

                {/* Viewfinder Subtext (Figma 1355:42) */}
                <Text className="text-[12px] font-medium text-[#CBD5E1] text-center mt-3">
                  Position QR code here
                </Text>
              </TouchableOpacity>

              {/* Bottom Camera Note (Figma 1355:43) */}
              <Text className="text-[11px] font-normal text-[#CBD5E1] text-center">
                Scanning starts when a code is in view
              </Text>
            </View>

            {/* 4. Scanning Guidance (Figma 1355:9) */}
            <View className="mb-5 items-center">
              <Text className="text-[12px] font-normal text-[#64748B] text-center leading-[18px]">
                Keep the code flat, well lit and fully visible.{'\n'}
                Order and waybill QR codes are supported.
              </Text>
            </View>

            {/* 5. Manual Search Section (Figma 1355:10) */}
            {!isManualSearchVisible ? (
              <View className="items-center">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setIsManualSearchVisible(true)}
                  className="w-full h-[48px] bg-[#2563EB] rounded-[14px] items-center justify-center shadow-xs active:bg-blue-700"
                >
                  <Text className="text-white font-semibold text-[14px]">
                    Search manually
                  </Text>
                </TouchableOpacity>

                <Text className="text-[11px] font-normal text-[#64748B] text-center mt-2.5">
                  Use an order, tracking or waybill number instead.
                </Text>
              </View>
            ) : (
              /* Inline Manual Search Input Card */
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-[12px] font-bold text-[#1E293B] uppercase tracking-wide">
                    Manual Order Lookup
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsManualSearchVisible(false)}
                    className="p-1"
                  >
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 mb-3">
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    value={lookupText}
                    onChangeText={setLookupText}
                    placeholder="e.g. PH2696153368792H or ORD-392"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    className="flex-1 ml-2 text-xs font-mono font-bold text-[#0F172A] p-0"
                  />
                  {lookupText.length > 0 && (
                    <TouchableOpacity onPress={() => setLookupText('')}>
                      <X size={14} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleLookup}
                  disabled={!lookupText.trim()}
                  className={`py-3 rounded-xl items-center justify-center shadow-xs ${
                    lookupText.trim()
                      ? 'bg-[#2563EB] active:bg-blue-700'
                      : 'bg-[#94A3B8]'
                  }`}
                >
                  <Text className="text-white font-bold text-xs">
                    Find Order Details
                  </Text>
                </TouchableOpacity>

                {/* Quick Pick Chips for Testing/Speed */}
                {orders.length > 0 && (
                  <View className="mt-3 border-t border-[#F1F5F9] pt-2.5">
                    <Text className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                      Recent Orders
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row gap-2"
                    >
                      {orders.slice(0, 4).map((o) => (
                        <TouchableOpacity
                          key={o.id}
                          onPress={() => {
                            onSelectOrder(o);
                            onClose();
                          }}
                          className="bg-[#F1F5F9] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] active:bg-slate-200"
                        >
                          <Text className="text-[11px] font-mono font-semibold text-[#0F172A]">
                            {o.id}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Also export as StaffManualLookupModal alias for backward compatibility
export const StaffManualLookupModal = StaffScanQrModal;
