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

interface RefundPassViewProps {
  readonly ticketCode: string;
  readonly orderId: string;
  readonly hasOrderDetail: boolean;
  readonly productName: string;
  readonly refundAmount: number;
  readonly qrIdentifier: string;
  readonly timeFormatted: string;
  readonly isRefunded?: boolean;
  readonly isRefundExpired: boolean;
  readonly isExpiringSoon: boolean;
  readonly isRefreshingRefund?: boolean;
  readonly isPullRefreshing: boolean;
  readonly passFadeAnim: Animated.Value;
  readonly passSlideAnim: Animated.Value;
  readonly onRefresh: () => void;
  readonly onRefreshRefund: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Focused Ready-for-Refund pass showing the refund QR code,
 * countdown timer / status badge, and expiry reactivation controls.
 */
export const RefundPassView: React.FC<RefundPassViewProps> = ({
  ticketCode,
  orderId,
  hasOrderDetail,
  productName,
  refundAmount,
  qrIdentifier,
  timeFormatted,
  isRefunded = false,
  isRefundExpired,
  isExpiringSoon,
  isRefreshingRefund = false,
  isPullRefreshing,
  passFadeAnim,
  passSlideAnim,
  onRefresh,
  onRefreshRefund,
  onReturnHome,
}) => {
  const memoizedQr = useMemo(
    () => (
      <QRCode
        value={qrIdentifier}
        size={210}
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
        transform: [{ translateX: passSlideAnim }],
      }}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
      >
        <View className="items-center">
          {/* Main PassCard: White Surface, Rounded 24px, Shadow */}
          <View
            style={{
              shadowColor: '#215CD4',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 30,
              elevation: 4,
            }}
            className="w-full rounded-[24px] bg-white border border-[#f1f5f9] p-5 items-center mb-4"
          >
            {/* PassCard Header: Refund Ticket ID */}
            <View className="w-full pb-3 border-b border-[#e2e8f0]">
              <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.66px] uppercase">
                REFUND TICKET
              </Text>
              <Text className="text-[18px] font-extrabold text-[#0f172a] mt-0.5 tracking-[-0.18px]">
                {ticketCode || (hasOrderDetail ? orderId : '...')}
              </Text>
            </View>

            {/* Scannable High-Contrast QR Code Area */}
            <View className="w-full items-center justify-center py-2 mt-2">
              <View
                style={{ width: 197, height: 209 }}
                className="bg-white rounded-[16px] p-3 items-center justify-center relative overflow-hidden"
              >
                <View style={{ opacity: isRefundExpired || isRefunded ? 0.08 : 1 }}>
                  {memoizedQr}
                </View>

                {/* Refunded Overlay Badge */}
                {isRefunded && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#ECFDF5',
                      }}
                      className="items-center justify-center"
                    >
                      <View
                        style={{
                          width: 57.5,
                          height: 57.5,
                          borderRadius: 28.75,
                          backgroundColor: '#D1FAE5',
                        }}
                        className="items-center justify-center"
                      >
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M5 13l4 4L19 7"
                            stroke="#059669"
                            strokeWidth={2.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    </View>
                  </View>
                )}

                {/* Expired Overlay Badge */}
                {isRefundExpired && !isRefunded && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#FEF2F2',
                      }}
                      className="items-center justify-center"
                    >
                      <View
                        style={{
                          width: 57.5,
                          height: 57.5,
                          borderRadius: 28.75,
                          backgroundColor: '#FEE2E2',
                        }}
                        className="items-center justify-center"
                      >
                        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                            stroke="#DC2626"
                            strokeWidth={2}
                          />
                          <Path
                            d="M12 6v6l4 2"
                            stroke="#DC2626"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Status / Timer Container */}
            <View className="w-full mt-2">
              <View className="border border-[#e2e8f0] rounded-[16px] py-[15px] px-4 items-center justify-center">
                {isRefunded ? (
                  <>
                    <Text className="text-[11px] font-bold text-[#2563eb] tracking-[0.66px] uppercase">
                      STATUS
                    </Text>
                    <Text className="text-[22px] font-extrabold text-[#10b981] tracking-[-0.2px] mt-0.5">
                      Refunded
                    </Text>
                  </>
                ) : isRefundExpired ? (
                  <>
                    <Text className="text-[11px] font-bold text-[#2563eb] tracking-[0.66px] uppercase">
                      STATUS
                    </Text>
                    <Text className="text-[22px] font-extrabold text-[#dc2626] tracking-[-0.2px] mt-0.5">
                      Refund Expired
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-[11px] font-bold text-[#2563eb] tracking-[0.66px] uppercase">
                      PROCEED TO THE HUB
                    </Text>
                    <Text
                      className={`text-[28px] font-extrabold tracking-[-0.56px] mt-0.5 ${
                        isExpiringSoon ? 'text-[#e11d48]' : 'text-[#0f172a]'
                      }`}
                    >
                      {timeFormatted}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Explanatory Instructions */}
            <View className="mt-4 px-3 items-center">
              {isRefunded ? (
                <Text className="text-[12px] font-normal text-[#64748b] text-center leading-[18px]">
                  Your refund has been completed. You can safely exit this page.
                </Text>
              ) : isRefundExpired ? (
                <Text className="text-[12px] font-normal text-[#64748b] text-center leading-[18px] max-w-[260px]">
                  Refund pass expired. Re-activate below when you are at the counter.
                </Text>
              ) : (
                <Text className="text-[12px] font-normal text-[#64748b] text-center leading-[18px] max-w-[240px]">
                  Please wait by the counter. Show this screen only if requested by staff.
                </Text>
              )}
            </View>
          </View>

          {/* Refund Details Card */}
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
            className="w-full rounded-[16px] bg-white border border-[#f1f5f9] p-4 mb-4"
          >
            <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.66px] uppercase pb-2.5 border-b border-[#f1f5f9]">
              REFUND DETAILS
            </Text>

            <View className="pt-3 gap-3">
              {/* Item Row */}
              <View className="flex-row items-center justify-between">
                <Text className="text-[13.5px] font-medium text-[#64748b]">Item</Text>
                <Text
                  numberOfLines={1}
                  className="text-[13.5px] font-semibold text-[#0f172a] flex-1 text-right ml-4"
                >
                  {productName}
                </Text>
              </View>

              {/* Refund Amount Row */}
              <View className="flex-row items-center justify-between pt-0.5">
                <Text className="text-[13.5px] font-medium text-[#64748b]">Refund Amount</Text>
                <View className="bg-[#eff6ff] px-3 py-1 rounded-[8px] items-center justify-center">
                  <Text className="text-[13px] font-bold text-[#2563eb]">
                    {`₱${refundAmount.toLocaleString('en-US')}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Expired Reactivate Button */}
          {isRefundExpired && !isRefunded && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRefreshRefund}
              disabled={isRefreshingRefund}
              style={{
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
              className="w-full h-[46px] rounded-[12px] bg-[#2563eb] items-center justify-center mb-3"
            >
              {isRefreshingRefund ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-[14px] text-center">
                  Re-activate Refund Window
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Return to Home Action Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onReturnHome}
            className="w-full py-3 items-center justify-center"
          >
            <Text className="text-[13.5px] font-semibold text-[#475569] text-center">
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default RefundPassView;
