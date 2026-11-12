import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CapturedRequest,
  CapturedResponse,
  CustomerCreateMpinRes,
  CustomerEndpointId,
  CustomerGetOrderRes,
  CustomerListOrdersRes,
  CustomerLoginRes,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  CustomerProfileRes,
  CustomerRefreshTokenRes,
  CustomerRegisterRes,
  CustomerVerifyMpinRes,
  RequestLogEntry,
  UiMode,
} from './types';
import { executeCustomerV1Request } from './customerV1Client';
import {
  getCustomerEndpointSpec,
  SEEDED_CUSTOMER_ACCOUNTS,
  SeededCustomerAccount,
} from './endpoints';

const AUTH_TOKEN_KEY = 'ph_v1_cust_auth_token';
const PRE_AUTH_TOKEN_KEY = 'ph_v1_cust_pre_auth_token';
const REFRESH_TOKEN_KEY = 'ph_v1_cust_refresh_token';
const CUSTOMER_PROFILE_KEY = 'ph_v1_cust_profile';
const BASE_URL_KEY = 'ph_v1_cust_base_url';
const EXPLICIT_LOGOUT_KEY = 'ph_v1_cust_explicit_logout';

export const DEFAULT_CUSTOMER_AUTH_TOKEN = 'mock-customer-jwt-auth-12345';
export const DEFAULT_CUSTOMER_PRE_AUTH_TOKEN = 'mock-customer-jwt-preauth-67890';
export const DEFAULT_CUSTOMER_REFRESH_TOKEN = 'mock-customer-jwt-refresh-abcde';

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
    // Ignore storage errors
  }
}

function getDefaultCustomerProfile(seed: SeededCustomerAccount = SEEDED_CUSTOMER_ACCOUNTS[0]): CustomerProfile {
  return {
    id: seed.id,
    email: seed.email,
    firstName: seed.firstName,
    lastName: seed.lastName,
    middleInitial: seed.middleInitial,
    phoneNumber: seed.phoneNumber,
    blacklisted: false,
  };
}

export interface SendCustomerRawRequestArgs {
  endpointId: CustomerEndpointId;
  source: 'debug' | 'real';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  includeAuth: boolean;
  tokenOverride?: string;
  body?: unknown | null;
  rawBodyText?: string;
}

export interface UseCustomerV1SessionReturn {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  preAuthToken: string;
  authToken: string;
  refreshToken: string;
  customerProfile: CustomerProfile | null;
  setPreAuthTokenValue: (token: string) => void;
  setAuthTokens: (auth: string, refresh?: string, profile?: CustomerProfile) => void;
  logout: () => void;
  orders: CustomerOrderSummary[];
  selectedOrderDetail: CustomerOrderDetail | null;
  ordersLoading: boolean;
  requestLogs: RequestLogEntry[];
  activeLog: RequestLogEntry | null;
  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;
  clearLogs: () => void;
  toast: { msg: string; type: 'success' | 'error' } | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  sendRequest: (args: SendCustomerRawRequestArgs) => Promise<RequestLogEntry>;
  registerCustomer: (
    payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      middleInitial?: string;
      phoneNumber: string;
    },
    source?: 'debug' | 'real'
  ) => Promise<RequestLogEntry>;
  loginCustomer: (email: string, password: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  createMpin: (mpin: string, preAuthOverride?: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  verifyMpin: (mpin: string, preAuthOverride?: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  refreshAuth: (mpin: string, refreshOverride?: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  fullSeedLogin: (
    email: string,
    password: string,
    mpin: string,
    source?: 'debug' | 'real'
  ) => Promise<{ ok: boolean; loginEntry: RequestLogEntry; mpinEntry?: RequestLogEntry }>;
  fetchProfile: (source?: 'debug' | 'real') => Promise<RequestLogEntry | null>;
  fetchOrders: (
    opts?: { type?: string; limit?: number; offset?: number; silent?: boolean; source?: 'debug' | 'real' }
  ) => Promise<RequestLogEntry | null>;
  fetchOrderDetail: (idOrCode: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  initializeOrder: (imageUrl: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  updateOrder: (
    idOrCode: string,
    orderPayload: { trackingId: string; productName: string; recipientName: string; price: number },
    source?: 'debug' | 'real'
  ) => Promise<RequestLogEntry>;
  claimOrder: (idOrCode: string, source?: 'debug' | 'real') => Promise<RequestLogEntry>;
  inspectLogInDebugger: (logId: string) => void;
  inspectedEndpointId: CustomerEndpointId | null;
  setInspectedEndpointId: (id: CustomerEndpointId | null) => void;
}

export function useCustomerV1Session(initialMode: UiMode = 'debug'): UseCustomerV1SessionReturn {
  const [uiMode, setUiMode] = useState<UiMode>(initialMode);
  const [baseUrl, setBaseUrlState] = useState<string>(() => safeGetStorage(BASE_URL_KEY));

  const [preAuthToken, setPreAuthToken] = useState<string>(() => {
    const stored = safeGetStorage(PRE_AUTH_TOKEN_KEY);
    if (stored) return stored;
    if (safeGetStorage(EXPLICIT_LOGOUT_KEY) === 'true') return '';
    return DEFAULT_CUSTOMER_PRE_AUTH_TOKEN;
  });
  const preAuthTokenRef = useRef<string>(preAuthToken);

  const [authToken, setAuthToken] = useState<string>(() => {
    const stored = safeGetStorage(AUTH_TOKEN_KEY);
    if (stored) return stored;
    if (safeGetStorage(EXPLICIT_LOGOUT_KEY) === 'true') return '';
    return DEFAULT_CUSTOMER_AUTH_TOKEN;
  });
  const authTokenRef = useRef<string>(authToken);

  const [refreshToken, setRefreshToken] = useState<string>(() => {
    const stored = safeGetStorage(REFRESH_TOKEN_KEY);
    if (stored) return stored;
    if (safeGetStorage(EXPLICIT_LOGOUT_KEY) === 'true') return '';
    return DEFAULT_CUSTOMER_REFRESH_TOKEN;
  });
  const refreshTokenRef = useRef<string>(refreshToken);

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() => {
    const raw = safeGetStorage(CUSTOMER_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as CustomerProfile;
      } catch {
        // Fallback below
      }
    }
    if (safeGetStorage(EXPLICIT_LOGOUT_KEY) === 'true') return null;
    return getDefaultCustomerProfile();
  });

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [inspectedEndpointId, setInspectedEndpointId] = useState<CustomerEndpointId | null>(null);
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
    safeSetStorage(BASE_URL_KEY, url);
  }, []);

  const setPreAuthTokenValue = useCallback((token: string) => {
    preAuthTokenRef.current = token;
    setPreAuthToken(token);
    safeSetStorage(PRE_AUTH_TOKEN_KEY, token);
    if (token) {
      safeSetStorage(EXPLICIT_LOGOUT_KEY, '');
    }
  }, []);

  const setAuthTokens = useCallback(
    (auth: string, refresh?: string, profile?: CustomerProfile) => {
      authTokenRef.current = auth;
      setAuthToken(auth);
      safeSetStorage(AUTH_TOKEN_KEY, auth);
      safeSetStorage(EXPLICIT_LOGOUT_KEY, '');
      if (refresh !== undefined) {
        refreshTokenRef.current = refresh;
        setRefreshToken(refresh);
        safeSetStorage(REFRESH_TOKEN_KEY, refresh);
      }
      if (profile) {
        setCustomerProfile(profile);
        safeSetStorage(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
      }
    },
    []
  );

  const logout = useCallback(() => {
    preAuthTokenRef.current = '';
    authTokenRef.current = '';
    refreshTokenRef.current = '';
    setPreAuthToken('');
    setAuthToken('');
    setRefreshToken('');
    setCustomerProfile(null);
    safeSetStorage(PRE_AUTH_TOKEN_KEY, '');
    safeSetStorage(AUTH_TOKEN_KEY, '');
    safeSetStorage(REFRESH_TOKEN_KEY, '');
    safeSetStorage(CUSTOMER_PROFILE_KEY, '');
    safeSetStorage(EXPLICIT_LOGOUT_KEY, 'true');
    setOrders([]);
    setSelectedOrderDetail(null);
    showToast('Customer session cleared (preAuth, auth, and refresh tokens).');
  }, [showToast]);

  const appendLog = useCallback(
    (
      endpointId: CustomerEndpointId,
      source: 'debug' | 'real',
      request: CapturedRequest,
      response: CapturedResponse
    ): RequestLogEntry => {
      const spec = getCustomerEndpointSpec(endpointId);
      const entry: RequestLogEntry = {
        id: `cust-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    async (args: SendCustomerRawRequestArgs): Promise<RequestLogEntry> => {
      const effectiveToken =
        args.tokenOverride !== undefined ? args.tokenOverride : authTokenRef.current;

      const { request, response } = await executeCustomerV1Request({
        method: args.method,
        url: args.url,
        authToken: effectiveToken,
        includeAuth: args.includeAuth,
        body: args.body,
        rawBodyText: args.rawBodyText,
      });

      const entry = appendLog(args.endpointId, args.source, request, response);

      // Auto-sync 2-step token lifecycle & order state from live responses
      if (response.ok && response.body && typeof response.body === 'object') {
        if (args.endpointId === 'login' || args.endpointId === 'register') {
          const data = response.body as Partial<CustomerLoginRes | CustomerRegisterRes>;
          if (data.preAuthToken) {
            setPreAuthTokenValue(data.preAuthToken);
          }
        } else if (args.endpointId === 'verify_mpin' || args.endpointId === 'create_mpin') {
          const data = response.body as Partial<CustomerVerifyMpinRes | CustomerCreateMpinRes>;
          if (data.authToken) {
            setAuthTokens(data.authToken, data.refreshToken || refreshTokenRef.current, data.customer);
            // Automatically fetch live orders on MPIN success so Target Order (Live DB) immediately populates
            void fetchOrders({ silent: true, source: args.source });
          }
        } else if (args.endpointId === 'refresh_token') {
          const data = response.body as Partial<CustomerRefreshTokenRes>;
          if (data.authToken) {
            setAuthTokens(data.authToken);
          }
        } else if (args.endpointId === 'get_profile') {
          const data = response.body as Partial<CustomerProfileRes>;
          if (data.customer) {
            setCustomerProfile(data.customer);
            safeSetStorage(CUSTOMER_PROFILE_KEY, JSON.stringify(data.customer));
          }
        } else if (args.endpointId === 'list_orders') {
          const data = response.body as Partial<CustomerListOrdersRes>;
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        } else if (args.endpointId === 'get_order') {
          const data = response.body as Partial<CustomerGetOrderRes>;
          if (data.order) {
            setSelectedOrderDetail(data.order);
          }
        }
      }

      return entry;
    },
    [appendLog, setPreAuthTokenValue, setAuthTokens]
  );

  const registerCustomer = useCallback(
    async (
      payload: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        middleInitial?: string;
        phoneNumber: string;
      },
      source: 'debug' | 'real' = 'real'
    ) => {
      return sendRequest({
        endpointId: 'register',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/register'),
        includeAuth: false,
        body: payload,
      });
    },
    [sendRequest, buildUrl]
  );

  const loginCustomer = useCallback(
    async (email: string, password: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'login',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/login'),
        includeAuth: false,
        body: { email, password },
      });
    },
    [sendRequest, buildUrl]
  );

  const createMpin = useCallback(
    async (mpin: string, preAuthOverride?: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'create_mpin',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/create-mpin'),
        includeAuth: false,
        body: {
          preAuthToken: preAuthOverride ?? preAuthTokenRef.current,
          mpin,
        },
      });
    },
    [sendRequest, buildUrl]
  );

  const verifyMpin = useCallback(
    async (mpin: string, preAuthOverride?: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'verify_mpin',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/mpin'),
        includeAuth: false,
        body: {
          preAuthToken: preAuthOverride ?? preAuthTokenRef.current,
          mpin,
        },
      });
    },
    [sendRequest, buildUrl]
  );

  const refreshAuth = useCallback(
    async (mpin: string, refreshOverride?: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'refresh_token',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/refresh'),
        includeAuth: false,
        body: {
          refreshToken: refreshOverride ?? refreshTokenRef.current,
          mpin,
        },
      });
    },
    [sendRequest, buildUrl]
  );

  const fetchProfile = useCallback(
    async (source: 'debug' | 'real' = 'real') => {
      if (!authTokenRef.current) return null;
      return sendRequest({
        endpointId: 'get_profile',
        source,
        method: 'GET',
        url: buildUrl('/api/v1/customer/profile'),
        includeAuth: true,
      });
    },
    [sendRequest, buildUrl]
  );

  const fetchOrders = useCallback(
    async (opts?: {
      type?: string;
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
        if (opts?.type && opts.type !== 'ALL') params.set('type', opts.type);
        if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
        if (opts?.offset !== undefined) params.set('offset', String(opts.offset));
        const qs = params.toString();
        return await sendRequest({
          endpointId: 'list_orders',
          source,
          method: 'GET',
          url: buildUrl(`/api/v1/customer/orders${qs ? `?${qs}` : ''}`),
          includeAuth: true,
        });
      } finally {
        if (!opts?.silent) setOrdersLoading(false);
      }
    },
    [sendRequest, buildUrl]
  );

  const fullSeedLogin = useCallback(
    async (email: string, password: string, mpin: string, source: 'debug' | 'real' = 'debug') => {
      const loginEntry = await loginCustomer(email, password, source);
      if (!loginEntry.response.ok) {
        return { ok: false, loginEntry };
      }
      const capturedPreAuth =
        loginEntry.response.body &&
        typeof loginEntry.response.body === 'object' &&
        'preAuthToken' in loginEntry.response.body
          ? String((loginEntry.response.body as { preAuthToken?: unknown }).preAuthToken || '')
          : preAuthTokenRef.current;

      const mpinEntry = await verifyMpin(mpin, capturedPreAuth, source);
      if (!mpinEntry.response.ok) {
        return { ok: false, loginEntry, mpinEntry };
      }

      await fetchOrders({ silent: true, source });
      return { ok: true, loginEntry, mpinEntry };
    },
    [loginCustomer, verifyMpin, fetchOrders]
  );

  const fetchOrderDetail = useCallback(
    async (idOrCode: string, source: 'debug' | 'real' = 'real') => {
      return sendRequest({
        endpointId: 'get_order',
        source,
        method: 'GET',
        url: buildUrl(`/api/v1/customer/orders/${encodeURIComponent(idOrCode.trim())}`),
        includeAuth: true,
      });
    },
    [sendRequest, buildUrl]
  );

  const initializeOrder = useCallback(
    async (imageUrl: string, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'initialize_order',
        source,
        method: 'POST',
        url: buildUrl('/api/v1/customer/orders/initialize'),
        includeAuth: true,
        body: { imageUrl },
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
      }
      return entry;
    },
    [sendRequest, buildUrl, fetchOrders]
  );

  const updateOrder = useCallback(
    async (
      idOrCode: string,
      orderPayload: { trackingId: string; productName: string; recipientName: string; price: number },
      source: 'debug' | 'real' = 'real'
    ) => {
      const entry = await sendRequest({
        endpointId: 'update_order',
        source,
        method: 'PUT',
        url: buildUrl(`/api/v1/customer/orders/${encodeURIComponent(idOrCode.trim())}`),
        includeAuth: true,
        body: { order: orderPayload },
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
        await fetchOrderDetail(idOrCode, source);
      }
      return entry;
    },
    [sendRequest, buildUrl, fetchOrders, fetchOrderDetail]
  );

  const claimOrder = useCallback(
    async (idOrCode: string, source: 'debug' | 'real' = 'real') => {
      const entry = await sendRequest({
        endpointId: 'claim_order',
        source,
        method: 'POST',
        url: buildUrl(`/api/v1/customer/orders/${encodeURIComponent(idOrCode.trim())}/claim`),
        includeAuth: true,
        body: {},
      });
      if (entry.response.ok) {
        await fetchOrders({ silent: true, source });
        await fetchOrderDetail(idOrCode, source);
      }
      return entry;
    },
    [sendRequest, buildUrl, fetchOrders, fetchOrderDetail]
  );

  const clearLogs = useCallback(() => {
    setRequestLogs([]);
    setSelectedLogId(null);
  }, []);

  const inspectLogInDebugger = useCallback(
    (logId: string) => {
      const found = requestLogs.find((l) => l.id === logId);
      if (found) {
        setSelectedLogId(found.id);
        setInspectedEndpointId(found.endpointId);
      }
      setUiMode('debug');
    },
    [requestLogs]
  );

  const activeLog = requestLogs.find((l) => l.id === selectedLogId) || requestLogs[0] || null;

  return {
    uiMode,
    setUiMode,
    baseUrl,
    setBaseUrl,
    preAuthToken,
    authToken,
    refreshToken,
    customerProfile,
    setPreAuthTokenValue,
    setAuthTokens,
    logout,
    orders,
    selectedOrderDetail,
    ordersLoading,
    requestLogs,
    activeLog,
    selectedLogId,
    setSelectedLogId,
    clearLogs,
    toast,
    showToast,
    sendRequest,
    registerCustomer,
    loginCustomer,
    createMpin,
    verifyMpin,
    refreshAuth,
    fullSeedLogin,
    fetchProfile,
    fetchOrders,
    fetchOrderDetail,
    initializeOrder,
    updateOrder,
    claimOrder,
    inspectLogInDebugger,
    inspectedEndpointId,
    setInspectedEndpointId,
  };
}
