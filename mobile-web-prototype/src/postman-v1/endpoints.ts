import type {
  AuthActor,
  CustomerCancelReasonCode,
  OrderPhotoType,
  OrderStatus,
  PostmanEndpointId,
  PostmanEndpointSpec,
  PostmanFormState,
  TargetOrderItem,
} from './types';

export const ORDER_STATUS_OPTIONS: readonly OrderStatus[] = [
  'PENDING_INITIALIZATION',
  'PAYMENT_REQUIRED',
  'AWAITING_PARCEL',
  'READY_TO_CLAIM',
  'CLAIMED',
  'CANCELLED',
  'REFUNDED',
];

export const CUSTOMER_LIST_STATUS_OPTIONS: readonly OrderStatus[] = [
  'PAYMENT_REQUIRED',
  'AWAITING_PARCEL',
  'READY_TO_CLAIM',
  'CLAIMED',
  'CANCELLED',
  'REFUNDED',
];

export const STAFF_LIST_STATUS_OPTIONS: readonly OrderStatus[] = [
  'PAYMENT_REQUIRED',
  'AWAITING_PARCEL',
  'READY_TO_CLAIM',
  'CLAIMED',
  'CANCELLED',
  'REFUNDED',
];

export const CANCEL_REASON_OPTIONS: readonly CustomerCancelReasonCode[] = [
  'CHANGED_MIND',
  'SELLER_CANCELLED',
  'WRONG_DETAILS',
  'DUPLICATE_ORDER',
  'DELIVERY_DELAYED',
  'OTHER',
];

export const PHOTO_TYPE_OPTIONS: readonly OrderPhotoType[] = ['all', 'screenshot', 'proof'];

export interface SeededCustomerAccount {
  readonly id: string;
  readonly label: string;
  readonly email: string;
  readonly password: string;
  readonly mpin: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial: string;
  readonly phoneNumber: string;
}

export const SEEDED_CUSTOMER_ACCOUNTS: readonly SeededCustomerAccount[] = [
  {
    id: 'CST-001',
    label: 'John Doe',
    email: 'user@example.com',
    password: 'password',
    mpin: '1234',
    firstName: 'John',
    lastName: 'Doe',
    middleInitial: 'D',
    phoneNumber: '+639123456789',
  },
  {
    id: 'CST-002',
    label: 'Maria Santos',
    email: 'maria@example.com',
    password: 'password',
    mpin: '1234',
    firstName: 'Maria',
    lastName: 'Santos',
    middleInitial: 'C',
    phoneNumber: '+639987654321',
  },
];

export const SEEDED_STAFF_ACCOUNT = {
  username: 'staff',
  password: 'string',
} as const;

export const SAMPLE_RECEIPT_IMAGES: ReadonlyArray<{ readonly label: string; readonly url: string }> = [
  {
    label: 'ParcelHub Init',
    url: 'https://storage.parcelhub.com/init/sample-parcel-checkout.jpg',
  },
  {
    label: 'Local Receipt',
    url: './assets/receipt_thumbnail.png',
  },
  {
    label: 'Shopee COD',
    url: 'https://storage.parcelhub.com/init/shopee-cod-invoice.jpg',
  },
];

export const SAMPLE_PROOF_IMAGES: ReadonlyArray<{ readonly label: string; readonly url: string }> = [
  {
    label: 'Storage Proof',
    url: 'https://storage.parcelhub.com/proof/sample-parcel.jpg',
  },
  {
    label: 'Local Receipt',
    url: './assets/receipt_thumbnail.png',
  },
  {
    label: 'Pouch Verified',
    url: 'https://storage.parcelhub.com/proof/pouch-verified-01.jpg',
  },
];

export const SEEDED_CUSTOMER_ORDERS: readonly TargetOrderItem[] = [
  {
    id: 'ORD-C1-PEND-01',
    ticketCode: '101-111',
    trackingId: 'PH-C1-001',
    status: 'PENDING_INITIALIZATION',
    label: 'Logitech MX Master 3S',
    productName: 'Logitech MX Master 3S',
    recipientName: 'John Doe',
    price: 480,
  },
  {
    id: 'ORD-C1-PAY-01',
    ticketCode: '101-201',
    trackingId: 'PH-C1-003',
    status: 'PAYMENT_REQUIRED',
    label: 'VXE R1 Wireless Mouse',
    productName: 'VXE R1 Wireless Mouse',
    recipientName: 'John Doe',
    price: 480,
  },
  {
    id: 'ORD-C1-AWT-01',
    ticketCode: '101-301',
    trackingId: 'PH-C1-005',
    status: 'AWAITING_PARCEL',
    label: 'UGREEN 100W Charger',
    productName: 'UGREEN 100W Charger',
    recipientName: 'John Doe',
    price: 2400,
    courierPaid: false,
  },
  {
    id: 'ORD-C1-RDY-01',
    ticketCode: '101-401',
    trackingId: 'PH-C1-007',
    status: 'READY_TO_CLAIM',
    label: 'Sony WH-1000XM5',
    productName: 'Sony WH-1000XM5',
    recipientName: 'John Doe',
    price: 18990,
  },
  {
    id: 'ORD-C1-CLM-01',
    ticketCode: '101-501',
    trackingId: 'PH-C1-009',
    status: 'CLAIMED',
    label: 'Keychron K2 Pro',
    productName: 'Keychron K2 Pro',
    recipientName: 'John Doe',
    price: 4200,
  },
];

export const SEEDED_STAFF_ORDERS: readonly TargetOrderItem[] = [
  {
    id: 'ORD-C1-PAY-01',
    ticketCode: '101-201',
    trackingId: 'PH-C1-003',
    status: 'PAYMENT_REQUIRED',
    label: 'VXE R1 Wireless Mouse',
    price: 480,
  },
  {
    id: 'ORD-C1-PAY-02',
    ticketCode: '101-202',
    trackingId: 'PH-C1-004',
    status: 'PAYMENT_REQUIRED',
    label: 'Baseus Power Bank',
    price: 1250,
  },
  {
    id: 'ORD-C1-AWT-01',
    ticketCode: '101-301',
    trackingId: 'PH-C1-005',
    status: 'AWAITING_PARCEL',
    label: 'UGREEN 100W Charger (Unpaid)',
    price: 2400,
    courierPaid: false,
  },
  {
    id: 'ORD-C1-AWT-02',
    ticketCode: '101-302',
    trackingId: 'PH-C1-006',
    status: 'AWAITING_PARCEL',
    label: 'Edifier W820NB (Courier Paid)',
    price: 2890,
    courierPaid: true,
  },
  {
    id: 'ORD-C1-RDY-01',
    ticketCode: '101-401',
    trackingId: 'PH-C1-007',
    status: 'READY_TO_CLAIM',
    label: 'Sony WH-1000XM5',
    price: 18990,
  },
  {
    id: 'ORD-C1-CLM-01',
    ticketCode: '101-501',
    trackingId: 'PH-C1-009',
    status: 'CLAIMED',
    label: 'Keychron K2 Pro',
    price: 4200,
  },
];

export function createInitialFormState(): PostmanFormState {
  const seed = SEEDED_CUSTOMER_ACCOUNTS[0];
  const sampleOrder = SEEDED_CUSTOMER_ORDERS[0];
  return {
    email: seed.email,
    password: seed.password,
    newPassword: 'newpassword123',
    firstName: seed.firstName,
    lastName: seed.lastName,
    middleInitial: seed.middleInitial,
    phoneNumber: seed.phoneNumber,
    otpCode: '123456',
    mpin: seed.mpin,
    newMpin: '5678',
    preAuthToken: '',
    refreshToken: '',
    resetToken: '',
    staffUsername: SEEDED_STAFF_ACCOUNT.username,
    staffPassword: SEEDED_STAFF_ACCOUNT.password,
    orderId: sampleOrder.id,
    customerStatusFilter: 'ALL',
    staffStatusFilter: 'ALL',
    search: '',
    refundEligible: 'false',
    limit: '20',
    offset: '0',
    photoType: 'all',
    initImageUrl: SAMPLE_RECEIPT_IMAGES[0].url,
    proofImageUrl: SAMPLE_PROOF_IMAGES[0].url,
    trackingId: sampleOrder.trackingId,
    productName: sampleOrder.productName || 'Sample Parcel',
    recipientName: sampleOrder.recipientName || 'John Doe',
    price: String(sampleOrder.price ?? 480),
    amountReceived: '500',
    reasonCode: 'CHANGED_MIND',
    reason: '',
    fcmToken: 'fcm_demo_device_token_v1',
  };
}

/**
 * Complete catalog of all 34 implemented v1 endpoints defined in ApiRoutes
 * (packages/contracts/src/v1.ts -> backend/app/types/v1/api.ts).
 */
export const POSTMAN_V1_ENDPOINTS: readonly PostmanEndpointSpec[] = [
  // ── Customer Auth ──────────────────────────────────────────────
  {
    id: 'customer_login',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Customer Login',
    shortLabel: 'Login',
    method: 'POST',
    pathTemplate: '/api/v1/customer/login',
    routeContract: ['POST', '/api/v1/customer/login'],
    description: 'Verifies email + password and issues a 5-minute preAuthToken for MPIN unlock.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Seeded: user@example.com or maria@example.com (password: "password").',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
      { key: 'password', label: 'password', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerLoginReq', resType: 'CustomerLoginRes' },
  },
  {
    id: 'customer_register',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Customer Register',
    shortLabel: 'Register',
    method: 'POST',
    pathTemplate: '/api/v1/customer/register',
    routeContract: ['POST', '/api/v1/customer/register'],
    description: 'Registers a new customer and dispatches a 6-digit email verification OTP.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Hard-locked: returns emailVerificationRequired=true (verify email before MPIN).',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
      { key: 'password', label: 'password', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'firstName', label: 'firstName', section: 'body', kind: 'text', required: true },
      { key: 'lastName', label: 'lastName', section: 'body', kind: 'text', required: true },
      { key: 'middleInitial', label: 'middleInitial', section: 'body', kind: 'text', placeholder: 'Optional' },
      { key: 'phoneNumber', label: 'phoneNumber', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerRegisterReq', resType: 'CustomerRegisterRes' },
  },
  {
    id: 'customer_send_email_verification',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Send Email Verification OTP',
    shortLabel: 'Send Verify OTP',
    method: 'POST',
    pathTemplate: '/api/v1/customer/email/send-verification',
    routeContract: ['POST', '/api/v1/customer/email/send-verification'],
    description: 'Sends (or resends) a 6-digit VERIFY_EMAIL OTP with anti-enumeration semantics.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Public anti-enumeration route. Rate-limited with cooldown.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
    ],
    contractSummary: {
      reqType: 'CustomerSendEmailVerificationReq',
      resType: 'CustomerSendEmailVerificationRes',
    },
  },
  {
    id: 'customer_verify_email',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Verify Email OTP',
    shortLabel: 'Verify Email',
    method: 'POST',
    pathTemplate: '/api/v1/customer/email/verify',
    routeContract: ['POST', '/api/v1/customer/email/verify'],
    description: 'Consumes 6-digit email OTP, marks email verified, and issues preAuthToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Auto-captures returned preAuthToken for POST /customer/create-mpin.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
      { key: 'otpCode', label: 'code (6 digits)', section: 'body', kind: 'text', required: true, maxLength: 6, mono: true },
    ],
    contractSummary: { reqType: 'CustomerVerifyEmailReq', resType: 'CustomerVerifyEmailRes' },
  },
  {
    id: 'customer_create_mpin',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Create Customer MPIN',
    shortLabel: 'Create MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/create-mpin',
    routeContract: ['POST', '/api/v1/customer/create-mpin'],
    description: 'Sets initial 4-digit MPIN using preAuthToken and returns authToken + refreshToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Requires preAuthToken and 4 numeric digits.',
    fields: [
      { key: 'preAuthToken', label: 'preAuthToken', section: 'body', kind: 'text', required: true, mono: true, placeholder: 'Auto-captured from login / verify-email' },
      { key: 'mpin', label: 'mpin (4 digits)', section: 'body', kind: 'text', required: true, maxLength: 4, mono: true },
    ],
    contractSummary: { reqType: 'CustomerCreateMpinReq', resType: 'CustomerCreateMpinRes' },
  },
  {
    id: 'customer_verify_mpin',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Verify Customer MPIN',
    shortLabel: 'Verify MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/mpin',
    routeContract: ['POST', '/api/v1/customer/mpin'],
    description: 'Exchanges preAuthToken + 4-digit MPIN for 15m authToken and 30d refreshToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Seeded customer MPIN is "1234". Auto-captures authToken & refreshToken.',
    fields: [
      { key: 'preAuthToken', label: 'preAuthToken', section: 'body', kind: 'text', required: true, mono: true, placeholder: 'Auto-captured from login' },
      { key: 'mpin', label: 'mpin (4 digits)', section: 'body', kind: 'text', required: true, maxLength: 4, mono: true },
    ],
    contractSummary: { reqType: 'CustomerVerifyMpinReq', resType: 'CustomerVerifyMpinRes' },
  },
  {
    id: 'customer_refresh',
    domain: 'customer',
    group: 'Customer Auth',
    title: 'Refresh / Unlock Session',
    shortLabel: 'Refresh Token',
    method: 'POST',
    pathTemplate: '/api/v1/customer/refresh',
    routeContract: ['POST', '/api/v1/customer/refresh'],
    description: 'Mints a fresh 15m authToken from a 30d refreshToken + 4-digit MPIN.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Requires refreshToken captured from MPIN verification.',
    fields: [
      { key: 'refreshToken', label: 'refreshToken', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'mpin', label: 'mpin (4 digits)', section: 'body', kind: 'text', required: true, maxLength: 4, mono: true },
    ],
    contractSummary: { reqType: 'CustomerRefreshTokenReq', resType: 'CustomerRefreshTokenRes' },
  },

  // ── Customer Recovery ──────────────────────────────────────────
  {
    id: 'customer_forgot_password',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Forgot Password (Send OTP)',
    shortLabel: 'Forgot Password',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-password',
    routeContract: ['POST', '/api/v1/customer/forgot-password'],
    description: 'Dispatches a 6-digit FORGOT_PASSWORD OTP email.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Anti-enumeration 200 OK response.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerForgotPasswordReq', resType: 'CustomerForgotPasswordRes' },
  },
  {
    id: 'customer_forgot_password_verify',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Verify Password Reset OTP',
    shortLabel: 'Verify PW OTP',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-password/verify',
    routeContract: ['POST', '/api/v1/customer/forgot-password/verify'],
    description: 'Verifies password reset OTP and issues a single-use PASSWORD_RESET resetToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Auto-captures resetToken into session vault.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
      { key: 'otpCode', label: 'code (6 digits)', section: 'body', kind: 'text', required: true, maxLength: 6, mono: true },
    ],
    contractSummary: {
      reqType: 'CustomerVerifyPasswordResetOtpReq',
      resType: 'CustomerVerifyPasswordResetOtpRes',
    },
  },
  {
    id: 'customer_forgot_password_reset',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Reset Password',
    shortLabel: 'Reset Password',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-password/reset',
    routeContract: ['POST', '/api/v1/customer/forgot-password/reset'],
    description: 'Resets password using resetToken, increments tokenVersion, and issues fresh tokens.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Password must be >= 6 chars and <= 72 bytes. Auto-captures returned tokens.',
    fields: [
      { key: 'resetToken', label: 'resetToken', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'newPassword', label: 'newPassword', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerResetPasswordReq', resType: 'CustomerResetPasswordRes' },
  },
  {
    id: 'customer_forgot_mpin',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Forgot MPIN (Send OTP)',
    shortLabel: 'Forgot MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-mpin',
    routeContract: ['POST', '/api/v1/customer/forgot-mpin'],
    description: 'Dispatches a 6-digit FORGOT_MPIN OTP email.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Anti-enumeration 200 OK response.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerForgotMpinReq', resType: 'CustomerForgotMpinRes' },
  },
  {
    id: 'customer_forgot_mpin_verify',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Verify MPIN Reset OTP',
    shortLabel: 'Verify MPIN OTP',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-mpin/verify',
    routeContract: ['POST', '/api/v1/customer/forgot-mpin/verify'],
    description: 'Verifies MPIN reset OTP and issues a single-use MPIN_RESET resetToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Auto-captures resetToken into session vault.',
    fields: [
      { key: 'email', label: 'email', section: 'body', kind: 'email', required: true, mono: true },
      { key: 'otpCode', label: 'code (6 digits)', section: 'body', kind: 'text', required: true, maxLength: 6, mono: true },
    ],
    contractSummary: {
      reqType: 'CustomerVerifyMpinResetOtpReq',
      resType: 'CustomerVerifyMpinResetOtpRes',
    },
  },
  {
    id: 'customer_forgot_mpin_reset',
    domain: 'customer',
    group: 'Customer Recovery',
    title: 'Reset MPIN',
    shortLabel: 'Reset MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/forgot-mpin/reset',
    routeContract: ['POST', '/api/v1/customer/forgot-mpin/reset'],
    description: 'Replaces 4-digit MPIN using resetToken and issues fresh authToken + refreshToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'newMpin must be strictly 4 digits. Auto-captures authToken & refreshToken.',
    fields: [
      { key: 'resetToken', label: 'resetToken', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'newMpin', label: 'newMpin (4 digits)', section: 'body', kind: 'text', required: true, maxLength: 4, mono: true },
    ],
    contractSummary: { reqType: 'CustomerResetMpinReq', resType: 'CustomerResetMpinRes' },
  },

  // ── Customer Account & Orders ──────────────────────────────────
  {
    id: 'customer_profile',
    domain: 'customer',
    group: 'Customer Account',
    title: 'Get Customer Profile',
    shortLabel: 'Profile',
    method: 'GET',
    pathTemplate: '/api/v1/customer/profile',
    routeContract: ['GET', '/api/v1/customer/profile'],
    description: 'Returns sanitized CustomerProfile for the authenticated customer Bearer token.',
    authPolicy: 'customer',
    hasBody: false,
    guardHint: 'Requires Customer Bearer authToken.',
    fields: [],
    contractSummary: { reqType: 'None', resType: 'CustomerProfileRes' },
  },
  {
    id: 'customer_list_orders',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'List Customer Orders',
    shortLabel: 'List Orders',
    method: 'GET',
    pathTemplate: '/api/v1/customer/orders',
    routeContract: ['GET', '/api/v1/customer/orders'],
    description: 'Lists orders owned by the customer (omits PENDING_INITIALIZATION drafts).',
    authPolicy: 'customer',
    hasBody: false,
    guardHint: 'Optional query params: ?type=<OrderStatus>&limit=<1..100>&offset=<n>.',
    fields: [
      {
        key: 'customerStatusFilter',
        label: 'type (status)',
        section: 'query',
        kind: 'select',
        options: ['ALL', ...CUSTOMER_LIST_STATUS_OPTIONS],
        mono: true,
      },
      { key: 'limit', label: 'limit', section: 'query', kind: 'number', mono: true },
      { key: 'offset', label: 'offset', section: 'query', kind: 'number', mono: true },
    ],
    contractSummary: {
      reqType: 'None',
      queryType: 'CustomerListOrdersQueryParams',
      resType: 'CustomerListOrdersRes',
    },
  },
  {
    id: 'customer_initialize_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Initialize Order',
    shortLabel: 'Initialize Order',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/initialize',
    routeContract: ['POST', '/api/v1/customer/orders/initialize'],
    description: 'Creates a PENDING_INITIALIZATION draft order with receipt screenshot & optional OCR autofill.',
    authPolicy: 'customer',
    hasBody: true,
    guardHint: 'Requires Customer Bearer authToken. Fails 403 if customer is blacklisted.',
    fields: [
      { key: 'initImageUrl', label: 'imageUrl', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerInitOrderReq', resType: 'CustomerInitOrderRes' },
  },
  {
    id: 'customer_get_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Get Customer Order Detail',
    shortLabel: 'Get Order',
    method: 'GET',
    pathTemplate: '/api/v1/customer/orders/{id}',
    routeContract: ['GET', '/api/v1/customer/orders/{id}'],
    description: 'Fetches full CustomerOrderDetail including timeline, claim window, cancel & refund status.',
    authPolicy: 'customer',
    hasBody: false,
    hasOrderIdParam: true,
    guardHint: 'Accepts UUIDv7 orderId or ticketCode. Must belong to authenticated customer.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'None', resType: 'CustomerGetOrderRes' },
  },
  {
    id: 'customer_get_order_photo',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Get Customer Order Photo',
    shortLabel: 'Order Photo',
    method: 'GET',
    pathTemplate: '/api/v1/customer/orders/{id}/photo',
    routeContract: ['GET', '/api/v1/customer/orders/{id}/photo'],
    description: 'Retrieves receipt screenshot and/or staff proof-of-delivery photo URLs.',
    authPolicy: 'customer',
    hasBody: false,
    hasOrderIdParam: true,
    guardHint: 'Optional query param ?type=all|screenshot|proof.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'photoType', label: 'type', section: 'query', kind: 'select', options: PHOTO_TYPE_OPTIONS, mono: true },
    ],
    contractSummary: {
      reqType: 'None',
      queryType: 'CustomerGetOrderPhotoQueryParams',
      resType: 'CustomerGetOrderPhotoRes',
    },
  },
  {
    id: 'customer_update_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Confirm / Update Draft Order',
    shortLabel: 'Confirm Order',
    method: 'PUT',
    pathTemplate: '/api/v1/customer/orders/{id}',
    routeContract: ['PUT', '/api/v1/customer/orders/{id}'],
    description: 'Confirms a PENDING_INITIALIZATION draft order and transitions it to PAYMENT_REQUIRED.',
    authPolicy: 'customer',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'One-shot transition from PENDING_INITIALIZATION. 409 if trackingId already active.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'trackingId', label: 'order.trackingId', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'productName', label: 'order.productName', section: 'body', kind: 'text', required: true },
      { key: 'recipientName', label: 'order.recipientName', section: 'body', kind: 'text', required: true },
      { key: 'price', label: 'order.price', section: 'body', kind: 'number', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerUpdateOrderReq', resType: 'CustomerUpdateOrderRes' },
  },
  {
    id: 'customer_cancel_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Cancel Order',
    shortLabel: 'Cancel Order',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/{id}/cancel',
    routeContract: ['POST', '/api/v1/customer/orders/{id}/cancel'],
    description: 'Cancels an order in PENDING_INITIALIZATION, PAYMENT_REQUIRED, or unpaid AWAITING_PARCEL.',
    authPolicy: 'customer',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Blocked if READY_TO_CLAIM, CLAIMED, or courierPaid=true. Computes refundAmount (full amountReceived).',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'reasonCode', label: 'reasonCode', section: 'body', kind: 'select', options: ['', ...CANCEL_REASON_OPTIONS], mono: true },
      { key: 'reason', label: 'reason (optional note)', section: 'body', kind: 'text', placeholder: 'Optional cancellation note' },
    ],
    contractSummary: { reqType: 'CustomerCancelOrderReq', resType: 'CustomerCancelOrderRes' },
  },
  {
    id: 'customer_claim_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Initiate Pickup Claim',
    shortLabel: 'Initiate Claim',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/{id}/claim',
    routeContract: ['POST', '/api/v1/customer/orders/{id}/claim'],
    description: 'Starts the timed customer pickup claim window so staff can release the parcel.',
    authPolicy: 'customer',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === READY_TO_CLAIM.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'CustomerClaimOrderReq ({})', resType: 'CustomerClaimOrderRes' },
  },
  {
    id: 'customer_refund_order',
    domain: 'customer',
    group: 'Customer Orders',
    title: 'Initiate Refund Pass',
    shortLabel: 'Initiate Refund',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/{id}/refund',
    routeContract: ['POST', '/api/v1/customer/orders/{id}/refund'],
    description: 'Opens a timed cash refund window on a cancelled, activated, unpaid-courier order.',
    authPolicy: 'customer',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === CANCELLED, courierPaid === false, and refundAmount > 0.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'reasonCode', label: 'reasonCode', section: 'body', kind: 'select', options: ['', ...CANCEL_REASON_OPTIONS], mono: true },
      { key: 'reason', label: 'reason (optional note)', section: 'body', kind: 'text', placeholder: 'Optional refund note' },
    ],
    contractSummary: { reqType: 'CustomerInitiateRefundReq', resType: 'CustomerInitiateRefundRes' },
  },

  // ── Staff Auth & Orders ────────────────────────────────────────
  {
    id: 'staff_login',
    domain: 'staff',
    group: 'Staff Auth',
    title: 'Staff Login',
    shortLabel: 'Staff Login',
    method: 'POST',
    pathTemplate: '/api/v1/staff/login',
    routeContract: ['POST', '/api/v1/staff/login'],
    description: 'Authenticates staff credentials and issues HS256 authToken + refreshToken.',
    authPolicy: 'public',
    hasBody: true,
    guardHint: 'Seeded staff account: username="staff", password="string".',
    fields: [
      { key: 'staffUsername', label: 'username', section: 'body', kind: 'text', required: true, mono: true },
      { key: 'staffPassword', label: 'password', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffLoginReq', resType: 'StaffLoginRes' },
  },
  {
    id: 'staff_list_orders',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'List Staff Orders',
    shortLabel: 'List Orders',
    method: 'GET',
    pathTemplate: '/api/v1/staff/orders',
    routeContract: ['GET', '/api/v1/staff/orders'],
    description: 'Returns paginated orders with live claim/refund timers and courier payout metadata.',
    authPolicy: 'staff',
    hasBody: false,
    guardHint: 'Requires Staff Bearer token. Filters: status, search (tracking/ticket), refundEligible, limit, offset.',
    fields: [
      {
        key: 'staffStatusFilter',
        label: 'status',
        section: 'query',
        kind: 'select',
        options: ['ALL', ...STAFF_LIST_STATUS_OPTIONS],
        mono: true,
      },
      { key: 'search', label: 'search (tracking/ticket)', section: 'query', kind: 'text', placeholder: 'e.g. 101-201 or PH-' },
      { key: 'refundEligible', label: 'refundEligible', section: 'query', kind: 'select', options: ['false', 'true'], mono: true },
      { key: 'limit', label: 'limit', section: 'query', kind: 'number', mono: true },
      { key: 'offset', label: 'offset', section: 'query', kind: 'number', mono: true },
    ],
    contractSummary: {
      reqType: 'None',
      queryType: 'StaffListOrdersQueryParams',
      resType: 'StaffListOrdersRes',
    },
  },
  {
    id: 'staff_get_order',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Get Staff Order Detail',
    shortLabel: 'Get Order',
    method: 'GET',
    pathTemplate: '/api/v1/staff/orders/{id}',
    routeContract: ['GET', '/api/v1/staff/orders/{id}'],
    description: 'Fetches StaffOrderDetail by orderId or ticketCode.',
    authPolicy: 'staff',
    hasBody: false,
    hasOrderIdParam: true,
    guardHint: 'Requires Staff Bearer token. Accepts orderId or ticketCode.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'None', resType: 'StaffGetOrderRes' },
  },
  {
    id: 'staff_get_order_photo',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Get Staff Order Photo',
    shortLabel: 'Order Photo',
    method: 'GET',
    pathTemplate: '/api/v1/staff/orders/{id}/photo',
    routeContract: ['GET', '/api/v1/staff/orders/{id}/photo'],
    description: 'Fetches customer screenshot and/or proof-of-delivery photo for an order.',
    authPolicy: 'staff',
    hasBody: false,
    hasOrderIdParam: true,
    guardHint: 'Optional query param ?type=all|screenshot|proof.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'photoType', label: 'type', section: 'query', kind: 'select', options: PHOTO_TYPE_OPTIONS, mono: true },
    ],
    contractSummary: {
      reqType: 'None',
      queryType: 'StaffGetOrderPhotoQueryParams',
      resType: 'StaffGetOrderPhotoRes',
    },
  },
  {
    id: 'staff_activate_order',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Activate Order (Cash In)',
    shortLabel: 'Activate',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/activate',
    routeContract: ['POST', '/api/v1/staff/orders/{id}/activate'],
    description: 'Records counter cash deposit, calculates change, and moves PAYMENT_REQUIRED -> AWAITING_PARCEL.',
    authPolicy: 'staff',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === PAYMENT_REQUIRED and amountReceived >= order.price.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'amountReceived', label: 'amountReceived', section: 'body', kind: 'number', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffActivateOrderReq', resType: 'StaffActivateOrderRes' },
  },
  {
    id: 'staff_pay_courier',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Pay Courier COD',
    shortLabel: 'Pay Courier',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/make-claimable/pay',
    routeContract: ['POST', '/api/v1/staff/orders/{id}/make-claimable/pay'],
    description: 'Marks courier COD disbursement as paid (courierPaid = true).',
    authPolicy: 'staff',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === AWAITING_PARCEL and courierPaid === false.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffPayCourierReq ({})', resType: 'StaffPayCourierRes' },
  },
  {
    id: 'staff_attach_photo',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Attach Proof Photo',
    shortLabel: 'Attach Photo',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/make-claimable/attach-photo',
    routeContract: ['POST', '/api/v1/staff/orders/{id}/make-claimable/attach-photo'],
    description: 'Attaches proofImageUrl and transitions AWAITING_PARCEL -> READY_TO_CLAIM.',
    authPolicy: 'staff',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === AWAITING_PARCEL and courierPaid === true.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
      { key: 'proofImageUrl', label: 'imageUrl', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffAttachPhotoReq', resType: 'StaffAttachPhotoRes' },
  },
  {
    id: 'staff_claim_order',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Release / Claim Order',
    shortLabel: 'Release Claim',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/claim',
    routeContract: ['POST', '/api/v1/staff/orders/{id}/claim'],
    description: 'Completes parcel handover and transitions READY_TO_CLAIM -> CLAIMED.',
    authPolicy: 'staff',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires status === READY_TO_CLAIM and active customer claim window.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffClaimOrderReq ({})', resType: 'StaffClaimOrderRes' },
  },
  {
    id: 'staff_refund_order',
    domain: 'staff',
    group: 'Staff Orders',
    title: 'Release Cash Refund',
    shortLabel: 'Release Refund',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/refund',
    routeContract: ['POST', '/api/v1/staff/orders/{id}/refund'],
    description: 'Releases counter cash refund and transitions CANCELLED -> REFUNDED.',
    authPolicy: 'staff',
    hasBody: true,
    hasOrderIdParam: true,
    guardHint: 'Requires active customer refund pass (isRefundActive === true) on CANCELLED order.',
    fields: [
      { key: 'orderId', label: 'id (orderId or ticketCode)', section: 'path', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'StaffRefundOrderReq ({})', resType: 'StaffRefundOrderRes' },
  },

  // ── Notifications ──────────────────────────────────────────────
  {
    id: 'notification_upload_token',
    domain: 'shared',
    group: 'Notifications',
    title: 'Upload FCM Push Token',
    shortLabel: 'Upload FCM Token',
    method: 'POST',
    pathTemplate: '/api/v1/notification/upload-token',
    routeContract: ['POST', '/api/v1/notification/upload-token'],
    description: 'Registers single active FCM device token for the authenticated user.',
    authPolicy: 'any_bearer',
    hasBody: true,
    guardHint: 'Accepts Customer or Staff Bearer token. Replaces prior device token for that user.',
    fields: [
      { key: 'fcmToken', label: 'fcmToken', section: 'body', kind: 'text', required: true, mono: true },
    ],
    contractSummary: { reqType: 'NotificationUploadTokenReq', resType: 'NotificationUploadTokenRes' },
  },
  {
    id: 'notification_delete_token',
    domain: 'shared',
    group: 'Notifications',
    title: 'Delete FCM Push Token',
    shortLabel: 'Delete FCM Token',
    method: 'DELETE',
    pathTemplate: '/api/v1/notification/token',
    routeContract: ['DELETE', '/api/v1/notification/token'],
    description: 'Removes a specific FCM token (or all tokens for the user if fcmToken omitted).',
    authPolicy: 'any_bearer',
    hasBody: true,
    guardHint: 'Accepts Customer or Staff Bearer token. Body fcmToken is optional.',
    fields: [
      { key: 'fcmToken', label: 'fcmToken (optional)', section: 'body', kind: 'text', placeholder: 'Leave blank to clear all tokens', mono: true },
    ],
    contractSummary: { reqType: 'NotificationDeleteTokenReq', resType: 'NotificationDeleteTokenRes' },
  },

  // ── Realtime ───────────────────────────────────────────────────
  {
    id: 'realtime_token',
    domain: 'shared',
    group: 'Realtime',
    title: 'Issue Realtime Channel Token',
    shortLabel: 'Realtime Token',
    method: 'POST',
    pathTemplate: '/api/v1/realtime/token',
    routeContract: ['POST', '/api/v1/realtime/token'],
    description: 'Mints a scoped Supabase Realtime JWT for customer:<id> or staff:orders channel.',
    authPolicy: 'any_bearer',
    hasBody: true,
    guardHint: 'Accepts Customer or Staff Bearer token. Auto-captures token & channel.',
    fields: [],
    contractSummary: { reqType: 'None ({})', resType: 'RealtimeTokenRes' },
  },
];

export function getPostmanEndpointSpec(id: PostmanEndpointId): PostmanEndpointSpec {
  return POSTMAN_V1_ENDPOINTS.find((ep) => ep.id === id) || POSTMAN_V1_ENDPOINTS[0];
}

export function getDefaultAuthActor(spec: PostmanEndpointSpec): AuthActor {
  switch (spec.authPolicy) {
    case 'customer':
      return 'customer';
    case 'staff':
      return 'staff';
    case 'any_bearer':
      return 'customer';
    case 'public':
    default:
      return 'none';
  }
}

export function buildPostmanUrl(
  spec: PostmanEndpointSpec,
  baseUrl: string,
  form: PostmanFormState,
  apiPrefix: string = '/api/v1'
): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanPrefix = apiPrefix.trim().replace(/\/+$/, '');

  let routeSuffix = spec.pathTemplate.replace(/^\/?api(\/v\d+)?/, '');
  if (!routeSuffix.startsWith('/')) {
    routeSuffix = `/${routeSuffix}`;
  }

  let path = `${cleanPrefix}${routeSuffix}`;

  if (spec.hasOrderIdParam) {
    const resolvedId = encodeURIComponent(form.orderId.trim() || '{id}');
    path = path.replace('{id}', resolvedId);
  }

  const params = new URLSearchParams();

  if (spec.id === 'customer_list_orders') {
    if (form.customerStatusFilter && form.customerStatusFilter !== 'ALL') {
      params.set('type', form.customerStatusFilter);
    }
    if (form.limit.trim()) params.set('limit', form.limit.trim());
    if (form.offset.trim()) params.set('offset', form.offset.trim());
  } else if (spec.id === 'staff_list_orders') {
    if (form.staffStatusFilter && form.staffStatusFilter !== 'ALL') {
      params.set('status', form.staffStatusFilter);
    }
    if (form.search.trim()) params.set('search', form.search.trim());
    if (form.refundEligible === 'true') params.set('refundEligible', 'true');
    if (form.limit.trim()) params.set('limit', form.limit.trim());
    if (form.offset.trim()) params.set('offset', form.offset.trim());
  } else if (spec.id === 'customer_get_order_photo' || spec.id === 'staff_get_order_photo') {
    if (form.photoType && form.photoType !== 'all') {
      params.set('type', form.photoType);
    }
  }

  const qs = params.toString();
  if (qs) {
    path = `${path}?${qs}`;
  }

  return `${cleanBase}${path}`;
}

export function buildPostmanBody(
  endpointId: PostmanEndpointId,
  form: PostmanFormState
): Record<string, unknown> | null {
  switch (endpointId) {
    case 'customer_login':
      return { email: form.email, password: form.password };
    case 'customer_register':
      return {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        ...(form.middleInitial.trim() ? { middleInitial: form.middleInitial.trim() } : {}),
        phoneNumber: form.phoneNumber,
      };
    case 'customer_send_email_verification':
    case 'customer_forgot_password':
    case 'customer_forgot_mpin':
      return { email: form.email };
    case 'customer_verify_email':
    case 'customer_forgot_password_verify':
    case 'customer_forgot_mpin_verify':
      return { email: form.email, code: form.otpCode };
    case 'customer_forgot_password_reset':
      return { resetToken: form.resetToken, newPassword: form.newPassword };
    case 'customer_forgot_mpin_reset':
      return { resetToken: form.resetToken, newMpin: form.newMpin };
    case 'customer_create_mpin':
    case 'customer_verify_mpin':
      return { preAuthToken: form.preAuthToken, mpin: form.mpin };
    case 'customer_refresh':
      return { refreshToken: form.refreshToken, mpin: form.mpin };
    case 'customer_initialize_order':
      return { imageUrl: form.initImageUrl };
    case 'customer_update_order': {
      const parsedPrice = Number(form.price);
      return {
        order: {
          trackingId: form.trackingId,
          productName: form.productName,
          recipientName: form.recipientName,
          price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        },
      };
    }
    case 'customer_cancel_order':
    case 'customer_refund_order': {
      const payload: Record<string, unknown> = {};
      if (form.reasonCode.trim()) payload.reasonCode = form.reasonCode.trim();
      if (form.reason.trim()) payload.reason = form.reason.trim();
      return payload;
    }
    case 'customer_claim_order':
    case 'staff_pay_courier':
    case 'staff_claim_order':
    case 'staff_refund_order':
    case 'realtime_token':
      return {};
    case 'staff_login':
      return { username: form.staffUsername, password: form.staffPassword };
    case 'staff_activate_order': {
      const parsed = Number(form.amountReceived);
      return { amountReceived: Number.isFinite(parsed) ? parsed : 0 };
    }
    case 'staff_attach_photo':
      return { imageUrl: form.proofImageUrl };
    case 'notification_upload_token':
      return { fcmToken: form.fcmToken };
    case 'notification_delete_token':
      return form.fcmToken.trim() ? { fcmToken: form.fcmToken.trim() } : {};
    case 'customer_profile':
    case 'customer_list_orders':
    case 'customer_get_order':
    case 'customer_get_order_photo':
    case 'staff_list_orders':
    case 'staff_get_order':
    case 'staff_get_order_photo':
    default:
      return null;
  }
}

export function buildCurlSnippet(
  method: string,
  url: string,
  headers: Record<string, string>,
  bodyText?: string
): string {
  const effectiveUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const lines: string[] = [`curl -X ${method} "${effectiveUrl}"`];
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`  -H "${k}: ${v}"`);
  }
  if (method !== 'GET' && bodyText && bodyText.trim().length > 0) {
    const escaped = bodyText.replace(/'/g, "'\\''");
    lines.push(`  -d '${escaped}'`);
  }
  return lines.join(' \\\n');
}
