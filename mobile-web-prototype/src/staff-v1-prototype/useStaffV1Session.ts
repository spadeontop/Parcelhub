import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CapturedRequest,
  CapturedResponse,
  PaginationMeta,
  RequestLogEntry,
  StaffEndpointId,
  StaffListOrdersRes,
  StaffLoginRes,
  StaffOrderSummary,
  UiMode,
} from './types';
import { executeStaffV1Request } from './staffV1Client';
import { getEndpointSpec, SEEDED_STAFF_CREDENTIALS } from './endpoints';

const TOKEN_STORAGE_KEY = 'ph_v1_staff_auth_token';
const REFRESH_STORAGE_KEY = 'ph_v1_staff_refresh_token';
const USERNAME_STORAGE_KEY = 'ph_v1_staff_username';
const BASE_URL_STORAGE_KEY = 'ph_v1_staff_base_url';
const EXPLICIT_LOGOUT_KEY = 'ph_v1_staff_explicit_logout';

export const DEFAULT_STAFF_TOKEN = 'mock-staff-jwt-token-12345';

function safeGetStorage(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export interface SendRawRequestArgs {
  endpointId: StaffEndpointId;
  source: 'debug' | 'real';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  includeAuth: boolean;
  tokenOverride?: string;
  body?: unknown | null;
  rawBodyText?: string;
}

export interface UseStaffV1SessionReturn {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  authToken: string;
  refreshToken: string;
  staffUsername: string;
  setTokens: (auth: string, refresh?: string, username?: string) => void;
  logout: () => void;
  orders: StaffOrderSummary[];
  pagination: PaginationMeta | null;
  ordersLoading: boolean;
  requestLogs: RequestLogEntry[];
  activeLog: RequestLogEntry | null;
  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;
  clearLogs: () => void;
  toast: { msg: string; type: 'success' | 'error' } | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  sendRequest: (args: SendRawRequestArgs) => Promise<RequestLogEntry>;
  login: (username: string, password: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  fetchOrders: (
    opts?: { status?: string; limit?: number; offset?: number; silent?: boolean; source?: 'debug' | 'real' }
  ) => Promise<RequestLogEntry | null>;
  fetchOrderDetail: (idOrCode: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  activateOrder: (idOrCode: string, amountReceived: number, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  payCourier: (idOrCode: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  attachPhoto: (idOrCode: string, imageUrl: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  claimOrder: (idOrCode: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  inspectLogInDebugger: (logId: string) => void;
  inspectedEndpointId: StaffEndpointId | null;
  setInspectedEndpointId: (id: StaffEndpointId | null) => void;
}

export function useStaffV1Session(initialMode: UiMode = 'debug'): UseStaffV1SessionReturn {
  const [uiMode, setUiMode] = useState<UiMode>(initialMode);
  const [baseUrl, setBaseUrlState] = useState<string>(() => safeGetStorage(BASE_URL_STORAGE_KEY));
  const [authToken, setAuthToken] = useState<string>(() => {
    const stored = safeGetStorage(TOKEN_STORAGE_KEY);
    if (stored) return stored;
    if (safeGetStorage(EXPLICIT_LOGOUT_KEY) === 'true') return '';
    return DEFAULT_STAFF_TOKEN;
  });
  const authTokenRef = useRef<string>(authToken);
  const [refreshToken, setRefreshToken] = useState<string>(() => safeGetStorage(REFRESH_STORAGE_KEY));
  const [staffUsername, setStaffUsername] = useState<string>(
    () => safeGetStorage(USERNAME_STORAGE_KEY) || SEEDED_STAFF_CREDENTIALS.username
  );

  const [orders, setOrders] = useState<StaffOrderSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [inspectedEndpointId, setInspectedEndpointId] = useState<StaffEndpointId | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const setBaseUrl = useCallback((url: string) => {
    setBaseUrlState(url);
    safeSetStorage(BASE_URL_STORAGE_KEY, url);
  }, []);

  const setTokens = useCallback((auth: string, refresh = '', username?: string) => {
    authTokenRef.current = auth;
    setAuthToken(auth);
    safeSetStorage(TOKEN_STORAGE_KEY, auth);
    safeSetStorage(EXPLICIT_LOGOUT_KEY, '');
    if (refresh !== undefined) {
      setRefreshToken(refresh);
      safeSetStorage(REFRESH_STORAGE_KEY, refresh);
    }
    if (username) {
      setStaffUsername(username);
      safeSetStorage(USERNAME_STORAGE_KEY, username);
    }
  }, []);

  const logout = useCallback(() => {
    authTokenRef.current = '';
    setAuthToken('');
    setRefreshToken('');
    safeSetStorage(TOKEN_STORAGE_KEY, '');
    safeSetStorage(REFRESH_STORAGE_KEY, '');
    safeSetStorage(EXPLICIT_LOGOUT_KEY, 'true');
    setOrders([]);
    setPagination(null);
    showToast('Staff session cleared.');
  }, [showToast]);

  const appendLog = useCallback(
    (
      endpointId: StaffEndpointId,
      source: 'debug' | 'real',
      request: CapturedRequest,
      response: CapturedResponse
    ): RequestLogEntry => {
      const spec = getEndpointSpec(endpointId);
      const entry: RequestLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        endpointId,
        endpointTitle: spec.title,
        source,
        request,
        response,
      };
      setRequestLogs((prev) => [entry, ...prev].slice(0, 60));
      setSelectedLogId(entry.id);
      return entry;
    },
    []
  );

  const buildUrl = useCallback(
    (path: string) => {
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');
      return `${cleanBase}${path}`;
    },
    [baseUrl]
  );

  const sendRequest = useCallback(
    async (args: SendRawRequestArgs): Promise<RequestLogEntry> => {
      const effectiveToken =
        args.tokenOverride !== undefined ? args.tokenOverride : authTokenRef.current;
      const { request, response } = await executeStaffV1Request({
        method: args.method,
        url: args.url,
        authToken: effectiveToken,
        includeAuth: args.includeAuth,
        body: args.body,
        rawBodyText: args.rawBodyText,
      });

      const entry = appendLog(args.endpointId, args.source, request, response);

      // Auto-sync session state when relevant endpoints succeed
      if (response.ok && response.body && typeof response.body === 'object') {
        if (args.endpointId === 'login') {
          const loginData = response.body as Partial<StaffLoginRes>;
          if (loginData.authToken) {
            const sentUsername =
              request.body && typeof request.body === 'object' && 'username' in request.body
                ? String((request.body as { username?: unknown }).username || '')
                : undefined;
            setTokens(loginData.authToken, loginData.refreshToken || '', sentUsername);
          }
        } else if (args.endpointId === 'list_orders') {
          const listData = response.body as Partial<StaffListOrdersRes>;
          if (Array.isArray(listData.orders)) {
            setOrders(listData.orders);
            setPagination(listData.pagination || null);
          }
        }
      }

      return entry;
    },
    [appendLog, setTokens]
  );

  const login = useCallback(
    async (username: string, password: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'login',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/staff/login'),
        includeAuth: false,
        body: { username, password },
      });
    },
    [sendRequest, buildUrl]
  );

  const fetchOrders = useCallback(
    async (opts?: {
      status?: string;
      limit?: number;
      offset?: number;
      silent?: boolean;
      source?: 'debug' | 'real';
    }) => {
      const token = authTokenRef.current;
      if (!token) return null;
      const source = opts?.source ?? 'real';
      if (!opts?.silent) setOrdersLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts?.status && opts.status !== 'ALL') params.set('status', opts.status);
        if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
        if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
        const qs = params.toString();
        const url = buildUrl(`/api/v1/staff/orders${qs ? `?${qs}` : ''}`);
        return await sendRequest({
          endpointId: 'list_orders',
          source,
          method: 'GET',
          url,
          includeAuth: true,
        });
      } finally {
        if (!opts?.silent) setOrdersLoading(false);
      }
    },
    [buildUrl, sendRequest]
  );

  const fetchOrderDetail = useCallback(
    async (idOrCode: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'get_order',
        source,
        method: 'GET',
        url: buildUrl(`/api/v1/staff/orders/${encodeURIComponent(idOrCode.trim())}`),
        includeAuth: true,
      });
    },
    [buildUrl, sendRequest]
  );

  const activateOrder = useCallback(
    async (idOrCode: string, amountReceived: number, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'activate_order',
        source,
        method: 'POST',
        url: buildUrl(`/api/v1/staff/orders/${encodeURIComponent(idOrCode.trim())}/activate`),
        includeAuth: true,
        body: { amountReceived },
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
      }
      return entry;
    },
    [buildUrl, sendRequest, fetchOrders]
  );

  const payCourier = useCallback(
    async (idOrCode: string, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'pay_courier',
        source,
        method: 'POST',
        url: buildUrl(`/api/v1/staff/orders/${encodeURIComponent(idOrCode.trim())}/make-claimable/pay`),
        includeAuth: true,
        body: {},
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
      }
      return entry;
    },
    [buildUrl, sendRequest, fetchOrders]
  );

  const attachPhoto = useCallback(
    async (idOrCode: string, imageUrl: string, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'attach_photo',
        source,
        method: 'POST',
        url: buildUrl(`/api/v1/staff/orders/${encodeURIComponent(idOrCode.trim())}/make-claimable/attach-photo`),
        includeAuth: true,
        body: { imageUrl },
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
      }
      return entry;
    },
    [buildUrl, sendRequest, fetchOrders]
  );

  const claimOrder = useCallback(
    async (idOrCode: string, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'claim_order',
        source,
        method: 'POST',
        url: buildUrl(`/api/v1/staff/orders/${encodeURIComponent(idOrCode.trim())}/claim`),
        includeAuth: true,
        body: {},
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
      }
      return entry;
    },
    [buildUrl, sendRequest, fetchOrders]
  );

  const clearLogs = useCallback(() => {
    setRequestLogs([]);
    setSelectedLogId(null);
  }, []);

  const inspectLogInDebugger = useCallback((logId: string) => {
    const found = requestLogs.find((l) => l.id === logId);
    if (found) {
      setSelectedLogId(found.id);
      setInspectedEndpointId(found.endpointId);
    }
    setUiMode('debug');
  }, [requestLogs]);

  const activeLog = requestLogs.find((l) => l.id === selectedLogId) || requestLogs[0] || null;

  return {
    uiMode,
    setUiMode,
    baseUrl,
    setBaseUrl,
    authToken,
    refreshToken,
    staffUsername,
    setTokens,
    logout,
    orders,
    pagination,
    ordersLoading,
    requestLogs,
    activeLog,
    selectedLogId,
    setSelectedLogId,
    clearLogs,
    toast,
    showToast,
    sendRequest,
    login,
    fetchOrders,
    fetchOrderDetail,
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
    inspectLogInDebugger,
    inspectedEndpointId,
    setInspectedEndpointId,
  };
}
