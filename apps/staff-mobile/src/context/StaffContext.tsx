import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StaffOrder,
  StaffUser,
  StaffTab,
  StaffBadgeCounts,
  ToastState,
} from '../types';
import { staffApi, StaffApiError } from '../services/staffApi';
import { ENV } from '../config/env';

interface StaffContextType {
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  orders: StaffOrder[];
  filteredOrders: StaffOrder[];
  activeTab: StaffTab;
  setActiveTab: (tab: StaffTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  badgeCounts: StaffBadgeCounts;
  selectedOrder: StaffOrder | null;
  isDetailsOpen: boolean;
  openOrderDetails: (order: StaffOrder) => void;
  closeOrderDetails: () => void;
  isLookupOpen: boolean;
  setIsLookupOpen: (open: boolean) => void;
  isDeskInfoOpen: boolean;
  setIsDeskInfoOpen: (open: boolean) => void;
  toast: ToastState;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  activateOrder: (orderId: string, amountReceived: number) => Promise<void>;
  payCourier: (orderId: string) => Promise<void>;
  attachPhoto: (orderId: string, imageUrl: string) => Promise<void>;
  claimOrder: (orderId: string) => Promise<void>;
  updateOrderNotes: (orderId: string, notes: string) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [activeTab, setActiveTab] = useState<StaffTab>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [isDeskInfoOpen, setIsDeskInfoOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3200);
  }, []);

  // Check stored auth token on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await staffApi.getStoredAuthToken();
        const email = await staffApi.getStoredStaffEmail();
        if (token && email && isMounted) {
          setStaffUser({
            id: 'STF-001',
            email,
            role: 'STAFF',
            token,
          });
        }
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch orders from live backend
  const fetchOrders = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const data = await staffApi.getOrders();
      setOrders((prev) => {
        // Merge notes from local memory if existing
        const notesMap = new Map<string, string>();
        prev.forEach((o) => {
          if (o.notes) notesMap.set(o.id, o.notes);
        });

        return data.map((o) => ({
          ...o,
          notes: notesMap.get(o.id) || o.notes,
        }));
      });
      setIsOnline(true);

      // Keep selected order in sync if modal is open
      setSelectedOrder((prevSelected) => {
        if (!prevSelected) return null;
        const fresh = data.find((o) => o.id === prevSelected.id);
        return fresh ? { ...fresh, notes: prevSelected.notes } : prevSelected;
      });
    } catch (err: any) {
      setIsOnline(false);
      if (!quiet) {
        showToast(err?.message || 'Failed to sync with backend', 'error');
      }
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [showToast]);

  // Polling every 4 seconds when authenticated
  useEffect(() => {
    if (!staffUser) return;
    fetchOrders(false);

    const interval = setInterval(() => {
      fetchOrders(true);
    }, ENV.POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [staffUser, fetchOrders]);

  // Compute Badge Counts for Tabs
  const badgeCounts: StaffBadgeCounts = useMemo(() => ({
    active: orders.filter((o) => o.status === 'AWAITING_PARCEL').length,
    ready: orders.filter((o) => o.status === 'READY_TO_CLAIM').length,
    unpaid: orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length,
    claimed: orders.filter((o) => o.status === 'CLAIMED').length,
  }), [orders]);

  // Filter orders by active tab
  const tabOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return orders.filter((o) => o.status === 'AWAITING_PARCEL');
      case 'ready':
        return orders.filter((o) => o.status === 'READY_TO_CLAIM');
      case 'unpaid':
        return orders.filter((o) => o.status === 'PAYMENT_REQUIRED');
      case 'claimed':
        return orders.filter((o) => o.status === 'CLAIMED');
      default:
        return orders;
    }
  }, [orders, activeTab]);

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabOrders;
    return tabOrders.filter((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingId.toLowerCase();
      const cust = o.customer.toLowerCase();
      const prod = (o.productName || '').toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      return id.includes(q) || track.includes(q) || cust.includes(q) || prod.includes(q) || notes.includes(q);
    });
  }, [tabOrders, searchQuery]);

  // Authentication actions
  const login = async (email: string, password: string) => {
    const res = await staffApi.login(email, password);
    setStaffUser({
      id: 'STF-001',
      email,
      role: 'STAFF',
      token: res.authToken,
    });
    showToast(`Signed in as ${email}`, 'success');
  };

  const logout = async () => {
    await staffApi.clearStoredSession();
    setStaffUser(null);
    setSelectedOrder(null);
    setIsDetailsOpen(false);
    showToast('Signed out of Staff Terminal', 'info');
  };

  // Order Details Modal helpers
  const openOrderDetails = (order: StaffOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const closeOrderDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  // Staff counter actions
  const activateOrder = async (orderId: string, amountReceived: number) => {
    const res = await staffApi.activateOrder(orderId, amountReceived);
    showToast(`Order ${orderId} activated! Change: ₱${res.change.toLocaleString()}`, 'success');
    await fetchOrders(true);
  };

  const payCourier = async (orderId: string) => {
    await staffApi.payCourier(orderId);
    showToast(`Courier payout recorded for ${orderId}`, 'success');
    await fetchOrders(true);
  };

  const attachPhoto = async (orderId: string, imageUrl: string) => {
    await staffApi.attachPhoto(orderId, imageUrl);
    showToast(`Proof attached. ${orderId} is now Ready to Claim!`, 'success');
    await fetchOrders(true);
  };

  const claimOrder = async (orderId: string) => {
    await staffApi.claimOrder(orderId);
    showToast(`Order ${orderId} handed over and marked Claimed!`, 'success');
    await fetchOrders(true);
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, notes } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, notes } : null));
    }
    showToast('Counter note updated', 'success');
  };

  return (
    <StaffContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        isOnline,
        isInitialLoading,
        isRefreshing,
        orders,
        filteredOrders,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        badgeCounts,
        selectedOrder,
        isDetailsOpen,
        openOrderDetails,
        closeOrderDetails,
        isLookupOpen,
        setIsLookupOpen,
        isDeskInfoOpen,
        setIsDeskInfoOpen,
        toast,
        showToast,
        login,
        logout,
        refreshOrders: () => fetchOrders(false),
        activateOrder,
        payCourier,
        attachPhoto,
        claimOrder,
        updateOrderNotes,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
