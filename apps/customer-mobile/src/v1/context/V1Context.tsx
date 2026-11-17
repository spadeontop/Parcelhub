import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { BackHandler } from 'react-native';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinRes,
  CustomerInitOrderRes,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  CustomerClaimOrderRes,
  CustomerOrderDetail,
  CustomerProfile,
  CustomerOrderSummary,
  CustomerListOrdersQueryParams,
  JWTToken,
  OrderId,
} from '../types/api';
import { authApi } from '../services/authApi';
import { orderApi } from '../services/orderApi';
import { customerApi } from '../services/customerApi';
import { notificationApi } from '../services/notificationApi';
import { setUnauthorizedHandler } from '../services/apiClient';
import {
  requestNotificationPermission,
  getFcmDeviceToken,
  setupFcmForegroundListener,
  setupFcmNotificationOpenedListener,
  checkInitialNotification,
  setupFcmTokenRefreshListener,
  RemoteFcmMessage,
} from '../services/fcmService';
import { v1Storage } from '../utils/storage';
import { formatOrderDate } from '../utils/date';

export type CustomerNotification = {
  readonly id: string;
  readonly orderId?: string;
  readonly title: string;
  readonly body: string;
  readonly time: string;
  readonly unread: boolean;
};

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

export type OrderDraft = {
  readonly orderId?: OrderId | null;
  readonly ticketCode?: string | null;
  readonly imageUrl?: string | null;
  readonly previewUri?: string | null;
  readonly trackingId?: string;
  readonly productName?: string;
  readonly recipientName?: string;
  readonly price?: number;
  readonly totalAmount?: string;
};

const DEFAULT_ORDER_DRAFT: OrderDraft = {
  orderId: null,
  ticketCode: null,
  imageUrl: null,
  previewUri: null,
  trackingId: '',
  productName: '',
  recipientName: '',
  price: 0,
  totalAmount: '',
};

export type ToastState = {
  readonly show: boolean;
  readonly message: string;
  readonly onPress?: () => void;
};

export type V1ContextType = {
  readonly activeScreen: ScreenId;
  readonly navigateTo: (
    screen: ScreenId,
    params?: { orderId?: string | null; ticketCode?: string | null }
  ) => void;
  readonly goBack: () => boolean;
  readonly fetchHomeData: () => Promise<void>;
  readonly toast: ToastState;
  readonly showToast: (message: string, onPress?: () => void) => void;
  readonly preAuthToken: JWTToken | null;
  readonly authToken: JWTToken | null;
  readonly customer: Partial<CustomerProfile> | null;
  readonly orders: readonly CustomerOrderSummary[];
  readonly selectedOrderId: string | null;
  readonly setSelectedOrderId: (id: string | null) => void;
  readonly selectedOrderTicketCode: string | null;
  readonly setSelectedOrderTicketCode: (code: string | null) => void;
  readonly registrationDraft: RegistrationDraft;
  readonly updateRegistrationDraft: (partial: Partial<RegistrationDraft>) => void;
  readonly clearRegistrationDraft: () => void;
  readonly orderDraft: OrderDraft;
  readonly updateOrderDraft: (partial: Partial<OrderDraft>) => void;
  readonly clearOrderDraft: () => void;
  readonly registerCustomer: (payload: CustomerRegisterReq) => Promise<CustomerRegisterRes>;
  readonly loginCustomer: (payload: CustomerLoginReq) => Promise<CustomerLoginRes>;
  readonly createCustomerMpin: (mpin: string) => Promise<CustomerCreateMpinRes>;
  readonly verifyCustomerMpin: (mpin: string) => Promise<void>;
  readonly refetchOrders: (query?: CustomerListOrdersQueryParams) => Promise<void>;
  readonly refetchProfile: () => Promise<void>;
  readonly initializeCustomerOrder: (imageUrl: string) => Promise<CustomerInitOrderRes>;
  readonly confirmCustomerOrder: (
    orderData: CustomerUpdateOrderReq['order']
  ) => Promise<CustomerUpdateOrderRes>;
  readonly fetchOrderDetail: (orderId: string) => Promise<CustomerOrderDetail>;
  readonly claimCustomerOrder: (orderId: string) => Promise<CustomerClaimOrderRes>;
  readonly isPodModalOpen: boolean;
  readonly openPodModal: () => void;
  readonly closePodModal: () => void;
  readonly notifications: readonly CustomerNotification[];
  readonly markAllNotificationsAsRead: () => void;
  readonly notificationsEnabled: boolean;
  readonly togglePushNotifications: () => Promise<void>;
  readonly signOutCustomer: () => Promise<void>;
  readonly handleSessionExpired: () => Promise<void>;
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
  const [selectedOrderTicketCode, setSelectedOrderTicketCode] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(
    DEFAULT_REGISTRATION_DRAFT
  );
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(DEFAULT_ORDER_DRAFT);

  // Expiry mutex and screen tracker refs
  const isHandlingExpiryRef = useRef(false);
  const activeScreenRef = useRef<ScreenId>('login');
  activeScreenRef.current = activeScreen;
  const selectedOrderIdRef = useRef<string | null>(null);
  selectedOrderIdRef.current = selectedOrderId;
  const selectedOrderTicketCodeRef = useRef<string | null>(null);
  selectedOrderTicketCodeRef.current = selectedOrderTicketCode;

  // Home refresh trigger counter & fetch guard
  const [homeFetchKey, setHomeFetchKey] = useState<number>(0);
  const isFetchingHomeRef = useRef<boolean>(false);

  // Navigation history for back press handling
  const screenHistoryRef = useRef<ScreenId[]>([]);

  // Stored return target to resume after MPIN unlock
  const returnTargetRef = useRef<{
    screen: ScreenId;
    orderId?: string | null;
    ticketCode?: string | null;
  } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, onPress?: () => void) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message, onPress });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', onPress: undefined });
    }, 3200);
  }, []);

  const navigateTo = useCallback(
    (screen: ScreenId, params?: { orderId?: string | null; ticketCode?: string | null }) => {
      if (screen === 'login' || screen === 'register') {
        returnTargetRef.current = null;
        screenHistoryRef.current = [];
      } else if (screen !== activeScreenRef.current) {
        screenHistoryRef.current.push(activeScreenRef.current);
        if (screenHistoryRef.current.length > 20) {
          screenHistoryRef.current.shift();
        }
      }

      if (screen === 'home') {
        // Trigger immediate fetch straight away, even if already on 'home'
        setHomeFetchKey((k) => k + 1);
      }

      setActiveScreen(screen);
      if (params?.orderId !== undefined) {
        setSelectedOrderId(params.orderId);
      }
      if (params?.ticketCode !== undefined) {
        setSelectedOrderTicketCode(params.ticketCode);
      }
    },
    []
  );

  const goBack = useCallback((): boolean => {
    const current = activeScreenRef.current;
    if (current === 'home' || current === 'login' || current === 'register') {
      return false;
    }

    while (screenHistoryRef.current.length > 0) {
      const prev = screenHistoryRef.current.pop()!;
      if (prev !== current && prev !== 'login' && prev !== 'register') {
        navigateTo(prev);
        return true;
      }
    }

    navigateTo('home');
    return true;
  }, [navigateTo]);

  // Global Android hardware back press listener: navigates back/home gracefully
  useEffect(() => {
    const handleHardwareBack = () => {
      return goBack();
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => backSub.remove();
  }, [goBack]);

  const updateRegistrationDraft = useCallback(
    (partial: Partial<RegistrationDraft>) => {
      setRegistrationDraft((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const clearRegistrationDraft = useCallback(() => {
    setRegistrationDraft(DEFAULT_REGISTRATION_DRAFT);
  }, []);

  const updateOrderDraft = useCallback((partial: Partial<OrderDraft>) => {
    setOrderDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearOrderDraft = useCallback(() => {
    setOrderDraft(DEFAULT_ORDER_DRAFT);
  }, []);

  // Centralized Session Expiry Handler
  const handleSessionExpired = useCallback(async (): Promise<void> => {
    if (isHandlingExpiryRef.current) return;
    isHandlingExpiryRef.current = true;

    try {
      const currentScreen = activeScreenRef.current;
      // Preserve current post-auth screen to resume after MPIN verification
      if (
        currentScreen !== 'login' &&
        currentScreen !== 'register' &&
        currentScreen !== 'mpin_login' &&
        currentScreen !== 'mpin_create'
      ) {
        returnTargetRef.current = {
          screen: currentScreen,
          orderId: selectedOrderIdRef.current,
          ticketCode: selectedOrderTicketCodeRef.current,
        };
      }

      const refresh = await v1Storage.getRefreshToken();
      if (refresh) {
        // Invalidate expired auth token in storage & memory
        await v1Storage.clearAuthToken();
        setAuthToken(null);

        showToast('Session expired. Enter MPIN to resume.');
        setActiveScreen('mpin_login');
      } else {
        // No refresh token available: clear all credentials and redirect to login
        await v1Storage.clearAllTokens();
        setPreAuthToken(null);
        setAuthToken(null);
        setCustomer(null);
        setOrders([]);
        setSelectedOrderId(null);
        setSelectedOrderTicketCode(null);
        returnTargetRef.current = null;

        showToast('Session expired. Please log in again.');
        setActiveScreen('login');
      }
    } finally {
      setTimeout(() => {
        isHandlingExpiryRef.current = false;
      }, 1500);
    }
  }, [showToast]);

  // Register centralized unauthorized interceptor with apiClient
  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleSessionExpired();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleSessionExpired]);

  // V1 Profile Refresh with 401 Silent Renewal trigger
  const refetchProfile = useCallback(async (): Promise<void> => {
    let token = authToken;
    if (!token) token = await v1Storage.getAuthToken();
    if (!token) {
      await handleSessionExpired();
      return;
    }

    try {
      const res = await customerApi.getProfile(token);
      if (res?.customer) {
        setCustomer(res.customer);
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        await handleSessionExpired();
      }
    }
  }, [authToken, handleSessionExpired]);

  // V1 Orders Fetch with 401 Silent Renewal trigger
  const refetchOrders = useCallback(
    async (query?: CustomerListOrdersQueryParams): Promise<void> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        await handleSessionExpired();
        return;
      }

      try {
        const res = await orderApi.listOrders(token, query);
        setOrders(res.orders || []);
      } catch (err: any) {
        if (err?.statusCode === 401) {
          await handleSessionExpired();
        }
      }
    },
    [authToken, handleSessionExpired]
  );

  // Home data fetcher: fetches orders and profile straight away
  const fetchHomeData = useCallback(async (): Promise<void> => {
    let token = authToken;
    if (!token) token = await v1Storage.getAuthToken();
    if (!token) return;

    if (isFetchingHomeRef.current) return;
    isFetchingHomeRef.current = true;
    try {
      await Promise.allSettled([refetchOrders(), refetchProfile()]);
    } catch (e) {
      console.warn('[Home] Failed to fetch home data:', e);
    } finally {
      isFetchingHomeRef.current = false;
    }
  }, [authToken, refetchOrders, refetchProfile]);

  // Initialize stored tokens on mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        const [storedPreAuth, storedAuth, storedProfile, storedPushPref] = await Promise.all([
          v1Storage.getPreAuthToken(),
          v1Storage.getAuthToken(),
          v1Storage.getCustomerProfile(),
          v1Storage.getPushNotificationsEnabled(),
        ]);
        if (storedPreAuth) setPreAuthToken(storedPreAuth);
        if (storedProfile) setCustomer(storedProfile);
        setNotificationsEnabled(storedPushPref);

        if (storedAuth) {
          setAuthToken(storedAuth);
          navigateTo('home');
        }
      } catch {}
    };
    initStorage();
  }, [navigateTo]);

  // When authToken is set, load fresh profile and orders if not already on home
  useEffect(() => {
    if (authToken && activeScreen !== 'home') {
      refetchProfile();
      refetchOrders();
    }
  }, [authToken, activeScreen, refetchProfile, refetchOrders]);

  // Push token registration helper
  const registerDevicePushToken = useCallback(async (tokenToAuth: JWTToken) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return;
      }
      const fcmToken = await getFcmDeviceToken();
      if (fcmToken) {
        await notificationApi.uploadToken(fcmToken, tokenToAuth);
      }
    } catch (err) {
      console.warn('[FCM] Push token registration warning:', err);
    }
  }, []);

  // When authToken is set and notificationsEnabled is true, register token
  useEffect(() => {
    if (authToken && notificationsEnabled) {
      registerDevicePushToken(authToken);
    }
  }, [authToken, notificationsEnabled, registerDevicePushToken]);

  // FCM listeners: foreground message, background notification opened, cold start notification, token refresh
  useEffect(() => {
    if (!authToken) return;

    // 1. Foreground message listener
    const unsubForeground = setupFcmForegroundListener((message: RemoteFcmMessage) => {
      const title = message.notification?.title || 'Order Update';
      const body = message.notification?.body || 'Your order status has been updated';
      const orderId = message.data?.orderId || message.data?.notifId;
      const ticketCode = message.data?.ticketCode;
      refetchOrders().catch(() => {});
      showToast(
        `📦 ${title}: ${body}`,
        orderId || ticketCode
          ? () =>
              navigateTo('order_details', {
                orderId: orderId || null,
                ticketCode: ticketCode || null,
              })
          : undefined
      );
    });

    // 2. Notification opened while running in background
    const unsubOpened = setupFcmNotificationOpenedListener((message: RemoteFcmMessage) => {
      const orderId = message.data?.orderId || message.data?.notifId;
      const ticketCode = message.data?.ticketCode;
      refetchOrders().catch(() => {});
      if (orderId || ticketCode) {
        // Direct both PAYMENT_VERIFIED and READY_TO_CLAIM (and other order notifications) to complete details
        navigateTo('order_details', {
          orderId: orderId || null,
          ticketCode: ticketCode || null,
        });
      } else {
        navigateTo('notifications');
      }
    });

    // 3. Initial notification if opened from cold/killed state
    checkInitialNotification((message: RemoteFcmMessage) => {
      const orderId = message.data?.orderId || message.data?.notifId;
      const ticketCode = message.data?.ticketCode;
      refetchOrders().catch(() => {});
      if (orderId || ticketCode) {
        // Direct both PAYMENT_VERIFIED and READY_TO_CLAIM (and other order notifications) to complete details
        navigateTo('order_details', {
          orderId: orderId || null,
          ticketCode: ticketCode || null,
        });
      } else {
        navigateTo('notifications');
      }
    });

    // 4. Token refresh listener
    const unsubRefresh = setupFcmTokenRefreshListener(async (newToken: string) => {
      if (authToken && notificationsEnabled) {
        try {
          await notificationApi.uploadToken(newToken, authToken);
        } catch (e) {
          console.warn('[FCM] Error updating refreshed token:', e);
        }
      }
    });

    return () => {
      unsubForeground();
      unsubOpened();
      unsubRefresh();
    };
  }, [authToken, notificationsEnabled, showToast, refetchOrders, navigateTo]);

  // Push notifications toggle handler
  const togglePushNotifications = useCallback(async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    await v1Storage.setPushNotificationsEnabled(nextVal);

    if (nextVal) {
      if (authToken) {
        const hasPerm = await requestNotificationPermission();
        if (hasPerm) {
          const token = await getFcmDeviceToken();
          if (token) {
            await notificationApi.uploadToken(token, authToken);
          }
          showToast('Push notifications enabled');
        } else {
          showToast('Notification permission not granted in system settings');
        }
      }
    } else {
      if (authToken) {
        try {
          await notificationApi.deleteToken(authToken);
        } catch {}
      }
      showToast('Push notifications disabled');
    }
  }, [notificationsEnabled, authToken, showToast]);

  // Polling & immediate fetch when viewing HomeScreen
  useEffect(() => {
    if (activeScreen !== 'home' || !authToken) return;

    // Call data fetching function straight before going to the usual polling
    fetchHomeData();

    let isPolling = false;
    const intervalTimer = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await refetchOrders();
      } finally {
        isPolling = false;
      }
    }, 5000);

    return () => clearInterval(intervalTimer);
  }, [activeScreen, authToken, homeFetchKey, fetchHomeData, refetchOrders]);

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
      navigateTo('home');
      return res;
    },
    [preAuthToken, showToast, clearRegistrationDraft, navigateTo]
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
        navigateTo('home');
        return;
      }

      // Mode B: Silent session unlock with refreshToken
      const storedRefresh = await v1Storage.getRefreshToken();
      if (storedRefresh) {
        try {
          const res = await authApi.refreshToken({
            refreshToken: storedRefresh,
            mpin: mpin as any,
          });

          setAuthToken(res.authToken);
          showToast(res.statusMessage || 'Session renewed');

          // Resume previously active screen if available
          if (returnTargetRef.current) {
            const target = returnTargetRef.current;
            returnTargetRef.current = null;
            navigateTo(target.screen, {
              orderId: target.orderId,
              ticketCode: target.ticketCode,
            });
          } else {
            navigateTo('home');
          }
          return;
        } catch (err: any) {
          const status = err?.statusCode || err?.status;
          const msg = err?.message || '';

          // If Incorrect MPIN (HTTP 401 with 'incorrect'), rethrow to let MpinLoginScreen display error
          if (status === 401 && msg.toLowerCase().includes('incorrect')) {
            throw err;
          }

          // If refreshToken itself is expired/invalid (HTTP 401/403), wipe stored credentials
          if (status === 401 || status === 403) {
            await v1Storage.clearAllTokens();
            setAuthToken(null);
            setPreAuthToken(null);
            setCustomer(null);
            returnTargetRef.current = null;
          }
          throw err;
        }
      }

      // Neither token available -> redirect to login
      await handleSessionExpired();
      throw new Error('Please log in again');
    },
    [preAuthToken, showToast, navigateTo, handleSessionExpired]
  );

  // V1 Initialize Order Action (V1 Feature #5 Decoupled Order Creation)
  const initializeCustomerOrder = useCallback(
    async (imageUrl: string): Promise<CustomerInitOrderRes> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        await handleSessionExpired();
        throw new Error('Please log in again');
      }

      const res = await orderApi.initializeOrder(token, imageUrl);

      // Pre-fill recipient name from customer account profile full name (V1 Feature #5)
      const defaultRecipient = customer
        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
        : '';

      updateOrderDraft({
        orderId: res.orderId,
        ticketCode: res.ticketCode,
        imageUrl,
        recipientName: defaultRecipient,
      });

      setSelectedOrderTicketCode(res.ticketCode);
      showToast(res.statusMessage || 'Order initialized');
      setActiveScreen('confirm_order');
      return res;
    },
    [authToken, customer, showToast, updateOrderDraft, setSelectedOrderTicketCode, handleSessionExpired]
  );

  const confirmCustomerOrder = useCallback(
    async (orderData: CustomerUpdateOrderReq['order']): Promise<CustomerUpdateOrderRes> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        await handleSessionExpired();
        throw new Error('Please log in again');
      }

      const orderId = orderDraft.orderId;
      const ticketCode = orderDraft.ticketCode;
      if (!orderId) {
        showToast('No active order to confirm. Please start again.');
        setActiveScreen('create_order');
        throw new Error('No active order ID');
      }

      try {
        const res = await orderApi.confirmOrder(token, orderId, orderData);
        setSelectedOrderId(orderId);
        if (ticketCode) {
          setSelectedOrderTicketCode(ticketCode);
        }
        showToast(res.statusMessage || 'Order details confirmed');
        clearOrderDraft();
        setActiveScreen('payment_verification');
        return res;
      } catch (err: any) {
        if (
          err?.statusCode === 400 &&
          (err?.error === 'OrderNotEditable' ||
            err?.message?.includes('Only PENDING_INITIALIZATION'))
        ) {
          showToast(err?.message || 'This order was already confirmed.');
          setSelectedOrderId(orderId);
          if (ticketCode) {
            setSelectedOrderTicketCode(ticketCode);
          }
          clearOrderDraft();
          setActiveScreen('payment_verification');
        }
        throw err;
      }
    },
    [
      authToken,
      orderDraft.orderId,
      orderDraft.ticketCode,
      showToast,
      clearOrderDraft,
      setActiveScreen,
      setSelectedOrderId,
      setSelectedOrderTicketCode,
      handleSessionExpired,
    ]
  );

  const fetchOrderDetail = useCallback(
    async (orderId: string): Promise<CustomerOrderDetail> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        await handleSessionExpired();
        throw new Error('Please log in again');
      }
      const res = await orderApi.getOrder(token, orderId);
      return res.order;
    },
    [authToken, handleSessionExpired]
  );

  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);
  const openPodModal = useCallback(() => setIsPodModalOpen(true), []);
  const closePodModal = useCallback(() => setIsPodModalOpen(false), []);

  const claimCustomerOrder = useCallback(
    async (orderId: string): Promise<CustomerClaimOrderRes> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        await handleSessionExpired();
        throw new Error('Please log in again');
      }
      const res = await orderApi.claimOrder(token, orderId);
      showToast(res.statusMessage || 'Order claim initiated');
      return res;
    },
    [authToken, showToast, handleSessionExpired]
  );

  const [readNotificationIds, setReadNotificationIds] = useState<ReadonlySet<string>>(
    new Set()
  );

  const notifications = useMemo<readonly CustomerNotification[]>(() => {
    return orders.map((o) => {
      let title = 'Order Update';
      let body = `${o.productName || 'Your order'} status is now ${o.status}.`;
      if (o.status === 'READY_TO_CLAIM') {
        title = 'Parcel Ready for Claim';
        body = `${o.productName || 'Your parcel'} has arrived at Lily’s Catering Hub and is ready for pickup.`;
      } else if (o.status === 'AWAITING_PARCEL') {
        title = 'Payment Verified';
        const formattedAmount =
          o.amountReceived != null
            ? ` of ₱${Number(o.amountReceived).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : '';
        body = `Payment${formattedAmount} received for ${o.productName || 'your parcel'}. Now awaiting courier arrival.`;
      } else if (o.status === 'PAYMENT_REQUIRED') {
        title = 'Order Created';
        body = `Order initialized for ${o.productName || 'item'}. Please complete payment at Lily’s Catering Hub.`;
      } else if (o.status === 'CLAIMED') {
        title = 'Parcel Claimed';
        body = `${o.productName || 'Parcel'} was claimed. Thank you for using ParcelHub!`;
      }

      const notifId = `${o.id}_${o.status}`;
      return {
        id: notifId,
        orderId: o.id,
        title,
        body,
        time: formatOrderDate(o.timestamp),
        unread: !readNotificationIds.has(notifId),
      };
    });
  }, [orders, readNotificationIds]);

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = new Set<string>();
    notifications.forEach((n) => allIds.add(n.id));
    setReadNotificationIds(allIds);
  }, [notifications]);

  const signOutCustomer = useCallback(async () => {
    if (authToken) {
      try {
        await notificationApi.deleteToken(authToken);
      } catch (e) {
        console.warn('[FCM] Token cleanup warning on signout:', e);
      }
    }
    await v1Storage.clearAllTokens();
    setPreAuthToken(null);
    setAuthToken(null);
    setCustomer(null);
    setOrders([]);
    setSelectedOrderId(null);
    setSelectedOrderTicketCode(null);
    returnTargetRef.current = null;
    screenHistoryRef.current = [];
    clearRegistrationDraft();
    clearOrderDraft();
    setActiveScreen('login');
    showToast('Signed out successfully');
  }, [authToken, clearRegistrationDraft, clearOrderDraft, showToast]);

  const value: V1ContextType = {
    activeScreen,
    navigateTo,
    goBack,
    fetchHomeData,
    toast,
    showToast,
    preAuthToken,
    authToken,
    customer,
    orders,
    selectedOrderId,
    setSelectedOrderId,
    selectedOrderTicketCode,
    setSelectedOrderTicketCode,
    registrationDraft,
    updateRegistrationDraft,
    clearRegistrationDraft,
    orderDraft,
    updateOrderDraft,
    clearOrderDraft,
    registerCustomer,
    loginCustomer,
    createCustomerMpin,
    verifyCustomerMpin,
    refetchOrders,
    refetchProfile,
    initializeCustomerOrder,
    confirmCustomerOrder,
    fetchOrderDetail,
    claimCustomerOrder,
    isPodModalOpen,
    openPodModal,
    closePodModal,
    notifications,
    markAllNotificationsAsRead,
    notificationsEnabled,
    togglePushNotifications,
    signOutCustomer,
    handleSessionExpired,
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
