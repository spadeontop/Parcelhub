import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  CustomerV1Workbench,
  CUSTOMER_V1_ENDPOINTS,
  buildCustomerEndpointUrl,
  buildCustomerEndpointBody,
  getCustomerEndpointSpec,
} from '../customer-v1-prototype';

const MOCK_CUSTOMER_ORDERS = [
  {
    id: 'ORD-C1-PEND-01',
    ticketCode: '101-111',
    trackingId: 'PH-C1-001',
    productName: 'Logitech MX Master 3S',
    status: 'PENDING_INITIALIZATION',
    timestamp: '2026-10-18T08:00:00Z',
    isClaimActive: false,
  },
  {
    id: 'ORD-C1-RDY-01',
    ticketCode: '101-401',
    trackingId: 'PH-C1-007',
    productName: 'Sony WH-1000XM5',
    status: 'READY_TO_CLAIM',
    timestamp: '2026-10-17T11:00:00Z',
    isClaimActive: false,
  },
];

function createCustomerFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();

    const makeJsonRes = (data: unknown, status = 200, statusText = 'OK') =>
      new Response(JSON.stringify(data), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
      });

    if (url.endsWith('/api/v1/customer/login') && method === 'POST') {
      return makeJsonRes({
        statusMessage: 'Credentials verified',
        preAuthToken: 'mock-preauth-token-999',
      });
    }

    if (url.endsWith('/api/v1/customer/mpin') && method === 'POST') {
      return makeJsonRes({
        statusMessage: 'MPIN verified',
        authToken: 'mock-cust-auth-token-777',
        refreshToken: 'mock-cust-refresh-token-888',
        customer: {
          id: 'CST-001',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+639123456789',
        },
      });
    }

    if (url.endsWith('/api/v1/customer/profile') && method === 'GET') {
      return makeJsonRes({
        statusMessage: 'Profile retrieved successfully',
        customer: {
          id: 'CST-001',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+639123456789',
        },
      });
    }

    if (url.includes('/api/v1/customer/orders?') || url.endsWith('/api/v1/customer/orders')) {
      return makeJsonRes({
        statusMessage: 'Orders retrieved',
        orders: MOCK_CUSTOMER_ORDERS,
      });
    }

    if (url.endsWith('/api/v1/customer/orders/initialize') && method === 'POST') {
      return makeJsonRes(
        {
          statusMessage: 'Order initialized successfully',
          orderId: 'ORD-NEW-999',
          ticketCode: '9A2-1B3',
        },
        201,
        'Created'
      );
    }

    if (url.endsWith('/claim') && method === 'POST') {
      return makeJsonRes({
        statusMessage: 'Order claim initiated',
        claimInitiatedAt: '2026-11-12T10:00:00Z',
        claimExpiresAt: '2026-11-12T10:05:00Z',
        durationMinutes: 5,
      });
    }

    if (url.includes('/api/v1/customer/orders/') && method === 'PUT') {
      return makeJsonRes({ statusMessage: 'Order updated successfully' });
    }

    if (url.includes('/api/v1/customer/orders/') && method === 'GET') {
      return makeJsonRes({
        statusMessage: 'Order details retrieved',
        order: {
          ...MOCK_CUSTOMER_ORDERS[0],
          recipientName: 'John Doe',
          price: 0,
          change: 0,
          statusTimeline: [
            { status: 'PENDING_INITIALIZATION', timestamp: '2026-10-18T08:00:00Z' },
          ],
        },
      });
    }

    return makeJsonRes({ success: false, error: 'Not Found', message: 'Route not found' }, 404, 'Not Found');
  });
}

describe('Customer v1 Prototype (Postman Debugger + Complete Customer UI)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defines all 11 /api/v1/customer endpoints and builds URLs & bodies properly', () => {
    expect(CUSTOMER_V1_ENDPOINTS.map((e) => e.id)).toEqual([
      'login',
      'register',
      'verify_mpin',
      'create_mpin',
      'refresh_token',
      'get_profile',
      'list_orders',
      'initialize_order',
      'get_order',
      'update_order',
      'claim_order',
    ]);

    const form = {
      email: 'user@example.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
      middleInitial: 'D',
      phoneNumber: '+639123456789',
      mpin: '1234',
      preAuthToken: 'pre-123',
      refreshToken: 'ref-456',
      orderId: 'ORD-C1-PEND-01',
      typeFilter: 'READY_TO_CLAIM',
      limit: '10',
      offset: '0',
      initImageUrl: 'https://storage.parcelhub.com/init/sample.jpg',
      trackingId: 'PH-C1-001',
      productName: 'Mouse',
      recipientName: 'John Doe',
      price: '480',
    };

    expect(buildCustomerEndpointUrl(getCustomerEndpointSpec('list_orders'), '', form)).toBe(
      '/api/v1/customer/orders?type=READY_TO_CLAIM&limit=10&offset=0'
    );
    expect(buildCustomerEndpointUrl(getCustomerEndpointSpec('update_order'), 'http://localhost:3000', form)).toBe(
      'http://localhost:3000/api/v1/customer/orders/ORD-C1-PEND-01'
    );
    expect(buildCustomerEndpointBody('update_order', form)).toEqual({
      order: {
        trackingId: 'PH-C1-001',
        productName: 'Mouse',
        recipientName: 'John Doe',
        price: 480,
      },
    });
  });

  it('runs 2-step Login + MPIN token capture, keeps {id} consistent, and updates on Target Order click', async () => {
    const fetchMock = createCustomerFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<CustomerV1Workbench initialMode="debug" />);

    // Click 1-Click Full Seed Login (chains POST /login -> POST /mpin -> GET /orders)
    fireEvent.click(screen.getByRole('button', { name: /1-Click Full Seed Login/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/customer/login',
        expect.objectContaining({ method: 'POST' })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/customer/mpin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ preAuthToken: 'mock-preauth-token-999', mpin: '1234' }, null, 2),
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/customer/orders',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-cust-auth-token-777',
          }),
        })
      );
    });

    // Switch to Confirm / Update Order (PUT) — {id} remains ORD-C1-PEND-01
    fireEvent.click(screen.getByRole('button', { name: /Select Confirm \/ Update Order/i }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/customer/orders/ORD-C1-PEND-01'
    );

    // Switch to Claim Order — {id} stays consistent until explicitly clicked
    fireEvent.click(screen.getByRole('button', { name: /Select Initiate Pickup Claim/i }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/customer/orders/ORD-C1-PEND-01/claim'
    );

    // Explicitly click ORD-C1-RDY-01 in Target Order list
    fireEvent.click(screen.getByRole('button', { name: 'Target order ORD-C1-RDY-01' }));
    expect((screen.getByLabelText('Resolved Request URL') as HTMLInputElement).value).toBe(
      '/api/v1/customer/orders/ORD-C1-RDY-01/claim'
    );

    // Send claim request
    fireEvent.click(screen.getByRole('button', { name: /Initiate 5m Claim/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/customer/orders/ORD-C1-RDY-01/claim',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('toggles seamlessly between Debugging UI and Real UI while sharing orders and logs', async () => {
    const fetchMock = createCustomerFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<CustomerV1Workbench initialMode="debug" />);

    fireEvent.click(screen.getByRole('button', { name: /1-Click Full Seed Login/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/customer/orders', expect.anything());
    });

    // Switch to Real UI
    fireEvent.click(screen.getByRole('button', { name: /Real UI/i }));
    await waitFor(() => {
      expect(screen.getByText(/ParcelHub Customer Portal \(Live API v1\)/i)).toBeInTheDocument();
    });

    // Click order card in Real UI
    fireEvent.click(screen.getByRole('button', { name: /View order details for ORD-C1-PEND-01/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/customer/orders/ORD-C1-PEND-01',
        expect.objectContaining({ method: 'GET' })
      );
    });

    // Jump back to Debugging UI
    fireEvent.click(screen.getByRole('button', { name: /Inspect in Debugging UI/i }));
    await waitFor(() => {
      expect(screen.getByText('/api/v1/customer Collection')).toBeInTheDocument();
    });
  });

  it('supports hardcoded presets (localhost, vercel) and allows adding/removing custom presets via +', async () => {
    const fetchMock = createCustomerFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<CustomerV1Workbench initialMode="debug" />);

    const select = screen.getByLabelText(/Customer Backend Base URL Preset/i) as HTMLSelectElement;

    // Verify hardcoded presets exist
    expect(screen.getByRole('option', { name: /Vite Proxy \(\/api\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /http:\/\/localhost:3000/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /https:\/\/parcelhub-spade\.vercel\.app/i })).toBeInTheDocument();

    // Select Vercel preset
    fireEvent.change(select, { target: { value: 'https://parcelhub-spade.vercel.app' } });
    expect(select.value).toBe('https://parcelhub-spade.vercel.app');

    // Click '+' to open inline add preset input
    const plusButton = screen.getByRole('button', { name: /Add custom preset/i });
    fireEvent.click(plusButton);

    const input = screen.getByPlaceholderText(/e\.g\. localhost:3000 or URL/i);
    expect(input).toBeInTheDocument();

    // Type raw URL without protocol and trailing slash
    fireEvent.change(input, { target: { value: '192.168.1.50:4000/' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Preset/i }));

    // Should auto-normalize to http://192.168.1.50:4000 and select it
    await waitFor(() => {
      const updatedSelect = screen.getByLabelText(/Customer Backend Base URL Preset/i) as HTMLSelectElement;
      expect(updatedSelect.value).toBe('http://192.168.1.50:4000');
      expect(screen.getByRole('option', { name: /http:\/\/192\.168\.1\.50:4000 \(Custom\)/i })).toBeInTheDocument();
    });

    // Check localStorage persistence
    const storedPresets = JSON.parse(localStorage.getItem('ph_v1_cust_custom_presets') || '[]');
    expect(storedPresets).toContain('http://192.168.1.50:4000');

    // Delete custom preset via '✕' button
    const deleteButton = screen.getByRole('button', { name: /Remove custom preset/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const resetSelect = screen.getByLabelText(/Customer Backend Base URL Preset/i) as HTMLSelectElement;
      expect(resetSelect.value).toBe('');
    });

    const storedPresetsAfterDelete = JSON.parse(localStorage.getItem('ph_v1_cust_custom_presets') || '[]');
    expect(storedPresetsAfterDelete).not.toContain('http://192.168.1.50:4000');
  });

  it('decouples route and supports hardcoded API prefixes (/api, /api/v1) and custom prefixes via +', async () => {
    const fetchMock = createCustomerFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(<CustomerV1Workbench initialMode="debug" />);

    // Check buildCustomerEndpointUrl decoupling
    const form = {
      email: 'user@example.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
      middleInitial: 'D',
      phoneNumber: '+639123456789',
      mpin: '1234',
      preAuthToken: 'pre-123',
      refreshToken: 'ref-456',
      orderId: 'ORD-C1-PEND-01',
      typeFilter: 'ALL',
      limit: '20',
      offset: '0',
      initImageUrl: 'https://storage.parcelhub.com/init/sample.jpg',
      trackingId: 'PH-C1-001',
      productName: 'Mouse',
      recipientName: 'John Doe',
      price: '480',
    };

    const loginSpec = getCustomerEndpointSpec('login');
    // Default prefix is /api/v1
    expect(buildCustomerEndpointUrl(loginSpec, 'http://localhost:3000', form)).toBe(
      'http://localhost:3000/api/v1/customer/login'
    );
    // Explicit /api prefix decoupled
    expect(buildCustomerEndpointUrl(loginSpec, 'http://localhost:3000', form, '/api')).toBe(
      'http://localhost:3000/api/customer/login'
    );

    // Verify Prefix select element
    const prefixSelect = screen.getByLabelText(/Customer Backend API Prefix Preset/i) as HTMLSelectElement;
    expect(prefixSelect.value).toBe('/api/v1');

    // Switch prefix to /api
    fireEvent.change(prefixSelect, { target: { value: '/api' } });
    expect(prefixSelect.value).toBe('/api');

    // Brand badge updates to /api/customer
    expect(screen.getByText('/api/customer')).toBeInTheDocument();

    // Click '+' to add custom prefix
    const addPrefixBtn = screen.getByRole('button', { name: /Add custom prefix/i });
    fireEvent.click(addPrefixBtn);

    const prefixInput = screen.getByPlaceholderText(/e\.g\. \/api\/v2 or \/custom/i);
    expect(prefixInput).toBeInTheDocument();

    // Enter prefix without leading slash and with trailing slash
    fireEvent.change(prefixInput, { target: { value: 'custom-api/' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Prefix/i }));

    // Should normalize to /custom-api and select it
    await waitFor(() => {
      const updatedPrefixSelect = screen.getByLabelText(/Customer Backend API Prefix Preset/i) as HTMLSelectElement;
      expect(updatedPrefixSelect.value).toBe('/custom-api');
      expect(screen.getByRole('option', { name: /\/custom-api \(Custom\)/i })).toBeInTheDocument();
    });

    // Check localStorage persistence
    const storedPrefixes = JSON.parse(localStorage.getItem('ph_v1_cust_prefix_presets') || '[]');
    expect(storedPrefixes).toContain('/custom-api');

    // Delete custom prefix
    const deletePrefixBtn = screen.getByRole('button', { name: /Remove custom prefix/i });
    fireEvent.click(deletePrefixBtn);

    await waitFor(() => {
      const resetPrefixSelect = screen.getByLabelText(/Customer Backend API Prefix Preset/i) as HTMLSelectElement;
      expect(resetPrefixSelect.value).toBe('/api/v1');
    });

    const storedPrefixesAfterDelete = JSON.parse(localStorage.getItem('ph_v1_cust_prefix_presets') || '[]');
    expect(storedPrefixesAfterDelete).not.toContain('/custom-api');
  });
});
