/**
 * ParcelHub Customer Mobile v1 TypeScript Contracts & Types
 * Client-side 1:1 mirror of backend/app/types/v1/api.ts (Customer scope)
 * Uses strict type aliases, union literals, and tuples. No interfaces.
 */

// ==========================================
// 1. Base & Primitives
// ==========================================

export type ISO8601Timestamp = string;
export type OrderId = `ORD-${string}`;
export type CustomerId = `CST-${string}`;
export type StaffId = `STF-${string}`;
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

export type OrderScreenshotChecks = {
  readonly trackingId_strict?: string;
  readonly trackingId_similar?: string;
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
  readonly trackingId: string | null;
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
  readonly change: number;
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly claimInitiatedAt?: ISO8601Timestamp | null;
  readonly claimExpiresAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
};

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
export type CustomerInitOrderReq = {
  readonly imageUrl: string;
};

export type CustomerInitOrderRes = StandardSuccessResponse & {
  readonly orderId: OrderId;
  readonly ticketCode: string;
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

// POST /api/v1/customer/orders/{id}/claim
export type CustomerClaimOrderReq = Record<string, never>;

export type CustomerClaimOrderRes = StandardSuccessResponse & {
  readonly claimInitiatedAt: ISO8601Timestamp;
  readonly claimExpiresAt: ISO8601Timestamp;
  readonly durationMinutes: number;
};

// ==========================================
// 2b. Push Notification Endpoints Types (v1)
// ==========================================

export type NotificationUploadTokenReq = {
  readonly fcmToken: string;
  readonly userId?: string;
};

export type NotificationUploadTokenRes = StandardSuccessResponse;

export type NotificationDeleteTokenReq = {
  readonly fcmToken?: string;
};

export type NotificationDeleteTokenRes = StandardSuccessResponse;

// ==========================================
// 3. Customer Mobile UI Outward Calling Routes
// ==========================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RouteDefinition = readonly [method: HttpMethod, path: string];

/**
 * Customer Mobile UI Outward Calling Routes
 * Grouped and commented per customer UI screen
 */
export type CustomerApiRoutes =
  // Screen: RegisterScreen & MpinCreateScreen (Account Registration)
  | readonly ["POST", "/api/v1/customer/register"]

  // Screen: LoginScreen (Email/Password Verification)
  | readonly ["POST", "/api/v1/customer/login"]

  // Screen: MpinCreateScreen (4-Digit MPIN Initialization)
  | readonly ["POST", "/api/v1/customer/create-mpin"]

  // Screen: MpinLoginScreen (4-Digit MPIN Authorization)
  | readonly ["POST", "/api/v1/customer/mpin"]

  // App Lifecycle / Session Resume (Silent MPIN Token Renewal)
  | readonly ["POST", "/api/v1/customer/refresh"]

  // Screen: ProfileScreen & App Header (Customer Profile Overview)
  | readonly ["GET", "/api/v1/customer/profile"]

  // Screen: HomeScreen & TransactionsScreen (List Orders & Filter Tabs)
  | readonly ["GET", "/api/v1/customer/orders"]

  // Screen: CreateOrderScreen (Upload Receipt Image / Link -> Initializes Order & Generates Ticket)
  | readonly ["POST", "/api/v1/customer/orders/initialize"]

  // Screen: ConfirmOrderScreen (Finalize Complete Order Details via PUT)
  | readonly ["PUT", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen (Live Polling & Timeline Tracking)
  | readonly ["GET", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen & ProofOfDeliveryModal (On-Demand Receipt / Proof Photo)
  | readonly ["GET", `/api/v1/customer/orders/${string}/photo`]

  // Screen: OrderDetailsScreen (Unlock Counter Pickup Pass)
  | readonly ["POST", `/api/v1/customer/orders/${string}/claim`]

  // Push Notifications Registration & Deregistration
  | readonly ["POST", "/api/v1/notification/upload-token"]
  | readonly ["DELETE", "/api/v1/notification/token"];
