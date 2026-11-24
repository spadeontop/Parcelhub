import { useCallback, useEffect, useRef, useState } from 'react';
import { executePostmanRequest } from './httpClient';
import { getPostmanEndpointSpec } from './endpoints';
import type {
  AuthActor,
  CustomerListOrdersRes,
  CustomerOrderSummary,
  CustomerProfile,
  HttpMethod,
  PostmanEndpointId,
  PostmanTokenVault,
  RequestLogEntry,
  StaffListOrdersRes,
  StaffOrderSummary,
} from './types';

const STORAGE_KEYS = {
  baseUrl: 'ph_postman_v1_base_url',
  apiPrefix: 'ph_postman_v1_api_prefix',
  customUrls: 'ph_postman_v1_custom_urls',
  customPrefixes: 'ph_postman_v1_custom_prefixes',
  tokens: 'ph_postman_v1_tokens',
  customerProfile: 'ph_postman_v1_customer_profile',
  staffUsername: 'ph_postman_v1_staff_username',
} as const;

export const DEFAULT_BASE_URL_PRESETS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
  { value: '', label: 'Vite Proxy (/api)' },
  { value: 'http://localhost:3000', label: 'http://localhost:3000' },
  { value: 'https://parcelhub-spade.vercel.app', label: 'https://parcelhub-spade.vercel.app' },
];

export const DEFAULT_PREFIX_PRESETS: readonly string[] = ['/api/v1', '/api'];

const EMPTY_VAULT: PostmanTokenVault = {
  customerAuthToken: '',
  customerPreAuthToken: '',
  customerRefreshToken: '',
  customerResetToken: '',
  staffAuthToken: '',
  staffRefreshToken: '',
  realtimeToken: '',
  realtimeChannel: '',
};

function readStorage(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function normalizePresetUrl(raw: string): string {
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned;
}

export function normalizePrefix(raw: string): string {
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  return cleaned;
}

export interface SendPostmanRequestArgs {
  readonly endpointId: PostmanEndpointId;
  readonly method: HttpMethod;
  readonly url: string;
  readonly authActor: AuthActor;
  readonly includeAuth: boolean;
  readonly customHeaders?: Record<string, string>;
  readonly body?: unknown | null;
  readonly rawBodyText?: string;
  readonly tokenOverride?: string;
}

export interface PostmanToast {
  readonly msg: string;
  readonly type: 'success' | 'error';
}

export interface UsePostmanSessionReturn {
  readonly baseUrl: string;
  readonly setBaseUrl: (url: string) => void;
  readonly customUrlPresets: readonly string[];
  readonly addCustomUrlPreset: (raw: string) => void;
  readonly removeCustomUrlPreset: (url: string) => void;
  readonly apiPrefix: string;
  readonly setApiPrefix: (prefix: string) => void;
  readonly customPrefixPresets: readonly string[];
  readonly addCustomPrefixPreset: (raw: string) => void;
  readonly removeCustomPrefixPreset: (prefix: string) => void;
  readonly tokens: PostmanTokenVault;
  readonly updateTokenField: (field: keyof PostmanTokenVault, value: string) => void;
  readonly clearCustomerAuth: () => void;
  readonly clearStaffAuth: () => void;
  readonly customerProfile: CustomerProfile | null;
  readonly staffUsername: string;
  readonly customerOrders: readonly CustomerOrderSummary[];
  readonly staffOrders: readonly StaffOrderSummary[];
  readonly requestLogs: readonly RequestLogEntry[];
  readonly clearLogs: () => void;
  readonly toast: PostmanToast | null;
  readonly showToast: (msg: string, type?: 'success' | 'error') => void;
  readonly sendRequest: (args: SendPostmanRequestArgs) => Promise<RequestLogEntry>;
  readonly quickCustomerLogin: (
    email: string,
    password: string,
    mpin: string
  ) => Promise<{ ok: boolean; loginEntry?: RequestLogEntry; mpinEntry?: RequestLogEntry }>;
  readonly quickStaffLogin: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; loginEntry?: RequestLogEntry }>;
  readonly syncCustomerOrders: (tokenOverride?: string) => Promise<RequestLogEntry>;
  readonly syncStaffOrders: (tokenOverride?: string) => Promise<RequestLogEntry>;
}

export function usePostmanSession(): UsePostmanSessionReturn {
  const [baseUrl, setBaseUrlState] = useState<string>(() => readStorage(STORAGE_KEYS.baseUrl, ''));
  const [apiPrefix, setApiPrefixState] = useState<string>(() =>
    readStorage(STORAGE_KEYS.apiPrefix, '/api/v1')
  );
  const [customUrlPresets, setCustomUrlPresets] = useState<string[]>(() =>
    readJsonStorage<string[]>(STORAGE_KEYS.customUrls, [])
  );
  const [customPrefixPresets, setCustomPrefixPresets] = useState<string[]>(() =>
    readJsonStorage<string[]>(STORAGE_KEYS.customPrefixes, [])
  );
  const [tokens, setTokens] = useState<PostmanTokenVault>(() => ({
    ...EMPTY_VAULT,
    ...readJsonStorage<Partial<PostmanTokenVault>>(STORAGE_KEYS.tokens, {}),
  }));
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(() =>
    readJsonStorage<CustomerProfile | null>(STORAGE_KEYS.customerProfile, null)
  );
  const [staffUsername, setStaffUsername] = useState<string>(() =>
    readStorage(STORAGE_KEYS.staffUsername, 'staff')
  );
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderSummary[]>([]);
  const [staffOrders, setStaffOrders] = useState<StaffOrderSummary[]>([]);
  const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);
  const [toast, setToast] = useState<PostmanToast | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokensRef = useRef<PostmanTokenVault>(tokens);
  tokensRef.current = tokens;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const setBaseUrl = useCallback((url: string) => {
    setBaseUrlState(url);
    writeStorage(STORAGE_KEYS.baseUrl, url);
  }, []);

  const setApiPrefix = useCallback((prefix: string) => {
    setApiPrefixState(prefix);
    writeStorage(STORAGE_KEYS.apiPrefix, prefix);
  }, []);

  const addCustomUrlPreset = useCallback(
    (raw: string) => {
      const normalized = normalizePresetUrl(raw);
      if (!normalized) return;
      const isDefault = DEFAULT_BASE_URL_PRESETS.some((p) => p.value === normalized);
      if (!isDefault) {
        setCustomUrlPresets((prev) => {
          if (prev.includes(normalized)) return prev;
          const next = [...prev, normalized];
          writeStorage(STORAGE_KEYS.customUrls, JSON.stringify(next));
          return next;
        });
      }
      setBaseUrl(normalized);
      showToast(`Target set to ${normalized}`);
    },
    [setBaseUrl, showToast]
  );

  const removeCustomUrlPreset = useCallback(
    (url: string) => {
      setCustomUrlPresets((prev) => {
        const next = prev.filter((p) => p !== url);
        writeStorage(STORAGE_KEYS.customUrls, JSON.stringify(next));
        return next;
      });
      if (baseUrl === url) {
        setBaseUrl('');
      }
      showToast('Removed custom target URL');
    },
    [baseUrl, setBaseUrl, showToast]
  );

  const addCustomPrefixPreset = useCallback(
    (raw: string) => {
      const normalized = normalizePrefix(raw);
      if (!normalized) return;
      if (!DEFAULT_PREFIX_PRESETS.includes(normalized)) {
        setCustomPrefixPresets((prev) => {
          if (prev.includes(normalized)) return prev;
          const next = [...prev, normalized];
          writeStorage(STORAGE_KEYS.customPrefixes, JSON.stringify(next));
          return next;
        });
      }
      setApiPrefix(normalized);
      showToast(`Prefix set to ${normalized}`);
    },
    [setApiPrefix, showToast]
  );

  const removeCustomPrefixPreset = useCallback(
    (prefix: string) => {
      setCustomPrefixPresets((prev) => {
        const next = prev.filter((p) => p !== prefix);
        writeStorage(STORAGE_KEYS.customPrefixes, JSON.stringify(next));
        return next;
      });
      if (apiPrefix === prefix) {
        setApiPrefix('/api/v1');
      }
      showToast('Removed custom API prefix');
    },
    [apiPrefix, setApiPrefix, showToast]
  );

  const persistTokens = useCallback((updater: (prev: PostmanTokenVault) => PostmanTokenVault) => {
    setTokens((prev) => {
      const next = updater(prev);
      tokensRef.current = next;
      writeStorage(STORAGE_KEYS.tokens, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateTokenField = useCallback(
    (field: keyof PostmanTokenVault, value: string) => {
      persistTokens((prev) => ({ ...prev, [field]: value }));
    },
    [persistTokens]
  );

  const clearCustomerAuth = useCallback(() => {
    persistTokens((prev) => ({
      ...prev,
      customerAuthToken: '',
      customerPreAuthToken: '',
      customerRefreshToken: '',
      customerResetToken: '',
    }));
    setCustomerProfile(null);
    setCustomerOrders([]);
    writeStorage(STORAGE_KEYS.customerProfile, 'null');
    showToast('Customer session cleared');
  }, [persistTokens, showToast]);

  const clearStaffAuth = useCallback(() => {
    persistTokens((prev) => ({
      ...prev,
      staffAuthToken: '',
      staffRefreshToken: '',
    }));
    setStaffOrders([]);
    showToast('Staff session cleared');
  }, [persistTokens, showToast]);

  const clearLogs = useCallback(() => {
    setRequestLogs([]);
    showToast('Request history cleared');
  }, [showToast]);

  const buildDirectPath = useCallback(
    (suffix: string) => {
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');
      const cleanPrefix = apiPrefix.trim().replace(/\/+$/, '');
      return `${cleanBase}${cleanPrefix}${suffix}`;
    },
    [baseUrl, apiPrefix]
  );

  const captureFromResponse = useCallback(
    (endpointId: PostmanEndpointId, body: unknown, reqBody: unknown) => {
      if (!body || typeof body !== 'object') return;
      const data = body as Record<string, unknown>;

      if (
        endpointId === 'customer_login' ||
        endpointId === 'customer_register' ||
        endpointId === 'customer_verify_email'
      ) {
        if (typeof data.preAuthToken === 'string' && data.preAuthToken) {
          persistTokens((prev) => ({ ...prev, customerPreAuthToken: data.preAuthToken as string }));
        }
      }

      if (
        endpointId === 'customer_forgot_password_verify' ||
        endpointId === 'customer_forgot_mpin_verify'
      ) {
        if (typeof data.resetToken === 'string' && data.resetToken) {
          persistTokens((prev) => ({ ...prev, customerResetToken: data.resetToken as string }));
        }
      }

      if (
        endpointId === 'customer_create_mpin' ||
        endpointId === 'customer_verify_mpin' ||
        endpointId === 'customer_forgot_password_reset' ||
        endpointId === 'customer_forgot_mpin_reset'
      ) {
        persistTokens((prev) => ({
          ...prev,
          ...(typeof data.authToken === 'string' && data.authToken
            ? { customerAuthToken: data.authToken }
            : {}),
          ...(typeof data.refreshToken === 'string' && data.refreshToken
            ? { customerRefreshToken: data.refreshToken }
            : {}),
          ...(typeof data.preAuthToken === 'string' && data.preAuthToken
            ? { customerPreAuthToken: data.preAuthToken }
            : {}),
        }));
        if (data.customer && typeof data.customer === 'object') {
          const prof = data.customer as CustomerProfile;
          setCustomerProfile(prof);
          writeStorage(STORAGE_KEYS.customerProfile, JSON.stringify(prof));
        }
      }

      if (endpointId === 'customer_refresh') {
        if (typeof data.authToken === 'string' && data.authToken) {
          persistTokens((prev) => ({ ...prev, customerAuthToken: data.authToken as string }));
        }
      }

      if (endpointId === 'customer_profile') {
        if (data.customer && typeof data.customer === 'object') {
          const prof = data.customer as CustomerProfile;
          setCustomerProfile(prof);
          writeStorage(STORAGE_KEYS.customerProfile, JSON.stringify(prof));
        }
      }

      if (endpointId === 'customer_list_orders') {
        const list = (data as Partial<CustomerListOrdersRes>).orders;
        if (Array.isArray(list)) {
          setCustomerOrders([...list]);
        }
      }

      if (endpointId === 'staff_login') {
        persistTokens((prev) => ({
          ...prev,
          ...(typeof data.authToken === 'string' && data.authToken
            ? { staffAuthToken: data.authToken }
            : {}),
          ...(typeof data.refreshToken === 'string' && data.refreshToken
            ? { staffRefreshToken: data.refreshToken }
            : {}),
        }));
        if (reqBody && typeof reqBody === 'object' && 'username' in reqBody) {
          const uname = String((reqBody as { username?: unknown }).username || '').trim();
          if (uname) {
            setStaffUsername(uname);
            writeStorage(STORAGE_KEYS.staffUsername, uname);
          }
        }
      }

      if (endpointId === 'staff_list_orders') {
        const list = (data as Partial<StaffListOrdersRes>).orders;
        if (Array.isArray(list)) {
          setStaffOrders([...list]);
        }
      }

      if (endpointId === 'realtime_token') {
        persistTokens((prev) => ({
          ...prev,
          ...(typeof data.token === 'string' ? { realtimeToken: data.token } : {}),
          ...(typeof data.channel === 'string' ? { realtimeChannel: data.channel } : {}),
        }));
      }
    },
    [persistTokens]
  );

  const sendRequest = useCallback(
    async (args: SendPostmanRequestArgs): Promise<RequestLogEntry> => {
      const spec = getPostmanEndpointSpec(args.endpointId);
      const activeToken =
        args.tokenOverride !== undefined
          ? args.tokenOverride
          : args.authActor === 'customer'
            ? tokensRef.current.customerAuthToken
            : args.authActor === 'staff'
              ? tokensRef.current.staffAuthToken
              : '';

      const result = await executePostmanRequest({
        method: args.method,
        url: args.url,
        authToken: activeToken,
        includeAuth: args.includeAuth && args.authActor !== 'none',
        customHeaders: args.customHeaders,
        body: args.body,
        rawBodyText: args.rawBodyText,
      });

      const entry: RequestLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        endpointId: args.endpointId,
        endpointTitle: spec.title,
        method: args.method,
        request: result.request,
        response: result.response,
      };

      setRequestLogs((prev) => [entry, ...prev].slice(0, 100));

      if (result.response.ok) {
        captureFromResponse(args.endpointId, result.response.body, result.request.body);
      }

      return entry;
    },
    [captureFromResponse]
  );

  const syncCustomerOrders = useCallback(
    async (tokenOverride?: string): Promise<RequestLogEntry> => {
      return sendRequest({
        endpointId: 'customer_list_orders',
        method: 'GET',
        url: buildDirectPath('/customer/orders?limit=50&offset=0'),
        authActor: 'customer',
        includeAuth: true,
        tokenOverride,
      });
    },
    [buildDirectPath, sendRequest]
  );

  const syncStaffOrders = useCallback(
    async (tokenOverride?: string): Promise<RequestLogEntry> => {
      return sendRequest({
        endpointId: 'staff_list_orders',
        method: 'GET',
        url: buildDirectPath('/staff/orders?limit=20&offset=0'),
        authActor: 'staff',
        includeAuth: true,
        tokenOverride,
      });
    },
    [buildDirectPath, sendRequest]
  );

  const quickCustomerLogin = useCallback(
    async (email: string, password: string, mpin: string) => {
      const loginEntry = await sendRequest({
        endpointId: 'customer_login',
        method: 'POST',
        url: buildDirectPath('/customer/login'),
        authActor: 'none',
        includeAuth: false,
        body: { email, password },
      });

      if (!loginEntry.response.ok) {
        showToast('Customer login failed', 'error');
        return { ok: false, loginEntry };
      }

      const preToken =
        loginEntry.response.body &&
        typeof loginEntry.response.body === 'object' &&
        'preAuthToken' in loginEntry.response.body
          ? String((loginEntry.response.body as { preAuthToken?: unknown }).preAuthToken || '')
          : '';

      if (!preToken) {
        showToast('No preAuthToken returned by login', 'error');
        return { ok: false, loginEntry };
      }

      const mpinEntry = await sendRequest({
        endpointId: 'customer_verify_mpin',
        method: 'POST',
        url: buildDirectPath('/customer/mpin'),
        authActor: 'none',
        includeAuth: false,
        body: { preAuthToken: preToken, mpin },
      });

      if (!mpinEntry.response.ok) {
        showToast('Customer MPIN verification failed', 'error');
        return { ok: false, loginEntry, mpinEntry };
      }

      const freshAuth =
        mpinEntry.response.body &&
        typeof mpinEntry.response.body === 'object' &&
        'authToken' in mpinEntry.response.body
          ? String((mpinEntry.response.body as { authToken?: unknown }).authToken || '')
          : '';

      if (freshAuth) {
        await Promise.all([
          sendRequest({
            endpointId: 'customer_profile',
            method: 'GET',
            url: buildDirectPath('/customer/profile'),
            authActor: 'customer',
            includeAuth: true,
            tokenOverride: freshAuth,
          }),
          syncCustomerOrders(freshAuth),
        ]);
      }

      showToast(`Signed in as ${email}`);
      return { ok: true, loginEntry, mpinEntry };
    },
    [buildDirectPath, sendRequest, showToast, syncCustomerOrders]
  );

  const quickStaffLogin = useCallback(
    async (username: string, password: string) => {
      const loginEntry = await sendRequest({
        endpointId: 'staff_login',
        method: 'POST',
        url: buildDirectPath('/staff/login'),
        authActor: 'none',
        includeAuth: false,
        body: { username, password },
      });

      if (!loginEntry.response.ok) {
        showToast('Staff login failed', 'error');
        return { ok: false, loginEntry };
      }

      const freshAuth =
        loginEntry.response.body &&
        typeof loginEntry.response.body === 'object' &&
        'authToken' in loginEntry.response.body
          ? String((loginEntry.response.body as { authToken?: unknown }).authToken || '')
          : '';

      if (freshAuth) {
        await syncStaffOrders(freshAuth);
      }

      showToast(`Signed in as staff "${username}"`);
      return { ok: true, loginEntry };
    },
    [buildDirectPath, sendRequest, showToast, syncStaffOrders]
  );

  return {
    baseUrl,
    setBaseUrl,
    customUrlPresets,
    addCustomUrlPreset,
    removeCustomUrlPreset,
    apiPrefix,
    setApiPrefix,
    customPrefixPresets,
    addCustomPrefixPreset,
    removeCustomPrefixPreset,
    tokens,
    updateTokenField,
    clearCustomerAuth,
    clearStaffAuth,
    customerProfile,
    staffUsername,
    customerOrders,
    staffOrders,
    requestLogs,
    clearLogs,
    toast,
    showToast,
    sendRequest,
    quickCustomerLogin,
    quickStaffLogin,
    syncCustomerOrders,
    syncStaffOrders,
  };
}
