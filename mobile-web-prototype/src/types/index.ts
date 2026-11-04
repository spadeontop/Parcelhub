export type OrderStatus =
  | 'PAYMENT_REQUIRED'
  | 'AWAITING_PARCEL'
  | 'READY_TO_CLAIM'
  | 'CLAIMED';

export type ScreenId =
  | 'home'
  | 'create_order'
  | 'confirm_order'
  | 'payment_verification'
  | 'qr_screen'
  | 'order_details'
  | 'transactions'
  | 'staff_ui'
  | 'login'
  | 'register'
  | 'mpin_login'
  | 'mpin_create'
  | 'faq';

export type RoleMode = 'user' | 'staff';

export type ViewMode = 'device' | 'fullscreen';

export type TransactionFilter =
  | 'ALL'
  | 'READY_TO_CLAIM'
  | 'AWAITING_PARCEL'
  | 'PAYMENT_REQUIRED'
  | 'CLAIMED';

export type StaffFilter = 'active' | 'ready_to_claim' | 'claimed' | 'inactive';

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
  | 'figma-staff'
  | 'figma-login'
  | 'figma-register'
  | 'figma-mpin-login'
  | 'figma-mpin-create';

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
  carrier: string;
  hubLocation: string;
  courierPaid?: boolean;
  parcelImageUrl?: string | null;
  claimInitiatedAt?: number | null;
}

export interface DraftOrder {
  product: string;
  recipient: string;
  totalAmount: string;
  trackingId: string;
  receiptUri: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface ToastState {
  show: boolean;
  message: string;
}

export interface CustomerRegisterRequest {
  password: string;
  email: string;
  firstname: string;
  lastname: string;
  middleinitial?: string;
  phonenumber: string;
}

export interface CustomerRegisterResponse {
  statusMessage: string;
  refreshToken: string;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export interface CustomerLoginResponse {
  statusMessage: string;
  refreshToken: string;
}

export interface CustomerCreateMpinRequest {
  refreshToken: string;
  mpin: string;
}

export interface CustomerCreateMpinResponse {
  statusMessage: string;
  authToken: string;
}

export interface CustomerVerifyMpinRequest {
  refreshToken: string;
  mpin: string;
}

export interface CustomerVerifyMpinResponse {
  statusMessage: string;
  authToken: string;
}

export interface AuthCustomer {
  email: string;
  firstname: string;
  lastname: string;
  middleinitial?: string;
  phonenumber: string;
}
