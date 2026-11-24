import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PostmanWorkbench,
  POSTMAN_V1_ENDPOINTS,
  buildPostmanUrl,
  buildPostmanBody,
  buildCurlSnippet,
  getPostmanEndpointSpec,
} from '../postman-v1';
import { createInitialFormState } from '../postman-v1/endpoints';

function mockFetchResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

describe('ParcelHub v1 Flat Minimalist Postman', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers all 34 implemented v1 endpoints from backend/app/types/v1/api.ts', () => {
    expect(POSTMAN_V1_ENDPOINTS).toHaveLength(34);
    const ids = new Set(POSTMAN_V1_ENDPOINTS.map((e) => e.id));
    expect(ids.size).toBe(34);

    // Verify newly added v1 endpoints are included
    const paths = POSTMAN_V1_ENDPOINTS.map((e) => `${e.method} ${e.pathTemplate}`);
    expect(paths).toContain('POST /api/v1/customer/email/send-verification');
    expect(paths).toContain('POST /api/v1/customer/email/verify');
    expect(paths).toContain('POST /api/v1/customer/forgot-password/reset');
    expect(paths).toContain('POST /api/v1/customer/forgot-mpin/reset');
    expect(paths).toContain('GET /api/v1/customer/orders/{id}/photo');
    expect(paths).toContain('POST /api/v1/customer/orders/{id}/cancel');
    expect(paths).toContain('POST /api/v1/customer/orders/{id}/refund');
    expect(paths).toContain('GET /api/v1/staff/orders/{id}/photo');
    expect(paths).toContain('POST /api/v1/staff/orders/{id}/refund');
    expect(paths).toContain('POST /api/v1/notification/upload-token');
    expect(paths).toContain('DELETE /api/v1/notification/token');
    expect(paths).toContain('POST /api/v1/realtime/token');
  });

  it('builds URLs and contract-accurate payloads for query, path, and body endpoints', () => {
    const form = {
      ...createInitialFormState(),
      orderId: 'ORD-C1-AWT-01',
      staffStatusFilter: 'CANCELLED',
      search: '101-301',
      refundEligible: 'true',
      photoType: 'proof',
      reasonCode: 'SELLER_CANCELLED',
      reason: 'Out of stock',
    };

    const staffListUrl = buildPostmanUrl(
      getPostmanEndpointSpec('staff_list_orders'),
      'http://localhost:3000',
      form,
      '/api/v1'
    );
    expect(staffListUrl).toBe(
      'http://localhost:3000/api/v1/staff/orders?status=CANCELLED&search=101-301&refundEligible=true&limit=20&offset=0'
    );

    const photoUrl = buildPostmanUrl(
      getPostmanEndpointSpec('customer_get_order_photo'),
      '',
      form,
      '/api/v1'
    );
    expect(photoUrl).toBe('/api/v1/customer/orders/ORD-C1-AWT-01/photo?type=proof');

    const cancelBody = buildPostmanBody('customer_cancel_order', form);
    expect(cancelBody).toEqual({
      reasonCode: 'SELLER_CANCELLED',
      reason: 'Out of stock',
    });

    const curl = buildCurlSnippet(
      'POST',
      '/api/v1/customer/orders/ORD-C1-AWT-01/cancel',
      { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
      JSON.stringify(cancelBody)
    );
    expect(curl).toContain('curl -X POST "http://localhost:3000/api/v1/customer/orders/ORD-C1-AWT-01/cancel"');
    expect(curl).toContain('Authorization: Bearer tok');
  });

  it('renders workbench, filters endpoints, and executes a request with response inspection', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/v1/customer/login')) {
        return mockFetchResponse({
          statusMessage: 'Credentials verified',
          preAuthToken: 'pre_tok_12345',
          hasMpin: true,
        });
      }
      return mockFetchResponse({ statusMessage: 'OK' });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PostmanWorkbench />);

    expect(screen.getByText('ParcelHub Postman')).toBeInTheDocument();
    expect(screen.getByText('v1 · 34 routes')).toBeInTheDocument();

    // Send default customer_login request
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => {
      // Appears in both Response Inspector JSON and auto-captured Auth Vault
      expect(screen.getAllByText(/pre_tok_12345/).length).toBeGreaterThanOrEqual(2);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/customer/login',
      expect.objectContaining({ method: 'POST' })
    );

    // Filter sidebar to Shared routes
    fireEvent.click(screen.getByRole('tab', { name: /Shared/i }));
    expect(screen.getByText('Realtime Token')).toBeInTheDocument();
    expect(screen.getByText('Upload FCM Token')).toBeInTheDocument();
  });

  it('chains 1-Click Customer Login and populates live orders in Target Order panel', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/v1/customer/login')) {
        return mockFetchResponse({
          statusMessage: 'Credentials verified',
          preAuthToken: 'pre_abc',
          hasMpin: true,
        });
      }
      if (url.endsWith('/api/v1/customer/mpin')) {
        return mockFetchResponse({
          statusMessage: 'Authenticated',
          authToken: 'auth_cust_999',
          refreshToken: 'ref_cust_999',
          customer: {
            id: 'cust-1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+639123456789',
          },
        });
      }
      if (url.endsWith('/api/v1/customer/profile')) {
        return mockFetchResponse({
          statusMessage: 'OK',
          customer: {
            id: 'cust-1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+639123456789',
          },
        });
      }
      if (url.includes('/api/v1/customer/orders')) {
        return mockFetchResponse({
          statusMessage: 'Orders retrieved',
          orders: [
            {
              id: 'ORD-LIVE-001',
              ticketCode: '999-101',
              trackingId: 'PH-LIVE-01',
              productName: 'Mechanical Keyboard',
              status: 'READY_TO_CLAIM',
              timestamp: '2026-11-24T12:00:00.000Z',
            },
          ],
        });
      }
      return mockFetchResponse({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PostmanWorkbench />);

    fireEvent.click(screen.getByRole('button', { name: '1-Click Customer Login' }));

    await waitFor(() => {
      expect(screen.getByText('Bearer Active')).toBeInTheDocument();
    });

    // Switch right rail to Target Order tab and pick the synced live order
    fireEvent.click(screen.getByRole('button', { name: 'Target Order' }));
    await waitFor(() => {
      expect(screen.getByText('ORD-LIVE-001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Target order ORD-LIVE-001' }));

    // Select customer_cancel_order and verify URL includes ORD-LIVE-001
    fireEvent.click(screen.getByText('Cancel Order'));
    const urlInput = screen.getByLabelText('Resolved Request URL') as HTMLInputElement;
    expect(urlInput.value).toBe('/api/v1/customer/orders/ORD-LIVE-001/cancel');
  });

  it('supports Raw JSON body override, cURL copy, and 1-Click Staff Login', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/v1/staff/login')) {
        return mockFetchResponse({
          statusMessage: 'Staff logged in',
          authToken: 'staff_tok_777',
          refreshToken: 'staff_ref_777',
        });
      }
      if (url.includes('/api/v1/staff/orders')) {
        return mockFetchResponse({ orders: [], pagination: { totalCount: 0, limit: 20, offset: 0, hasMore: false } });
      }
      if (url.endsWith('/api/v1/notification/upload-token')) {
        return mockFetchResponse({ statusMessage: 'FCM token saved successfully' });
      }
      return mockFetchResponse({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PostmanWorkbench />);

    // 1-Click Staff Login
    fireEvent.click(screen.getByRole('button', { name: '1-Click Staff Login' }));
    await waitFor(() => {
      expect(screen.getByText(/staff_tok_777/)).toBeInTheDocument();
    });

    // Switch to Upload FCM Token and use Raw JSON override
    fireEvent.click(screen.getByText('Upload FCM Token'));
    fireEvent.click(screen.getByRole('tab', { name: /Body \(JSON\)/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Raw JSON' }));

    const textarea = screen.getByLabelText('Raw Request JSON Body') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"fcmToken":"raw_override_token"}' } });

    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/notification/upload-token',
        expect.objectContaining({
          method: 'POST',
          body: '{"fcmToken":"raw_override_token"}',
        })
      );
    });

    // Copy cURL command
    fireEvent.click(screen.getByRole('button', { name: 'cURL' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('curl -X POST "http://localhost:3000/api/v1/notification/upload-token"')
    );
  });
});
