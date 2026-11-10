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
  attachPhoto: (orderId: string, imageUrl?: string) => Promise<void>;
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
  const userRef = useRef<StaffUser | null>(null);
  userRef.current = staffUser;

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
          const user: StaffUser = {
            id: 'STF-001',
            email,
            role: 'STAFF',
            token,
          };
          setStaffUser(user);
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
  const fetchOrders = useCallback(async (quiet = false, explicitToken?: string) => {
    const token = explicitToken || userRef.current?.token;
    if (!token) return;

    if (!quiet) setIsRefreshing(true);
    try {
      const data = await staffApi.getOrders(undefined, undefined, token);
      setOrders((prev) => {
        // Merge notes and local claimedAt from local memory if existing
        const notesMap = new Map<string, string>();
        const claimedAtMap = new Map<string, string>();
        prev.forEach((o) => {
          if (o.notes) notesMap.set(o.id, o.notes);
          if (o.claimedAt) claimedAtMap.set(o.id, o.claimedAt);
        });

        return data.map((o) => ({
          ...o,
          notes: notesMap.get(o.id) || o.notes,
          claimedAt: claimedAtMap.get(o.id) || o.claimedAt,
        }));
      });
      setIsOnline(true);

      // Keep selected order in sync if modal is open
      setSelectedOrder((prevSelected) => {
        if (!prevSelected) return null;
        const fresh = data.find((o) => o.id === prevSelected.id);
        return fresh
          ? {
              ...fresh,
              notes: prevSelected.notes,
              claimedAt: prevSelected.claimedAt,
            }
          : prevSelected;
      });
    } catch (err: any) {
      if (err instanceof StaffApiError && err.statusCode === 401) {
        setStaffUser(null);
        showToast('Session expired or unauthorized. Please sign in again.', 'error');
        return;
      }
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
    fetchOrders(false, staffUser.token);

    const interval = setInterval(() => {
      fetchOrders(true, staffUser.token);
    }, ENV.POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [staffUser, fetchOrders]);

  // Helper to determine if an unpaid order was placed within the last 5 minutes
  const isRecentUnpaid = useCallback((order: StaffOrder) => {
    if (order.status !== 'PAYMENT_REQUIRED') return false;
    if (!order.timestamp) return true;
    const time = new Date(order.timestamp).getTime();
    if (isNaN(time)) return true;
    const diffMinutes = (Date.now() - time) / (1000 * 60);
    return diffMinutes <= 5;
  }, []);

  // Compute Badge Counts for Tabs
  const badgeCounts: StaffBadgeCounts = useMemo(() => ({
    active: orders.filter((o) => o.status === 'AWAITING_PARCEL').length,
    ready: orders.filter((o) => o.status === 'READY_TO_CLAIM').length,
    unpaid: orders.filter((o) => isRecentUnpaid(o)).length,
    claimed: orders.filter((o) => o.status === 'CLAIMED').length,
  }), [orders, isRecentUnpaid]);

  // Filter orders by active tab
  const tabOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return orders.filter((o) => o.status === 'AWAITING_PARCEL');
      case 'ready':
        return orders.filter((o) => o.status === 'READY_TO_CLAIM');
      case 'unpaid':
        return orders.filter((o) => isRecentUnpaid(o));
      case 'claimed':
        return orders.filter((o) => o.status === 'CLAIMED');
      default:
        return orders;
    }
  }, [orders, activeTab, isRecentUnpaid]);

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
    const user: StaffUser = {
      id: 'STF-001',
      email,
      role: 'STAFF',
      token: res.authToken,
    };
    setStaffUser(user);
    showToast(`Signed in as ${email}`, 'success');
    await fetchOrders(false, res.authToken);
  };

  const logout = async () => {
    await staffApi.clearStoredSession();
    setStaffUser(null);
    setSelectedOrder(null);
    setIsDetailsOpen(false);
    showToast('Signed out of Staff Terminal', 'info');
  };

  // Order Details Modal helpers
  const openOrderDetails = async (order: StaffOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    try {
      const token = userRef.current?.token;
      if (token) {
        const detail = await staffApi.getOrder(order.id, token);
        setSelectedOrder((prev) =>
          prev && prev.id === order.id
            ? {
                ...prev,
                ...detail,
                amountReceived: detail.amountReceived ?? prev.amountReceived,
                change: detail.change || prev.change,
                productName: prev.productName || detail.productName,
                notes: prev.notes,
                claimedAt: prev.claimedAt,
              }
            : prev
        );
      }
    } catch {}
  };

  const closeOrderDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  // Staff counter actions
  const activateOrder = async (orderId: string, amountReceived: number) => {
    const res = await staffApi.activateOrder(orderId, amountReceived, staffUser?.token);
    showToast(`Order ${orderId} activated! Change: ₱${res.change.toLocaleString()}`, 'success');
    await fetchOrders(true, staffUser?.token);
  };

  const payCourier = async (orderId: string) => {
    await staffApi.payCourier(orderId, staffUser?.token);
    showToast(`Courier payout recorded for ${orderId}`, 'success');
    await fetchOrders(true, staffUser?.token);
  };

  const attachPhoto = async (orderId: string, imageUrl?: string) => {
    const payloadUrl = imageUrl?.trim() || 'mock://ai-verified-proof-delivery.jpg';
    await staffApi.attachPhoto(orderId, payloadUrl, staffUser?.token);
    showToast(`Proof attached. ${orderId} is now Ready to Claim!`, 'success');
    await fetchOrders(true, staffUser?.token);
  };

  const claimOrder = async (orderId: string) => {
    await staffApi.claimOrder(orderId, staffUser?.token);
    const claimedAt = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CLAIMED',
              isClaimActive: false,
              claimRemainingSeconds: 0,
              timestamp: claimedAt,
              claimedAt,
            }
          : o
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            status: 'CLAIMED',
            isClaimActive: false,
            claimRemainingSeconds: 0,
            timestamp: claimedAt,
            claimedAt,
          }
        : prev
    );
    showToast(`Order ${orderId} handed over and marked Claimed!`, 'success');
    await fetchOrders(true, staffUser?.token);
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
        refreshOrders: () => fetchOrders(false, staffUser?.token),
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
