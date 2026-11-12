import {
  ApiOrderStatus,
  StaffEndpointId,
  StaffEndpointSpec,
  StaffOrderSummary,
} from './types';

export const STAFF_ORDER_STATUS_OPTIONS: readonly ApiOrderStatus[] = [
  'PENDING_INITIALIZATION',
  'PAYMENT_REQUIRED',
  'AWAITING_PARCEL',
  'READY_TO_CLAIM',
  'CLAIMED',
  'CANCELLED',
];

export const SEEDED_STAFF_CREDENTIALS = {
  username: 'staff',
  password: 'string',
} as const;

export const SAMPLE_PROOF_IMAGES: ReadonlyArray<{ label: string; url: string }> = [
  {
    label: 'ParcelHub Storage Proof',
    url: 'https://storage.parcelhub.com/proof/sample-parcel.jpg',
  },
  {
    label: 'Local Receipt Asset',
    url: './assets/receipt_thumbnail.png',
  },
  {
    label: 'Delivered Pouch Photo',
    url: 'https://storage.parcelhub.com/proof/pouch-verified-01.jpg',
  },
];

export const SEEDED_SAMPLE_ORDERS: ReadonlyArray<{
  id: string;
  ticketCode: string;
  status: ApiOrderStatus;
  price: number;
  label: string;
}> = [
  { id: 'ORD-C1-PAY-01', ticketCode: '101-201', status: 'PAYMENT_REQUIRED', price: 480, label: 'VXE R1 Wireless Mouse' },
  { id: 'ORD-C1-PAY-02', ticketCode: '101-202', status: 'PAYMENT_REQUIRED', price: 1250, label: 'Baseus Power Bank' },
  { id: 'ORD-C1-AWT-01', ticketCode: '101-301', status: 'AWAITING_PARCEL', price: 2400, label: 'UGREEN 100W Charger (Unpaid Courier)' },
  { id: 'ORD-C1-AWT-02', ticketCode: '101-302', status: 'AWAITING_PARCEL', price: 2890, label: 'Edifier W820NB (Courier Paid)' },
  { id: 'ORD-C1-RDY-01', ticketCode: '101-401', status: 'READY_TO_CLAIM', price: 18990, label: 'Sony WH-1000XM5' },
  { id: 'ORD-C1-CLM-01', ticketCode: '101-501', status: 'CLAIMED', price: 4200, label: 'Keychron K2 Pro' },
];

export const STAFF_V1_ENDPOINTS: readonly StaffEndpointSpec[] = [
  {
    id: 'login',
    group: 'Authentication',
    title: 'Staff Login',
    shortLabel: 'Login',
    method: 'POST',
    pathTemplate: '/api/v1/staff/login',
    description: 'Authenticates staff credentials (username & password) and returns HS256 authToken + refreshToken.',
    requiresAuth: false,
    hasOrderIdParam: false,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Public endpoint. Seeded account: username="staff", password="string".',
  },
  {
    id: 'list_orders',
    group: 'Order Queries',
    title: 'List Staff Orders',
    shortLabel: 'List Orders',
    method: 'GET',
    pathTemplate: '/api/v1/staff/orders',
    description: 'Returns paginated orders sorted by timestamp desc with live claim countdowns and courier payout metadata.',
    requiresAuth: true,
    hasOrderIdParam: false,
    hasQueryParams: true,
    hasBody: false,
    guardHint: 'Requires Staff Bearer token. Optional query filters: status, limit (max 100), offset.',
  },
  {
    id: 'get_order',
    group: 'Order Queries',
    title: 'Get Order Detail',
    shortLabel: 'Get Order',
    method: 'GET',
    pathTemplate: '/api/v1/staff/orders/{id}',
    description: 'Fetches a single order by Order ID (e.g. ORD-C1-PAY-01) or human-facing Ticket Code (e.g. 101-201).',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: false,
    guardHint: 'Accepts either orders.id or orders.ticketCode in {id}.',
  },
  {
    id: 'activate_order',
    group: 'Order Lifecycle',
    title: 'Activate Order (Cash In)',
    shortLabel: 'Activate',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/activate',
    description: 'Records customer cash deposit at counter, computes change, and transitions PAYMENT_REQUIRED -> AWAITING_PARCEL.',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires status === PAYMENT_REQUIRED and amountReceived >= order.price.',
  },
  {
    id: 'pay_courier',
    group: 'Order Lifecycle',
    title: 'Pay Courier COD',
    shortLabel: 'Pay Courier',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/make-claimable/pay',
    description: 'Records that staff paid the delivery courier upon parcel arrival (courierPaid = true).',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires status === AWAITING_PARCEL and courierPaid === false.',
  },
  {
    id: 'attach_photo',
    group: 'Order Lifecycle',
    title: 'Attach Proof Photo',
    shortLabel: 'Attach Photo',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/make-claimable/attach-photo',
    description: 'Attaches proofImageUrl and transitions AWAITING_PARCEL -> READY_TO_CLAIM.',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires status === AWAITING_PARCEL and courierPaid === true.',
  },
  {
    id: 'claim_order',
    group: 'Order Lifecycle',
    title: 'Claim / Release Order',
    shortLabel: 'Claim',
    method: 'POST',
    pathTemplate: '/api/v1/staff/orders/{id}/claim',
    description: 'Completes customer handover and transitions READY_TO_CLAIM -> CLAIMED.',
    requiresAuth: true,
    hasOrderIdParam: true,
    hasQueryParams: false,
    hasBody: true,
    guardHint: 'Requires status === READY_TO_CLAIM and active customer claim window (isClaimActive === true).',
  },
];

export interface EndpointFormValues {
  username: string;
  password: string;
  orderId: string;
  statusFilter: string;
  limit: string;
  offset: string;
  amountReceived: string;
  imageUrl: string;
}

export function getEndpointSpec(id: StaffEndpointId): StaffEndpointSpec {
  return STAFF_V1_ENDPOINTS.find((ep) => ep.id === id) || STAFF_V1_ENDPOINTS[0];
}

export function buildEndpointUrl(
  spec: StaffEndpointSpec,
  baseUrl: string,
  form: EndpointFormValues
): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const resolvedId = encodeURIComponent(form.orderId.trim() || '{id}');
  let path = spec.pathTemplate.replace('{id}', resolvedId);

  if (spec.id === 'list_orders') {
    const params = new URLSearchParams();
    if (form.statusFilter && form.statusFilter !== 'ALL') {
      params.set('status', form.statusFilter);
    }
    if (form.limit.trim()) {
      params.set('limit', form.limit.trim());
    }
    if (form.offset.trim()) {
      params.set('offset', form.offset.trim());
    }
    const qs = params.toString();
    if (qs) {
      path = `${path}?${qs}`;
    }
  }

  return `${cleanBase}${path}`;
}

export function buildEndpointBody(
  endpointId: StaffEndpointId,
  form: EndpointFormValues
): Record<string, unknown> | null {
  switch (endpointId) {
    case 'login':
      return {
        username: form.username,
        password: form.password,
      };
    case 'activate_order': {
      const parsed = Number(form.amountReceived);
      return {
        amountReceived: form.amountReceived.trim() === '' || isNaN(parsed) ? 0 : parsed,
      };
    }
    case 'pay_courier':
    case 'claim_order':
      return {};
    case 'attach_photo':
      return {
        imageUrl: form.imageUrl,
      };
    case 'list_orders':
    case 'get_order':
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
  const displayUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url;
  const parts = [`curl -X ${method} "${displayUrl}"`];
  Object.entries(headers).forEach(([k, v]) => {
    parts.push(`  -H "${k}: ${v}"`);
  });
  if (bodyText && method !== 'GET') {
    parts.push(`  -d '${bodyText}'`);
  }
  return parts.join(' \\\n');
}

export function findPreferredOrderForEndpoint(
  endpointId: StaffEndpointId,
  orders: StaffOrderSummary[]
): StaffOrderSummary | undefined {
  if (orders.length === 0) return undefined;
  switch (endpointId) {
    case 'activate_order':
      return orders.find((o) => o.status === 'PAYMENT_REQUIRED') || orders[0];
    case 'pay_courier':
      return (
        orders.find((o) => o.status === 'AWAITING_PARCEL' && !o.courierPaid) ||
        orders.find((o) => o.status === 'AWAITING_PARCEL') ||
        orders[0]
      );
    case 'attach_photo':
      return (
        orders.find((o) => o.status === 'AWAITING_PARCEL' && o.courierPaid) ||
        orders.find((o) => o.status === 'AWAITING_PARCEL') ||
        orders[0]
      );
    case 'claim_order':
      return (
        orders.find((o) => o.status === 'READY_TO_CLAIM' && o.isClaimActive) ||
        orders.find((o) => o.status === 'READY_TO_CLAIM') ||
        orders[0]
      );
    default:
      return orders[0];
  }
}
