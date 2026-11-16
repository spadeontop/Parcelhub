import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinRes,
  CustomerProfile,
  CustomerOrderSummary,
  CustomerListOrdersQueryParams,
  JWTToken,
} from '../types/api';
import { authApi } from '../services/authApi';
import { orderApi } from '../services/orderApi';
import { customerApi } from '../services/customerApi';
import { v1Storage } from '../utils/storage';

export type ScreenId =
  | 'register'
  | 'login'
  | 'mpin_create'
  | 'mpin_login'
  | 'home'
  | 'create_order'
  | 'confirm_order'
  | 'payment_verification'
  | 'qr_screen'
  | 'order_details'
  | 'transactions'
  | 'notifications'
  | 'profile'
  | 'faq';

export type RegistrationDraft = {
  readonly currentStep: 1 | 2;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly emailError?: string;
};

const DEFAULT_REGISTRATION_DRAFT: RegistrationDraft = {
  currentStep: 1,
  firstName: '',
  lastName: '',
  middleInitial: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  emailError: '',
};

export type ToastState = {
  readonly show: boolean;
  readonly message: string;
};

export type V1ContextType = {
  readonly activeScreen: ScreenId;
  readonly navigateTo: (screen: ScreenId, params?: { orderId?: string }) => void;
  readonly toast: ToastState;
  readonly showToast: (message: string) => void;
  readonly preAuthToken: JWTToken | null;
  readonly authToken: JWTToken | null;
  readonly customer: Partial<CustomerProfile> | null;
  readonly orders: readonly CustomerOrderSummary[];
  readonly selectedOrderId: string | null;
  readonly setSelectedOrderId: (id: string | null) => void;
  readonly registrationDraft: RegistrationDraft;
  readonly updateRegistrationDraft: (partial: Partial<RegistrationDraft>) => void;
  readonly clearRegistrationDraft: () => void;
  readonly registerCustomer: (payload: CustomerRegisterReq) => Promise<CustomerRegisterRes>;
  readonly loginCustomer: (payload: CustomerLoginReq) => Promise<CustomerLoginRes>;
  readonly createCustomerMpin: (mpin: string) => Promise<CustomerCreateMpinRes>;
  readonly verifyCustomerMpin: (mpin: string) => Promise<void>;
  readonly refetchOrders: (query?: CustomerListOrdersQueryParams) => Promise<void>;
  readonly refetchProfile: () => Promise<void>;
};

const V1Context = createContext<V1ContextType | undefined>(undefined);

export const V1Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default entry screen: 'login'
  const [activeScreen, setActiveScreen] = useState<ScreenId>('login');
  const [preAuthToken, setPreAuthToken] = useState<JWTToken | null>(null);
  const [authToken, setAuthToken] = useState<JWTToken | null>(null);
  const [customer, setCustomer] = useState<Partial<CustomerProfile> | null>(null);
  const [orders, setOrders] = useState<readonly CustomerOrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(
    DEFAULT_REGISTRATION_DRAFT
  );

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3200);
  }, []);

  const navigateTo = useCallback((screen: ScreenId, params?: { orderId?: string }) => {
    setActiveScreen(screen);
    if (params?.orderId) {
      setSelectedOrderId(params.orderId);
    }
  }, []);

  const updateRegistrationDraft = useCallback(
    (partial: Partial<RegistrationDraft>) => {
      setRegistrationDraft((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const clearRegistrationDraft = useCallback(() => {
    setRegistrationDraft(DEFAULT_REGISTRATION_DRAFT);
  }, []);

  // V1 Profile Refresh with 401 Silent Renewal trigger
  const refetchProfile = useCallback(async (): Promise<void> => {
    let token = authToken;
    if (!token) token = await v1Storage.getAuthToken();
    if (!token) return;

    try {
      const res = await customerApi.getProfile(token);
      if (res?.customer) {
        setCustomer(res.customer);
      }
    } catch (err: any) {
      // V1 Feature #1: Silent session refresh interceptor on 401
      if (err?.statusCode === 401) {
        const refresh = await v1Storage.getRefreshToken();
        if (refresh) {
          showToast('Session expired. Enter MPIN to resume.');
          setActiveScreen('mpin_login');
        } else {
          setActiveScreen('login');
        }
      }
    }
  }, [authToken, showToast]);

  // V1 Orders Fetch with 401 Silent Renewal trigger
  const refetchOrders = useCallback(
    async (query?: CustomerListOrdersQueryParams): Promise<void> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) return;

      try {
        const res = await orderApi.listOrders(token, query);
        setOrders(res.orders || []);
      } catch (err: any) {
        // V1 Feature #1: Silent session refresh interceptor on 401
        if (err?.statusCode === 401) {
          const refresh = await v1Storage.getRefreshToken();
          if (refresh) {
            showToast('Session expired. Enter MPIN to resume.');
            setActiveScreen('mpin_login');
          } else {
            setActiveScreen('login');
          }
        }
      }
    },
    [authToken, showToast]
  );

  // Initialize stored tokens on mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        const [storedPreAuth, storedAuth, storedProfile] = await Promise.all([
          v1Storage.getPreAuthToken(),
          v1Storage.getAuthToken(),
          v1Storage.getCustomerProfile(),
        ]);
        if (storedPreAuth) setPreAuthToken(storedPreAuth);
        if (storedProfile) setCustomer(storedProfile);

        if (storedAuth) {
          setAuthToken(storedAuth);
          setActiveScreen('home');
        }
      } catch {}
    };
    initStorage();
  }, []);

  // When authToken is set, load fresh profile and orders
  useEffect(() => {
    if (authToken) {
      refetchProfile();
      refetchOrders();
    }
  }, [authToken, refetchProfile, refetchOrders]);

  // Interval polling while viewing HomeScreen
  useEffect(() => {
    if (activeScreen !== 'home' || !authToken) return;

    let isFetching = false;
    const intervalTimer = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await refetchOrders();
      } finally {
        isFetching = false;
      }
    }, 5000);

    return () => clearInterval(intervalTimer);
  }, [activeScreen, authToken, refetchOrders]);

  // V1 Register Customer Action
  const registerCustomer = useCallback(
    async (payload: CustomerRegisterReq): Promise<CustomerRegisterRes> => {
      const res = await authApi.register(payload);

      setPreAuthToken(res.preAuthToken);
      setCustomer({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        middleInitial: payload.middleInitial,
        phoneNumber: payload.phoneNumber,
      });

      showToast(res.statusMessage || 'Registration successful');
      setActiveScreen('mpin_create');
      return res;
    },
    [showToast]
  );

  // V1 Login Customer Action
  const loginCustomer = useCallback(
    async (payload: CustomerLoginReq): Promise<CustomerLoginRes> => {
      const res = await authApi.login(payload);

      setPreAuthToken(res.preAuthToken);
      setCustomer((prev) => ({
        ...prev,
        email: payload.email.trim().toLowerCase(),
      }));

      showToast(res.statusMessage || 'Credentials verified. Please enter your MPIN.');
      setActiveScreen('mpin_login');
      return res;
    },
    [showToast]
  );

  // V1 Create MPIN Action
  const createCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerCreateMpinRes> => {
      let activePreAuth = preAuthToken;
      if (!activePreAuth) {
        activePreAuth = await v1Storage.getPreAuthToken();
      }

      if (!activePreAuth) {
        showToast('Session expired. Please log in again.');
        setActiveScreen('login');
        throw new Error('Pre-auth token missing. Please log in again.');
      }

      const res = await authApi.createMpin({
        preAuthToken: activePreAuth,
        mpin: mpin as any,
      });

      setAuthToken(res.authToken);
      if (res.customer) {
        setCustomer(res.customer);
      }
      setPreAuthToken(null);
      clearRegistrationDraft();

      showToast(res.statusMessage || 'MPIN created successfully!');
      setActiveScreen('home');
      return res;
    },
    [preAuthToken, showToast, clearRegistrationDraft]
  );

  // V1 Verify MPIN Action (Dual-Mode: preAuthToken or refreshToken)
  const verifyCustomerMpin = useCallback(
    async (mpin: string): Promise<void> => {
      let activePreAuth = preAuthToken;
      if (!activePreAuth) {
        activePreAuth = await v1Storage.getPreAuthToken();
      }

      if (activePreAuth) {
        // Mode A: Session verification with preAuthToken
        const res = await authApi.verifyMpin({
          preAuthToken: activePreAuth,
          mpin: mpin as any,
        });

        setAuthToken(res.authToken);
        if (res.customer) {
          setCustomer(res.customer);
        }
        setPreAuthToken(null);

        showToast(res.statusMessage || 'Access granted');
        setActiveScreen('home');
        return;
      }

      // Mode B: Silent session unlock with refreshToken
      const storedRefresh = await v1Storage.getRefreshToken();
      if (storedRefresh) {
        const res = await authApi.refreshToken({
          refreshToken: storedRefresh,
          mpin: mpin as any,
        });

        setAuthToken(res.authToken);
        showToast(res.statusMessage || 'Session renewed');
        setActiveScreen('home');
        return;
      }

      // Neither token available -> redirect to login
      showToast('Session expired. Please log in again.');
      setActiveScreen('login');
      throw new Error('Please log in again');
    },
    [preAuthToken, showToast]
  );

  const value: V1ContextType = {
    activeScreen,
    navigateTo,
    toast,
    showToast,
    preAuthToken,
    authToken,
    customer,
    orders,
    selectedOrderId,
    setSelectedOrderId,
    registrationDraft,
    updateRegistrationDraft,
    clearRegistrationDraft,
    registerCustomer,
    loginCustomer,
    createCustomerMpin,
    verifyCustomerMpin,
    refetchOrders,
    refetchProfile,
  };

  return <V1Context.Provider value={value}>{children}</V1Context.Provider>;
};

export const useV1 = (): V1ContextType => {
  const context = useContext(V1Context);
  if (!context) {
    throw new Error('useV1 must be used within a V1Provider');
  }
  return context;
};
