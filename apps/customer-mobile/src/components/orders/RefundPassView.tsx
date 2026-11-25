import React from 'react';
import { Animated } from 'react-native';
import { TimedQrPassView } from './TimedQrPassView';

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
 * Focused Ready-for-Refund pass delegating layout to TimedQrPassView.
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
}) => (
  <TimedQrPassView
    ticketLabel="REFUND TICKET"
    displayTicket={ticketCode || (hasOrderDetail ? orderId : '...')}
    qrIdentifier={qrIdentifier}
    timeFormatted={timeFormatted}
    isCompleted={isRefunded}
    isExpired={isRefundExpired}
    isExpiringSoon={isExpiringSoon}
    completedLabel="Refunded"
    expiredLabel="Refund Expired"
    completedMessage="Your refund is complete. You can safely close this page."
    expiredMessage="Refund pass expired. Re-activate below when you are at the counter."
    activeMessage="Show this QR pass at the hub counter when requested by staff."
    detailsTitle="REFUND DETAILS"
    productName={productName}
    amountLabel="Refund Amount"
    amountValue={refundAmount}
    reactivateLabel="Re-activate Refund Window"
    isReactivating={isRefreshingRefund}
    isPullRefreshing={isPullRefreshing}
    passFadeAnim={passFadeAnim}
    passSlideAnim={passSlideAnim}
    slideAxis="x"
    onRefresh={onRefresh}
    onReactivate={onRefreshRefund}
    onReturnHome={onReturnHome}
  />
);

export default RefundPassView;
