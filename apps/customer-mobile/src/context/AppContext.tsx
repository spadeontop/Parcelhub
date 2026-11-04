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
  CustomerRegisterRequest,
  CustomerRegisterResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerCreateMpinResponse,
  CustomerVerifyMpinResponse,
  AuthCustomer,
} from '../types';
import { customerApi } from '../services/customerApi';
import {
  orderApi,
  getStatedFee,
  isClaimUnlocked,
  getClaimTimeRemainingSeconds,
} from '../services/orderApi';

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-402',
    product: 'VXE R1 Nearlink',
    recipient: 'John Vince Dumaguit',
    paidAmount: '₱500',
    codAmount: '₱480',
    change: '₱20',
    trackingNumber: 'PH2696153366792H',
    refCode: '0001-5544-5555',
    alphanumericKey: 'PH-402-5544',
    envelopeNumber: 'ENV-402',
    status: 'READY_TO_CLAIM',
    orderPlacedTime: '17 Oct 16:32',
    awaitingParcelTime: '17 Oct 18:32',
    readyToClaimTime: '17 Oct 22:32',
    claimedTime: null,
    dateLabel: 'October 10, 2026 10:30',
    carrier: 'ShopeeXpress (SPX)',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: true,
    parcelImageUrl: null,
    claimInitiatedAt: null,
    notes: 'Customer notified via SMS. Ready for counter pickup.',
    statedFee: 500,
  },
  {
    id: 'ORD-408',
    product: 'Poco X6 Pro',
    recipient: 'John Vince Dumaguit',
    paidAmount: '₱12,500',
    codAmount: '₱12,450',
    change: '₱50',
    trackingNumber: 'PH90823411293K',
    refCode: '0001-8899-2211',
    alphanumericKey: 'PH-408-8899',
    envelopeNumber: 'ENV-408',
    status: 'AWAITING_PARCEL',
    orderPlacedTime: '7 Oct 07:41',
    awaitingParcelTime: '7 Oct 12:15',
    readyToClaimTime: null,
    claimedTime: null,
    dateLabel: 'October 7, 2026 7:41',
    carrier: 'J&T Express',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: false,
    parcelImageUrl: null,
    claimInitiatedAt: null,
    notes: 'Fragile electronics. Priority intake requested.',
    statedFee: 12500,
  },
  {
    id: 'ORD-883',
    product: 'VXE R1 Nearlink Wireless Mouse',
    recipient: 'John Vince Dumaguit',
    paidAmount: '',
    codAmount: '₱480',
    change: 'To Be Determined',
    trackingNumber: 'PH883904421101N',
    refCode: '0001-9044-2110',
    alphanumericKey: 'PH-883-9044',
    envelopeNumber: 'ENV-883',
    status: 'PAYMENT_REQUIRED',
    orderPlacedTime: '18 Oct 08:30',
    awaitingParcelTime: null,
    readyToClaimTime: null,
    claimedTime: null,
    dateLabel: 'October 18, 2026 08:30',
    carrier: 'ShopeeXpress (SPX)',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: false,
    parcelImageUrl: null,
    claimInitiatedAt: null,
    notes: 'Counter deposit pending.',
    statedFee: 500,
  },
  {
    id: 'ORD-388',
    product: 'Keychron K2 Pro Mechanical Keyboard',
    recipient: 'John Vince Dumaguit',
    paidAmount: '₱4,200',
    codAmount: '₱4,200',
    change: '₱0',
    trackingNumber: 'PH44219902341L',
    refCode: '0001-1122-3344',
    alphanumericKey: 'PH-388-1122',
    envelopeNumber: 'ENV-388',
    status: 'CLAIMED',
    orderPlacedTime: '1 Oct 10:00',
    awaitingParcelTime: '2 Oct 14:00',
    readyToClaimTime: '3 Oct 11:30',
    claimedTime: '4 Oct 09:15',
    dateLabel: 'October 1, 2026 10:00',
    carrier: 'Flash Express',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: true,
    parcelImageUrl: null,
    claimInitiatedAt: null,
    notes: 'Handover complete. Validated with government ID.',
    statedFee: 4200,
  },
  {
    id: 'ORD-719',
    product: 'Sony WH-1000XM5 Headphones',
    recipient: 'Maria Santos',
    paidAmount: '₱16,000',
    codAmount: '₱15,800',
    change: '₱200',
    trackingNumber: 'PH719445588312S',
    refCode: '0001-4455-8831',
    alphanumericKey: 'PH-719-4455',
    envelopeNumber: 'ENV-719',
    status: 'CLAIMED',
    orderPlacedTime: '15 Oct 11:20',
    awaitingParcelTime: '15 Oct 14:45',
    readyToClaimTime: '16 Oct 09:10',
    claimedTime: '16 Oct 17:00',
    dateLabel: 'October 15, 2026 11:20',
    carrier: 'ShopeeXpress (SPX)',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: true,
    parcelImageUrl: null,
    claimInitiatedAt: null,
    notes: '',
    statedFee: 16000,
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, title: 'Parcel Ready for Claim', body: 'VXE R1 Nearlink has arrived at Lily’s Catering Hub.', time: '10m ago', unread: true },
  { id: 2, title: 'Deposit Verified', body: '₱500 deposit received for your order.', time: '2h ago', unread: true },
  { id: 3, title: 'Courier Payment Logged', body: 'Staff paid ₱480 to SPX Express courier.', time: '4h ago', unread: true },
  { id: 4, title: 'Welcome to ParcelHub', body: 'Lily’s Catering Hub station is active.', time: '1d ago', unread: true },
];

const INITIAL_DRAFT: DraftOrder = {
  product: 'VXE R1 Nearlink Wireless Mouse',
  recipient: 'John Vince Dumaguit',
  totalAmount: '₱480',
  trackingId: 'PH2696153366792H',
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
  claimConfirmed: boolean;

  // Modals
  isMpinModalOpen: boolean;
  isPodModalOpen: boolean;
  isEscrowModalOpen: boolean;
  isNotificationsModalOpen: boolean;

  // Customer Auth
  refreshToken: string | null;
  authToken: string | null;
  authCustomer: AuthCustomer;
  loginCustomer: (payload: CustomerLoginRequest) => Promise<CustomerLoginResponse>;
  registerCustomer: (payload: CustomerRegisterRequest) => Promise<CustomerRegisterResponse>;
  createCustomerMpin: (mpin: string) => Promise<CustomerCreateMpinResponse>;
  verifyCustomerMpin: (mpin: string) => Promise<CustomerVerifyMpinResponse>;

  // Navigation & Actions
  navigateTo: (screenId: ScreenId, params?: { orderId?: string; status?: OrderStatus; filter?: TransactionFilter }) => void;
  setHasOrders: (val: boolean) => void;
  setHubOpen: (val: boolean) => void;
  setClaimConfirmed: (val: boolean) => void;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setSelectedOrderId: (id: string) => void;
  updateDraftOrder: (partial: Partial<DraftOrder>) => void;
  submitDraftOrder: () => void;
  loadSampleReceipt: () => void;
  toggleNotificationAlerts: () => void;
  showToast: (msg: string) => void;
  openMpinModal: () => void;
  closeMpinModal: () => void;
  openPodModal: () => void;
  closePodModal: () => void;
  openProofOfDeliveryModal: () => void;
  closeProofOfDeliveryModal: () => void;
  openEscrowModal: () => void;
  closeEscrowModal: () => void;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  markAllNotificationsAsRead: () => void;
  customerInitiateClaim: (orderId: string) => void;
  isOrderClaimUnlocked: (order: Order) => boolean;
  getOrderClaimRemainingSeconds: (order: Order) => number;
  getOrderStatedFee: (order: Order) => number;
  copyToClipboard: (text: string, label: string) => Promise<void>;
  completeMpinClaim: () => void;
  getCurrentOrder: () => Order;
  applyScenario: (scenario: ScenarioId) => void;
  simulatePaymentReceived: (orderId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState<string | null>('rt_demo_john_dumaguit');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authCustomer, setAuthCustomer] = useState<AuthCustomer>({
    email: 'johnvincekeyedu@gmail.com',
    firstname: 'John Vince',
    lastname: 'Dumaguit',
    phonenumber: '0917 123 4567',
  });

  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [hasOrders, setHasOrdersState] = useState<boolean>(true);
  const [hubOpen, setHubOpenState] = useState<boolean>(true);
  const [notificationActive, setNotificationActive] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-402');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');
  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [draftOrder, setDraftOrder] = useState<DraftOrder>(INITIAL_DRAFT);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modals
  const [isMpinModalOpen, setIsMpinModalOpen] = useState<boolean>(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ticker for live countdown
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

  const getCurrentOrder = useCallback((): Order => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
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
      }
    },
    [selectedOrderId]
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
    setDraftOrder((prev) => ({ ...prev, receiptUri: 'sample_receipt' }));
    showToast('Sample Shopee receipt attached & OCR parsed!');
    setActiveScreen('confirm_order');
  }, [showToast]);

  const submitDraftOrder = useCallback(() => {
    const newId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const randomKeyNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: newId,
      product: draftOrder.product || 'Purchased Item',
      recipient: draftOrder.recipient || authCustomer.firstname + ' ' + authCustomer.lastname,
      paidAmount: '',
      codAmount: draftOrder.totalAmount || '₱480',
      change: 'To Be Determined',
      trackingNumber: draftOrder.trackingId || 'PH' + Math.floor(100000000000 + Math.random() * 900000000000) + 'X',
      refCode: `0001-${randomKeyNum}-1122`,
      alphanumericKey: `PH-${newId.replace('ORD-', '')}-${randomKeyNum}`,
      envelopeNumber: `ENV-${newId.replace('ORD-', '')}`,
      status: 'PAYMENT_REQUIRED',
      orderPlacedTime: 'Just now',
      awaitingParcelTime: null,
      readyToClaimTime: null,
      claimedTime: null,
      dateLabel: 'Today, Just now',
      carrier: 'ShopeeXpress (SPX)',
      hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
      courierPaid: false,
      parcelImageUrl: null,
      claimInitiatedAt: null,
      notes: 'Counter deposit pending.',
      statedFee: 500,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.id);
    showToast(`Order ${newOrder.id} placed! Please deposit cash at Lily's Catering Hub.`);
    setActiveScreen('payment_verification');
  }, [draftOrder, authCustomer, showToast]);

  const openMpinModal = useCallback(() => setIsMpinModalOpen(true), []);
  const closeMpinModal = useCallback(() => setIsMpinModalOpen(false), []);

  const openPodModal = useCallback(() => setIsPodModalOpen(true), []);
  const closePodModal = useCallback(() => setIsPodModalOpen(false), []);

  const openProofOfDeliveryModal = useCallback(() => setIsPodModalOpen(true), []);
  const closeProofOfDeliveryModal = useCallback(() => setIsPodModalOpen(false), []);

  const openEscrowModal = useCallback(() => setIsEscrowModalOpen(true), []);
  const closeEscrowModal = useCallback(() => setIsEscrowModalOpen(false), []);

  const openNotificationsModal = useCallback(() => setIsNotificationsModalOpen(true), []);
  const closeNotificationsModal = useCallback(() => setIsNotificationsModalOpen(false), []);

  const customerInitiateClaim = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const res = orderApi.customerInitiateClaim(order);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        showToast(res.message);
        // openMpinModal removed on initiate claim
      } else {
        showToast(res.message);
      }
    },
    [orders, showToast, openMpinModal]
  );

  const completeMpinClaim = useCallback(() => {
    closeMpinModal();
    const current = getCurrentOrder();
    const updated = {
      ...current,
      claimInitiatedAt: Date.now(),
    };
    setOrders((prev) => prev.map((o) => (o.id === current.id ? updated : o)));
    showToast('MPIN verified! Active counter handover ticket valid for 5:00 minutes.');
  }, [closeMpinModal, getCurrentOrder, showToast]);

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

  const loginCustomer = useCallback(
    async (payload: CustomerLoginRequest): Promise<CustomerLoginResponse> => {
      const res = await customerApi.login(payload);
      setRefreshToken(res.refreshToken);
      setAuthCustomer((prev) => ({
        ...prev,
        email: payload.email,
      }));
      showToast(res.statusMessage);
      setActiveScreen('mpin_login');
      return res;
    },
    [showToast]
  );

  const registerCustomer = useCallback(
    async (payload: CustomerRegisterRequest): Promise<CustomerRegisterResponse> => {
      const res = await customerApi.register(payload);
      setRefreshToken(res.refreshToken);
      setAuthCustomer({
        email: payload.email,
        firstname: payload.firstname,
        lastname: payload.lastname,
        middleinitial: payload.middleinitial,
        phonenumber: payload.phonenumber,
      });
      showToast(res.statusMessage);
      setActiveScreen('mpin_create');
      return res;
    },
    [showToast]
  );

  const createCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerCreateMpinResponse> => {
      const res = await customerApi.createMpin({
        refreshToken: refreshToken || 'rt_demo',
        mpin,
      });
      setAuthToken(res.authToken);
      showToast(res.statusMessage);
      setActiveScreen('home');
      return res;
    },
    [refreshToken, showToast]
  );

  const verifyCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerVerifyMpinResponse> => {
      const res = await customerApi.verifyMpin({
        refreshToken: refreshToken || 'rt_demo',
        mpin,
      });
      setAuthToken(res.authToken);
      showToast(res.statusMessage);
      setActiveScreen('home');
      return res;
    },
    [refreshToken, showToast]
  );

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
        claimConfirmed,
        isMpinModalOpen,
        isPodModalOpen,
        isEscrowModalOpen,
        isNotificationsModalOpen,
        refreshToken,
        authToken,
        authCustomer,
        loginCustomer,
        registerCustomer,
        createCustomerMpin,
        verifyCustomerMpin,
        navigateTo,
        setHasOrders,
        setHubOpen,
        setClaimConfirmed,
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
        openEscrowModal,
        closeEscrowModal,
        openNotificationsModal,
        closeNotificationsModal,
        markAllNotificationsAsRead,
        customerInitiateClaim,
        isOrderClaimUnlocked,
        getOrderClaimRemainingSeconds,
        getOrderStatedFee,
        copyToClipboard,
        completeMpinClaim,
        getCurrentOrder,
        applyScenario,
        simulatePaymentReceived,
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

