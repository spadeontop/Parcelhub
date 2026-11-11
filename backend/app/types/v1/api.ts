/**
 * ParcelHub API v1 TypeScript Contracts & Types
 * Standalone contract definition for v1 API and database schema integration.
 * Uses strict type aliases, union literals, and tuples. No interfaces.
 */

// ==========================================
// 1. Drizzle Schema Integration & Exports
// ==========================================

export {
  customers,
  staff,
  orders,
  fcmTokens,
  appConfig,
} from "@/db/schema";

export type {
  CustomerRow,
  NewCustomerRow,
  StaffRow,
  NewStaffRow,
  OrderRow,
  NewOrderRow,
} from "@/db/schema";

export type FcmTokenRow = typeof import("@/db/schema").fcmTokens.$inferSelect;
export type NewFcmTokenRow = typeof import("@/db/schema").fcmTokens.$inferInsert;
export type AppConfigRow = typeof import("@/db/schema").appConfig.$inferSelect;
export type NewAppConfigRow = typeof import("@/db/schema").appConfig.$inferInsert;

// ==========================================
// 2. Base & Primitives
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
// 3. Customer Endpoints Types (v1)
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

export type CustomerRegisterRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// POST /api/v1/customer/login
export type CustomerLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
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

// GET /api/v1/customer/profile
export type CustomerProfile = {
  readonly id: CustomerId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
  readonly blacklisted?: boolean;
  readonly blacklistReason?: string | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly updatedAt?: ISO8601Timestamp;
};

export type CustomerProfileRes = StandardSuccessResponse & {
  readonly customer: CustomerProfile;
};

// GET /api/v1/customer/orders
export type CustomerOrderSummary = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
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

// GET /api/v1/customer/orders/{id}
export type CustomerOrderDetail = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string;
  readonly productName: string;
  readonly recipientName: string;
  readonly price: number;
  readonly change: number;
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly imageUrl?: string | null;
  readonly proofImageUrl?: string | null;
  readonly claimInitiatedAt?: ISO8601Timestamp | null;
  readonly claimExpiresAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
};

export type CustomerGetOrderRes = StandardSuccessResponse & {
  readonly order: CustomerOrderDetail;
};

// POST /api/v1/customer/orders/initialize
export type CustomerInitOrderReq = {
  readonly imageUrl: string;
  readonly trackingId: string;
};

export type CustomerInitOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly ticketCode: string;
};

// PUT /api/v1/customer/orders/{id}
export type CustomerEditableOrderStatus = "PENDING_INITIALIZATION" | "PAYMENT_REQUIRED";

export type CustomerUpdateOrderReq = {
  readonly order: {
    readonly trackingId?: string;
    readonly productName?: string;
    readonly recipientName?: string;
    readonly price?: number;
  };
};

export type CustomerUpdateOrderRes = StandardSuccessResponse;

// DELETE /api/v1/customer/orders/{id}
export type CustomerCancelOrderRes = StandardSuccessResponse;

// POST /api/v1/customer/orders/{id}/claim
export type CustomerClaimOrderReq = Record<string, never>;
export type CustomerClaimOrderRes = StandardSuccessResponse & {
  readonly claimInitiatedAt: ISO8601Timestamp;
  readonly claimExpiresAt: ISO8601Timestamp;
  readonly durationMinutes: number;
};

// ==========================================
// 4. Staff Endpoints Types (v1 - strictly schema.ts aligned)
// ==========================================

// Staff in schema.ts has username (no email/phone)
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
  readonly trackingId: string;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived: number;
  readonly change: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly imageUrl?: string | null;
  readonly proofImageUrl?: string | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId | null;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp | null;
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

// GET /api/v1/staff/orders/{id}
export type StaffOrderDetail = {
  readonly orderId: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived?: number | null;
  readonly change?: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly imageUrl?: string | null;
  readonly proofImageUrl?: string | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId | null;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
};

export type StaffGetOrderRes = StaffOrderDetail;

// POST /api/v1/staff/orders/{id}/activate
export type StaffActivateOrderReq = {
  readonly amountReceived: number;
};

export type StaffActivateOrderRes = StandardSuccessResponse & {
  readonly change: number;
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

// ==========================================
// 5. Administrator Endpoints Types (v1)
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
// 6. Push Notification Endpoints Types (v1)
// ==========================================

// POST /api/v1/notification/upload-token
export type NotificationUploadTokenReq = {
  readonly fcmToken: string;
  readonly userId?: string;
};

export type NotificationUploadTokenRes = StandardSuccessResponse;

// POST /api/v1/notification/send-notification
export type NotificationSendReq = {
  readonly notificationBody: string;
  readonly fcmToken: string;
};

export type NotificationSendRes = StandardSuccessResponse;

// ==========================================
// 7. Route Map & Method Unions
// ==========================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type RouteDefinition = readonly [method: HttpMethod, path: string];

export type ApiRoutes =
  | readonly ["POST", "/api/v1/customer/register"]
  | readonly ["POST", "/api/v1/customer/login"]
  | readonly ["POST", "/api/v1/customer/create-mpin"]
  | readonly ["POST", "/api/v1/customer/mpin"]
  | readonly ["GET", "/api/v1/customer/profile"]
  | readonly ["GET", "/api/v1/customer/orders"]
  | readonly ["GET", `/api/v1/customer/orders/${string}`]
  | readonly ["POST", "/api/v1/customer/orders/initialize"]
  | readonly ["PUT", `/api/v1/customer/orders/${string}`]
  | readonly ["DELETE", `/api/v1/customer/orders/${string}`]
  | readonly ["POST", `/api/v1/customer/orders/${string}/claim`]
  | readonly ["POST", "/api/v1/staff/login"]
  | readonly ["GET", "/api/v1/staff/orders"]
  | readonly ["GET", `/api/v1/staff/orders/${string}`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/activate`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/make-claimable/pay`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/make-claimable/attach-photo`]
  | readonly ["POST", `/api/v1/staff/orders/${string}/claim`]
  | readonly ["POST", "/api/v1/admin/create-staff"]
  | readonly ["GET", "/api/v1/admin/staffs"]
  | readonly ["PUT", `/api/v1/admin/staffs/${string}`]
  | readonly ["DELETE", `/api/v1/admin/staffs/${string}`]
  | readonly ["GET", "/api/v1/admin/orders"]
  | readonly ["GET", `/api/v1/admin/orders/${string}`]
  | readonly ["POST", `/api/v1/admin/blacklist/customer/${string}`]
  | readonly ["POST", `/api/v1/admin/config/${AdminOcrConfigTarget}/ai-ocr-verify/${AdminOcrConfigAction}`]
  | readonly ["POST", "/api/v1/notification/upload-token"]
  | readonly ["POST", "/api/v1/notification/send-notification"];
