import React, { useMemo } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CheckIcon, ClockIcon } from '../common/Icons';

export type QrOverlayState = 'completed' | 'expired';

interface QrCodeFrameProps {
  readonly value: string;
  readonly overlayState?: QrOverlayState;
  readonly getRef?: (ref: any) => void;
}

const QR_SIZE = 168;
const FRAME_SIZE = 208; // 168px QR + 20px quiet zone on all 4 sides

/**
 * Authoritative square QR frame with a 20px quiet zone on every side,
 * guaranteeing crisp, unclipped scanning across all pass screens.
 */
export const QrCodeFrame: React.FC<QrCodeFrameProps> = ({
  value,
  overlayState,
  getRef,
}) => {
  const isDimmed = Boolean(overlayState);

  const memoizedQr = useMemo(
    () => (
      <QRCode
        getRef={getRef}
        value={value}
        size={QR_SIZE}
        color="#0f172a"
        backgroundColor="#ffffff"
      />
    ),
    [value, getRef]
  );

  return (
    <View className="w-full items-center justify-center py-5">
      <View
        style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
        className="bg-white rounded-[16px] border border-[#edf2f7] p-5 items-center justify-center relative"
      >
        <View style={{ opacity: isDimmed ? 0.08 : 1 }}>{memoizedQr}</View>

        {overlayState === 'completed' && (
          <View className="absolute inset-0 items-center justify-center">
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#ecfdf5',
              }}
              className="items-center justify-center"
            >
              <CheckIcon size={28} color="#059669" strokeWidth={2.6} />
            </View>
          </View>
        )}

        {overlayState === 'expired' && (
          <View className="absolute inset-0 items-center justify-center">
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#fef2f2',
              }}
              className="items-center justify-center"
            >
              <ClockIcon size={26} color="#dc2626" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
