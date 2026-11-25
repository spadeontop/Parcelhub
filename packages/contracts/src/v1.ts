/**
 * ParcelHub API v1 Shared TypeScript Contracts & Types
 * Single source of truth for backend, customer-mobile, and staff-mobile.
 * Uses strict type aliases, union literals, and tuples. No interfaces.
 */

// ==========================================
// 1. Base & Primitives
// ==========================================

export type ISO8601Timestamp = string;
export type OrderId = string; // UUIDv7 primary key from orders.id
export type StaffId = string; // UUIDv7 primary key from staff.id
export type CustomerId = string; // UUIDv7 primary key from customers.id
export type JWTToken = string;
export type MPIN = `${number}${number}${number}${number}`;

export type OrderStatus =
  | "PENDING_INITIALIZATION"
  | "PAYMENT_REQUIRED"
  | "AWAITING_PARCEL"
  | "READY_TO_CLAIM"
  | "CLAIMED"
  | "CANCELLED"
  | "REFUNDED";

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type StatusTimelineEntry = {
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
};

export type OrderStatusHistoryTuple = readonly StatusTimelineEntry[];

export type StandardSuccessResponse<TMessage extends string = string> = {
  readonly statusMessage: TMessage;
};

export type ScreenshotSourceApp = "shopee" | "lazada" | "tiktok" | "unknown";
export type AiTrackingIdMode = "none" | "present" | "unique" | "strict";

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
  readonly sourceApp?: ScreenshotSourceApp;
};

export type OrderScreenshotChecks = {
  readonly trackingId_strict?: string;
  readonly trackingId_similar?: string;
  readonly trackingIdLocked?: boolean;
  readonly sourceApp?: ScreenshotSourceApp;
  readonly isParcel?: boolean;
  readonly hasRealMetadata?: boolean;
  readonly [key: string]: unknown;
};

// ==========================================
// 2. Customer Endpoints Types (v1)
// ==========================================

// POST /api/v1/customer/register
export type CustomerRegisterReq = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type EmailVerificationPurpose =
  | "VERIFY_EMAIL"
  | "FORGOT_PASSWORD"
  | "FORGOT_MPIN"
  | "CHANGE_PASSWORD"
  | "CHANGE_EMAIL";

export type OrderActorRole = "CUSTOMER" | "STAFF" | "ADMIN" | "SYSTEM";

export type CustomerCancelReasonCode =
  | "CHANGED_MIND"
  | "SELLER_CANCELLED"
  | "WRONG_DETAILS"
  | "DUPLICATE_ORDER"
  | "DELIVERY_DELAYED"
  | "OTHER";

export type SystemCancelReasonCode =
  | "SYSTEM_DUPLICATE_TRACKING_ACTIVATED"
  | "SYSTEM_PAYMENT_EXPIRED"
  | "SYSTEM_DRAFT_ABANDONED";

export type CancelReasonCode = CustomerCancelReasonCode | SystemCancelReasonCode;

export type CustomerRegisterRes = StandardSuccessResponse & {
  readonly emailVerificationRequired: true;
  readonly email: string;
  readonly verificationEmailSent: boolean;
  readonly expiresInSeconds: number;
  readonly retryAfterSeconds: number;
  readonly preAuthToken?: JWTToken;
};

// POST /api/v1/customer/email/send-verification
export type CustomerSendEmailVerificationReq = {
  readonly email: string;
};

export type CustomerSendEmailVerificationRes = StandardSuccessResponse & {
  readonly expiresInSeconds: number;
  readonly retryAfterSeconds: number;
};

// POST /api/v1/customer/email/verify
export type CustomerVerifyEmailReq = {
  readonly email: string;
  readonly code: string;
};

export type CustomerVerifyEmailRes = StandardSuccessResponse & {
  readonly emailVerified: true;
  readonly hasMpin: boolean;
  readonly preAuthToken: JWTToken;
};

// POST /api/v1/customer/forgot-password
export type CustomerForgotPasswordReq = {
  readonly email: string;
};

export type CustomerForgotPasswordRes = StandardSuccessResponse & {
  readonly expiresInSeconds: number;
  readonly retryAfterSeconds: number;
};

// POST /api/v1/customer/forgot-password/verify
export type CustomerVerifyPasswordResetOtpReq = {
  readonly email: string;
  readonly code: string;
};

export type CustomerVerifyPasswordResetOtpRes = StandardSuccessResponse & {
  readonly resetToken: JWTToken;
};

// POST /api/v1/customer/forgot-password/reset
export type CustomerResetPasswordReq = {
  readonly resetToken: JWTToken;
  readonly newPassword: string;
};

export type CustomerResetPasswordRes = StandardSuccessResponse & {
  readonly authToken?: JWTToken;
  readonly refreshToken?: JWTToken;
  readonly preAuthToken?: JWTToken;
  readonly requiresMpinCreation: boolean;
  readonly customer: CustomerProfile;
};

// POST /api/v1/customer/forgot-mpin
export type CustomerForgotMpinReq = {
  readonly email: string;
};

export type CustomerForgotMpinRes = StandardSuccessResponse & {
  readonly expiresInSeconds: number;
  readonly retryAfterSeconds: number;
};

// POST /api/v1/customer/forgot-mpin/verify
export type CustomerVerifyMpinResetOtpReq = {
  readonly email: string;
  readonly code: string;
};

export type CustomerVerifyMpinResetOtpRes = StandardSuccessResponse & {
  readonly resetToken: JWTToken;
};

// POST /api/v1/customer/forgot-mpin/reset
export type CustomerResetMpinReq = {
  readonly resetToken: JWTToken;
  readonly newMpin: MPIN;
};

export type CustomerResetMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer: CustomerProfile;
};

// POST /api/v1/customer/login
export type CustomerLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
  readonly hasMpin?: boolean;
};

// POST /api/v1/customer/create-mpin
export type CustomerCreateMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerCreateMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

// POST /api/v1/customer/mpin
export type CustomerVerifyMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerVerifyMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

// POST /api/v1/customer/refresh (MPIN unlock with refreshToken)
export type CustomerRefreshTokenReq = {
  readonly refreshToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerRefreshTokenRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
};

// GET /api/v1/customer/profile
export type CustomerProfile = {
  readonly id: CustomerId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
  readonly emailVerified?: boolean;
  readonly emailVerifiedAt?: ISO8601Timestamp | null;
  readonly blacklisted?: boolean;
  readonly blacklistReason?: string | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly updatedAt?: ISO8601Timestamp;
};

export type CustomerProfileRes = StandardSuccessResponse & {
  readonly customer: CustomerProfile;
};

export type OrderCancelFields = {
  readonly cancelledBy?: string | null;
  readonly cancelledByRole?: OrderActorRole | null;
  readonly cancelReasonCode?: CancelReasonCode | null;
  readonly cancelReason?: string | null;
  readonly cancelledAt?: ISO8601Timestamp | null;
};

export type OrderRefundFields = {
  readonly isRefundEligible?: boolean;
  readonly refundAmount?: number;
  readonly refundRequested?: boolean;
  readonly refundInitiatedAt?: ISO8601Timestamp | null;
  readonly refundExpiresAt?: ISO8601Timestamp | null;
  readonly isRefundActive?: boolean;
  readonly refundRemainingSeconds?: number;
  readonly refundReasonCode?: CancelReasonCode | null;
  readonly refundReason?: string | null;
  readonly isRefunded?: boolean;
  readonly refundedAt?: ISO8601Timestamp | null;
};

export type StaffOrderRefundFields = OrderRefundFields & {
  readonly refundedBy?: StaffId | null;
  readonly refundedByName?: string;
};

// GET /api/v1/customer/orders
export type CustomerOrderSummary = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string | null;
  readonly productName: string;
  readonly price?: number;
  readonly amountReceived?: number | null;
  readonly change?: number;
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
  readonly activatedAt?: ISO8601Timestamp | null;
  readonly courierPaid?: boolean;
  readonly isClaimActive?: boolean;
} & OrderCancelFields &
  OrderRefundFields;

export type CustomerListOrdersQueryParams = {
  readonly type?: OrderStatus;
  readonly limit?: number;
  readonly offset?: number;
};

export type CustomerListOrdersRes = StandardSuccessResponse & {
  readonly orders: readonly CustomerOrderSummary[];
};

export type OrderScreenshotDetail = {
  readonly id: string;
  readonly orderId: OrderId;
  readonly imageUrl: string;
  readonly isVerified: boolean;
  readonly checks?: OrderScreenshotChecks | null;
  readonly model?: string | null;
  readonly createdAt: ISO8601Timestamp;
};

// GET /api/v1/customer/orders/{id}
export type CustomerOrderDetail = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string | null;
  readonly productName: string;
  readonly recipientName: string;
  readonly price: number;
  readonly amountReceived?: number | null;
  readonly change: number;
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly activatedAt?: ISO8601Timestamp | null;
  readonly courierPaid?: boolean;
  readonly claimInitiatedAt?: ISO8601Timestamp | null;
  readonly claimExpiresAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
} & OrderCancelFields &
  OrderRefundFields;

export type CustomerGetOrderRes = StandardSuccessResponse & {
  readonly order: CustomerOrderDetail;
};

// GET /api/v1/customer/orders/{id}/photo
export type OrderPhotoType = "screenshot" | "proof" | "all";

export type CustomerGetOrderPhotoQueryParams = {
  readonly type?: OrderPhotoType;
};

export type CustomerGetOrderPhotoRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly imageUrl: string | null;
  readonly proofImageUrl: string | null;
};

// POST /api/v1/customer/orders/initialize
export type CustomerOrderAutofill = {
  readonly trackingId: string | null;
  readonly productName: string | null;
  readonly recipientName: string;
  readonly price: number | null;
  readonly trackingIdLocked: boolean;
  readonly sourceApp: ScreenshotSourceApp;
};

export type CustomerInitOrderReq = {
  readonly imageUrl: string;
};

export type CustomerInitOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly ticketCode: string;
  readonly autofill?: CustomerOrderAutofill;
};

// PUT /api/v1/customer/orders/{id}
export type CustomerEditableOrderStatus = "PENDING_INITIALIZATION";

export type CustomerUpdateOrderReq = {
  readonly order: {
    readonly trackingId: string;
    readonly productName: string;
    readonly recipientName: string;
    readonly price: number;
  };
};

export type CustomerUpdateOrderRes = StandardSuccessResponse;

// POST /api/v1/customer/orders/{id}/cancel
export type CustomerCancelOrderReq = {
  readonly reasonCode?: CustomerCancelReasonCode;
  readonly reason?: string;
};

export type CustomerCancelOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly status: "CANCELLED";
  readonly cancelledBy: string;
  readonly cancelledByRole: OrderActorRole;
  readonly cancelReasonCode: CancelReasonCode | null;
  readonly cancelReason: string | null;
  readonly cancelledAt: ISO8601Timestamp;
  readonly isRefundEligible: boolean;
  readonly refundAmount: number;
};

// POST /api/v1/customer/orders/{id}/refund
export type CustomerInitiateRefundReq = {
  readonly reasonCode?: CustomerCancelReasonCode;
  readonly reason?: string;
};

export type CustomerInitiateRefundRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly refundAmount: number;
  readonly refundRequested: boolean;
  readonly refundInitiatedAt: ISO8601Timestamp;
  readonly refundExpiresAt: ISO8601Timestamp;
  readonly isRefundActive: boolean;
  readonly refundRemainingSeconds: number;
  readonly durationMinutes: number;
  readonly refundReasonCode: CancelReasonCode | null;
  readonly refundReason: string | null;
};

// POST /api/v1/customer/orders/{id}/claim
export type CustomerClaimOrderReq = Record<string, never>;
export type CustomerClaimOrderRes = StandardSuccessResponse & {
  readonly claimInitiatedAt: ISO8601Timestamp;
  readonly claimExpiresAt: ISO8601Timestamp;
  readonly durationMinutes: number;
};

// ==========================================
// 3. Staff Endpoints Types (v1)
// ==========================================

export type StaffProfile = {
  readonly id: StaffId;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly createdAt?: ISO8601Timestamp;
  readonly updatedAt?: ISO8601Timestamp;
};

// POST /api/v1/staff/login
export type StaffLoginReq = {
  readonly username: string;
  readonly password: string;
};

export type StaffLoginRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
};

// GET /api/v1/staff/orders
export type StaffOrderSummary = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string | null;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived: number | null;
  readonly change: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly activatedAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId | null;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
} & OrderCancelFields &
  StaffOrderRefundFields;

export type StaffListOrdersQueryParams = {
  readonly status?: OrderStatus;
  readonly search?: string;
  readonly refundEligible?: boolean;
  readonly limit?: number;
  readonly offset?: number;
};

export type PaginationMeta = {
  readonly totalCount: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasMore: boolean;
};

export type StaffListOrdersRes = {
  readonly orders: readonly StaffOrderSummary[];
  readonly pagination?: PaginationMeta;
};

// GET /api/v1/staff/orders/{id}
export type StaffOrderDetail = {
  readonly orderId: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string | null;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived?: number | null;
  readonly change?: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly activatedAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId | null;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
} & OrderCancelFields &
  StaffOrderRefundFields;

export type StaffGetOrderRes = StaffOrderDetail;

// GET /api/v1/staff/orders/{id}/photo
export type StaffGetOrderPhotoQueryParams = {
  readonly type?: OrderPhotoType;
};

export type StaffGetOrderPhotoRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly imageUrl: string | null;
  readonly proofImageUrl: string | null;
};

// POST /api/v1/staff/orders/{id}/activate
export type StaffActivateOrderReq = {
  readonly amountReceived: number;
};

export type StaffActivateOrderRes = StandardSuccessResponse & {
  readonly change: number;
  readonly autoCancelledCount?: number;
};

// POST /api/v1/staff/orders/{id}/make-claimable/pay
export type StaffPayCourierReq = Record<string, never>;
export type StaffPayCourierRes = StandardSuccessResponse;

// POST /api/v1/staff/orders/{id}/make-claimable/attach-photo
export type StaffAttachPhotoReq = {
  readonly imageUrl: string;
};

export type StaffAttachPhotoRes = StandardSuccessResponse & {
  readonly imageUrl: string;
};

// POST /api/v1/staff/orders/{id}/claim
export type StaffClaimOrderReq = Record<string, never>;
export type StaffClaimOrderRes = StandardSuccessResponse;

// POST /api/v1/staff/orders/{id}/refund
export type StaffRefundOrderReq = Record<string, never>;
export type StaffRefundOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly status: "REFUNDED";
  readonly isRefunded: boolean;
  readonly refundAmount: number;
  readonly refundedBy: StaffId;
  readonly refundedByName?: string;
  readonly refundedAt: ISO8601Timestamp;
};

// ==========================================
// 4. Administrator Endpoints Types (v1)
// ==========================================

// POST /api/v1/admin/create-staff
export type AdminCreateStaffReq = {
  readonly username: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
};

export type AdminCreateStaffRes = StandardSuccessResponse & {
  readonly staffId: StaffId;
};

// GET /api/v1/admin/staffs
export type AdminListStaffsRes = StandardSuccessResponse & {
  readonly staffs: readonly StaffProfile[];
};

// PUT /api/v1/admin/staffs/{id}
export type AdminUpdateStaffReq = {
  readonly staff: Partial<AdminCreateStaffReq>;
};

export type AdminUpdateStaffRes = StandardSuccessResponse;

// DELETE /api/v1/admin/staffs/{id}
export type AdminDeleteStaffReq = {
  readonly reason: string;
};

export type AdminDeleteStaffRes = StandardSuccessResponse;

// GET /api/v1/admin/orders
export type AdminListOrdersQueryParams = {
  readonly type?: OrderStatus;
  readonly limit?: number;
  readonly offset?: number;
};

export type AdminAuditOrderSummary = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly productName: string;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly timestamp: ISO8601Timestamp;
};

export type AdminListOrdersRes = StandardSuccessResponse & {
  readonly orders: readonly AdminAuditOrderSummary[];
};

// GET /api/v1/admin/orders/{id}
export type AdminOrderDetailAudit = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string | null;
  readonly productName: string;
  readonly recipientName: string;
  readonly price: number;
  readonly change: number;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly modifiedBy: StaffId | CustomerId | "SYSTEM";
  readonly timestamp: ISO8601Timestamp;
};

export type AdminGetOrderAuditRes = StandardSuccessResponse & {
  readonly orderVersions: AdminOrderDetailAudit;
};

// POST /api/v1/admin/blacklist/customer/{id}
export type AdminBlacklistCustomerReq = {
  readonly reason: string;
};

export type AdminBlacklistCustomerRes = StandardSuccessResponse;

// POST /api/v1/admin/config/{target}/ai-ocr-verify/{action}
export type AdminOcrConfigTarget = "staff" | "customer";
export type AdminOcrConfigAction = "enable" | "disable";
export type AdminOcrConfigRes = StandardSuccessResponse;

// ==========================================
// 5. Push Notification Endpoints Types (v1)
// ==========================================

// POST /api/v1/notification/upload-token
export type NotificationUploadTokenReq = {
  readonly fcmToken: string;
};

export type NotificationUploadTokenRes = StandardSuccessResponse;

// DELETE /api/v1/notification/token
export type NotificationDeleteTokenReq = {
  readonly fcmToken?: string;
};

export type NotificationDeleteTokenRes = StandardSuccessResponse;

// ==========================================
// 6. Realtime Broadcast Types (v1)
// ==========================================

export type RealtimeOrderEventType =
  | "ORDER_CREATED"
  | "ORDER_ACTIVATED"
  | "COURIER_PAID"
  | "ORDER_READY"
  | "CLAIM_INITIATED"
  | "ORDER_CLAIMED"
  | "ORDER_CANCELLED"
  | "REFUND_INITIATED"
  | "ORDER_REFUNDED";

export type RealtimeOrderSignal = {
  readonly event: RealtimeOrderEventType;
  readonly orderId: OrderId;
  readonly ticketCode: string | null;
  readonly status: OrderStatus;
  readonly updatedAt: ISO8601Timestamp;
};

// POST /api/v1/realtime/token
export type RealtimeTokenRes = StandardSuccessResponse & {
  readonly token: JWTToken;
  readonly channel: string;
  readonly expiresAt: ISO8601Timestamp;
};

// ==========================================
// 7. Route Map & Method Unions (Implemented v1 Routes)
// ==========================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RouteDefinition = readonly [method: HttpMethod, path: string];

export type ApiRoutes =
  | readonly ["POST", "/api/v1/customer/register"]
  | readonly ["POST", "/api/v1/customer/login"]
  | readonly ["POST", "/api/v1/customer/email/send-verification"]
  | readonly ["POST", "/api/v1/customer/email/verify"]
  | readonly ["POST", "/api/v1/customer/forgot-password"]
  | readonly ["POST", "/api/v1/customer/forgot-password/verify"]
  | readonly ["POST", "/api/v1/customer/forgot-password/reset"]
  | readonly ["POST", "/api/v1/customer/forgot-mpin"]
  | readonly ["POST", "/api/v1/customer/forgot-mpin/verify"]
  | readonly ["POST", "/api/v1/customer/forgot-mpin/reset"]
  | readonly ["POST", "/api/v1/customer/create-mpin"]
  | readonly ["POST", "/api/v1/customer/mpin"]
  | readonly ["POST", "/api/v1/customer/refresh"]
  | readonly ["GET", "/api/v1/customer/profile"]
  | readonly ["GET", "/api/v1/customer/orders"]
  | readonly ["GET", `/api/v1/customer/orders/${string}`]
  | readonly ["GET", `/api/v1/customer/orders/${string}/photo`]
  | readonly ["POST", "/api/v1/customer/orders/initialize"]
  | readonly ["PUT", `/api/v1/customer/orders/${string}`]
  | readonly ["POST", `/api/v1/customer/orders/${string}/cancel`]
  | readonly ["POST", `/api/v1/customer/orders/${string}/claim`]
  | readonly ["POST", `/api/v1/customer/orders/${string}/refund`]
  | readonly ["POST", "/api/v1/staff/login"]
  | readonly ["GET", "/api/v1/staff/orders"]
  | readonly ["GET", `/api/v1/staff/orders/${string}`]
  | readonly ["GET", `/api/v1/staff/orders/${string}/photo`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/activate`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/make-claimable/pay`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/make-claimable/attach-photo`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/claim`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/refund`]
  | readonly ["POST", "/api/v1/notification/upload-token"]
  | readonly ["DELETE", "/api/v1/notification/token"]
  | readonly ["POST", "/api/v1/realtime/token"];
