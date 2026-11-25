import React from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatPeso } from '../../utils/currency';
import { CARD_SHADOW } from '../common/cardStyles';
import {
  OrderAmountRow,
  OrderProductBlock,
  OrderSectionCard,
  ReturnHomeLink,
} from './OrderDetailPrimitives';
import { QrCodeFrame, QrOverlayState } from './QrCodeFrame';

export interface TimedQrPassViewProps {
  readonly ticketLabel: string;
  readonly displayTicket: string;
  readonly qrIdentifier: string;
  readonly timeFormatted: string;
  readonly isCompleted: boolean;
  readonly isExpired: boolean;
  readonly isExpiringSoon: boolean;
  readonly completedLabel: string;
  readonly expiredLabel: string;
  readonly completedMessage: string;
  readonly expiredMessage: string;
  readonly activeMessage: string;
  readonly detailsTitle: string;
  readonly productName: string;
  readonly amountLabel: string;
  readonly amountValue: number;
  readonly muteZeroAmount?: boolean;
  readonly reactivateLabel: string;
  readonly isReactivating: boolean;
  readonly isPullRefreshing: boolean;
  readonly passFadeAnim: Animated.Value;
  readonly passSlideAnim: Animated.Value;
  readonly slideAxis: 'x' | 'y';
  readonly onRefresh: () => void;
  readonly onReactivate: () => void;
  readonly onReturnHome: () => void;
}

/**
 * Shared animated QR pass layout used for both Ready-for-Release pickup passes
 * and Ready-for-Refund counter passes.
 */
export const TimedQrPassView: React.FC<TimedQrPassViewProps> = ({
  ticketLabel,
  displayTicket,
  qrIdentifier,
  timeFormatted,
  isCompleted,
  isExpired,
  isExpiringSoon,
  completedLabel,
  expiredLabel,
  completedMessage,
  expiredMessage,
  activeMessage,
  detailsTitle,
  productName,
  amountLabel,
  amountValue,
  muteZeroAmount = false,
  reactivateLabel,
  isReactivating,
  isPullRefreshing,
  passFadeAnim,
  passSlideAnim,
  slideAxis,
  onRefresh,
  onReactivate,
  onReturnHome,
}) => {
  const overlayState: QrOverlayState | undefined = isCompleted
    ? 'completed'
    : isExpired
    ? 'expired'
    : undefined;

  const instructionText = isCompleted
    ? completedMessage
    : isExpired
    ? expiredMessage
    : activeMessage;

  const animatedTransform =
    slideAxis === 'x'
      ? [{ translateX: passSlideAnim }]
      : [{ translateY: passSlideAnim }];

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: passFadeAnim,
        transform: animatedTransform,
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
              {ticketLabel}
            </Text>
            <Text className="font-mono text-[18px] font-bold text-[#0f172a] mt-1 tracking-[0.5px]">
              {displayTicket}
            </Text>
          </View>

          {/* Padded Square QR Frame */}
          <QrCodeFrame value={qrIdentifier} overlayState={overlayState} />

          {/* Timer / Status Strip */}
          <View className="w-full bg-[#f8fafc] border border-[#f1f5f9] rounded-[14px] py-3.5 px-4 items-center">
            {isCompleted ? (
              <>
                <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
                  STATUS
                </Text>
                <Text className="text-[20px] font-bold text-[#059669] mt-0.5">
                  {completedLabel}
                </Text>
              </>
            ) : isExpired ? (
              <>
                <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
                  STATUS
                </Text>
                <Text className="text-[20px] font-bold text-[#dc2626] mt-0.5">
                  {expiredLabel}
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
            {instructionText}
          </Text>
        </View>

        {/* Minimalist Details Card */}
        <OrderSectionCard title={detailsTitle} style={{ marginBottom: 16 }}>
          <OrderProductBlock productName={productName} />
          <View className="pt-3.5">
            <OrderAmountRow
              label={amountLabel}
              value={formatPeso(amountValue)}
              emphasized
              tone={muteZeroAmount && amountValue <= 0 ? 'muted' : 'default'}
            />
          </View>
        </OrderSectionCard>

        {/* Actions */}
        <View className="gap-3 pt-1">
          {isExpired && !isCompleted && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onReactivate}
              disabled={isReactivating}
              style={{
                shadowColor: '#215cd4',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.24,
                shadowRadius: 10,
                elevation: 4,
              }}
              className="w-full h-[48px] rounded-[12px] bg-[#215cd4] items-center justify-center"
            >
              {isReactivating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-[14px] text-center">
                  {reactivateLabel}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <ReturnHomeLink onPress={onReturnHome} />
        </View>
      </ScrollView>
    </Animated.View>
  );
};
