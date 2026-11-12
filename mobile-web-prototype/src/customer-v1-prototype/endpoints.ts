import {
  ApiOrderStatus,
  CustomerEndpointId,
  CustomerEndpointSpec,
} from './types';

export const CUSTOMER_ORDER_STATUS_OPTIONS: readonly ApiOrderStatus[] = [
  'PENDING_INITIALIZATION',
  'PAYMENT_REQUIRED',
  'AWAITING_PARCEL',
  'READY_TO_CLAIM',
  'CLAIMED',
  'CANCELLED',
];

export interface SeededCustomerAccount {
  id: string;
  label: string;
  email: string;
  password: string;
  mpin: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  phoneNumber: string;
}

export const SEEDED_CUSTOMER_ACCOUNTS: readonly SeededCustomerAccount[] = [
  {
    id: 'CST-001',
    label: 'John Doe (Primary)',
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

export const SAMPLE_RECEIPT_IMAGES: ReadonlyArray<{ label: string; url: string }> = [
  {
    label: 'ParcelHub Init Sample',
    url: 'https://storage.parcelhub.com/init/sample-parcel-checkout.jpg',
  },
  {
    label: 'Local Receipt Asset',
    url: './assets/receipt_thumbnail.png',
  },
  {
    label: 'Shopee COD Screenshot',
    url: 'https://storage.parcelhub.com/init/shopee-cod-invoice.jpg',
  },
];

export const SEEDED_CUSTOMER_SAMPLE_ORDERS: ReadonlyArray<{
  id: string;
  ticketCode: string;
  status: ApiOrderStatus;
  price: number;
  label: string;
  trackingId: string;
  productName: string;
  recipientName: string;
}> = [
  {
    id: 'ORD-C1-PEND-01',
    ticketCode: '101-111',
    status: 'PENDING_INITIALIZATION',
    price: 0,
    label: 'Logitech MX Master 3S • PH-C1-001',
    trackingId: 'PH-C1-001',
    productName: 'Logitech MX Master 3S',
    recipientName: 'John Doe',
  },
  {
    id: 'ORD-C1-PAY-01',
    ticketCode: '101-201',
    status: 'PAYMENT_REQUIRED',
    price: 480,
    label: 'VXE R1 Wireless Mouse • PH-C1-003',
    trackingId: 'PH-C1-003',
    productName: 'VXE R1 Wireless Mouse',
    recipientName: 'John Doe',
  },
  {
    id: 'ORD-C1-AWT-01',
    ticketCode: '101-301',
    status: 'AWAITING_PARCEL',
    price: 2400,
    label: 'UGREEN 100W Charger • PH-C1-005',
    trackingId: 'PH-C1-005',
    productName: 'UGREEN 100W Charger',
    recipientName: 'John Doe',
  },
  {
    id: 'ORD-C1-RDY-01',
    ticketCode: '101-401',
    status: 'READY_TO_CLAIM',
    price: 18990,
    label: 'Sony WH-1000XM5 • PH-C1-007',
    trackingId: 'PH-C1-007',
    productName: 'Sony WH-1000XM5',
    recipientName: 'John Doe',
  },
  {
    id: 'ORD-C1-CLM-01',
    ticketCode: '101-501',
    status: 'CLAIMED',
    price: 4200,
    label: 'Keychron K2 Pro • PH-C1-009',
    trackingId: 'PH-C1-009',
    productName: 'Keychron K2 Pro',
    recipientName: 'John Doe',
  },
];

export const CUSTOMER_V1_ENDPOINTS: readonly CustomerEndpointSpec[] = [
  {
    id: 'login',
    group: 'Authentication',
    title: 'Customer Login',
    shortLabel: 'Login',
    method: 'POST',
    pathTemplate: '/api/v1/customer/login',
    description: 'Verifies email + password and issues a 5-min preAuthToken for MPIN verification.',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Public endpoint. Seeded accounts: user@example.com or maria@example.com (password: "password").',
  },
  {
    id: 'register',
    group: 'Authentication',
    title: 'Customer Register',
    shortLabel: 'Register',
    method: 'POST',
    pathTemplate: '/api/v1/customer/register',
    description: 'Creates a new customer account (409 if email exists) and issues a 5-min preAuthToken.',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Public endpoint. Next step after registration is POST /api/v1/customer/create-mpin.',
  },
  {
    id: 'verify_mpin',
    group: 'Authentication',
    title: 'Verify MPIN',
    shortLabel: 'Verify MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/mpin',
    description: 'Exchanges preAuthToken + 4-digit MPIN for HS256 authToken (15m) + refreshToken (30d).',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires valid 5m preAuthToken from Login. Seeded MPIN: "1234".',
  },
  {
    id: 'create_mpin',
    group: 'Authentication',
    title: 'Create MPIN',
    shortLabel: 'Create MPIN',
    method: 'POST',
    pathTemplate: '/api/v1/customer/create-mpin',
    description: 'Sets 4-digit MPIN after registration using preAuthToken and returns authToken + refreshToken.',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires preAuthToken and strictly 4 numeric digits for mpin.',
  },
  {
    id: 'refresh_token',
    group: 'Authentication',
    title: 'Refresh / Unlock Auth',
    shortLabel: 'Refresh',
    method: 'POST',
    pathTemplate: '/api/v1/customer/refresh',
    description: 'Unlocks session using 30d refreshToken + 4-digit MPIN to mint a fresh 15m authToken.',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires valid 30-day refreshToken from Verify/Create MPIN.',
  },
  {
    id: 'get_profile',
    group: 'Account',
    title: 'Get Customer Profile',
    shortLabel: 'Profile',
    method: 'GET',
    pathTemplate: '/api/v1/customer/profile',
    description: 'Fetches sanitized customer profile details for the authenticated Bearer token.',
    requiresAuth: true,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: false,
    guardHint: 'Requires Customer Bearer authToken.',
  },
  {
    id: 'list_orders',
    group: 'Orders',
    title: 'List Customer Orders',
    shortLabel: 'List Orders',
    method: 'GET',
    pathTemplate: '/api/v1/customer/orders',
    description: 'Lists orders owned by the authenticated customer with optional type, limit, and offset query params.',
    requiresAuth: true,
    hasOrderIdParam: false,
    hasQueryParams: true,
    hasBody: false,
    guardHint: 'Requires Customer Bearer authToken. Filter query param is named "type".',
  },
  {
    id: 'initialize_order',
    group: 'Orders',
    title: 'Initialize Order',
    shortLabel: 'Init Order',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/initialize',
    description: 'Creates a PENDING_INITIALIZATION draft order + order_screenshots record from imageUrl.',
    requiresAuth: true,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires Customer Bearer authToken and imageUrl. Fails with 403 if customer is blacklisted.',
  },
  {
    id: 'get_order',
    group: 'Orders',
    title: 'Get Order Details',
    shortLabel: 'Get Order',
    method: 'GET',
    pathTemplate: '/api/v1/customer/orders/{id}',
    description: 'Retrieves full order details & timeline by UUID (ORD-...) or ticketCode (e.g. 101-111).',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: false,
    guardHint: 'Requires Customer Bearer authToken and customer ownership of {id}.',
  },
  {
    id: 'update_order',
    group: 'Orders',
    title: 'Confirm / Update Order',
    shortLabel: 'Confirm (PUT)',
    method: 'PUT',
    pathTemplate: '/api/v1/customer/orders/{id}',
    description: 'Confirms a PENDING_INITIALIZATION draft order with tracking/product/price -> PAYMENT_REQUIRED.',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'One-shot transition: order must currently be PENDING_INITIALIZATION. Fails 409 if trackingId duplicates an active paid parcel.',
  },
  {
    id: 'claim_order',
    group: 'Orders',
    title: 'Initiate Pickup Claim',
    shortLabel: 'Claim',
    method: 'POST',
    pathTemplate: '/api/v1/customer/orders/{id}/claim',
    description: 'Starts the 5-minute claim pickup window so staff can verify QR/ticket and release parcel.',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Order status must be READY_TO_CLAIM.',
  },
];

export function getCustomerEndpointSpec(id: CustomerEndpointId): CustomerEndpointSpec {
  return CUSTOMER_V1_ENDPOINTS.find((e) => e.id === id) || CUSTOMER_V1_ENDPOINTS[0];
}

export interface CustomerEndpointFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  phoneNumber: string;
  mpin: string;
  preAuthToken: string;
  refreshToken: string;
  orderId: string;
  typeFilter: string;
  limit: string;
  offset: string;
  initImageUrl: string;
  trackingId: string;
  productName: string;
  recipientName: string;
  price: string;
}

export function buildCustomerEndpointUrl(
  spec: CustomerEndpointSpec,
  baseUrl: string,
  form: CustomerEndpointFormValues
): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  let path = spec.pathTemplate;

  if (spec.hasOrderIdParam) {
    const cleanId = encodeURIComponent((form.orderId || 'ORD-C1-PEND-01').trim());
    path = path.replace('{id}', cleanId);
  }

  if (spec.id === 'list_orders' && spec.hasQueryParams) {
    const params = new URLSearchParams();
    if (form.typeFilter && form.typeFilter !== 'ALL') {
      params.set('type', form.typeFilter);
    }
    if (form.limit.trim()) {
      params.set('limit', form.limit.trim());
    }
    if (form.offset.trim()) {
      params.set('offset', form.offset.trim());
    }
    const qs = params.toString();
    if (qs) path = `${path}?${qs}`;
  }

  return `${cleanBase}${path}`;
}

export function buildCustomerEndpointBody(
  endpointId: CustomerEndpointId,
  form: CustomerEndpointFormValues
): unknown | null {
  switch (endpointId) {
    case 'login':
      return {
        email: form.email,
        password: form.password,
      };
    case 'register':
      return {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        ...(form.middleInitial.trim() ? { middleInitial: form.middleInitial.trim() } : {}),
        phoneNumber: form.phoneNumber,
      };
    case 'verify_mpin':
    case 'create_mpin':
      return {
        preAuthToken: form.preAuthToken,
        mpin: form.mpin,
      };
    case 'refresh_token':
      return {
        refreshToken: form.refreshToken,
        mpin: form.mpin,
      };
    case 'initialize_order':
      return {
        imageUrl: form.initImageUrl,
      };
    case 'update_order': {
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
    case 'claim_order':
      return {};
    case 'get_profile':
    case 'list_orders':
    case 'get_order':
    default:
      return null;
  }
}

export function buildCustomerCurlSnippet(
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
  if (method !== 'GET' && bodyText !== undefined && bodyText !== '') {
    const compact = bodyText.replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
    lines.push(`  -d "${compact}"`);
  }
  return lines.join(' \\\n');
}
