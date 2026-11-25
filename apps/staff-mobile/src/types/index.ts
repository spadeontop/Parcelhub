import type {
  CancelReasonCode,
  OrderActorRole,
  OrderStatus,
  PaginationMeta,
  StaffActivateOrderRes,
  StaffAttachPhotoRes,
  StaffClaimOrderRes,
  StaffGetOrderPhotoRes,
  StaffLoginRes,
  StaffOrderDetail,
  StaffPayCourierRes,
  StaffRefundOrderRes,
  StatusTimelineEntry,
} from '@parcelhub/contracts';

export type { CancelReasonCode, OrderActorRole, OrderStatus, PaginationMeta, StatusTimelineEntry };

export type StaffTab = 'all' | 'ready' | 'active' | 'unpaid' | 'claimed' | 'cancelled' | 'refunded';

export interface StaffBadgeCounts {
  all?: number;
  active: number;
  ready: number;
  unpaid: number;
  claimed: number;
  cancelled: number;
  refunded: number;
}

export interface StaffUser {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role: 'STAFF' | string;
  hubName?: string;
  token: string;
}

export interface StaffOrder {
  id: string;
  ticketCode?: string | null;
  trackingId: string;
  customer: string;
  amountToPay: number;
  amountReceived?: number;
  change: number;
  timestamp: string;
  status: OrderStatus;
  statusMessage?: string;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
  claimInitiatedAt?: string;
  claimExpiresAt?: string;
  courierPaid?: boolean;
  courierPaidBy?: string;
  courierPaidByName?: string;
  courierPaidAt?: string;
  claimedAt?: string;
  createdAt?: string;
  statusTimeline?: readonly StatusTimelineEntry[];
  proofImageUrl?: string;
  notes?: string;
  cancelledBy?: string | null;
  cancelledByRole?: OrderActorRole | null;
  cancelReasonCode?: CancelReasonCode | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  isRefundEligible?: boolean;
  refundAmount?: number;
  refundRequested?: boolean;
  refundInitiatedAt?: string | null;
  refundExpiresAt?: string | null;
  isRefundActive?: boolean;
  refundRemainingSeconds?: number;
  refundReasonCode?: CancelReasonCode | null;
  refundReason?: string | null;
  isRefunded?: boolean;
  refundedBy?: string | null;
  refundedByName?: string;
  refundedAt?: string | null;
}

export type StaffLoginResponse = StaffLoginRes;

export interface StaffOrdersResponse {
  orders: StaffOrder[];
}

export type StaffOrderDetailResponse = StaffOrderDetail;
export type StaffGetOrderPhotoResponse = StaffGetOrderPhotoRes;
export type StaffActivateOrderResponse = StaffActivateOrderRes;
export type StaffPayCourierResponse = StaffPayCourierRes;
export type StaffAttachPhotoResponse = StaffAttachPhotoRes;
export type StaffClaimOrderResponse = StaffClaimOrderRes;
export type StaffRefundOrderResponse = StaffRefundOrderRes;

export interface JustUpdatedOrderInfo {
  orderId: string;
  actionBadgeText: string;
  targetBadgeText: string;
  targetStatus: OrderStatus;
  targetTab: StaffTab;
}
