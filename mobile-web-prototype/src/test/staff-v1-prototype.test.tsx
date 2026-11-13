import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  StaffV1Workbench,
  STAFF_V1_ENDPOINTS,
  buildEndpointUrl,
  buildEndpointBody,
  getEndpointSpec,
} from '../staff-v1-prototype';

const MOCK_ORDERS = [
  {
    id: 'ORD-C1-PAY-01',
    ticketCode: '101-201',
    trackingId: 'PH-C1-003',
    customer: 'John Doe',
    amountToPay: 480,
    amountReceived: 0,
    change: 0,
    timestamp: '2026-10-18T09:00:00Z',
    status: 'PAYMENT_REQUIRED',
    statusMessage: 'Awaiting customer cash deposit',
    courierPaid: false,
    isClaimActive: false,
    claimRemainingSeconds: 0,
  },
  {
    id: 'ORD-C1-AWT-01',
    ticketCode: '101-301',
    trackingId: 'PH-C1-005',
    customer: 'John Doe',
    amountToPay: 2400,
    amountReceived: 2500,
    change: 100,
    timestamp: '2026-10-18T09:00:00Z',
    status: 'AWAITING_PARCEL',
    statusMessage: 'Awaiting parcel arrival',
    courierPaid: false,
    isClaimActive: false,
    claimRemainingSeconds: 0,
  },
  {
    id: 'ORD-C1-RDY-01',
    ticketCode: '101-401',
    trackingId: 'PH-C1-007',
    customer: 'John Doe',
    amountToPay: 18990,
    amountReceived: 19000,
    change: 10,
    timestamp: '2026-10-17T11:00:00Z',
    status: 'READY_TO_CLAIM',
    statusMessage: 'Ready for customer pickup',
    courierPaid: true,
    isClaimActive: true,
    claimRemainingSeconds: 240,
  },
];

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();

    const makeJsonRes = (data: unknown, status = 200, statusText = 'OK') =>
      new Response(JSON.stringify(data), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
      });

    if (url.endsWith('/api/v1/staff/login') && method === 'POST') {
      return makeJsonRes({
        statusMessage: 'Staff login successful',
        authToken: 'mock-staff-jwt-token-12345',
        refreshToken: 'mock-staff-refresh-token-67890',
      });
    }

    if (url.includes('/api/v1/staff/orders?') || url.endsWith('/api/v1/staff/orders')) {
      return makeJsonRes({
        orders: MOCK_ORDERS,
        pagination: { totalCount: MOCK_ORDERS.length, limit: 20, offset: 0, hasMore: false },
      });
    }

    if (url.endsWith('/activate') && method === 'POST') {
      const body = JSON.parse(String(init?.body || '{}'));
      return makeJsonRes({
        statusMessage: 'Order activated and awaiting parcel delivery',
        change: Math.max(0, Number(body.amountReceived || 0) - 480),
      });
    }

    if (url.endsWith('/make-claimable/pay') && method === 'POST') {
      return makeJsonRes({ statusMessage: 'Courier payment recorded' });
    }

    if (url.endsWith('/make-claimable/attach-photo') && method === 'POST') {
      const body = JSON.parse(String(init?.body || '{}'));
      return makeJsonRes({
        statusMessage: 'Proof photo attached. Order is now claimable.',
        imageUrl: body.imageUrl,
      });
    }

    if (url.endsWith('/claim') && method === 'POST') {
      return makeJsonRes({ statusMessage: 'Order successfully claimed' });
    }

    if (url.includes('/api/v1/staff/orders/') && method === 'GET') {
      return makeJsonRes({
        ...MOCK_ORDERS[0],
        orderId: MOCK_ORDERS[0].id,
      });
    }

    return makeJsonRes({ success: false, error: 'Not Found', message: 'Route not found' }, 404, 'Not Found');
  });
}

describe('Staff v1 Prototype (Postman Debugger + Real UI Toggle)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defines all 7 /api/v1/staff endpoints and builds URLs & JSON bodies automatically', () => {
    expect(STAFF_V1_ENDPOINTS.map((e) => e.id)).toEqual([
      'login',
      'list_orders',
      'get_order',
      'activate_order',
      'pay_courier',
      'attach_photo',
      'claim_order',
    ]);

    const form = {
      username: 'staff',
      password: 'string',
      orderId: 'ORD-C1-PAY-01',
      statusFilter: 'PAYMENT_REQUIRED',
      limit: '10',
      offset: '0',
      amountReceived: '500',
      imageUrl: 'https://storage.parcelhub.com/proof/sample.jpg',
    };

    expect(buildEndpointUrl(getEndpointSpec('list_orders'), '', form)).toBe(
      '/api/v1/staff/orders?status=PAYMENT_REQUIRED&limit=10&offset=0'
    );
    expect(buildEndpointUrl(getEndpointSpec('activate_order'), 'http://localhost:3000', form)).toBe(
      'http://localhost:3000/api/v1/staff/orders/ORD-C1-PAY-01/activate'
    );
    expect(buildEndpointBody('activate_order', form)).toEqual({ amountReceived: 500 });
    expect(buildEndpointBody('pay_courier', form)).toEqual({});
    expect(buildEndpointBody('attach_photo', form)).toEqual({
      imageUrl: 'https://storage.parcelhub.com/proof/sample.jpg',
    });
  });

  it('logs in from Debugging UI, auto-captures Bearer token, sends Activate & Pay Courier without copy-paste', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffV1Workbench initialMode="debug" />);

    // Verify zero-copy-paste URL is already resolved for login
    const urlInput = screen.getByLabelText('Resolved Request URL') as HTMLInputElement;
    expect(urlInput.value).toBe('/api/v1/staff/login');

    // Click Send Request for Login
    fireEvent.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Bearer Active')).toBeInTheDocument();
    });

    // Should have called login and auto-synced orders
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/staff/login',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/staff/orders',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-staff-jwt-token-12345',
        }),
      })
    );

    // Switch to Activate Order endpoint — automatically selects PAYMENT_REQUIRED order ORD-C1-PAY-01
    fireEvent.click(screen.getByRole('button', { name: /Select Activate Order/i }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/staff/orders/ORD-C1-PAY-01/activate'
    );

    // Use +₱100 preset chip (480 + 100 = 580) without typing JSON
    fireEvent.click(screen.getByRole('button', { name: /\+₱100 \(₱580\)/i }));
    // Verify simulated action button "Receive Cash & Activate" works in addition to "Send Request"
    expect(screen.getAllByRole('button', { name: /Receive Cash & Activate/i })[0]).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/staff/orders/ORD-C1-PAY-01/activate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amountReceived: 580 }, null, 2),
        })
      );
    });

    // Switch to Pay Courier — user requirement: Selected path {id} stays consistent across collection switches
    fireEvent.click(screen.getByRole('button', { name: /Select Pay Courier COD/i }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/staff/orders/ORD-C1-PAY-01/make-claimable/pay'
    );

    // Explicitly click target order in Target Order list (Live DB) to change {id}
    fireEvent.click(screen.getByText('ORD-C1-AWT-01'));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/staff/orders/ORD-C1-AWT-01/make-claimable/pay'
    );

    // Use the dedicated simulated button for courier payment
    const payCourierBtn = screen.getByRole('button', { name: 'Pay Courier COD' });
    fireEvent.click(payCourierBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/staff/orders/ORD-C1-AWT-01/make-claimable/pay',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Switch to Claim Order — {id} stays ORD-C1-AWT-01 until explicitly picked
    fireEvent.click(screen.getByRole('button', { name: /Select Claim \/ Release Order/i }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/staff/orders/ORD-C1-AWT-01/claim'
    );

    // Explicitly click READY_TO_CLAIM order ORD-C1-RDY-01 in Target Order list
    fireEvent.click(screen.getByText('ORD-C1-RDY-01'));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/staff/orders/ORD-C1-RDY-01/claim'
    );
    const releaseBtn = screen.getByRole('button', { name: /Release Parcel to Customer/i });
    expect(releaseBtn).toBeInTheDocument();
    fireEvent.click(releaseBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/staff/orders/ORD-C1-RDY-01/claim',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Verify Request and Response are visible at the same time
    expect(screen.getByText('REQUEST SENT')).toBeInTheDocument();
    expect(screen.getByText(/RESPONSE \(200\)/i)).toBeInTheDocument();
    expect(screen.getByText('Request Headers:')).toBeInTheDocument();
    expect(screen.getByText('Response Payload:')).toBeInTheDocument();
  });

  it('toggles between Debugging UI and Real UI while sharing auth token, live orders, and request logs', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffV1Workbench initialMode="debug" />);

    // Quick 1-click login in Debugging UI
    fireEvent.click(screen.getByRole('button', { name: /1-Click Seed Login/i }));

    await waitFor(() => {
      expect(screen.getByText('Bearer Active')).toBeInTheDocument();
    });

    // Toggle to Real UI
    fireEvent.click(screen.getByRole('button', { name: /Real UI/i }));

    await waitFor(() => {
      expect(screen.getByText(/Lily’s Hub Staff Terminal/i)).toBeInTheDocument();
    });

    // Real UI displays live orders from /api/v1/staff/orders (Unpaid tab active by default -> ORD-C1-PAY-01)
    expect(screen.getAllByText('ORD-C1-PAY-01')[0]).toBeInTheDocument();

    // Click order card in Real UI -> opens details modal and fires GET /api/v1/staff/orders/ORD-C1-PAY-01
    fireEvent.click(screen.getByRole('button', { name: /View complete details and actions for ORD-C1-PAY-01/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/staff/orders/ORD-C1-PAY-01',
        expect.objectContaining({ method: 'GET' })
      );
    });

    // Jump back to Debugging UI via "Inspect in Debugging UI →" link
    fireEvent.click(screen.getByRole('button', { name: /Inspect in Debugging UI/i }));

    await waitFor(() => {
      expect(screen.getByText('/api/v1/staff Collection')).toBeInTheDocument();
    });
  });

  it('supports decoupled route, hardcoded presets (localhost, vercel, /api, /api/v1) and custom additions via +', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<StaffV1Workbench initialMode="debug" />);

    // Check buildEndpointUrl decoupling
    const form = {
      username: 'staff',
      password: 'password',
      orderId: 'ORD-C1-PAY-01',
      statusFilter: 'ALL',
      limit: '20',
      offset: '0',
      amountReceived: '580',
      imageUrl: '',
    };

    const loginSpec = getEndpointSpec('login');
    // Default prefix is /api/v1
    expect(buildEndpointUrl(loginSpec, 'http://localhost:3000', form)).toBe(
      'http://localhost:3000/api/v1/staff/login'
    );
    // Explicit /api prefix decoupled
    expect(buildEndpointUrl(loginSpec, 'http://localhost:3000', form, '/api')).toBe(
      'http://localhost:3000/api/staff/login'
    );

    // 1. Target Host Presets
    const hostSelect = screen.getByLabelText(/Backend Base URL Preset/i) as HTMLSelectElement;
    expect(screen.getByRole('option', { name: /Vite Proxy \(\/api\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /http:\/\/localhost:3000/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /https:\/\/parcelhub-spade\.vercel\.app/i })).toBeInTheDocument();

    // Select Vercel preset
    fireEvent.change(hostSelect, { target: { value: 'https://parcelhub-spade.vercel.app' } });
    expect(hostSelect.value).toBe('https://parcelhub-spade.vercel.app');

    // Add custom host preset via '+'
    const addHostBtn = screen.getByRole('button', { name: /Add custom preset/i });
    fireEvent.click(addHostBtn);

    const hostInput = screen.getByPlaceholderText(/e\.g\. localhost:3000 or URL/i);
    expect(hostInput).toBeInTheDocument();

    fireEvent.change(hostInput, { target: { value: '192.168.1.75:5000/' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Preset/i }));

    await waitFor(() => {
      const updatedHostSelect = screen.getByLabelText(/Backend Base URL Preset/i) as HTMLSelectElement;
      expect(updatedHostSelect.value).toBe('http://192.168.1.75:5000');
    });

    const storedHosts = JSON.parse(localStorage.getItem('ph_v1_staff_custom_presets') || '[]');
    expect(storedHosts).toContain('http://192.168.1.75:5000');

    // Delete custom host preset via '✕'
    const deleteHostBtn = screen.getByRole('button', { name: /Remove custom preset/i });
    fireEvent.click(deleteHostBtn);

    await waitFor(() => {
      const resetHostSelect = screen.getByLabelText(/Backend Base URL Preset/i) as HTMLSelectElement;
      expect(resetHostSelect.value).toBe('');
    });

    // 2. API Prefix Presets
    const prefixSelect = screen.getByLabelText(/Staff Backend API Prefix Preset/i) as HTMLSelectElement;
    expect(prefixSelect.value).toBe('/api/v1');

    // Switch prefix to /api
    fireEvent.change(prefixSelect, { target: { value: '/api' } });
    expect(prefixSelect.value).toBe('/api');

    // Brand badge updates to /api/staff
    expect(screen.getByText('/api/staff')).toBeInTheDocument();

    // Add custom prefix via '+'
    const addPrefixBtn = screen.getByRole('button', { name: /Add custom prefix/i });
    fireEvent.click(addPrefixBtn);

    const prefixInput = screen.getByPlaceholderText(/e\.g\. \/api\/v2 or \/custom/i);
    expect(prefixInput).toBeInTheDocument();

    fireEvent.change(prefixInput, { target: { value: 'custom-staff/' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Prefix/i }));

    await waitFor(() => {
      const updatedPrefixSelect = screen.getByLabelText(/Staff Backend API Prefix Preset/i) as HTMLSelectElement;
      expect(updatedPrefixSelect.value).toBe('/custom-staff');
    });

    const storedPrefixes = JSON.parse(localStorage.getItem('ph_v1_staff_prefix_presets') || '[]');
    expect(storedPrefixes).toContain('/custom-staff');

    // Delete custom prefix
    const deletePrefixBtn = screen.getByRole('button', { name: /Remove custom prefix/i });
    fireEvent.click(deletePrefixBtn);

    await waitFor(() => {
      const resetPrefixSelect = screen.getByLabelText(/Staff Backend API Prefix Preset/i) as HTMLSelectElement;
      expect(resetPrefixSelect.value).toBe('/api/v1');
    });

    const storedPrefixesAfterDelete = JSON.parse(localStorage.getItem('ph_v1_staff_prefix_presets') || '[]');
    expect(storedPrefixesAfterDelete).not.toContain('/custom-staff');
  });
});
