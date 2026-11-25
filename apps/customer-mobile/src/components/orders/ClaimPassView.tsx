import React from 'react';
import { Animated } from 'react-native';
import { TimedQrPassView } from './TimedQrPassView';

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
 * Focused Ready-for-Release pickup pass delegating layout to TimedQrPassView.
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
}) => (
  <TimedQrPassView
    ticketLabel="PICKUP TICKET"
    displayTicket={ticketCode || (hasOrderDetail ? orderId : '...')}
    qrIdentifier={qrIdentifier}
    timeFormatted={timeFormatted}
    isCompleted={isClaimed}
    isExpired={isReleaseExpired}
    isExpiringSoon={isExpiringSoon}
    completedLabel="Claimed"
    expiredLabel="Claim Expired"
    completedMessage="Your order has been claimed. You can safely close this page."
    expiredMessage="Pickup pass expired. Re-activate below when you are at the counter."
    activeMessage="Show this QR pass at the hub counter when requested by staff."
    detailsTitle="ORDER DETAILS"
    productName={productName}
    amountLabel="Cash Change"
    amountValue={change}
    muteZeroAmount
    reactivateLabel="Re-activate Release Window"
    isReactivating={isRefreshingRelease}
    isPullRefreshing={isPullRefreshing}
    passFadeAnim={passFadeAnim}
    passSlideAnim={passSlideAnim}
    slideAxis="y"
    onRefresh={onRefresh}
    onReactivate={onRefreshRelease}
    onReturnHome={onReturnHome}
  />
);
