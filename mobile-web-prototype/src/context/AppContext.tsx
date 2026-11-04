import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Order,
  OrderStatus,
  DraftOrder,
  NotificationItem,
  ScreenId,
  RoleMode,
  ViewMode,
  TransactionFilter,
  StaffFilter,
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
    recipient: 'John Doe',
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
    parcelImageUrl: './assets/receipt_thumbnail.png',
    claimInitiatedAt: null,
    notes: 'Customer notified via SMS. Ready for counter pickup.',
    statedFee: 500,
  },
  {
    id: 'ORD-408',
    product: 'Poco X6 Pro',
    recipient: 'John Doe',
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
    recipient: 'John Doe',
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
    recipient: 'John Doe',
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
    parcelImageUrl: './assets/receipt_thumbnail.png',
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
    parcelImageUrl: './assets/receipt_thumbnail.png',
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
  recipient: 'John Doe',
  totalAmount: '₱480',
  trackingId: 'PH2696153366792H',
  receiptUri: './assets/receipt_screenshot.png',
};

interface AppContextType {
  activeScreen: ScreenId;
  roleMode: RoleMode;
  hasOrders: boolean;
  hubOpen: boolean;
  viewMode: ViewMode;
  notificationActive: boolean;
  selectedOrderId: string;
  transactionFilter: TransactionFilter;
  staffFilter: StaffFilter;
  staffSearchQuery: string;
  pingCountdown: number;
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

  // Actions
  navigateTo: (screenId: ScreenId, params?: { orderId?: string; status?: OrderStatus; filter?: TransactionFilter }) => void;
  setRoleMode: (role: RoleMode) => void;
  setHasOrders: (val: boolean) => void;
  setHubOpen: (val: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setClaimConfirmed: (val: boolean) => void;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setStaffFilter: (filter: StaffFilter) => void;
  setStaffSearchQuery: (query: string) => void;
  setSelectedOrderId: (id: string) => void;
  updateDraftOrder: (partial: Partial<DraftOrder>) => void;
  submitDraftOrder: () => void;
  loadSampleReceipt: () => void;
  handleReceiptFile: (file: File) => void;
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
  resetPingTimer: () => void;
  simulateStaffFlow: () => void;
  applyScenario: (scenario: ScenarioId) => void;
  staffAcceptPayment: (orderId: string, amountReceived?: number) => boolean;
  staffActivateOrder: (orderId: string, amountReceived: number) => boolean;
  staffPayCourier: (orderId: string) => void;
  staffAttachPhoto: (orderId: string, imageUrl: string) => boolean;
  customerInitiateClaim: (orderId: string) => void;
  staffReleaseOrder: (orderId: string) => boolean;
  staffReceiveCourier: (orderId: string) => void;
  staffReleaseParcel: (orderId: string) => void;
  isOrderClaimUnlocked: (order: Order) => boolean;
  getOrderClaimRemainingSeconds: (order: Order) => number;
  getOrderStatedFee: (order: Order) => number;
  copyToClipboard: (text: string, label: string) => void;
  completeMpinClaim: () => void;
  getCurrentOrder: () => Order;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Customer Auth State
  const [refreshToken, setRefreshToken] = useState<string | null>('rt_demo_john_dumaguit');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authCustomer, setAuthCustomer] = useState<AuthCustomer>({
    email: 'johnvincekeyedu@gmail.com',
    firstname: 'John Vince',
    lastname: 'Dumaguit',
    phonenumber: '0917 123 4567',
  });

  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [roleMode, setRoleModeState] = useState<RoleMode>('user');
  const [hasOrders, setHasOrdersState] = useState<boolean>(true);
  const [hubOpen, setHubOpenState] = useState<boolean>(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('device');
  const [notificationActive, setNotificationActive] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-402');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');
  const [staffFilter, setStaffFilter] = useState<StaffFilter>('active');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [pingCountdown, setPingCountdown] = useState<number>(298); // 04:58
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

  // Periodic ticker to trigger re-renders for active handoff claim countdowns
  const [, setTicker] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 1000000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetPingTimer = useCallback(() => {
    setPingCountdown(298);
    showToast('Counter ping renewed! Active for next 5:00 minutes.');
  }, [showToast]);

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

  const setRoleMode = useCallback(
    (role: RoleMode) => {
      setRoleModeState(role);
      if (role === 'staff') {
        setActiveScreen('staff_ui');
        showToast('Switched to Hub Staff Counter Terminal');
      } else {
        setActiveScreen('home');
        showToast('Switched to Customer Mobile App');
      }
    },
    [showToast]
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

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

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
    setDraftOrder((prev) => ({ ...prev, receiptUri: './assets/receipt_screenshot.png' }));
    showToast('Sample Shopee receipt attached & OCR parsed!');
    setActiveScreen('confirm_order');
  }, [showToast]);

  const handleReceiptFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        if (file.size > 15 * 1024 * 1024) {
          showToast('Image exceeds 15MB limit. Please upload a smaller receipt.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          setDraftOrder((prev) => ({ ...prev, receiptUri: res }));
          showToast('Receipt image loaded successfully!');
          setActiveScreen('confirm_order');
        };
        reader.onerror = () => {
          showToast('Could not read image file. Please try another.');
        };
        reader.readAsDataURL(file);
      } else {
        showToast('Please upload a valid image file (PNG, JPG, WebP).');
      }
    },
    [showToast]
  );

  const submitDraftOrder = useCallback(() => {
    const amtStr = draftOrder.totalAmount || '₱480';
    const numericAmt = parseInt(amtStr.replace(/[^\d]/g, ''), 10) || 480;
    let depositAmount = Math.ceil(numericAmt / 100) * 100;
    if (depositAmount === numericAmt) depositAmount += 100;
    const changeAmount = depositAmount - numericAmt;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newOrder: Order = {
      id: `ORD-${randomNum}`,
      product: draftOrder.product.trim() || 'VXE R1 Nearlink Wireless Mouse',
      recipient: draftOrder.recipient.trim() || 'John Doe',
      paidAmount: `₱${depositAmount.toLocaleString()}`,
      codAmount: amtStr.startsWith('₱') ? amtStr : `₱${numericAmt.toLocaleString()}`,
      change: `₱${changeAmount.toLocaleString()}`,
      trackingNumber: draftOrder.trackingId.trim() || 'PH2696153366792H',
      refCode: `0001-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      alphanumericKey: `PH-${randomNum}-${Math.floor(1000 + Math.random() * 9000)}`,
      envelopeNumber: `ENV-${randomNum}`,
      status: 'PAYMENT_REQUIRED',
      orderPlacedTime: 'Just now',
      awaitingParcelTime: null,
      readyToClaimTime: null,
      claimedTime: null,
      dateLabel: 'Today, Just now',
      carrier: 'ShopeeXpress (SPX)',
      hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.id);
    setHasOrdersState(true);
    setActiveScreen('payment_verification');
    showToast('Order registered! Complete counter deposit to activate.');
  }, [draftOrder, showToast]);

  const loginCustomer = useCallback(
    async (payload: CustomerLoginRequest): Promise<CustomerLoginResponse> => {
      try {
        const res = await customerApi.login(payload);
        if (res.refreshToken) {
          setRefreshToken(res.refreshToken);
        }
        setAuthCustomer((prev) => ({
          ...prev,
          email: payload.email,
        }));
        showToast(res.statusMessage || 'Login verified! Please enter your MPIN.');
        navigateTo('mpin_login');
        return res;
      } catch (err: any) {
        showToast(err?.message || 'Login failed. Please check your credentials.');
        throw err;
      }
    },
    [navigateTo, showToast]
  );

  const registerCustomer = useCallback(
    async (payload: CustomerRegisterRequest): Promise<CustomerRegisterResponse> => {
      try {
        const res = await customerApi.register(payload);
        if (res.refreshToken) {
          setRefreshToken(res.refreshToken);
        }
        setAuthCustomer({
          email: payload.email,
          firstname: payload.firstname,
          lastname: payload.lastname,
          middleinitial: payload.middleinitial,
          phonenumber: payload.phonenumber,
        });
        showToast(res.statusMessage || 'Registration successful! Setup your MPIN.');
        navigateTo('mpin_create');
        return res;
      } catch (err: any) {
        showToast(err?.message || 'Registration failed. Please check your information.');
        throw err;
      }
    },
    [navigateTo, showToast]
  );

  const createCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerCreateMpinResponse> => {
      try {
        const token = refreshToken || 'rt_demo_john_dumaguit';
        const res = await customerApi.createMpin({ refreshToken: token, mpin });
        if (res.authToken) {
          setAuthToken(res.authToken);
        }
        showToast(res.statusMessage || 'MPIN created! Welcome to ParcelHub.');
        navigateTo('home');
        return res;
      } catch (err: any) {
        showToast(err?.message || 'Failed to create MPIN. Please try again.');
        throw err;
      }
    },
    [navigateTo, refreshToken, showToast]
  );

  const verifyCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerVerifyMpinResponse> => {
      try {
        const token = refreshToken || 'rt_demo_john_dumaguit';
        const res = await customerApi.verifyMpin({ refreshToken: token, mpin });
        if (res.authToken) {
          setAuthToken(res.authToken);
        }
        showToast(res.statusMessage || 'Welcome back to ParcelHub!');
        navigateTo('home');
        return res;
      } catch (err: any) {
        showToast(err?.message || 'MPIN verification failed. Please try again.');
        throw err;
      }
    },
    [navigateTo, refreshToken, showToast]
  );

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            showToast(`${label} copied to clipboard: ${text}`);
          })
          .catch(() => {
            fallbackCopy(text, label);
          });
      } else {
        fallbackCopy(text, label);
      }

      function fallbackCopy(val: string, lbl: string) {
        const ta = document.createElement('textarea');
        ta.value = val;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch {
          // execCommand may throw in certain headless environments
        }
        showToast(`${lbl} copied to clipboard: ${val}`);
        document.body.removeChild(ta);
      }
    },
    [showToast]
  );

  const completeMpinClaim = useCallback(() => {
    setIsMpinModalOpen(false);
    const cur = orders.find((o) => o.id === selectedOrderId) || orders[0];
    const finalChange = !cur.change || cur.change === 'To Be Determined' ? '₱20' : cur.change;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === selectedOrderId) {
          return {
            ...o,
            status: 'CLAIMED',
            claimedTime: 'Today, Just now',
            change: finalChange,
          };
        }
        return o;
      })
    );
    setClaimConfirmed(false);
    showToast(`MPIN Authorized! Parcel claimed & change (${finalChange}) returned.`);
  }, [orders, selectedOrderId, showToast]);

  const staffActivateOrder = useCallback(
    (orderId: string, amountReceived: number): boolean => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return false;
      const res = orderApi.staffActivate(ord, amountReceived);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        showToast(res.message);
        return true;
      } else {
        showToast(res.message);
        return false;
      }
    },
    [orders, showToast]
  );

  const staffAcceptPayment = useCallback(
    (orderId: string, amountReceived?: number): boolean => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return false;
      const amt = amountReceived !== undefined ? amountReceived : getStatedFee(ord);
      return staffActivateOrder(orderId, amt);
    },
    [orders, staffActivateOrder]
  );

  const staffPayCourier = useCallback(
    (orderId: string) => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return;
      const res = orderApi.staffPayCourier(ord);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    },
    [orders, showToast]
  );

  const staffAttachPhoto = useCallback(
    (orderId: string, imageUrl: string): boolean => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return false;
      const res = orderApi.staffAttachPhoto(ord, imageUrl);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        showToast(res.message);
        return true;
      } else {
        showToast(res.message);
        return false;
      }
    },
    [orders, showToast]
  );

  const customerInitiateClaim = useCallback(
    (orderId: string) => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return;
      const res = orderApi.customerInitiateClaim(ord);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    },
    [orders, showToast]
  );

  const staffReleaseOrder = useCallback(
    (orderId: string): boolean => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return false;
      const res = orderApi.staffRelease(ord);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data! : o)));
        setClaimConfirmed(false);
        showToast(res.message);
        return true;
      } else {
        showToast(res.message);
        return false;
      }
    },
    [orders, showToast]
  );

  const staffReceiveCourier = useCallback(
    (orderId: string) => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                courierPaid: true,
                parcelImageUrl: './assets/receipt_thumbnail.png',
                status: 'READY_TO_CLAIM',
                readyToClaimTime: 'Just now',
              }
            : o
        )
      );
      showToast(`Courier payment verified (${ord.codAmount || 'COD'}) & parcel photo attached!`);
    },
    [orders, showToast]
  );

  const staffReleaseParcel = useCallback(
    (orderId: string) => {
      const ord = orders.find((o) => o.id === orderId);
      if (ord && !isClaimUnlocked(ord)) {
        // Unlock if needed for legacy/convenience
        ord.claimInitiatedAt = Date.now();
      }
      staffReleaseOrder(orderId);
    },
    [orders, staffReleaseOrder]
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

  const simulateStaffFlow = useCallback(() => {
    const cur = orders.find((o) => o.id === selectedOrderId) || orders[0];
    if (cur.status === 'PAYMENT_REQUIRED') {
      staffActivateOrder(cur.id, getStatedFee(cur));
    } else if (cur.status === 'AWAITING_PARCEL') {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cur.id
            ? {
                ...o,
                courierPaid: true,
                parcelImageUrl: './assets/receipt_thumbnail.png',
                status: 'READY_TO_CLAIM',
                readyToClaimTime: 'Just now',
              }
            : o
        )
      );
      showToast('Courier package received! Order status: Ready to Claim');
    } else if (cur.status === 'READY_TO_CLAIM') {
      if (!isClaimUnlocked(cur)) {
        customerInitiateClaim(cur.id);
      } else {
        staffReleaseOrder(cur.id);
      }
    }
  }, [orders, selectedOrderId, showToast, staffActivateOrder, customerInitiateClaim, staffReleaseOrder]);

  const applyScenario = useCallback(
    (scenario: ScenarioId) => {
      setRoleModeState('user');
      switch (scenario) {
        case 'figma-1':
          setHasOrdersState(false);
          setActiveScreen('home');
          break;
        case 'figma-2':
          setHasOrdersState(true);
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
          setActiveScreen('qr_screen');
          break;
        case 'figma-7':
          setActiveScreen('order_details');
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'PAYMENT_REQUIRED' } : o))
          );
          break;
        case 'figma-8':
          setActiveScreen('order_details');
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'AWAITING_PARCEL' } : o))
          );
          break;
        case 'figma-9':
          setActiveScreen('order_details');
          setClaimConfirmed(false);
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'READY_TO_CLAIM' } : o))
          );
          setHubOpenState(true);
          break;
        case 'figma-10':
          setActiveScreen('order_details');
          setClaimConfirmed(true);
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'READY_TO_CLAIM' } : o))
          );
          setHubOpenState(true);
          break;
        case 'figma-11':
          setActiveScreen('order_details');
          setClaimConfirmed(false);
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'READY_TO_CLAIM' } : o))
          );
          setHubOpenState(false);
          break;
        case 'figma-12':
          setActiveScreen('order_details');
          setClaimConfirmed(false);
          setOrders((prev) =>
            prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'CLAIMED' } : o))
          );
          break;
        case 'figma-staff':
          setRoleModeState('staff');
          setActiveScreen('staff_ui');
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
    [selectedOrderId]
  );

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        roleMode,
        hasOrders,
        hubOpen,
        viewMode,
        notificationActive,
        selectedOrderId,
        transactionFilter,
        staffFilter,
        staffSearchQuery,
        pingCountdown,
        draftOrder,
        orders,
        notifications,
        toast,
        claimConfirmed,
        isMpinModalOpen,
        isPodModalOpen,
        isEscrowModalOpen,
        isNotificationsModalOpen,
        navigateTo,
        setRoleMode,
        setHasOrders,
        setHubOpen,
        setViewMode,
        setClaimConfirmed,
        setTransactionFilter,
        setStaffFilter,
        setStaffSearchQuery,
        setSelectedOrderId,
        updateDraftOrder,
        submitDraftOrder,
        loadSampleReceipt,
        handleReceiptFile,
        toggleNotificationAlerts,
        showToast,
        openMpinModal: () => setIsMpinModalOpen(true),
        closeMpinModal: () => setIsMpinModalOpen(false),
        openPodModal: () => setIsPodModalOpen(true),
        closePodModal: () => setIsPodModalOpen(false),
        openProofOfDeliveryModal: () => setIsPodModalOpen(true),
        closeProofOfDeliveryModal: () => setIsPodModalOpen(false),
        openEscrowModal: () => setIsEscrowModalOpen(true),
        closeEscrowModal: () => setIsEscrowModalOpen(false),
        openNotificationsModal: () => setIsNotificationsModalOpen(true),
        closeNotificationsModal: () => setIsNotificationsModalOpen(false),
        markAllNotificationsAsRead,
        resetPingTimer,
        simulateStaffFlow,
        applyScenario,
        staffAcceptPayment,
        staffActivateOrder,
        staffPayCourier,
        staffAttachPhoto,
        customerInitiateClaim,
        staffReleaseOrder,
        staffReceiveCourier,
        staffReleaseParcel,
        isOrderClaimUnlocked,
        getOrderClaimRemainingSeconds,
        getOrderStatedFee,
        copyToClipboard,
        completeMpinClaim,
        getCurrentOrder,
        refreshToken,
        authToken,
        authCustomer,
        loginCustomer,
        registerCustomer,
        createCustomerMpin,
        verifyCustomerMpin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
