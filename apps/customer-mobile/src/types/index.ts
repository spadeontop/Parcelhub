/**
 * ParcelHub Customer Mobile Types
 * Strictly aligned with backend/app/types/api.ts
 */

export type ISO8601Timestamp = string;
export type OrderId = `ORD-${string}` | string;
export type CustomerId = `CST-${string}` | string;
export type JWTToken = string;
export type MPIN = string;

export type OrderStatus =
  | 'PENDING_INITIALIZATION'
  | 'PAYMENT_REQUIRED'
  | 'AWAITING_PARCEL'
  | 'READY_TO_CLAIM'
  | 'CLAIMED'
  | 'CANCELLED';

export type TransactionFilter =
  | 'ALL'
  | 'READY_TO_CLAIM'
  | 'AWAITING_PARCEL'
  | 'PAYMENT_REQUIRED'
  | 'CLAIMED';

export type StatusTimelineEntry = {
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
};

export type OrderStatusHistoryTuple = readonly StatusTimelineEntry[];

// ==========================================
// Backend API Request & Response Contracts
// ==========================================

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
};

export type CustomerRegisterReq = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type CustomerRegisterRes = {
  readonly statusMessage: string;
  readonly preAuthToken: JWTToken;
};

export type CustomerLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginRes = {
  readonly statusMessage: string;
  readonly preAuthToken: JWTToken;
};

export type CustomerProfile = {
  readonly id: CustomerId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type CustomerProfileRes = {
  readonly statusMessage: string;
  readonly customer: CustomerProfile;
};

export type CustomerCreateMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerCreateMpinRes = {
  readonly statusMessage: string;
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

export type CustomerVerifyMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerVerifyMpinRes = {
  readonly statusMessage: string;
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

export type CustomerOrderSummary = {
  readonly id: OrderId;
  readonly trackingId: string;
  readonly productName: string;
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
  readonly isClaimActive?: boolean;
};

export type CustomerListOrdersRes = {
  readonly statusMessage: string;
  readonly orders: readonly CustomerOrderSummary[];
};

export type CustomerOrderDetail = {
  readonly id: OrderId;
  readonly trackingId: string;
  readonly productName: string;
  readonly recipientName: string;
  readonly price: number;
  readonly change: number;
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly qrImageUrl: string;
  readonly claimInitiatedAt?: ISO8601Timestamp;
  readonly claimExpiresAt?: ISO8601Timestamp;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
};

export type CustomerGetOrderRes = {
  readonly statusMessage: string;
  readonly order: CustomerOrderDetail;
};

export type CustomerInitOrderReq = {
  readonly imageUrl: string;
};

export type CustomerInitOrderRes = {
  readonly statusMessage: string;
  readonly orderId: OrderId;
};

export type CustomerUpdateOrderReq = {
  readonly order: {
    readonly trackingId?: string;
    readonly productName?: string;
    readonly recipientName?: string;
    readonly price?: number;
  };
};

export type CustomerUpdateOrderRes = {
  readonly statusMessage: string;
};

export type CustomerClaimOrderRes = {
  readonly statusMessage: string;
  readonly claimInitiatedAt: ISO8601Timestamp;
  readonly claimExpiresAt: ISO8601Timestamp;
  readonly durationMinutes: number;
};

// Aliases for compatibility
export type CustomerRegisterRequest = CustomerRegisterReq;
export type CustomerRegisterResponse = CustomerRegisterRes;
export type CustomerLoginRequest = CustomerLoginReq;
export type CustomerLoginResponse = CustomerLoginRes;
export type CustomerCreateMpinRequest = CustomerCreateMpinReq;
export type CustomerCreateMpinResponse = CustomerCreateMpinRes;
export type CustomerVerifyMpinRequest = CustomerVerifyMpinReq;
export type CustomerVerifyMpinResponse = CustomerVerifyMpinRes;

// ==========================================
// Mobile App Domain Models
// ==========================================

export interface Order {
  id: string;
  product: string;
  recipient: string;
  paidAmount: string;
  codAmount: string;
  change: string;
  trackingNumber: string;
  refCode: string;
  alphanumericKey: string;
  envelopeNumber: string;
  status: OrderStatus;
  orderPlacedTime: string;
  awaitingParcelTime: string | null;
  readyToClaimTime: string | null;
  claimedTime: string | null;
  dateLabel: string;
  hubLocation: string;
  courierPaid?: boolean;
  parcelImageUrl?: string | null;
  claimInitiatedAt?: number | null;
  claimExpiresAt?: string | null;
  notes?: string;
  statedFee?: number;
  qrImageUrl?: string | null;
  statusTimeline?: StatusTimelineEntry[];
}

export interface DraftOrder {
  product: string;
  recipient: string;
  totalAmount: string;
  trackingId: string;
  receiptUri: string;
}

export interface ToastState {
  show: boolean;
  message: string;
}

export interface AuthCustomer {
  email: string;
  firstname: string;
  lastname: string;
  middleinitial?: string;
  phonenumber: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export type ScreenId =
  | 'home'
  | 'create_order'
  | 'confirm_order'
  | 'payment_verification'
  | 'qr_screen'
  | 'order_details'
  | 'transactions'
  | 'notifications'
  | 'login'
  | 'register'
  | 'mpin_login'
  | 'mpin_create'
  | 'profile'
  | 'faq';

export type ScenarioId =
  | 'figma-1'
  | 'figma-2'
  | 'figma-3'
  | 'figma-4'
  | 'figma-5'
  | 'figma-6'
  | 'figma-7'
  | 'figma-8'
  | 'figma-9'
  | 'figma-10'
  | 'figma-11'
  | 'figma-12'
  | 'figma-login'
  | 'figma-register'
  | 'figma-mpin-login'
  | 'figma-mpin-create'
  | 'figma-profile';
