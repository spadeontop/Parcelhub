import { Order } from '../types';

export type UiMode = 'debug' | 'real';

export type ApiOrderStatus =
  | 'PENDING_INITIALIZATION'
  | 'PAYMENT_REQUIRED'
  | 'AWAITING_PARCEL'
  | 'READY_TO_CLAIM'
  | 'CLAIMED'
  | 'CANCELLED';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface StatusTimelineEntry {
  status: ApiOrderStatus;
  timestamp: string;
}

export interface StaffLoginReq {
  username: string;
  password: string;
}

export interface StaffLoginRes {
  statusMessage: string;
  authToken: string;
  refreshToken: string;
}

export interface StaffOrderSummary {
  id: string;
  ticketCode?: string | null;
  trackingId: string;
  customer: string;
  amountToPay: number;
  amountReceived: number;
  change: number;
  timestamp: string;
  status: ApiOrderStatus;
  statusMessage: string;
  imageUrl?: string | null;
  proofImageUrl?: string | null;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
  courierPaid?: boolean;
  courierPaidBy?: string | null;
  courierPaidByName?: string;
  courierPaidAt?: string | null;
  createdAt?: string;
  statusTimeline?: StatusTimelineEntry[];
}

export interface PaginationMeta {
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface StaffListOrdersRes {
  orders: StaffOrderSummary[];
  pagination?: PaginationMeta;
}

export interface StaffOrderDetail {
  orderId: string;
  ticketCode?: string | null;
  trackingId: string;
  customer: string;
  amountToPay: number;
  amountReceived?: number | null;
  change?: number;
  timestamp: string;
  status: ApiOrderStatus;
  statusMessage: string;
  imageUrl?: string | null;
  proofImageUrl?: string | null;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
  courierPaid?: boolean;
  courierPaidBy?: string | null;
  courierPaidByName?: string;
  courierPaidAt?: string | null;
  createdAt?: string;
  statusTimeline?: StatusTimelineEntry[];
}

export interface StaffActivateOrderReq {
  amountReceived: number;
}

export interface StaffActivateOrderRes {
  statusMessage: string;
  change: number;
}

export interface StaffPayCourierRes {
  statusMessage: string;
}

export interface StaffAttachPhotoReq {
  imageUrl: string;
}

export interface StaffAttachPhotoRes {
  statusMessage: string;
  imageUrl: string;
}

export interface StaffClaimOrderRes {
  statusMessage: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export type StaffEndpointId =
  | 'login'
  | 'list_orders'
  | 'get_order'
  | 'activate_order'
  | 'pay_courier'
  | 'attach_photo'
  | 'claim_order';

export type EndpointGroup = 'Authentication' | 'Order Queries' | 'Order Lifecycle';

export interface StaffEndpointSpec {
  id: StaffEndpointId;
  group: EndpointGroup;
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
  endpointId: StaffEndpointId;
  endpointTitle: string;
  source: 'debug' | 'real';
  request: CapturedRequest;
  response: CapturedResponse;
}

export type UiOrderMapped = Order & {
  apiStatus: ApiOrderStatus;
  ticketCode?: string | null;
  amountToPay: number;
  isClaimActive: boolean;
  claimRemainingSeconds: number;
  courierPaidByName?: string;
  courierPaidAt?: string | null;
};
