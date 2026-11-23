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
  TransactionFilter,
  JWTToken,
  OrderId,
  ScreenshotSourceApp,
} from '../types/api';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '../services/apiClient';
import { authApi } from '../services/authApi';
import { orderApi } from '../services/orderApi';
import { customerApi } from '../services/customerApi';
import { notificationApi } from '../services/notificationApi';
import { customerQueryKeys } from '../query/queryClient';
import { useCustomerOrdersQuery, useCustomerProfileQuery } from '../query/useCustomerQueries';
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
import { isJwtExpired } from '../utils/jwt';
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

export type NavigationStackEntry = {
  readonly screen: ScreenId;
  readonly orderId?: string | null;
  readonly ticketCode?: string | null;
  readonly filter?: TransactionFilter;
};

const TOP_LEVEL_SCREENS: readonly ScreenId[] = [
  'home',
  'transactions',
  'notifications',
  'profile',
];

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
  readonly trackingIdLocked?: boolean;
  readonly sourceApp?: ScreenshotSourceApp;
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
};

export type V1ContextType = {
  readonly activeScreen: ScreenId;
  readonly navigateTo: (
    screen: ScreenId,
    params?: {
      orderId?: string | null;
      ticketCode?: string | null;
      filter?: TransactionFilter;
    }
  ) => void;
  readonly goBack: () => void;
  readonly transactionFilter: TransactionFilter;
  readonly setTransactionFilter: (filter: TransactionFilter) => void;
  readonly toast: ToastState;
  readonly showToast: (message: string) => void;
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
  readonly switchAccount: () => Promise<void>;
  readonly signOutCustomer: () => Promise<void>;
};

const V1Context = createContext<V1ContextType | undefined>(undefined);

export const V1Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default entry screen: 'login'
  const [activeScreen, setActiveScreen] = useState<ScreenId>('login');
  const [navigationHistory, setNavigationHistory] = useState<readonly NavigationStackEntry[]>([]);
  const navigationHistoryRef = useRef<readonly NavigationStackEntry[]>(navigationHistory);
  navigationHistoryRef.current = navigationHistory;
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');
  const [preAuthToken, setPreAuthToken] = useState<JWTToken | null>(null);
  const [authToken, setAuthToken] = useState<JWTToken | null>(null);
  const [customer, setCustomer] = useState<Partial<CustomerProfile> | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderTicketCode, setSelectedOrderTicketCode] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(
    DEFAULT_REGISTRATION_DRAFT
  );
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(DEFAULT_ORDER_DRAFT);

  const queryClient = useQueryClient();
  const isHandlingUnauthorizedRef = useRef<boolean>(false);

  // References to keep navigation callbacks fresh without recreating them
  const activeScreenRef = useRef<ScreenId>(activeScreen);
  activeScreenRef.current = activeScreen;

  const selectedOrderIdRef = useRef<string | null>(selectedOrderId);
  selectedOrderIdRef.current = selectedOrderId;

  const selectedOrderTicketCodeRef = useRef<string | null>(selectedOrderTicketCode);
  selectedOrderTicketCodeRef.current = selectedOrderTicketCode;

  const transactionFilterRef = useRef<TransactionFilter>(transactionFilter);
  transactionFilterRef.current = transactionFilter;

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

  const navigateTo = useCallback(
    (
      screen: ScreenId,
      params?: {
        orderId?: string | null;
        ticketCode?: string | null;
        filter?: TransactionFilter;
      }
    ) => {
      const currentScreen = activeScreenRef.current;
      const currentOrderId = selectedOrderIdRef.current;
      const currentTicketCode = selectedOrderTicketCodeRef.current;
      const currentFilter = transactionFilterRef.current;

      if (screen === currentScreen) {
        if (params?.orderId !== undefined) {
          setSelectedOrderId(params.orderId);
        }
        if (params?.ticketCode !== undefined) {
          setSelectedOrderTicketCode(params.ticketCode);
        }
        if (params?.filter !== undefined) {
          setTransactionFilter(params.filter);
        }
        return;
      }

      // If returning to a top-level tab (home, transactions, notifications, profile),
      // reset the sub-screen navigation history stack
      if (TOP_LEVEL_SCREENS.includes(screen)) {
        setNavigationHistory([]);
      } else {
        // Navigating to a sub-screen / modal: push current screen and context onto stack
        setNavigationHistory((prev) => [
          ...prev,
          {
            screen: currentScreen,
            orderId: currentOrderId,
            ticketCode: currentTicketCode,
            filter: currentFilter,
          },
        ]);
      }

      setActiveScreen(screen);
      if (params?.orderId !== undefined) {
        setSelectedOrderId(params.orderId);
      }
      if (params?.ticketCode !== undefined) {
        setSelectedOrderTicketCode(params.ticketCode);
      }
      if (params?.filter !== undefined) {
        setTransactionFilter(params.filter);
      }
    },
    []
  );

  const goBack = useCallback(() => {
    const history = navigationHistoryRef.current;
    if (history.length === 0) {
      setActiveScreen('home');
      setSelectedOrderId(null);
      setSelectedOrderTicketCode(null);
      return;
    }

    const nextHistory = [...history];
    const target = nextHistory.pop()!;

    setNavigationHistory(nextHistory);
    setActiveScreen(target.screen);
    if (target.orderId !== undefined) {
      setSelectedOrderId(target.orderId);
    }
    if (target.ticketCode !== undefined) {
      setSelectedOrderTicketCode(target.ticketCode);
    }
    if (target.filter !== undefined) {
      setTransactionFilter(target.filter);
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

  const updateOrderDraft = useCallback((partial: Partial<OrderDraft>) => {
    setOrderDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearOrderDraft = useCallback(() => {
    setOrderDraft(DEFAULT_ORDER_DRAFT);
  }, []);

  const profileQuery = useCustomerProfileQuery(authToken);
  const ordersQuery = useCustomerOrdersQuery(authToken, undefined, {
    refetchInterval: activeScreen === 'home' && authToken ? 5000 : false,
  });

  const orders = useMemo<readonly CustomerOrderSummary[]>(
    () => ordersQuery.data ?? [],
    [ordersQuery.data]
  );

  useEffect(() => {
    if (profileQuery.data) {
      setCustomer(profileQuery.data);
    }
  }, [profileQuery.data]);

  // Centralized single-flight 401 handler registered with apiClient
  const handleUnauthorized = useCallback(async () => {
    if (isHandlingUnauthorizedRef.current) return;
    isHandlingUnauthorizedRef.current = true;
    try {
      await v1Storage.clearAuthToken();
      setAuthToken(null);
      const refresh = await v1Storage.getRefreshToken();
      if (refresh) {
        showToast('Session expired. Enter MPIN to resume.');
        setNavigationHistory([]);
        setActiveScreen('mpin_login');
      } else {
        queryClient.clear();
        setCustomer(null);
        setNavigationHistory([]);
        setActiveScreen('login');
      }
    } finally {
      isHandlingUnauthorizedRef.current = false;
    }
  }, [queryClient, showToast]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleUnauthorized]);

  // V1 Profile Refresh
  const refetchProfile = useCallback(async (): Promise<void> => {
    const token = authToken || (await v1Storage.getAuthToken());
    if (!token) return;

    try {
      await queryClient.fetchQuery({
        queryKey: customerQueryKeys.profile(),
        queryFn: async () => {
          const res = await customerApi.getProfile(token);
          return res.customer;
        },
        staleTime: 0,
      });
    } catch {
      // 401 is handled centrally by apiClient unauthorizedHandler
    }
  }, [authToken, queryClient]);

  // V1 Orders Fetch (filtered queries use separate cache keys so Home orders are never clobbered)
  const refetchOrders = useCallback(
    async (query?: CustomerListOrdersQueryParams): Promise<void> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) return;

      try {
        await queryClient.fetchQuery({
          queryKey: customerQueryKeys.ordersList(query),
          queryFn: async () => {
            const res = await orderApi.listOrders(token, query);
            return res.orders || [];
          },
          staleTime: 0,
        });
      } catch {
        // 401 is handled centrally by apiClient unauthorizedHandler
      }
    },
    [authToken, queryClient]
  );

  // Initialize stored tokens on mount with JWT expiry check
  useEffect(() => {
    const initStorage = async () => {
      try {
        const [storedPreAuth, storedAuth, storedRefresh, storedProfile, storedPushPref] =
          await Promise.all([
            v1Storage.getPreAuthToken(),
            v1Storage.getAuthToken(),
            v1Storage.getRefreshToken(),
            v1Storage.getCustomerProfile(),
            v1Storage.getPushNotificationsEnabled(),
          ]);
        if (storedPreAuth) setPreAuthToken(storedPreAuth);
        if (storedProfile) setCustomer(storedProfile);
        setNotificationsEnabled(storedPushPref);

        if (storedAuth) {
          if (!isJwtExpired(storedAuth, 30)) {
            setAuthToken(storedAuth);
            setActiveScreen('home');
          } else {
            await v1Storage.clearAuthToken();
            if (storedRefresh) {
              setActiveScreen('mpin_login');
            }
          }
        } else if (storedRefresh) {
          setActiveScreen('mpin_login');
        }
      } catch {}
    };
    initStorage();
  }, []);

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
      showToast(`📦 ${title}: ${body}`);
      refetchOrders().catch(() => {});
    });

    // 2. Notification opened while running in background
    const unsubOpened = setupFcmNotificationOpenedListener((message: RemoteFcmMessage) => {
      const orderId = message.data?.orderId || message.data?.notifId;
      const status = message.data?.status;
      if (orderId) {
        if (status === 'READY_TO_CLAIM') {
          navigateTo('qr_screen', { orderId });
        } else {
          navigateTo('order_details', { orderId });
        }
      } else {
        navigateTo('notifications');
      }
    });

    // 3. Initial notification if opened from cold/killed state
    checkInitialNotification((message: RemoteFcmMessage) => {
      const orderId = message.data?.orderId || message.data?.notifId;
      const status = message.data?.status;
      if (orderId) {
        if (status === 'READY_TO_CLAIM') {
          navigateTo('qr_screen', { orderId });
        } else {
          navigateTo('order_details', { orderId });
        }
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

  // V1 Initialize Order Action (V1 Feature #5 Decoupled Order Creation)
  const initializeCustomerOrder = useCallback(
    async (imageUrl: string): Promise<CustomerInitOrderRes> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        showToast('Session expired. Please log in again.');
        setActiveScreen('login');
        throw new Error('Please log in again');
      }

      const res = await orderApi.initializeOrder(token, imageUrl);

      // Pre-fill recipient name from customer account profile full name (V1 Feature #5)
      const defaultRecipient = customer
        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
        : '';

      const autofill = res.autofill;
      updateOrderDraft({
        orderId: res.orderId,
        ticketCode: res.ticketCode,
        imageUrl,
        recipientName: autofill?.recipientName || defaultRecipient,
        trackingId: autofill?.trackingId || '',
        productName: autofill?.productName || '',
        price: typeof autofill?.price === 'number' ? autofill.price : undefined,
        totalAmount: typeof autofill?.price === 'number' ? String(autofill.price) : '',
        trackingIdLocked: Boolean(autofill?.trackingIdLocked && autofill?.trackingId),
        sourceApp: autofill?.sourceApp,
      });

      setSelectedOrderTicketCode(res.ticketCode);
      showToast(res.statusMessage || 'Order initialized');
      navigateTo('confirm_order');
      return res;
    },
    [authToken, customer, showToast, updateOrderDraft, setSelectedOrderTicketCode, navigateTo]
  );

  const confirmCustomerOrder = useCallback(
    async (orderData: CustomerUpdateOrderReq['order']): Promise<CustomerUpdateOrderRes> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
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
    ]
  );

  const fetchOrderDetail = useCallback(
    async (orderId: string): Promise<CustomerOrderDetail> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
        throw new Error('Please log in again');
      }
      const res = await orderApi.getOrder(token, orderId);
      return res.order;
    },
    [authToken, setActiveScreen]
  );

  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);
  const openPodModal = useCallback(() => setIsPodModalOpen(true), []);
  const closePodModal = useCallback(() => setIsPodModalOpen(false), []);

  const claimCustomerOrder = useCallback(
    async (orderId: string): Promise<CustomerClaimOrderRes> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
        throw new Error('Please log in again');
      }
      const res = await orderApi.claimOrder(token, orderId);
      showToast(res.statusMessage || 'Order claim initiated');
      return res;
    },
    [authToken, setActiveScreen, showToast]
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
        body = `Payment received for ${o.productName || 'your parcel'}. Now awaiting courier arrival.`;
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

  const resetSessionState = useCallback(async () => {
    if (authToken) {
      try {
        await notificationApi.deleteToken(authToken);
      } catch (e) {
        console.warn('[FCM] Token cleanup warning:', e);
      }
    }
    await v1Storage.clearAllTokens();
    queryClient.clear();
    setPreAuthToken(null);
    setAuthToken(null);
    setCustomer(null);
    setSelectedOrderId(null);
    setSelectedOrderTicketCode(null);
    clearRegistrationDraft();
    clearOrderDraft();
    setNavigationHistory([]);
    setTransactionFilter('ALL');
    setActiveScreen('login');
  }, [authToken, queryClient, clearRegistrationDraft, clearOrderDraft]);

  const switchAccount = useCallback(async () => {
    await resetSessionState();
  }, [resetSessionState]);

  const signOutCustomer = useCallback(async () => {
    await resetSessionState();
    showToast('Signed out successfully');
  }, [resetSessionState, showToast]);

  const value = useMemo<V1ContextType>(
    () => ({
      activeScreen,
      navigateTo,
      goBack,
      transactionFilter,
      setTransactionFilter,
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
      switchAccount,
      signOutCustomer,
    }),
    [
      activeScreen,
      navigateTo,
      goBack,
      transactionFilter,
      toast,
      showToast,
      preAuthToken,
      authToken,
      customer,
      orders,
      selectedOrderId,
      selectedOrderTicketCode,
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
      switchAccount,
      signOutCustomer,
    ]
  );

  return <V1Context.Provider value={value}>{children}</V1Context.Provider>;
};

export const useV1 = (): V1ContextType => {
  const context = useContext(V1Context);
  if (!context) {
    throw new Error('useV1 must be used within a V1Provider');
  }
  return context;
};
