import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
import { CARD_SHADOW } from '../common/cardStyles';

interface ClaimPassViewProps {
  readonly ticketCode: string;
  readonly orderId: string;
  readonly hasOrderDetail: boolean;
  readonly productName: string;
  readonly change: number;
  readonly qrIdentifier: string;
  readonly timeFormatted: string;
  readonly isClaimed: boolean;
  readonly isReleaseExpired: boolean;
  readonly isExpiringSoon: boolean;
  readonly isRefreshingRelease: boolean;
  readonly isPullRefreshing: boolean;
  readonly passFadeAnim: Animated.Value;
  readonly passSlideAnim: Animated.Value;
  readonly onRefresh: () => void;
  readonly onRefreshRelease: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Focused Ready-for-Release pickup pass showing a properly padded scannable QR code,
 * countdown timer / status state, and minimalist order details.
 */
export const ClaimPassView: React.FC<ClaimPassViewProps> = ({
  ticketCode,
  orderId,
  hasOrderDetail,
  productName,
  change,
  qrIdentifier,
  timeFormatted,
  isClaimed,
  isReleaseExpired,
  isExpiringSoon,
  isRefreshingRelease,
  isPullRefreshing,
  passFadeAnim,
  passSlideAnim,
  onRefresh,
  onRefreshRelease,
  onReturnHome,
}) => {
  const displayTicket = ticketCode || (hasOrderDetail ? orderId : '...');
  const isQrDimmed = isReleaseExpired || isClaimed;

  const memoizedQr = useMemo(
    () => (
      <QRCode
        value={qrIdentifier}
        size={168}
        color="#0f172a"
        backgroundColor="#ffffff"
      />
    ),
    [qrIdentifier]
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: passFadeAnim,
        transform: [{ translateY: passSlideAnim }],
      }}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onRefresh}
            tintColor="#215cd4"
            colors={['#215cd4']}
          />
        }
      >
        {/* Main QR Pass Card */}
        <View
          className="w-full rounded-[20px] bg-white border border-[#edf2f7] p-5 items-center mb-3.5"
          style={CARD_SHADOW}
        >
          {/* Centered Ticket Header */}
          <View className="w-full pb-4 border-b border-[#f1f5f9] items-center">
            <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
              PICKUP TICKET
            </Text>
            <Text className="font-mono text-[18px] font-bold text-[#0f172a] mt-1 tracking-[0.5px]">
              {displayTicket}
            </Text>
          </View>

          {/* Padded Square QR Frame (208x208 with 20px quiet zone around 168px QR) */}
          <View className="w-full items-center justify-center py-5">
            <View
              style={{ width: 208, height: 208 }}
              className="bg-white rounded-[16px] border border-[#edf2f7] p-5 items-center justify-center relative"
            >
              <View style={{ opacity: isQrDimmed ? 0.08 : 1 }}>
                {memoizedQr}
              </View>

              {/* Claimed Overlay */}
              {isClaimed && (
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
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4 4L19 7"
                        stroke="#059669"
                        strokeWidth={2.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
              )}

              {/* Expired Overlay */}
              {isReleaseExpired && !isClaimed && (
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
                    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                        stroke="#dc2626"
                        strokeWidth={2}
                      />
                      <Path
                        d="M12 6v6l4 2"
                        stroke="#dc2626"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Timer / Status Strip */}
          <View className="w-full bg-[#f8fafc] border border-[#f1f5f9] rounded-[14px] py-3.5 px-4 items-center">
            {isClaimed ? (
              <>
                <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
                  STATUS
                </Text>
                <Text className="text-[20px] font-bold text-[#059669] mt-0.5">
                  Claimed
                </Text>
              </>
            ) : isReleaseExpired ? (
              <>
                <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
                  STATUS
                </Text>
                <Text className="text-[20px] font-bold text-[#dc2626] mt-0.5">
                  Claim Expired
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[11px] font-bold text-[#64748b] tracking-[0.65px] uppercase">
                  TIME REMAINING
                </Text>
                <Text
                  className="text-[24px] font-bold tracking-[0.5px] mt-0.5"
                  style={{ color: isExpiringSoon ? '#dc2626' : '#0f172a' }}
                >
                  {timeFormatted}
                </Text>
              </>
            )}
          </View>

          {/* Concise Counter Instruction */}
          <Text className="text-[12.5px] font-normal text-[#64748b] text-center leading-[18px] mt-3.5 max-w-[260px]">
            {isClaimed
              ? 'Your order has been claimed. You can safely close this page.'
              : isReleaseExpired
              ? 'Pickup pass expired. Re-activate below when you are at the counter.'
              : 'Show this QR pass at the hub counter when requested by staff.'}
          </Text>
        </View>

        {/* Minimalist Order Details Card */}
        <View
          className="w-full rounded-[20px] bg-white border border-[#edf2f7] p-5 mb-4"
          style={CARD_SHADOW}
        >
          <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
            ORDER DETAILS
          </Text>

          <View className="mt-2.5 pb-3.5 border-b border-[#f1f5f9]">
            <Text
              numberOfLines={2}
              className="text-[15px] font-bold text-[#0f172a] leading-[21px]"
            >
              {productName}
            </Text>
          </View>

          <View className="pt-3.5 flex-row items-baseline justify-between">
            <Text className="text-[14px] font-medium text-[#64748b]">Cash Change</Text>
            <Text
              className="text-[17px] font-bold"
              style={{ color: change > 0 ? '#0f172a' : '#64748b' }}
            >
              {`₱${change.toLocaleString('en-US')}`}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3 pt-1">
          {isReleaseExpired && !isClaimed && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onRefreshRelease}
              disabled={isRefreshingRelease}
              style={{
                shadowColor: '#215cd4',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.24,
                shadowRadius: 10,
                elevation: 4,
              }}
              className="w-full h-[48px] rounded-[12px] bg-[#215cd4] items-center justify-center"
            >
              {isRefreshingRelease ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-[14px] text-center">
                  Re-activate Release Window
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onReturnHome}
            className="items-center justify-center py-2"
          >
            <Text className="text-[12.5px] font-semibold text-[#475569] text-center">
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};
