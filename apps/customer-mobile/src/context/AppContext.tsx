import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Order,
  OrderStatus,
  DraftOrder,
  NotificationItem,
  ScreenId,
  TransactionFilter,
  ScenarioId,
  ToastState,
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinRes,
  CustomerVerifyMpinRes,
  AuthCustomer,
} from '../types';
import { customerApi } from '../services/customerApi';
import {
  orderApi,
  getStatedFee,
  isClaimUnlocked,
  getClaimTimeRemainingSeconds,
  mapOrderDetailToOrder,
  mapSummaryToOrder,
  parseCurrency,
} from '../services/orderApi';
import { ENV, getDetectedApiUrl } from '../config/env';
import { clearRetainedRegistrationData } from '../services/registrationState';

const INITIAL_ORDERS: Order[] = [];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

const INITIAL_DRAFT: DraftOrder = {
  product: '',
  recipient: '',
  totalAmount: '',
  trackingId: '',
  receiptUri: '',
};

export interface AppContextType {
  activeScreen: ScreenId;
  hasOrders: boolean;
  hubOpen: boolean;
  notificationActive: boolean;
  selectedOrderId: string;
  transactionFilter: TransactionFilter;
  draftOrder: DraftOrder;
  orders: Order[];
  notifications: NotificationItem[];
  toast: ToastState;
  isLoadingOrders: boolean;

  // Live / Dev Network Settings
  isLiveMode: boolean;
  setIsLiveMode: (val: boolean) => void;
  apiUrl: string;
  setApiUrl: (val: string) => void;
  isPollingEnabled: boolean;
  setIsPollingEnabled: (val: boolean) => void;
  pollingInterval: number;
  setPollingInterval: (sec: number) => void;

  // Modals
  isMpinModalOpen: boolean;
  isPodModalOpen: boolean;
  isEscrowModalOpen: boolean;
  isNotificationsModalOpen: boolean;

  // Customer Auth
  preAuthToken: string | null;
  refreshToken: string | null;
  authToken: string | null;
  authCustomer: AuthCustomer;
  pendingRegistration: CustomerRegisterReq | null;
  clearPendingRegistration: () => void;
  loginCustomer: (payload: CustomerLoginReq) => Promise<CustomerLoginRes>;
  registerCustomer: (payload: CustomerRegisterReq) => Promise<CustomerRegisterRes>;
  createCustomerMpin: (mpin: string) => Promise<CustomerCreateMpinRes>;
  verifyCustomerMpin: (mpin: string) => Promise<CustomerVerifyMpinRes>;
  updateAuthCustomer: (partial: Partial<AuthCustomer>) => void;
  signOutCustomer: () => void;

  // Navigation & Actions
  navigateTo: (screenId: ScreenId, params?: { orderId?: string; status?: OrderStatus; filter?: TransactionFilter }) => void;
  setHasOrders: (val: boolean) => void;
  setHubOpen: (val: boolean) => void;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setSelectedOrderId: (id: string) => void;
  updateDraftOrder: (partial: Partial<DraftOrder>) => void;
  submitDraftOrder: () => Promise<void>;
  loadSampleReceipt: () => void;
  toggleNotificationAlerts: () => void;
  showToast: (msg: string) => void;
  openMpinModal: () => void;
  closeMpinModal: () => void;
  openPodModal: () => void;
  closePodModal: () => void;
  openProofOfDeliveryModal: () => void;
  closeProofOfDeliveryModal: () => void;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  markAllNotificationsAsRead: () => void;
  seenClaimedPassOrders: Record<string, boolean>;
  markClaimedPassSeen: (orderId: string) => void;
  customerInitiateClaim: (orderId: string) => Promise<void>;
  isOrderClaimUnlocked: (order: Order) => boolean;
  getOrderClaimRemainingSeconds: (order: Order) => number;
  getOrderStatedFee: (order: Order) => number;
  copyToClipboard: (text: string, label: string) => Promise<void>;
  completeMpinClaim: () => void;
  getCurrentOrder: () => Order;
  applyScenario: (scenario: ScenarioId) => void;
  simulatePaymentReceived: (orderId: string) => void;
  advanceOrderStatus: (orderId: string, status: OrderStatus) => void;
  refetchOrders: (filter?: TransactionFilter, quiet?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Live / Dev Config State
  const [isLiveMode, setIsLiveModeState] = useState<boolean>(true);
  const [apiUrl, setApiUrlState] = useState<string>(ENV.API_BASE_URL);
  const [isPollingEnabled, setIsPollingEnabled] = useState<boolean>(true);
  const [pollingInterval, setPollingInterval] = useState<number>(ENV.DEFAULT_POLL_INTERVAL_SEC);

  // Auth State
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<CustomerRegisterReq | null>(null);
  const [authCustomer, setAuthCustomer] = useState<AuthCustomer>({
    email: '',
    firstname: '',
    lastname: '',
    phonenumber: '',
  });

  const clearPendingRegistration = useCallback(() => {
    setPendingRegistration(null);
    setPreAuthToken(null);
    setAuthCustomer({
      email: '',
      firstname: '',
      lastname: '',
      phonenumber: '',
    });
  }, []);

  // Strict Auth Gate: Start at 'login' by default until token verification
  const [activeScreen, setActiveScreen] = useState<ScreenId>('login');
  const [hasOrders, setHasOrdersState] = useState<boolean>(false);
  const [hubOpen, setHubOpenState] = useState<boolean>(true);
  const [notificationActive, setNotificationActive] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');
  const [draftOrder, setDraftOrder] = useState<DraftOrder>(INITIAL_DRAFT);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  // Modals
  const [isMpinModalOpen, setIsMpinModalOpen] = useState<boolean>(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Second Ticker for live countdown
  const [, setTicker] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 1000000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message: msg });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3200);
  }, []);

  const setIsLiveMode = useCallback((val: boolean) => {
    setIsLiveModeState(val);
    customerApi.setStoredIsLiveMode(val);
  }, []);

  const setApiUrl = useCallback((url: string) => {
    setApiUrlState(url);
    customerApi.setStoredApiUrl(url);
  }, []);

  // Fetch orders from backend
  const refetchOrders = useCallback(
    async (filter?: TransactionFilter, quiet?: boolean) => {
      if (!isLiveMode || !authToken) return;
      if (!quiet) setIsLoadingOrders(true);
      try {
        const orderType = filter && filter !== 'ALL' ? filter : undefined;
        const summaries = await orderApi.getOrders(authToken, apiUrl, isLiveMode, orderType);

        if (summaries && summaries.length > 0) {
          // Fetch detailed data for each order to ensure rich timeline and pricing
          const fullOrders = await Promise.all(
            summaries.map(async (s) => {
              try {
                const detail = await orderApi.getOrder(authToken, s.id, apiUrl, isLiveMode);
                if (detail) return mapOrderDetailToOrder(detail);
              } catch {}
              return mapSummaryToOrder(s);
            })
          );
          setOrders(fullOrders);
          setHasOrdersState(fullOrders.length > 0);
        } else if (filter && filter !== 'ALL') {
          // If filtered list is empty, keep current orders but let filtered view show empty
        } else {
          setOrders([]);
          setHasOrdersState(false);
        }
      } catch (err: any) {
        // Fallback to current mock orders if network error
      } finally {
        if (!quiet) setIsLoadingOrders(false);
      }
    },
    [authToken, apiUrl, isLiveMode]
  );

  // Strict Auth Gate on Startup
  useEffect(() => {
    const initApp = async () => {
      try {
        const [storedAuth, storedRefresh, storedLive, storedUrl, storedProfile] = await Promise.all([
          customerApi.getStoredAuthToken(),
          customerApi.getStoredRefreshToken(),
          customerApi.getStoredIsLiveMode(),
          customerApi.getStoredApiUrl(),
          customerApi.getStoredProfile(),
        ]);

        if (storedLive !== null) setIsLiveModeState(storedLive);
        if (storedUrl) setApiUrlState(storedUrl);

        if (storedProfile) {
          setAuthCustomer({
            email: storedProfile.email || '',
            firstname: storedProfile.firstName || storedProfile.firstname || '',
            lastname: storedProfile.lastName || storedProfile.lastname || '',
            middleinitial: storedProfile.middleInitial || storedProfile.middleinitial || '',
            phonenumber: storedProfile.phoneNumber || storedProfile.phonenumber || '',
          });
        }

        if (storedAuth) {
          setAuthToken(storedAuth);
          setRefreshToken(storedRefresh);
          setActiveScreen('home');

          // Fetch fresh customer profile
          customerApi
            .getProfile(storedAuth, storedUrl || apiUrl)
            .then((res) => {
              if (res?.customer) {
                setAuthCustomer({
                  email: res.customer.email,
                  firstname: res.customer.firstName,
                  lastname: res.customer.lastName,
                  middleinitial: res.customer.middleInitial || '',
                  phonenumber: res.customer.phoneNumber,
                });
              }
            })
            .catch(() => {});

          // Fetch fresh orders
          try {
            const summaries = await orderApi.getOrders(storedAuth, storedUrl || apiUrl, true);
            if (summaries && summaries.length > 0) {
              const fullOrders = await Promise.all(
                summaries.map(async (s) => {
                  try {
                    const detail = await orderApi.getOrder(storedAuth, s.id, storedUrl || apiUrl, true);
                    if (detail) return mapOrderDetailToOrder(detail);
                  } catch {}
                  return mapSummaryToOrder(s);
                })
              );
              setOrders(fullOrders);
            }
          } catch {}
        } else {
          setActiveScreen('login');
        }
      } catch {
        setActiveScreen('login');
      }
    };

    initApp();
  }, []);

  // Active Orders Polling when viewing Customer Dashboard ('home')
  useEffect(() => {
    if (!isPollingEnabled || !isLiveMode || !authToken || (activeScreen !== 'home' && activeScreen !== 'transactions')) {
      return;
    }

    let isFetching = false;
    const intervalId = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await refetchOrders(undefined, true);
      } finally {
        isFetching = false;
      }
    }, (pollingInterval || 5) * 1000);

    return () => clearInterval(intervalId);
  }, [isPollingEnabled, isLiveMode, authToken, activeScreen, refetchOrders, pollingInterval]);

  // Active Order Polling when viewing OrderDetailsScreen
  useEffect(() => {
    if (!isPollingEnabled || !isLiveMode || !authToken || activeScreen !== 'order_details') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const detail = await orderApi.getOrder(authToken, selectedOrderId, apiUrl, isLiveMode);
        if (detail) {
          const updated = mapOrderDetailToOrder(detail);
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === selectedOrderId);
            if (idx >= 0) {
              const current = prev[idx];
              
              // Team Lead Damping Rule (±3 seconds threshold):
              // When polling hits during an active release window, compare backend seconds with frontend seconds.
              // If the difference is <= 3 seconds, do NOT overwrite the local claim timer/expiry timestamps.
              // Only overwrite if difference is > 3 seconds (or if status/other fields changed).
              let preservedClaimInitiatedAt = updated.claimInitiatedAt;
              let preservedClaimExpiresAt = updated.claimExpiresAt;

              if (current.claimExpiresAt && updated.claimExpiresAt) {
                const currentRemaining = Math.max(0, Math.floor((new Date(current.claimExpiresAt).getTime() - Date.now()) / 1000));
                const remoteRemaining = Math.max(0, Math.floor((new Date(updated.claimExpiresAt).getTime() - Date.now()) / 1000));
                const diff = Math.abs(currentRemaining - remoteRemaining);

                if (diff <= 3) {
                  // Within ±3s tolerance: keep frontend timer intact to prevent flicker
                  preservedClaimInitiatedAt = current.claimInitiatedAt;
                  preservedClaimExpiresAt = current.claimExpiresAt;
                }
              }

              const merged: Order = {
                ...updated,
                claimInitiatedAt: preservedClaimInitiatedAt,
                claimExpiresAt: preservedClaimExpiresAt,
              };

              const copy = [...prev];
              copy[idx] = merged;
              return copy;
            }
            return [updated, ...prev];
          });
        }
      } catch {}
    }, pollingInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isPollingEnabled, isLiveMode, authToken, activeScreen, selectedOrderId, apiUrl, pollingInterval]);

  const getCurrentOrder = useCallback((): Order => {
    return (
      orders.find((o) => o.id === selectedOrderId) ||
      orders[0] || {
        id: '',
        product: '',
        recipient: '',
        paidAmount: '',
        codAmount: '',
        change: '',
        trackingNumber: '',
        refCode: '',
        alphanumericKey: '',
        envelopeNumber: '',
        status: 'PAYMENT_REQUIRED',
        orderPlacedTime: '',
        awaitingParcelTime: null,
        readyToClaimTime: null,
        claimedTime: null,
        dateLabel: '',
        hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
        courierPaid: false,
        parcelImageUrl: null,
        claimInitiatedAt: null,
        notes: '',
        statedFee: 0,
      }
    );
  }, [orders, selectedOrderId]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read.');
  }, [showToast]);

  const navigateTo = useCallback(
    (screenId: ScreenId, params?: { orderId?: string; status?: OrderStatus; filter?: TransactionFilter }) => {
      setActiveScreen(screenId);
      if (params?.orderId) {
        setSelectedOrderId(params.orderId);
      }
      if (params?.status) {
        const targetId = params.orderId || selectedOrderId;
        setOrders((prev) =>
          prev.map((o) => (o.id === targetId ? { ...o, status: params.status! } : o))
        );
      }
      if (params?.filter) {
        setTransactionFilter(params.filter);
        refetchOrders(params.filter);
      }
    },
    [selectedOrderId, refetchOrders]
  );

  const setHasOrders = useCallback(
    (val: boolean) => {
      setHasOrdersState(val);
      showToast(val ? 'Showing home with active orders' : 'Showing home with zero orders');
    },
    [showToast]
  );

  const setHubOpen = useCallback(
    (val: boolean) => {
      setHubOpenState(val);
      showToast(val ? 'Lily’s Catering Hub set to: OPEN' : 'Lily’s Catering Hub set to: CLOSED');
    },
    [showToast]
  );

  const toggleNotificationAlerts = useCallback(() => {
    setNotificationActive((prev) => {
      const next = !prev;
      showToast(next ? 'Push notifications enabled for ParcelHub!' : 'Notifications muted.');
      return next;
    });
  }, [showToast]);

  const updateDraftOrder = useCallback((partial: Partial<DraftOrder>) => {
    setDraftOrder((prev) => ({ ...prev, ...partial }));
  }, []);

  const loadSampleReceipt = useCallback(() => {
    setDraftOrder((prev) => ({ ...prev, receiptUri: 'sample_receipt_image' }));
    showToast('Sample Shopee receipt attached & OCR parsed!');
    setActiveScreen('confirm_order');
  }, [showToast]);

  // Atomic on Confirm: initialize order + update details
  const submitDraftOrder = useCallback(async () => {
    const rawPrice = parseCurrency(draftOrder.totalAmount);
    const price = rawPrice > 0 ? rawPrice : 480;

    try {
      showToast('Initializing & creating order...');
      // 1. POST /api/customer/orders/initialize
      const initRes = await orderApi.initializeOrder(
        authToken,
        draftOrder.receiptUri || 'sample_receipt_image',
        apiUrl
      );
      const newOrderId = initRes.orderId;

      // 2. PUT /api/customer/orders/{id}
      await orderApi.updateOrder(
        authToken,
        newOrderId,
        {
          trackingId: draftOrder.trackingId,
          productName: draftOrder.product,
          recipientName: draftOrder.recipient || `${authCustomer.firstname} ${authCustomer.lastname}`,
          price,
        },
        apiUrl
      );

      // Create local order entry
      const numId = newOrderId.replace('ORD-', '');
      const newOrder: Order = {
        id: newOrderId,
        product: draftOrder.product || 'Purchased Item',
        recipient: draftOrder.recipient || `${authCustomer.firstname} ${authCustomer.lastname}`,
        paidAmount: '',
        codAmount: `₱${price.toLocaleString('en-US')}`,
        change: 'To Be Determined',
        trackingNumber: draftOrder.trackingId || `PH${Date.now()}`,
        refCode: `0001-${numId.padStart(4, '0')}-1122`,
        alphanumericKey: newOrderId,
        envelopeNumber: `ENV-${numId}`,
        status: 'PAYMENT_REQUIRED',
        orderPlacedTime: 'Just now',
        awaitingParcelTime: null,
        readyToClaimTime: null,
        claimedTime: null,
        dateLabel: 'Today, Just now',
        hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
        courierPaid: false,
        parcelImageUrl: null,
        claimInitiatedAt: null,
        claimExpiresAt: null,
        notes: 'Counter deposit pending.',
        statedFee: price,
        qrImageUrl: null,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setSelectedOrderId(newOrder.id);
      showToast(`Order ${newOrder.id} placed! Please deposit cash at Lily's Catering Hub.`);
      setActiveScreen('payment_verification');
    } catch (err: any) {
      showToast(err?.message || 'Order creation failed. Please try again.');
      throw err;
    }
  }, [authToken, draftOrder, authCustomer, apiUrl, isLiveMode, showToast]);

  const openMpinModal = useCallback(() => setIsMpinModalOpen(true), []);
  const closeMpinModal = useCallback(() => setIsMpinModalOpen(false), []);
  const openPodModal = useCallback(() => setIsPodModalOpen(true), []);
  const closePodModal = useCallback(() => setIsPodModalOpen(false), []);
  const openProofOfDeliveryModal = useCallback(() => setIsPodModalOpen(true), []);
  const closeProofOfDeliveryModal = useCallback(() => setIsPodModalOpen(false), []);
  const openNotificationsModal = useCallback(() => setIsNotificationsModalOpen(true), []);
  const closeNotificationsModal = useCallback(() => setIsNotificationsModalOpen(false), []);

  const [seenClaimedPassOrders, setSeenClaimedPassOrders] = useState<Record<string, boolean>>({});

  const markClaimedPassSeen = useCallback((orderId: string) => {
    setSeenClaimedPassOrders((prev) => ({ ...prev, [orderId]: true }));
  }, []);

  // Direct One-Tap Claim Unlock
  const customerInitiateClaim = useCallback(
    async (orderId: string) => {
      try {
        showToast('Unlocking counter pickup pass...');
        const res = await orderApi.claimOrder(authToken, orderId, apiUrl);

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  claimInitiatedAt: new Date(res.claimInitiatedAt).getTime(),
                  claimExpiresAt: res.claimExpiresAt,
                }
              : o
          )
        );

        showToast(
          res.statusMessage || `Pickup pass unlocked! Valid for ${res.durationMinutes || 5} minutes.`
        );
      } catch (err: any) {
        showToast(err?.message || 'Failed to unlock pickup pass.');
      }
    },
    [authToken, apiUrl, showToast]
  );

  const completeMpinClaim = useCallback(() => {
    closeMpinModal();
    const current = getCurrentOrder();
    if (current?.id) {
      customerInitiateClaim(current.id);
    }
  }, [closeMpinModal, getCurrentOrder, customerInitiateClaim]);

  const simulatePaymentReceived = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'AWAITING_PARCEL',
                paidAmount: '₱500',
                change: '₱20',
                awaitingParcelTime: 'Just now',
              }
            : o
        )
      );
      showToast('Cash deposit verified! ParcelHub is now monitoring your parcel arrival.');
      setActiveScreen('order_details');
    },
    [showToast]
  );

  const advanceOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                courierPaid: status === 'READY_TO_CLAIM' || status === 'CLAIMED',
              }
            : o
        )
      );
      showToast(`Order ${orderId} moved to ${status}`);
    },
    [showToast]
  );

  const copyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await Clipboard.setStringAsync(text);
        showToast(`Copied ${label} (${text}) to clipboard!`);
      } catch {
        showToast(`Copied ${label}!`);
      }
    },
    [showToast]
  );

  const isOrderClaimUnlocked = useCallback((order: Order): boolean => {
    return isClaimUnlocked(order);
  }, []);

  const getOrderClaimRemainingSeconds = useCallback((order: Order): number => {
    return getClaimTimeRemainingSeconds(order);
  }, []);

  const getOrderStatedFee = useCallback((order: Order): number => {
    return getStatedFee(order);
  }, []);

  // Auth: Login
  const loginCustomer = useCallback(
    async (payload: CustomerLoginReq): Promise<CustomerLoginRes> => {
      const res = await customerApi.login(payload, apiUrl);
      setPreAuthToken(res.preAuthToken);
      setAuthCustomer((prev) => ({
        ...prev,
        email: payload.email,
      }));
      showToast(res.statusMessage || 'Credentials verified. Enter MPIN.');
      setActiveScreen('mpin_login');
      return res;
    },
    [apiUrl, showToast]
  );

  // Auth: Register (prepares registration data without saving to backend until MPIN is confirmed)
  const registerCustomer = useCallback(
    async (payload: CustomerRegisterReq): Promise<CustomerRegisterRes> => {
      setPendingRegistration(payload);
      setAuthCustomer((prev) => ({
        ...prev,
        email: payload.email,
        firstname: payload.firstName,
        lastname: payload.lastName,
        phonenumber: payload.phoneNumber,
        middleinitial: payload.middleInitial,
      }));
      setActiveScreen('mpin_create');
      return {
        statusMessage: 'Please create your 4-digit MPIN.',
        preAuthToken: '',
      };
    },
    []
  );

  // Auth: Create MPIN
  const createCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerCreateMpinRes> => {
      let activePreAuthToken = preAuthToken;

      // Only save registration to the backend when MPIN is being created/confirmed
      if (pendingRegistration) {
        const regRes = await customerApi.register(pendingRegistration, apiUrl);
        activePreAuthToken = regRes.preAuthToken;
        setPreAuthToken(regRes.preAuthToken);
        setPendingRegistration(null);
      }

      if (!activePreAuthToken) {
        throw new Error('Pre-auth token missing. Please register or log in first.');
      }

      const res = await customerApi.createMpin(
        { preAuthToken: activePreAuthToken, mpin: mpin as any },
        apiUrl
      );
      setAuthToken(res.authToken);
      if (res.refreshToken) setRefreshToken(res.refreshToken);
      if (res.customer) {
        setAuthCustomer({
          email: res.customer.email,
          firstname: res.customer.firstName,
          lastname: res.customer.lastName,
          middleinitial: res.customer.middleInitial || '',
          phonenumber: res.customer.phoneNumber,
        });
      }

      // Successfully saved and MPIN verified: clear pending and retained form data
      setPendingRegistration(null);
      clearRetainedRegistrationData();

      showToast(res.statusMessage || 'MPIN created successfully!');
      setActiveScreen('home');
      refetchOrders();
      return res;
    },
    [preAuthToken, pendingRegistration, apiUrl, showToast, refetchOrders]
  );

  // Auth: Verify MPIN
  const verifyCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerVerifyMpinRes> => {
      if (!preAuthToken) {
        throw new Error('Pre-auth token missing. Please log in first.');
      }
      const res = await customerApi.verifyMpin({ preAuthToken, mpin }, apiUrl);
      setAuthToken(res.authToken);
      if (res.refreshToken) setRefreshToken(res.refreshToken);
      if (res.customer) {
        setAuthCustomer({
          email: res.customer.email,
          firstname: res.customer.firstName,
          lastname: res.customer.lastName,
          middleinitial: res.customer.middleInitial || '',
          phonenumber: res.customer.phoneNumber,
        });
      }
      showToast(res.statusMessage || 'Access granted!');
      setActiveScreen('home');
      refetchOrders();
      return res;
    },
    [preAuthToken, apiUrl, showToast, refetchOrders]
  );

  const updateAuthCustomer = useCallback(
    (partial: Partial<AuthCustomer>) => {
      setAuthCustomer((prev) => ({ ...prev, ...partial }));
      showToast('Profile updated successfully!');
    },
    [showToast]
  );

  const signOutCustomer = useCallback(() => {
    customerApi.clearTokens();
    setAuthToken(null);
    setRefreshToken(null);
    setPreAuthToken(null);
    setPendingRegistration(null);
    setAuthCustomer({
      email: '',
      firstname: '',
      lastname: '',
      phonenumber: '',
    });
    clearRetainedRegistrationData();
    showToast('Signed out successfully.');
    setActiveScreen('login');
  }, [showToast]);

  const applyScenario = useCallback(
    (scenario: ScenarioId) => {
      switch (scenario) {
        case 'figma-1':
          setHasOrdersState(true);
          setActiveScreen('home');
          break;
        case 'figma-2':
          setHasOrdersState(false);
          setActiveScreen('home');
          break;
        case 'figma-3':
          setActiveScreen('create_order');
          break;
        case 'figma-4':
          setActiveScreen('confirm_order');
          break;
        case 'figma-5':
          setActiveScreen('payment_verification');
          break;
        case 'figma-6':
          setSelectedOrderId('ORD-883');
          setActiveScreen('order_details');
          break;
        case 'figma-7':
          setSelectedOrderId('ORD-408');
          setActiveScreen('order_details');
          break;
        case 'figma-8':
          setSelectedOrderId('ORD-402');
          setActiveScreen('order_details');
          break;
        case 'figma-9':
          setSelectedOrderId('ORD-388');
          setActiveScreen('order_details');
          break;
        case 'figma-10':
          setSelectedOrderId('ORD-402');
          setActiveScreen('qr_screen');
          break;
        case 'figma-11':
          setTransactionFilter('ALL');
          setActiveScreen('transactions');
          break;
        case 'figma-12':
          setIsEscrowModalOpen(true);
          break;
        case 'figma-login':
          setActiveScreen('login');
          break;
        case 'figma-register':
          setActiveScreen('register');
          break;
        case 'figma-mpin-login':
          setActiveScreen('mpin_login');
          break;
        case 'figma-mpin-create':
          setActiveScreen('mpin_create');
          break;
        case 'figma-profile':
          setActiveScreen('profile');
          break;
      }
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        hasOrders,
        hubOpen,
        notificationActive,
        selectedOrderId,
        transactionFilter,
        draftOrder,
        orders,
        notifications,
        toast,
        isLoadingOrders,
        isLiveMode,
        setIsLiveMode,
        apiUrl,
        setApiUrl,
        isPollingEnabled,
        setIsPollingEnabled,
        pollingInterval,
        setPollingInterval,
        isMpinModalOpen,
        isPodModalOpen,
        isEscrowModalOpen,
        isNotificationsModalOpen,
        preAuthToken,
        refreshToken,
        authToken,
        authCustomer,
        pendingRegistration,
        clearPendingRegistration,
        loginCustomer,
        registerCustomer,
        createCustomerMpin,
        verifyCustomerMpin,
        updateAuthCustomer,
        signOutCustomer,
        navigateTo,
        setHasOrders,
        setHubOpen,
        setTransactionFilter,
        setSelectedOrderId,
        updateDraftOrder,
        submitDraftOrder,
        loadSampleReceipt,
        toggleNotificationAlerts,
        showToast,
        openMpinModal,
        closeMpinModal,
        openPodModal,
        closePodModal,
        openProofOfDeliveryModal,
        closeProofOfDeliveryModal,
        openNotificationsModal,
        closeNotificationsModal,
        markAllNotificationsAsRead,
        seenClaimedPassOrders,
        markClaimedPassSeen,
        customerInitiateClaim,
        isOrderClaimUnlocked,
        getOrderClaimRemainingSeconds,
        getOrderStatedFee,
        copyToClipboard,
        completeMpinClaim,
        getCurrentOrder,
        applyScenario,
        simulatePaymentReceived,
        advanceOrderStatus,
        refetchOrders,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
