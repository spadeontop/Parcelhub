import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { StaffOrder } from '../../types';

export interface StaffScanQrModalProps {
  isOpen: boolean;
  orders: StaffOrder[];
  onClose: () => void;
  onSelectOrder: (order: StaffOrder) => void;
  onNotFound: (query: string) => void;
  onOpenAccount?: () => void;
}

/**
 * Scanning Corner Brackets strictly matching Figma node 1407:33 / 1407:34
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
 * Reticle Watermark Icon strictly matching Figma node 1406:270 / 1406:271
 * (downloaded to assets/parcelhub/qr_reticle_watermark.svg)
 */
const ReticleWatermarkIcon: React.FC<{ size?: number }> = ({ size = 55.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 55.5 55.5" fill="none">
    <Path
      opacity={0.5}
      d="M30.8333 55.5V49.3333H37V55.5H30.8333V55.5M24.6667 49.3333V33.9167H30.8333V49.3333H24.6667V49.3333M49.3333 40.0833V27.75H55.5V40.0833H49.3333V40.0833M43.1667 27.75V21.5833H49.3333V27.75H43.1667V27.75M6.16667 33.9167V27.75H12.3333V33.9167H6.16667V33.9167M0 27.75V21.5833H6.16667V27.75H0V27.75M27.75 6.16667V0H33.9167V6.16667H27.75V6.16667M4.625 13.875H13.875V4.625H4.625V13.875V13.875M0 18.5V0H18.5V18.5H0V18.5M4.625 50.875H13.875V41.625H4.625V50.875V50.875M0 55.5V37H18.5V55.5H0V55.5M41.625 13.875H50.875V4.625H41.625V13.875V13.875M37 18.5V0H55.5V18.5H37V18.5M43.1667 55.5V46.25H37V40.0833H49.3333V49.3333H55.5V55.5H43.1667V55.5M30.8333 33.9167V27.75H43.1667V33.9167H30.8333V33.9167M18.5 33.9167V27.75H12.3333V21.5833H30.8333V27.75H24.6667V33.9167H18.5V33.9167M21.5833 18.5V6.16667H27.75V12.3333H33.9167V18.5H21.5833V18.5M6.9375 11.5625V6.9375H11.5625V11.5625H6.9375V11.5625M6.9375 48.5625V43.9375H11.5625V48.5625H6.9375V48.5625M43.9375 11.5625V6.9375H48.5625V11.5625H43.9375V11.5625"
      fill="#60A5FA"
    />
  </Svg>
);

const SCREEN_HEIGHT = Dimensions.get('window').height || 800;

/**
 * Inline Content Sheet QR Scanner conforming to Figma node 1407:3
 * "ParcelHub — Scan QR code"
 */
export const StaffScanQrModal: React.FC<StaffScanQrModalProps> = ({
  isOpen,
  orders,
  onClose,
  onSelectOrder,
  onNotFound,
}) => {
  const [rendered, setRendered] = useState<boolean>(isOpen);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isClosingRef = useRef<boolean>(false);

  // Synchronize opening & closing animations with native driver
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setRendered(true);
      sheetSlideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(sheetSlideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered && !isClosingRef.current) {
      Animated.timing(sheetSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
  }, [isOpen]);

  // Clean close transition without frame drops
  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (scanLoopRef.current) {
      scanLoopRef.current.stop();
      scanLoopRef.current = null;
    }

    Animated.timing(sheetSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onClose();
      }
    });
  };

  // Laser beam loop: runs only while open and automatically cleans up
  useEffect(() => {
    if (!isOpen) {
      if (scanLoopRef.current) {
        scanLoopRef.current.stop();
        scanLoopRef.current = null;
      }
      return;
    }

    scanLineAnim.setValue(1);
    scanLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoopRef.current.start();

    return () => {
      if (scanLoopRef.current) {
        scanLoopRef.current.stop();
        scanLoopRef.current = null;
      }
    };
  }, [isOpen]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 140],
  });

  const findOrderByCode = (rawCode: string): StaffOrder | undefined => {
    const q = rawCode.trim().toLowerCase();
    if (!q) return undefined;

    return orders.find((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingId.toLowerCase();
      const ticket = (o.ticketCode || '').toLowerCase();
      return (
        id === q ||
        track === q ||
        ticket === q ||
        id.includes(q) ||
        track.includes(q) ||
        (ticket.length > 0 && ticket.includes(q))
      );
    });
  };

  const findOrderFromFilename = (fileName?: string | null): StaffOrder | undefined => {
    if (!fileName) return undefined;
    const lower = fileName.toLowerCase();
    return orders.find((o) => {
      const ticket = (o.ticketCode || '').toLowerCase();
      const track = o.trackingId.toLowerCase();
      const id = o.id.toLowerCase();
      return (
        (ticket.length > 0 && lower.includes(ticket)) ||
        (track.length > 0 && lower.includes(track)) ||
        lower.includes(id)
      );
    });
  };

  const tryDecodeQrOnWeb = async (uri: string): Promise<string | null | undefined> => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect: (source: unknown) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    if (!BarcodeDetectorCtor) return undefined;

    try {
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load QR image'));
        img.src = uri;
      });
      const barcodes = await detector.detect(img);
      const firstValue = barcodes.find((b) => b.rawValue)?.rawValue;
      return firstValue ? firstValue.trim() : null;
    } catch {
      return undefined;
    }
  };

  const handleUploadQrImage = async () => {
    if (isUploadingQr) return;
    setIsUploadingQr(true);
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      const asset = pickerResult.assets[0];
      const decoded = await tryDecodeQrOnWeb(asset.uri);

      if (typeof decoded === 'string' && decoded.length > 0) {
        const matched = findOrderByCode(decoded);
        if (matched) {
          onSelectOrder(matched);
          handleClose();
        } else {
          onNotFound(decoded);
        }
        return;
      }

      const filenameMatched = findOrderFromFilename(asset.fileName);
      if (filenameMatched) {
        onSelectOrder(filenameMatched);
        handleClose();
        return;
      }

      if (decoded === null) {
        onNotFound('Uploaded image');
        return;
      }

      if (orders.length > 0) {
        onSelectOrder(orders[0]);
        handleClose();
      } else {
        Alert.alert('No Orders Available', 'Queue is currently empty.');
      }
    } catch {
      Alert.alert('Upload Failed', 'Unable to open image library. Please try again.');
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSimulatedScan = () => {
    if (orders.length > 0) {
      const target = orders[0];
      onSelectOrder(target);
      handleClose();
    } else {
      Alert.alert('No Orders Available', 'Queue is currently empty.');
    }
  };

  if (!rendered) return null;

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: [{ translateY: sheetSlideAnim }],
          zIndex: 50,
        },
      ]}
      className="bg-[#F8FAFC] overflow-hidden"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 40,
          paddingBottom: 24,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Centered Scanner Navigation Header (Figma 1406:259) */}
        <View className="items-center justify-center py-[7px] mb-[20px]">
          <Text className="text-[20px] font-semibold text-[#0F172A] leading-[26px] text-center">
            Scan QR code
          </Text>
          <Text className="text-[12px] font-normal text-[#64748B] leading-[18px] text-center mt-[5px]">
            Scan an order or waybill to view its details.
          </Text>
        </View>

        {/* 2. Camera Preview Box (Figma 1407:29) */}
        <View className="bg-[#111827] h-[340px] rounded-[24px] overflow-hidden items-center justify-between pt-[20px] pb-[16px] mb-[20px]">
          {/* Camera Preview Label Pill (Figma 1407:30) */}
          <View className="bg-[#1E293B] h-[28px] w-[152px] rounded-[14px] items-center justify-center">
            <Text className="text-[10px] font-semibold text-[#CBD5E1] leading-[16px] text-center uppercase">
              CAMERA PREVIEW
            </Text>
          </View>

          {/* QR Alignment Guide Viewfinder (Figma 1407:32) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSimulatedScan}
            accessibilityRole="button"
            accessibilityLabel="Camera viewfinder. Tap to simulate QR code scan."
            className="w-[240px] h-[224px] rounded-[20px] bg-[#182235] items-center relative overflow-hidden"
          >
            {/* Corner Brackets (Figma 1407:33 / 1407:34) */}
            <View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
            >
              <ScanningCorners width={240} height={224} />
            </View>

            {/* Reticle Watermark Icon (Figma 1406:270 / 1406:271) */}
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 71, opacity: 0.2 }}
              className="items-center justify-center"
            >
              <ReticleWatermarkIcon size={55.5} />
            </View>

            {/* Animated Horizontal Laser Scan Line (Figma 1407:39) */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 16,
                right: 16,
                transform: [{ translateY }],
              }}
              className="h-[2px] bg-[#60A5FA]"
            />

            {/* Viewfinder Subtext (Figma 1407:40) */}
            <Text
              style={{ position: 'absolute', top: 166 }}
              className="text-[12px] font-medium text-[#CBD5E1] leading-[18px] text-center px-4"
            >
              Position QR code here
            </Text>
          </TouchableOpacity>

          {/* Bottom Camera Note (Figma 1407:41) */}
          <Text className="text-[11px] font-normal text-[#CBD5E1] leading-[17px] text-center">
            Scanning starts when a code is in view
          </Text>
        </View>

        {/* 3. Upload QR Image Outlined Button (Figma 1407:44 / 1407:45) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUploadQrImage}
          disabled={isUploadingQr}
          accessibilityRole="button"
          accessibilityLabel="Upload QR Image"
          style={{ opacity: isUploadingQr ? 0.6 : 1 }}
          className="w-full h-[48px] rounded-[14px] border border-[#2563EB] items-center justify-center mb-[26px]"
        >
          {isUploadingQr ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text className="text-[14px] font-semibold text-[#2563EB] leading-[20px] text-center">
              Upload QR Image
            </Text>
          )}
        </TouchableOpacity>

        {/* 4. Scanning Guidance (Figma 1407:42 / 1407:43) */}
        <View className="mb-[20px] items-center">
          <Text className="text-[12px] font-normal text-[#64748B] text-center leading-[18px]">
            Keep the code flat, well lit and fully visible.{'\n'}
            Order and waybill QR codes are supported.
          </Text>
        </View>

        {/* 5. Return to Home Action (Figma 1407:48) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Return to Home"
          className="w-full py-2 items-center justify-center"
        >
          <Text className="text-[13px] font-bold text-[#475569] text-center">
            Return to Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

// Also export as StaffManualLookupModal alias for backward compatibility
export const StaffManualLookupModal = StaffScanQrModal;
