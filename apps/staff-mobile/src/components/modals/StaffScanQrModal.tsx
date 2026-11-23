import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  AppState,
  Linking,
  ActivityIndicator,
  Platform,
  BackHandler,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView, scanFromURLAsync } from 'expo-camera';
import type { BarcodeType } from 'expo-camera';
import type { StaffQrLookupResult } from '../../services/staffApi';
import type { StaffOrder } from '../../types';

export interface StaffScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: StaffOrder, hasDetails: boolean) => void;
  findOrderByQrCode: (code: string, signal: AbortSignal) => Promise<StaffQrLookupResult>;
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
const QR_TYPES: BarcodeType[] = ['qr'];
const QR_SCANNER_SETTINGS = { barcodeTypes: QR_TYPES };
const IS_ANDROID = Platform.OS === 'android';
const CAN_UPLOAD_QR = IS_ANDROID || Platform.OS === 'web';
type CameraPermission = Awaited<ReturnType<typeof Camera.getCameraPermissionsAsync>>;

/**
 * Inline Content Sheet QR Scanner conforming to Figma node 1407:3
 * "ParcelHub — Scan QR code"
 */
export const StaffScanQrModal: React.FC<StaffScanQrModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  findOrderByQrCode,
}) => {
  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [permission, setPermission] = useState<CameraPermission | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activity, setActivity] = useState<'uploading' | 'searching' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isClosingRef = useRef(false);
  const attemptRef = useRef<AbortController | null>(null);
  const cameraIsVisible =
    IS_ANDROID && isOpen && !isClosing && appState === 'active' &&
    !!permission?.granted && !cameraError && !activity && !notice;

  useLayoutEffect(() => {
    if (!isOpen) return;
    setActivity(null);
    setNotice(null);
    setCameraError(null);
    return () => {
      attemptRef.current?.abort();
      attemptRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen) return;
    setAppState(AppState.currentState);
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, [isOpen]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen || appState !== 'active') return;
    let current = true;
    Camera.getCameraPermissionsAsync().then(
      (status) => {
        if (current) setPermission(status);
      },
      () => {
        if (current) setCameraError('Could not check camera access.');
      }
    );
    return () => {
      current = false;
    };
  }, [isOpen, appState]);

  // Synchronize opening & closing animations with native driver
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setIsClosing(false);
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
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [isOpen]);

  // Clean close transition without frame drops
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    attemptRef.current?.abort();
    attemptRef.current = null;

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
  }, [onClose, sheetSlideAnim]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen, handleClose]);

  // Laser beam loop: runs only while open and automatically cleans up
  useEffect(() => {
    if (!cameraIsVisible) return;

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
  }, [cameraIsVisible, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 140],
  });

  const handleCameraAccess = async () => {
    try {
      setCameraError(null);
      if (permission?.canAskAgain === false && !permission.granted) {
        await Linking.openSettings();
        return;
      }
      const status = permission?.granted
        ? await Camera.getCameraPermissionsAsync()
        : await Camera.requestCameraPermissionsAsync();
      setPermission(status);
    } catch {
      setCameraError('Could not access the camera.');
    }
  };

  const searchScannedCode = async (code: string, attempt: AbortController) => {
    setActivity('searching');
    try {
      const result = await findOrderByQrCode(code, attempt.signal);
      if (attempt.signal.aborted) return;
      if (result.kind === 'found') {
        handleClose();
        onSelectOrder(result.order, result.hasDetails);
        return;
      }
      setNotice(result.kind === 'ambiguous'
        ? 'Multiple orders match this QR code. Use manual search to choose an order.'
        : 'No order matches this QR code.');
    } catch {
      if (!attempt.signal.aborted) {
        setNotice('Could not search for the order. Check your connection and try again.');
      }
    } finally {
      if (!attempt.signal.aborted) setActivity(null);
    }
  };

  const beginAttempt = () => {
    if (!isOpen || isClosingRef.current || attemptRef.current) return null;
    const attempt = new AbortController();
    attemptRef.current = attempt;
    return attempt;
  };

  const handleScan = (value: string) => {
    const code = value.trim();
    if (!cameraIsVisible || AppState.currentState !== 'active' || !code) return;
    const attempt = beginAttempt();
    if (attempt) void searchScannedCode(code, attempt);
  };

  const handleUploadQrImage = async () => {
    const attempt = beginAttempt();
    if (!attempt) return;
    setActivity('uploading');
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (attempt.signal.aborted) return;
      if (selection.canceled || !selection.assets[0]) {
        attemptRef.current = null;
        return;
      }

      const barcodes = await scanFromURLAsync(selection.assets[0].uri, QR_TYPES);
      if (attempt.signal.aborted) return;

      const codes = [...new Set(barcodes.map(({ data }) => data.trim()).filter(Boolean))];
      if (codes.length === 1) {
        await searchScannedCode(codes[0], attempt);
        return;
      }
      setNotice(codes.length === 0
        ? 'No readable QR code was found. Choose a clear image of the code.'
        : 'Multiple QR codes were found. Choose an image with one code.');
    } catch {
      if (!attempt.signal.aborted) setNotice('Could not read the selected image. Try another image.');
    } finally {
      if (!attempt.signal.aborted) setActivity(null);
    }
  };

  const resetScanner = () => {
    attemptRef.current = null;
    setNotice(null);
  };

  if (!rendered) return null;

  const needsPermission = permission && !permission.granted;
  let previewMessage = 'Getting the camera ready…';
  if (!IS_ANDROID) {
    previewMessage = CAN_UPLOAD_QR ? 'Choose a QR image to look up an order.' : 'Use manual search to find an order.';
  } else if (needsPermission) {
    previewMessage = 'Allow camera access to scan parcel QR codes.';
  }

  return (
    <Animated.View
      pointerEvents={isOpen && !isClosing ? 'auto' : 'none'}
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
          {cameraIsVisible && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={QR_SCANNER_SETTINGS}
              onBarcodeScanned={({ data }) => handleScan(data)}
              onMountError={() => setCameraError('Could not start the camera.')}
            />
          )}
          {/* Camera Preview Label Pill (Figma 1407:30) */}
          <View className="bg-[#1E293B] h-[28px] w-[152px] rounded-[14px] items-center justify-center">
            <Text className="text-[10px] font-semibold text-[#CBD5E1] leading-[16px] text-center uppercase">
              CAMERA PREVIEW
            </Text>
          </View>

          {/* QR Alignment Guide Viewfinder (Figma 1407:32) */}
          {cameraIsVisible ? (
            <View className="w-[240px] h-[224px] rounded-[20px] items-center relative overflow-hidden">
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <ScanningCorners width={240} height={224} />
              </View>
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 71, opacity: 0.2 }}
                className="items-center justify-center"
              >
                <ReticleWatermarkIcon size={55.5} />
              </View>
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
              <Text
                style={{ position: 'absolute', top: 166 }}
                className="text-[12px] font-medium text-white leading-[18px] text-center bg-[#1E293B] rounded-lg px-4 py-1"
              >
                Position QR code here
              </Text>
            </View>
          ) : (
            <View className="w-full flex-1 justify-center items-center px-6 gap-3">
              {!!activity && <ActivityIndicator color="#60A5FA" />}
              <Text accessibilityLiveRegion="polite" className="text-sm text-center text-[#E2E8F0]">
                {activity === 'uploading' && 'Reading QR image…'}
                {activity === 'searching' && 'Searching for the order…'}
                {!activity && (notice || cameraError || previewMessage)}
              </Text>
              {!activity && notice && (
                <TouchableOpacity accessibilityRole="button" onPress={resetScanner} className="px-4 py-2">
                  <Text className="font-semibold text-[#93C5FD]">Scan again</Text>
                </TouchableOpacity>
              )}
              {IS_ANDROID && !activity && !notice && (cameraError || needsPermission) && (
                <TouchableOpacity accessibilityRole="button" onPress={handleCameraAccess} className="px-4 py-2">
                  <Text className="font-semibold text-[#93C5FD]">
                    {needsPermission && !permission.canAskAgain
                      ? 'Open Android settings'
                      : cameraError ? 'Retry camera' : 'Allow camera access'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Camera Note (Figma 1407:41) */}
          {cameraIsVisible && (
            <Text className="text-[11px] font-normal text-white leading-[17px] text-center bg-[#1E293B] rounded-lg px-3 py-1">
              Scanning starts when a code is in view
            </Text>
          )}
        </View>

        {/* 3. Upload QR Image Outlined Button (Figma 1407:44 / 1407:45) */}
        {CAN_UPLOAD_QR && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUploadQrImage}
            disabled={!!activity || !!notice}
            accessibilityRole="button"
            accessibilityLabel="Upload QR Image"
            style={{ opacity: activity || notice ? 0.6 : 1 }}
            className="w-full h-[48px] rounded-[14px] border border-[#2563EB] items-center justify-center mb-[26px]"
          >
            <Text className="text-[14px] font-semibold text-[#2563EB] leading-[20px] text-center">
              Upload QR Image
            </Text>
          </TouchableOpacity>
        )}

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
