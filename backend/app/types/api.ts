/**
 * ParcelHub API TypeScript Contracts & Types
 * Uses strict type aliases, union literals, and tuples. No interfaces.
 */

// ==========================================
// Base & Primitives
// ==========================================

export type ISO8601Timestamp = string;
export type OrderId = `ORD-${string}`;
export type StaffId = `STF-${string}`;
export type CustomerId = `CST-${string}`;
export type JWTToken = string;
export type MPIN = `${number}${number}${number}${number}`;

export type OrderStatus =
  | "PENDING_INITIALIZATION"
  | "PAYMENT_REQUIRED"
  | "AWAITING_PARCEL"
  | "READY_TO_CLAIM"
  | "CLAIMED"
  | "CANCELLED";

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export type StatusTimelineEntry = {
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
};

export type OrderStatusHistoryTuple = readonly StatusTimelineEntry[];

export type StandardSuccessResponse<TMessage extends string = string> = {
  readonly statusMessage: TMessage;
};

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
};

// ==========================================
// 1. Customer Endpoints Types
// ==========================================

// POST /api/customer/register
export type CustomerRegisterReq = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type CustomerRegisterRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// POST /api/customer/login
export type CustomerLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// POST /api/customer/create-mpin
export type CustomerCreateMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerCreateMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

// POST /api/customer/mpin
export type CustomerVerifyMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerVerifyMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

// GET /api/customer/profile
export type CustomerProfile = {
  readonly id: CustomerId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type CustomerProfileRes = StandardSuccessResponse & {
  readonly customer: CustomerProfile;
};

// GET /api/customer/orders
export type CustomerOrderSummary = {
  readonly id: OrderId;
  readonly trackingId: string;
  readonly productName: string;
  readonly status: OrderStatus;
  readonly timestamp: ISO8601Timestamp;
  readonly isClaimActive?: boolean;
};

export type CustomerListOrdersQueryParams = {
  readonly type?: OrderStatus;
  readonly limit?: number;
  readonly offset?: number;
};

export type CustomerListOrdersRes = StandardSuccessResponse & {
  readonly orders: readonly CustomerOrderSummary[];
};

// GET /api/customer/orders/{id}
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

export type CustomerGetOrderRes = StandardSuccessResponse & {
  readonly order: CustomerOrderDetail;
};

// POST /api/customer/orders/initialize
export type CustomerInitOrderReq = {
  readonly imageUrl: string;
  readonly trackingId?: string;
};

export type CustomerInitOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
};

// PUT /api/customer/orders/{id}
// Allowed only when order is unpaid/inactive: PENDING_INITIALIZATION or PAYMENT_REQUIRED
export type CustomerEditableOrderStatus = 'PENDING_INITIALIZATION' | 'PAYMENT_REQUIRED';

export type CustomerUpdateOrderReq = {
  readonly order: {
    readonly trackingId?: string;
    readonly productName?: string;
    readonly recipientName?: string;
    readonly price?: number;
  };
};

export type CustomerUpdateOrderRes = StandardSuccessResponse;

// DELETE /api/customer/orders/{id}
export type CustomerCancelOrderRes = StandardSuccessResponse;

// POST /api/customer/orders/{id}/claim
export type CustomerClaimOrderReq = Record<string, never>;
export type CustomerClaimOrderRes = StandardSuccessResponse & {
  readonly claimInitiatedAt: ISO8601Timestamp;
  readonly claimExpiresAt: ISO8601Timestamp;
  readonly durationMinutes: number;
};

// ==========================================
// 2. Staff Endpoints Types
// ==========================================

// POST /api/staff/login
export type StaffLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type StaffLoginRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
};

// GET /api/staff/orders
export type StaffOrderSummary = {
  readonly id: OrderId;
  readonly trackingId: string;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived: number;
  readonly change: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
};

export type StaffListOrdersQueryParams = {
  readonly status?: OrderStatus;
  readonly limit?: number;
  readonly offset?: number;
};

export type StaffListOrdersRes = {
  readonly orders: readonly StaffOrderSummary[];
};

// GET /api/staff/orders/{id}
export type StaffOrderDetail = {
  readonly orderId: OrderId;
  readonly trackingId: string;
  readonly customer: string;
  readonly amountToPay: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
};

export type StaffGetOrderRes = StaffOrderDetail;

// POST /api/staff/orders/{id}/activate
export type StaffActivateOrderReq = {
  readonly amountReceived: number;
};

export type StaffActivateOrderRes = StandardSuccessResponse & {
  readonly change: number;
};

// POST /api/staff/orders/{id}/make-claimable/pay
export type StaffPayCourierReq = Record<string, never>;
export type StaffPayCourierRes = StandardSuccessResponse;

// POST /api/staff/orders/{id}/make-claimable/attach-photo
export type StaffAttachPhotoReq = {
  readonly imageUrl: string;
};

export type StaffAttachPhotoRes = StandardSuccessResponse & {
  readonly imageUrl: string;
};

// POST /api/staff/orders/{id}/claim
export type StaffClaimOrderReq = Record<string, never>;
export type StaffClaimOrderRes = StandardSuccessResponse;

// ==========================================
// 3. Administrator Endpoints Types
// ==========================================

export type StaffProfile = {
  readonly id: StaffId;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
  readonly email: string;
};

// POST /api/admin/create-staff
export type AdminCreateStaffReq = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type AdminCreateStaffRes = StandardSuccessResponse & {
  readonly staffId: StaffId;
};

// GET /api/admin/staffs
export type AdminListStaffsRes = StandardSuccessResponse & {
  readonly staffs: readonly StaffProfile[];
};

// PUT /api/admin/staffs/{id}
export type AdminUpdateStaffReq = {
  readonly staff: Partial<Omit<AdminCreateStaffReq, "email">> & {
    readonly email?: string;
  };
};

export type AdminUpdateStaffRes = StandardSuccessResponse;

// DELETE /api/admin/staffs/{id}
export type AdminDeleteStaffReq = {
  readonly reason: string;
};

export type AdminDeleteStaffRes = StandardSuccessResponse;

// GET /api/admin/orders
export type AdminListOrdersQueryParams = {
  readonly type?: OrderStatus;
  readonly limit?: number;
  readonly offset?: number;
};

export type AdminAuditOrderSummary = {
  readonly id: OrderId;
  readonly productName: string;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly timestamp: ISO8601Timestamp;
};

export type AdminListOrdersRes = StandardSuccessResponse & {
  readonly orders: readonly AdminAuditOrderSummary[];
};

// GET /api/admin/orders/{id}
export type AdminOrderDetailAudit = {
  readonly id: OrderId;
  readonly trackingId: string;
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

// POST /api/admin/blacklist/customer/{id}
export type AdminBlacklistCustomerReq = {
  readonly reason: string;
};

export type AdminBlacklistCustomerRes = StandardSuccessResponse;

// POST /api/admin/config/{target}/ai-ocr-verify/{action}
export type AdminOcrConfigTarget = "staff" | "customer";
export type AdminOcrConfigAction = "enable" | "disable";
export type AdminOcrConfigRes = StandardSuccessResponse;

// ==========================================
// 4. Push Notification Endpoints Types
// ==========================================

// POST /api/notification/upload-token
export type NotificationUploadTokenReq = {
  readonly fcmToken: string;
};

export type NotificationUploadTokenRes = StandardSuccessResponse;

// POST /api/notification/send-notification
export type NotificationSendReq = {
  readonly notificationBody: string;
  readonly fcmToken: string;
};

export type NotificationSendRes = StandardSuccessResponse;

// ==========================================
// Route Map & Method Unions
// ==========================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RouteDefinition = readonly [method: HttpMethod, path: string];

export type ApiRoutes =
  | readonly ["POST", "/api/customer/register"]
  | readonly ["POST", "/api/customer/login"]
  | readonly ["POST", "/api/customer/create-mpin"]
  | readonly ["POST", "/api/customer/mpin"]
  | readonly ["GET", "/api/customer/profile"]
  | readonly ["GET", "/api/customer/orders"]
  | readonly ["GET", `/api/customer/orders/${string}`]
  | readonly ["POST", "/api/customer/orders/initialize"]
  | readonly ["PUT", `/api/customer/orders/${string}`]
  | readonly ["DELETE", `/api/customer/orders/${string}`]
  | readonly ["POST", `/api/customer/orders/${string}/claim`]
  | readonly ["POST", "/api/staff/login"]
  | readonly ["GET", "/api/staff/orders"]
  | readonly ["GET", `/api/staff/orders/${string}`]
  | readonly ["POST", `/api/staff/orders/${string}/activate`]
  | readonly ["POST", `/api/staff/orders/${string}/make-claimable/pay`]
  | readonly ["POST", `/api/staff/orders/${string}/make-claimable/attach-photo`]
  | readonly ["POST", `/api/staff/orders/${string}/claim`]
  | readonly ["POST", "/api/admin/create-staff"]
  | readonly ["GET", "/api/admin/staffs"]
  | readonly ["PUT", `/api/admin/staffs/${string}`]
  | readonly ["DELETE", `/api/admin/staffs/${string}`]
  | readonly ["GET", "/api/admin/orders"]
  | readonly ["GET", `/api/admin/orders/${string}`]
  | readonly ["POST", `/api/admin/blacklist/customer/${string}`]
  | readonly ["POST", `/api/admin/config/${AdminOcrConfigTarget}/ai-ocr-verify/${AdminOcrConfigAction}`]
  | readonly ["POST", "/api/notification/upload-token"]
  | readonly ["POST", "/api/notification/send-notification"];
