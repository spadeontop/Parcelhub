import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  PostmanWorkbench,
  POSTMAN_V1_ENDPOINTS,
  buildPostmanUrl,
  buildPostmanBody,
  buildCurlSnippet,
  buildSupabaseRealtimeWsUrl,
  getPostmanEndpointSpec,
} from '../postman-v1';
import { createInitialFormState } from '../postman-v1/endpoints';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  sentFrames: string[] = [];
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentFrames.push(data);
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean: true } as CloseEvent);
  }

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  triggerMessage(data: unknown) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.({ data: raw } as MessageEvent);
  }
}

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

  it('toggles dark mode and persists theme preference in localStorage', () => {
    const { container, unmount } = render(<PostmanWorkbench />);

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv.getAttribute('data-theme')).toBe('light');
    expect(rootDiv.className).not.toContain('dark ');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Dark Mode' }));

    expect(rootDiv.getAttribute('data-theme')).toBe('dark');
    expect(rootDiv.className).toContain('dark');
    expect(localStorage.getItem('ph_postman_v1_theme')).toBe('dark');

    // Remount restores dark mode
    unmount();
    const { container: container2 } = render(<PostmanWorkbench />);
    const remountedRoot = container2.firstElementChild as HTMLElement;
    expect(remountedRoot.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to Light Mode' })).toBeInTheDocument();
  });

  it('keeps persistent Realtime WebSocket alive while minimized and running Staff requests', async () => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);

    expect(buildSupabaseRealtimeWsUrl('https://demo.supabase.co/', 'sb_pub_123')).toBe(
      'wss://demo.supabase.co/realtime/v1/websocket?apikey=sb_pub_123&vsn=1.0.0'
    );

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/v1/staff/login')) {
        return mockFetchResponse({
          statusMessage: 'Staff logged in',
          authToken: 'staff_tok_live',
          refreshToken: 'staff_ref_live',
        });
      }
      if (url.includes('/api/v1/staff/orders') && !url.includes('/pay')) {
        return mockFetchResponse({
          orders: [],
          pagination: { totalCount: 0, limit: 20, offset: 0, hasMore: false },
        });
      }
      if (url.endsWith('/api/v1/realtime/token')) {
        return mockFetchResponse({
          statusMessage: 'Realtime token issued',
          token: 'rt_jwt_staff_001',
          channel: 'staff:orders',
          expiresAt: '2026-11-25T10:00:00.000Z',
        });
      }
      if (url.includes('/make-claimable/pay')) {
        return mockFetchResponse({
          statusMessage: 'Courier paid',
          orderId: 'ORD-C1-AWT-01',
          courierPaid: true,
        });
      }
      return mockFetchResponse({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PostmanWorkbench />);

    // 1. Login as Staff
    fireEvent.click(screen.getByRole('button', { name: '1-Click Staff Login' }));
    await waitFor(() => {
      expect(screen.getByText(/staff_tok_live/)).toBeInTheDocument();
    });

    // 2. Open Realtime WS Dock & configure Supabase URL + Key
    fireEvent.click(screen.getByRole('button', { name: /Realtime WS/i }));
    fireEvent.click(screen.getByRole('button', { name: /WS Config/i }));
    fireEvent.change(screen.getByLabelText('Supabase Project URL'), {
      target: { value: 'https://demo.supabase.co' },
    });
    fireEvent.change(screen.getByLabelText('Supabase Publishable or Anon Key'), {
      target: { value: 'sb_pub_123' },
    });

    // 3. Create Staff Realtime WS session
    fireEvent.click(screen.getByRole('button', { name: '+ Staff WS' }));

    await waitFor(() => {
      expect(MockWebSocket.instances).toHaveLength(1);
    });

    const socket = MockWebSocket.instances[0];
    expect(socket.url).toBe('wss://demo.supabase.co/realtime/v1/websocket?apikey=sb_pub_123&vsn=1.0.0');

    // Simulate WS open -> phx_join frame sent with private: true & access_token
    act(() => {
      socket.triggerOpen();
    });

    expect(socket.sentFrames).toHaveLength(1);
    const joinFrame = JSON.parse(socket.sentFrames[0]);
    expect(joinFrame.topic).toBe('realtime:staff:orders');
    expect(joinFrame.event).toBe('phx_join');
    expect(joinFrame.payload.config.private).toBe(true);
    expect(joinFrame.payload.access_token).toBe('rt_jwt_staff_001');

    // Simulate server phx_reply ok -> subscribed
    act(() => {
      socket.triggerMessage({
        topic: 'realtime:staff:orders',
        event: 'phx_reply',
        payload: { status: 'ok', response: {} },
        ref: joinFrame.ref,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('subscribed')).toBeInTheDocument();
    });

    // 4. Minimize Realtime Dock like VS Code terminal (socket must stay open!)
    fireEvent.click(screen.getByRole('button', { name: 'Minimize Realtime Dock' }));
    expect(screen.getByLabelText('Realtime WebSocket Dock (Minimized)')).toBeInTheDocument();
    expect(socket.readyState).toBe(MockWebSocket.OPEN);

    // 5. Manually run a Staff HTTP mutation while dock is minimized
    fireEvent.click(screen.getByText('Pay Courier'));
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/make-claimable/pay'),
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(socket.readyState).toBe(MockWebSocket.OPEN);

    // 6. Receive live order_signal broadcast while minimized -> unread badge appears
    act(() => {
      socket.triggerMessage({
        topic: 'realtime:staff:orders',
        event: 'broadcast',
        payload: {
          type: 'broadcast',
          event: 'order_signal',
          payload: {
            event: 'ORDER_READY',
            orderId: 'ORD-WS-777',
            ticketCode: '888-777',
            status: 'READY_TO_CLAIM',
            updatedAt: '2026-11-25T01:40:00.000Z',
          },
        },
        ref: null,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('1 new')).toBeInTheDocument();
    });

    // 7. Restore Realtime Dock, inspect live signal, and Target the order directly into Postman
    fireEvent.click(screen.getByRole('button', { name: 'Expand Realtime Dock' }));
    await waitFor(() => {
      expect(screen.getByText(/ORDER_READY · 888-777 \(ORD-WS-777\)/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Target' }));
    const urlInput = screen.getByLabelText('Resolved Request URL') as HTMLInputElement;
    expect(urlInput.value).toContain('ORD-WS-777');
  });

  it('supports Raw WebSocket connections and sending manual frames', async () => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);

    render(<PostmanWorkbench />);

    fireEvent.click(screen.getByRole('button', { name: /Realtime WS/i }));
    fireEvent.click(screen.getByRole('button', { name: '+ Raw WS' }));

    const urlInput = screen.getByLabelText('Raw WebSocket URL') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'ws://localhost:9000/ws' } });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(MockWebSocket.instances).toHaveLength(1);
    });

    const rawSock = MockWebSocket.instances[0];
    act(() => {
      rawSock.triggerOpen();
    });

    const frameInput = screen.getByLabelText('Send WebSocket Frame') as HTMLInputElement;
    fireEvent.change(frameInput, { target: { value: '{"ping":true}' } });
    fireEvent.submit(frameInput.closest('form')!);

    expect(rawSock.sentFrames).toContain('{"ping":true}');

    act(() => {
      rawSock.triggerMessage({ pong: true });
    });

    await waitFor(() => {
      expect(screen.getByText(/\{"pong":true\}/)).toBeInTheDocument();
    });
  });
});
