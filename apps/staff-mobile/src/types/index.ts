export type OrderStatus =
  | 'PENDING_INITIALIZATION'
  | 'PAYMENT_REQUIRED'
  | 'AWAITING_PARCEL'
  | 'READY_TO_CLAIM'
  | 'CLAIMED'
  | 'CANCELLED';

export type StaffTab = 'active' | 'ready' | 'unpaid' | 'claimed';

export interface StaffBadgeCounts {
  active: number;
  ready: number;
  unpaid: number;
  claimed: number;
}

export interface StaffUser {
  id: string;
  email: string;
  role: 'STAFF';
  token: string;
}

export interface StatusTimelineEntry {
  status: OrderStatus;
  timestamp: string;
}

export interface StaffOrder {
  id: string;
  trackingId: string;
  customer: string;
  productName?: string;
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
  statusTimeline?: StatusTimelineEntry[];
  proofImageUrl?: string;
  notes?: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type?: 'info' | 'success' | 'error';
}

export interface StaffLoginResponse {
  statusMessage: string;
  authToken: string;
  refreshToken: string;
}

export interface StaffOrdersResponse {
  orders: StaffOrder[];
}

export interface StaffOrderDetailResponse {
  orderId: string;
  trackingId: string;
  customer: string;
  amountToPay: number;
  timestamp: string;
  status: OrderStatus;
  statusMessage: string;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
  courierPaid?: boolean;
  courierPaidBy?: string;
  courierPaidByName?: string;
  courierPaidAt?: string;
  claimedAt?: string;
  createdAt?: string;
  statusTimeline?: StatusTimelineEntry[];
  proofImageUrl?: string;
}

export interface StaffActivateOrderResponse {
  statusMessage: string;
  change: number;
}

export interface StaffPayCourierResponse {
  statusMessage: string;
}

export interface StaffAttachPhotoResponse {
  statusMessage: string;
  imageUrl: string;
}

export interface StaffClaimOrderResponse {
  statusMessage: string;
}
