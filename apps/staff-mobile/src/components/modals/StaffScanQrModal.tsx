import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CameraView } from 'expo-camera';
import type { StaffQrLookupResult } from '../../services/staffApi';
import type { StaffOrder } from '../../types';
import {
  CAN_UPLOAD_QR,
  IS_ANDROID,
  QR_SCANNER_SETTINGS,
  useQrScanController,
} from '../../hooks/useQrScanController';

export interface StaffScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: StaffOrder, hasDetails: boolean) => void;
  onAmbiguousMatch?: (code: string, matches: StaffOrder[]) => void;
  findOrderByQrCode: (code: string, signal: AbortSignal) => Promise<StaffQrLookupResult>;
}

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

const ReticleWatermarkIcon: React.FC<{ size?: number }> = ({ size = 55.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 55.5 55.5" fill="none">
    <Path
      opacity={0.5}
      d="M30.8333 55.5V49.3333H37V55.5H30.8333V55.5M24.6667 49.3333V33.9167H30.8333V49.3333H24.6667V49.3333M49.3333 40.0833V27.75H55.5V40.0833H49.3333V40.0833M43.1667 27.75V21.5833H49.3333V27.75H43.1667V27.75M6.16667 33.9167V27.75H12.3333V33.9167H6.16667V33.9167M0 27.75V21.5833H6.16667V27.75H0V27.75M27.75 6.16667V0H33.9167V6.16667H27.75V6.16667M4.625 13.875H13.875V4.625H4.625V13.875V13.875M0 18.5V0H18.5V18.5H0V18.5M4.625 50.875H13.875V41.625H4.625V50.875V50.875M0 55.5V37H18.5V55.5H0V55.5M41.625 13.875H50.875V4.625H41.625V13.875V13.875M37 18.5V0H55.5V18.5H37V18.5M43.1667 55.5V46.25H37V40.0833H49.3333V49.3333H55.5V55.5H43.1667V55.5M30.8333 33.9167V27.75H43.1667V33.9167H30.8333V33.9167M18.5 33.9167V27.75H12.3333V21.5833H30.8333V27.75H24.6667V33.9167H18.5V33.9167M21.5833 18.5V6.16667H27.75V12.3333H33.9167V18.5H21.5833V18.5M6.9375 11.5625V6.9375H11.5625V11.5625H6.9375V11.5625M6.9375 48.5625V43.9375H11.5625V48.5625H6.9375V48.5625M43.9375 11.5625V6.9375H48.5625V11.5625H43.9375V11.5625"
      fill="#60A5FA"
    />
  </Svg>
);

export const StaffScanQrModal: React.FC<StaffScanQrModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onAmbiguousMatch,
  findOrderByQrCode,
}) => {
  const {
    rendered,
    isClosing,
    permission,
    needsPermission,
    cameraError,
    setCameraError,
    activity,
    notice,
    cameraIsVisible,
    sheetSlideAnim,
    translateY,
    previewMessage,
    handleClose,
    handleCameraAccess,
    handleScan,
    handleUploadQrImage,
    resetScanner,
  } = useQrScanController({
    isOpen,
    onClose,
    onSelectOrder,
    onAmbiguousMatch,
    findOrderByQrCode,
  });

  if (!rendered) return null;

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
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 24, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center py-[7px] mb-[20px]">
          <Text className="text-[20px] font-semibold text-[#0F172A] leading-[26px] text-center">
            Scan QR code
          </Text>
          <Text className="text-[12px] font-normal text-[#64748B] leading-[18px] text-center mt-[5px]">
            Scan an order or waybill to view its details.
          </Text>
        </View>

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

          <View className="bg-[#1E293B] h-[28px] w-[152px] rounded-[14px] items-center justify-center">
            <Text className="text-[10px] font-semibold text-[#CBD5E1] leading-[16px] text-center uppercase">
              CAMERA PREVIEW
            </Text>
          </View>

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
                    {needsPermission && !permission?.canAskAgain
                      ? 'Open Android settings'
                      : cameraError
                        ? 'Retry camera'
                        : 'Allow camera access'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {cameraIsVisible && (
            <Text className="text-[11px] font-normal text-white leading-[17px] text-center bg-[#1E293B] rounded-lg px-3 py-1">
              Scanning starts when a code is in view
            </Text>
          )}
        </View>

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

        <View className="mb-[20px] items-center">
          <Text className="text-[12px] font-normal text-[#64748B] text-center leading-[18px]">
            Keep the code flat, well lit and fully visible.{'\n'}
            Order and waybill QR codes are supported.
          </Text>
        </View>

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
