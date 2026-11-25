import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenshotSourceApp } from '../../types/api';
import { FieldError } from '../common/FieldError';

const BRAND_BLUE = '#215cd4';

const CARD_SHADOW = {
  shadowColor: '#111827',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

const TRACKING_TUTORIAL_BY_APP: Record<
  ScreenshotSourceApp,
  { title: string; steps: string }
> = {
  shopee: {
    title: 'Shopee Tracking Number Not Found',
    steps:
      'Open Shopee → Me → To Receive → tap your order → tap "Shipping Information" so the SPX/courier tracking number is visible, then upload that screenshot.',
  },
  lazada: {
    title: 'Lazada Tracking Number Not Found',
    steps:
      'Open Lazada → Account → To Receive → tap your order → tap "Track Package" so the LEX/courier tracking number is visible, then upload that screenshot.',
  },
  tiktok: {
    title: 'TikTok Shop Tracking Number Not Found',
    steps:
      'Open TikTok → Profile → Your Orders → tap your order → tap "Shipping details" so the courier tracking number is visible, then upload that screenshot.',
  },
  unknown: {
    title: 'Tracking Number Not Visible',
    steps:
      'Please upload a clear order or shipping details screenshot from Shopee, Lazada, or TikTok Shop that clearly shows the courier tracking number.',
  },
};

export interface CreateOrderReceiptCardProps {
  readonly previewSourceUri: string | null;
  readonly isOrderReady: boolean;
  readonly isPicking: boolean;
  readonly isScanning: boolean;
  readonly isSubmitting: boolean;
  readonly canRetry: boolean;
  readonly missingTrackingApp: ScreenshotSourceApp | null;
  readonly isHighlighted: boolean;
  readonly feedbackMessage: string | null;
  readonly shakeAnim: Animated.Value;
  readonly onUploadPress: () => void;
  readonly onRetryScan: () => void;
}

/**
 * Step 1 card for attaching and scanning a receipt screenshot on CreateOrderScreen.
 */
export const CreateOrderReceiptCard: React.FC<CreateOrderReceiptCardProps> = ({
  previewSourceUri,
  isOrderReady,
  isPicking,
  isScanning,
  isSubmitting,
  canRetry,
  missingTrackingApp,
  isHighlighted,
  feedbackMessage,
  shakeAnim,
  onUploadPress,
  onRetryScan,
}) => {
  const hasPhoto = Boolean(previewSourceUri);

  return (
    <>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <View
          className="rounded-[16px] p-3.5 border"
          style={[
            CARD_SHADOW,
            {
              backgroundColor: isHighlighted ? '#fff5f5' : '#ffffff',
              borderColor: isHighlighted ? '#fca5a5' : '#f1f5f9',
            },
          ]}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
              RECEIPT SCREENSHOT
            </Text>
            {isOrderReady && !isScanning ? (
              <Text className="text-[11px] font-semibold text-[#215cd4]">
                Attached
              </Text>
            ) : isHighlighted ? (
              <Text className="text-[11px] font-semibold text-[#dc2626]">
                Required
              </Text>
            ) : null}
          </View>

          {hasPhoto && previewSourceUri ? (
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onUploadPress}
                disabled={isScanning || isPicking || isSubmitting}
                className="w-12 h-12 rounded-[10px] overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] mr-3"
              >
                <Image
                  source={{ uri: previewSourceUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <View className="flex-1 mr-2">
                {isScanning ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={BRAND_BLUE} />
                    <Text className="text-[13px] font-semibold text-[#111827]">
                      Scanning receipt...
                    </Text>
                  </View>
                ) : isOrderReady ? (
                  <>
                    <Text className="text-[13px] font-semibold text-[#111827]">
                      Receipt attached
                    </Text>
                    <Text className="text-[11.5px] text-[#64748b] mt-0.5">
                      Order details populated
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-[13px] font-semibold text-[#b45309]">
                      Unable to read receipt
                    </Text>
                    <Text className="text-[11.5px] text-[#64748b] mt-0.5">
                      {missingTrackingApp
                        ? 'Tracking number missing'
                        : 'Retry or upload another photo'}
                    </Text>
                  </>
                )}
              </View>

              <View className="flex-row items-center gap-1.5">
                {canRetry && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onRetryScan}
                    className="px-2.5 py-1.5 rounded-[8px] bg-[#eff6ff]"
                  >
                    <Text className="text-[11.5px] font-semibold text-[#215cd4]">
                      Retry
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onUploadPress}
                  disabled={isScanning || isPicking || isSubmitting}
                  className="px-2.5 py-1.5 rounded-[8px] bg-[#f1f5f9]"
                >
                  <Text className="text-[11.5px] font-semibold text-[#475569]">
                    Replace
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onUploadPress}
              disabled={isPicking || isScanning}
              className="rounded-[12px] border border-dashed py-3 px-3 flex-row items-center"
              style={{
                backgroundColor: isHighlighted ? '#fef2f2' : '#f8fafc',
                borderColor: isHighlighted ? '#f87171' : '#cbd5e1',
              }}
            >
              <View className="mr-3 items-center justify-center">
                {isPicking ? (
                  <ActivityIndicator size="small" color={BRAND_BLUE} />
                ) : (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke={isHighlighted ? '#dc2626' : BRAND_BLUE}
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-[#111827]">
                  {isPicking ? 'Opening gallery...' : 'Attach receipt photo'}
                </Text>
                <Text className="text-[11.5px] text-[#64748b] mt-0.5">
                  Shopee · Lazada · TikTok Shop
                </Text>
              </View>

              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

          {feedbackMessage ? (
            <FieldError
              message={feedbackMessage}
              color={isHighlighted ? '#dc2626' : '#64748b'}
            />
          ) : null}
        </View>
      </Animated.View>

      {missingTrackingApp && (
        <View className="rounded-[14px] bg-[#fffbeb] border border-[#fde68a] p-3 mt-2">
          <Text className="text-[12px] font-bold text-[#92400e] mb-0.5">
            {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].title}
          </Text>
          <Text className="text-[11.5px] text-[#78350f] leading-[17px]">
            {TRACKING_TUTORIAL_BY_APP[missingTrackingApp].steps}
          </Text>
        </View>
      )}
    </>
  );
};

export default CreateOrderReceiptCard;
