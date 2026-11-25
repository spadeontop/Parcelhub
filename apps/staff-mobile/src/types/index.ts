import type {
  OrderStatus,
  PaginationMeta,
  StaffActivateOrderRes,
  StaffAttachPhotoRes,
  StaffClaimOrderRes,
  StaffGetOrderPhotoRes,
  StaffLoginRes,
  StaffOrderDetail,
  StaffPayCourierRes,
  StatusTimelineEntry,
} from '@parcelhub/contracts';

export type { OrderStatus, PaginationMeta, StatusTimelineEntry };

export type StaffTab = 'all' | 'ready' | 'active' | 'unpaid' | 'claimed';

export interface StaffBadgeCounts {
  all?: number;
  active: number;
  ready: number;
  unpaid: number;
  claimed: number;
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

export interface JustUpdatedOrderInfo {
  orderId: string;
  actionBadgeText: string;
  targetBadgeText: string;
  targetStatus: OrderStatus;
  targetTab: StaffTab;
}
