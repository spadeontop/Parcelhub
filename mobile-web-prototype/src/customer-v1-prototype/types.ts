export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type UiMode = 'debug' | 'real';

export type CustomerEndpointId =
  | 'register'
  | 'login'
  | 'create_mpin'
  | 'verify_mpin'
  | 'refresh_token'
  | 'get_profile'
  | 'list_orders'
  | 'initialize_order'
  | 'get_order'
  | 'update_order'
  | 'claim_order';

export type ApiOrderStatus =
  | 'PENDING_INITIALIZATION'
  | 'PAYMENT_REQUIRED'
  | 'AWAITING_PARCEL'
  | 'READY_TO_CLAIM'
  | 'CLAIMED'
  | 'CANCELLED';

export interface CustomerEndpointSpec {
  id: CustomerEndpointId;
  group: 'Authentication' | 'Account' | 'Orders';
  title: string;
  shortLabel: string;
  method: HttpMethod;
  pathTemplate: string;
  description: string;
  requiresAuth: boolean;
  hasOrderIdParam: boolean;
  hasQueryParams: boolean;
  hasBody: boolean;
  guardHint?: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  phoneNumber: string;
  blacklisted?: boolean;
  blacklistReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusTimelineEntry {
  status: ApiOrderStatus;
  timestamp: string;
}

export interface CustomerOrderSummary {
  id: string;
  ticketCode?: string | null;
  trackingId: string | null;
  productName: string;
  status: ApiOrderStatus;
  timestamp: string;
  isClaimActive?: boolean;
}

export interface CustomerOrderDetail {
  id: string;
  ticketCode?: string | null;
  trackingId: string | null;
  productName: string;
  recipientName: string;
  price: number;
  change: number;
  status: ApiOrderStatus;
  statusTimeline: StatusTimelineEntry[];
  imageUrl?: string | null;
  proofImageUrl?: string | null;
  claimInitiatedAt?: string | null;
  claimExpiresAt?: string | null;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
}

export interface CustomerRegisterRes {
  statusMessage: string;
  preAuthToken: string;
}

export interface CustomerLoginRes {
  statusMessage: string;
  preAuthToken: string;
}

export interface CustomerCreateMpinRes {
  statusMessage: string;
  authToken: string;
  refreshToken: string;
  customer?: CustomerProfile;
}

export interface CustomerVerifyMpinRes {
  statusMessage: string;
  authToken: string;
  refreshToken: string;
  customer?: CustomerProfile;
}

export interface CustomerRefreshTokenRes {
  statusMessage: string;
  authToken: string;
}

export interface CustomerProfileRes {
  statusMessage: string;
  customer: CustomerProfile;
}

export interface CustomerListOrdersRes {
  statusMessage: string;
  orders: CustomerOrderSummary[];
}

export interface CustomerGetOrderRes {
  statusMessage: string;
  order: CustomerOrderDetail;
}

export interface CustomerInitOrderRes {
  statusMessage: string;
  orderId: string;
  ticketCode: string;
}

export interface CustomerUpdateOrderRes {
  statusMessage: string;
}

export interface CustomerClaimOrderRes {
  statusMessage: string;
  claimInitiatedAt: string;
  claimExpiresAt: string;
  durationMinutes: number;
}

export interface CapturedRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: unknown | null;
  rawBodyText?: string;
  timestamp: string;
}

export interface CapturedResponse {
  status: number;
  statusText: string;
  ok: boolean;
  durationMs: number;
  headers: Record<string, string>;
  body: unknown;
  rawText: string;
  networkError?: string;
}

export interface RequestLogEntry {
  id: string;
  endpointId: CustomerEndpointId;
  endpointTitle: string;
  source: 'debug' | 'real';
  request: CapturedRequest;
  response: CapturedResponse;
}
