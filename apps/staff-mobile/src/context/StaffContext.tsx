import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  StaffOrder,
  StaffUser,
  StaffTab,
  OrderStatus,
  StaffBadgeCounts,
  JustUpdatedOrderInfo,
} from '../types';
import { staffApi, StaffApiError } from '../services/staffApi';
import type { StaffQrLookupResult } from '../services/staffApi';
import { ENV } from '../config/env';

export const STAFF_TABS: StaffTab[] = ['all', 'ready', 'active', 'unpaid', 'claimed'];

export interface TabCacheEntry {
  orders: StaffOrder[];
  totalCount: number;
  lastFetched: number;
}

export type StaffTabCache = Record<StaffTab, TabCacheEntry | undefined>;

interface StaffContextType {
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  isInitialLoading: boolean;
  isLoadingOrders: boolean;
  isRefreshing: boolean;
  orders: StaffOrder[];
  filteredOrders: StaffOrder[];
  allCachedOrders: StaffOrder[];
  tabCache: StaffTabCache;
  totalCount: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  activeTab: StaffTab;
  setActiveTab: (tab: StaffTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  badgeCounts: StaffBadgeCounts;
  selectedOrder: StaffOrder | null;
  isDetailsOpen: boolean;
  openOrderDetails: (order: StaffOrder, hasDetails?: boolean) => void;
  findOrderByQrCode: (code: string, signal: AbortSignal) => Promise<StaffQrLookupResult>;
  closeOrderDetails: () => void;
  isLookupOpen: boolean;
  setIsLookupOpen: (open: boolean) => void;
  isDeskInfoOpen: boolean;
  setIsDeskInfoOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  activateOrder: (orderId: string, amountReceived: number) => Promise<void>;
  payCourier: (orderId: string) => Promise<void>;
  attachPhoto: (orderId: string, imageUrl?: string) => Promise<void>;
  claimOrder: (orderId: string) => Promise<void>;
  updateOrderNotes: (orderId: string, notes: string) => void;
  justUpdatedOrder: JustUpdatedOrderInfo | null;
  setJustUpdatedOrder: (info: JustUpdatedOrderInfo | null) => void;
}

function getStatusForTab(tab: StaffTab): OrderStatus | undefined {
  switch (tab) {
    case 'ready':
      return 'READY_TO_CLAIM';
    case 'active':
      return 'AWAITING_PARCEL';
    case 'unpaid':
      return 'PAYMENT_REQUIRED';
    case 'claimed':
      return 'CLAIMED';
    case 'all':
    default:
      return undefined;
  }
}

function extractLocalOverrides(cache: StaffTabCache): {
  notesMap: Map<string, string>;
  claimedAtMap: Map<string, string>;
  createdAtMap: Map<string, string>;
  proofImageUrlMap: Map<string, string>;
} {
  const notesMap = new Map<string, string>();
  const claimedAtMap = new Map<string, string>();
  const createdAtMap = new Map<string, string>();
  const proofImageUrlMap = new Map<string, string>();

  Object.values(cache).forEach((entry) => {
    entry?.orders.forEach((o) => {
      if (o.notes) notesMap.set(o.id, o.notes);
      if (o.claimedAt) claimedAtMap.set(o.id, o.claimedAt);
      if (o.createdAt) createdAtMap.set(o.id, o.createdAt);
      if (o.proofImageUrl) proofImageUrlMap.set(o.id, o.proofImageUrl);
    });
  });

  return { notesMap, claimedAtMap, createdAtMap, proofImageUrlMap };
}

function mergeOrders(
  rawOrders: StaffOrder[],
  overrides: {
    notesMap: Map<string, string>;
    claimedAtMap: Map<string, string>;
    createdAtMap: Map<string, string>;
    proofImageUrlMap: Map<string, string>;
  }
): StaffOrder[] {
  return rawOrders.map((o) => ({
    ...o,
    notes: overrides.notesMap.get(o.id) || o.notes,
    claimedAt: overrides.claimedAtMap.get(o.id) || o.claimedAt,
    createdAt: o.createdAt || overrides.createdAtMap.get(o.id),
    proofImageUrl: overrides.proofImageUrlMap.get(o.id) || o.proofImageUrl,
  }));
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Tab cache: stores 20 orders, totalCount, and lastFetched timestamp per tab
  const [tabCache, setTabCache] = useState<StaffTabCache>({
    all: undefined,
    ready: undefined,
    active: undefined,
    unpaid: undefined,
    claimed: undefined,
  });

  // Dedicated search state (so search never pollutes or erases tab cache)
  const [searchOrders, setSearchOrders] = useState<StaffOrder[] | null>(null);
  const [searchTotalCount, setSearchTotalCount] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<StaffTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [isDeskInfoOpen, setIsDeskInfoOpen] = useState<boolean>(false);
  const [justUpdatedOrder, setJustUpdatedOrder] = useState<JustUpdatedOrderInfo | null>(null);

  const userRef = useRef<StaffUser | null>(null);
  userRef.current = staffUser;

  const tabCacheRef = useRef<StaffTabCache>(tabCache);
  tabCacheRef.current = tabCache;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const isLoadingOrdersRef = useRef(isLoadingOrders);
  isLoadingOrdersRef.current = isLoadingOrders;

  const tabFetchRequestId = useRef(0);
  const tabAbortControllerRef = useRef<AbortController | null>(null);
  const isFetchingTabRef = useRef(false);

  // Fetch orders for a specific tab and page
  const fetchTabOrders = useCallback(
    async (tab: StaffTab, quiet = false, explicitToken?: string, page = 1) => {
      const token = explicitToken || userRef.current?.token;
      if (!token) return;

      // Prevent overlapping background requests
      if (quiet && isFetchingTabRef.current) {
        return;
      }

      // Cancel previous in-flight tab request if any
      if (tabAbortControllerRef.current) {
        tabAbortControllerRef.current.abort();
      }
      tabAbortControllerRef.current = new AbortController();
      const signal = tabAbortControllerRef.current.signal;

      const currentReqId = ++tabFetchRequestId.current;
      isFetchingTabRef.current = true;

      if (!quiet) {
        setIsLoadingOrders(true);
      }

      try {
        const status = getStatusForTab(tab);
        const limit = 20;
        const offset = (page - 1) * limit;

        const { orders: data, pagination } = await staffApi.getOrders(
          status,
          limit,
          offset,
          token,
          undefined,
          signal
        );

        // Guard against out-of-order responses if user switched tabs while request was in flight
        if (currentReqId !== tabFetchRequestId.current || signal.aborted) {
          return;
        }

        const overrides = extractLocalOverrides(tabCacheRef.current);
        const mergedOrders = mergeOrders(data, overrides);

        setTabCache((prev) => ({
          ...prev,
          [tab]: {
            orders: mergedOrders,
            totalCount: pagination.totalCount,
            lastFetched: Date.now(),
          },
        }));

        setIsOnline(true);

        // Keep selected order in sync if details modal is open
        setSelectedOrder((prevSelected) => {
          if (!prevSelected) return null;
          const fresh = mergedOrders.find((o) => o.id === prevSelected.id);
          return fresh
            ? {
                ...fresh,
                notes: prevSelected.notes,
                proofImageUrl: prevSelected.proofImageUrl || fresh.proofImageUrl,
              }
            : prevSelected;
        });
      } catch (err: any) {
        if (err?.name === 'AbortError' || currentReqId !== tabFetchRequestId.current) {
          return;
        }
        if (err instanceof StaffApiError && err.statusCode === 401) {
          setStaffUser(null);
          return;
        }
        setIsOnline(false);
      } finally {
        isFetchingTabRef.current = false;
        if (!quiet && currentReqId === tabFetchRequestId.current) {
          setIsLoadingOrders(false);
        }
      }
    },
    []
  );

  // Strategy A: Eagerly prefetch initial 20 orders for ALL tabs concurrently
  const fetchAllTabs = useCallback(
    async (quiet = false, explicitToken?: string) => {
      const token = explicitToken || userRef.current?.token;
      if (!token) return;

      if (!quiet) {
        setIsLoadingOrders(true);
        setIsRefreshing(true);
      }

      try {
        const limit = 20;
        const offset = 0;

        const settledResults = await Promise.allSettled(
          STAFF_TABS.map(async (tab) => {
            const status = getStatusForTab(tab);
            const { orders: data, pagination } = await staffApi.getOrders(
              status,
              limit,
              offset,
              token
            );
            return { tab, orders: data, totalCount: pagination.totalCount };
          })
        );

        const overrides = extractLocalOverrides(tabCacheRef.current);
        let hasSuccess = false;
        let has401 = false;

        const newEntries: Partial<StaffTabCache> = {};

        settledResults.forEach((res) => {
          if (res.status === 'fulfilled') {
            hasSuccess = true;
            const { tab, orders: data, totalCount } = res.value;
            newEntries[tab] = {
              orders: mergeOrders(data, overrides),
              totalCount,
              lastFetched: Date.now(),
            };
          } else {
            if (res.reason instanceof StaffApiError && res.reason.statusCode === 401) {
              has401 = true;
            }
          }
        });

        if (has401) {
          setStaffUser(null);
          return;
        }

        setTabCache((prev) => ({
          ...prev,
          ...newEntries,
        }));

        if (hasSuccess) {
          setIsOnline(true);
        }
      } catch {
        setIsOnline(false);
      } finally {
        if (!quiet) {
          setIsLoadingOrders(false);
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  // Search API execution
  const searchRequestId = useRef(0);

  const performSearch = useCallback(
    async (query: string, token: string, page = 1) => {
      const reqId = ++searchRequestId.current;
      setIsLoadingOrders(true);
      try {
        const limit = 20;
        const offset = (page - 1) * limit;
        const { orders: data, pagination } = await staffApi.getOrders(
          undefined,
          limit,
          offset,
          token,
          query
        );
        if (reqId !== searchRequestId.current) return;
        const overrides = extractLocalOverrides(tabCacheRef.current);
        setSearchOrders(mergeOrders(data, overrides));
        setSearchTotalCount(pagination.totalCount);
        setIsOnline(true);
      } catch (err: any) {
        if (reqId !== searchRequestId.current) return;
        if (err instanceof StaffApiError && err.statusCode === 401) {
          setStaffUser(null);
          return;
        }
        setIsOnline(false);
      } finally {
        if (reqId === searchRequestId.current) {
          setIsLoadingOrders(false);
        }
      }
    },
    []
  );

  // Check stored auth token on startup and prefetch tabs
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await staffApi.getStoredAuthToken();
        const email = await staffApi.getStoredStaffEmail();
        if (token && email && isMounted) {
          const user: StaffUser = {
            id: 'STF-001',
            name: 'Jane Smith',
            username: email,
            email,
            role: 'STAFF',
            hubName: "LILY'S CATERING HUB",
            token,
          };
          setStaffUser(user);
          // Eager pre-fetch for all tabs on session restore
          await fetchAllTabs(false, token);
        }
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchAllTabs]);

  // Handle tab switching:
  // - Pure client-side switch from memory cache!
  // - 0 network requests on tab change (Instant 0ms UI)
  // - The 4-second polling timer will silently refresh whatever tab is active
  const handleSelectTab = useCallback(
    (tab: StaffTab) => {
      // Guard 1: Ignore click if tab is already active and no search query is typed
      if (activeTabRef.current === tab && !searchQueryRef.current.trim()) {
        return;
      }

      // Clear search if active
      if (searchQueryRef.current) {
        setSearchQuery('');
        searchQueryRef.current = '';
        setSearchOrders(null);
      }

      setActiveTab(tab);
      activeTabRef.current = tab;

      // DO NOT REQUEST THE BACKEND!
      // Switching tabs reads 100% directly from cache.
      const cached = tabCacheRef.current[tab];
      if (!cached) {
        // Fallback ONLY if the tab was somehow never loaded during login prefetch
        const token = userRef.current?.token;
        if (token) {
          fetchTabOrders(tab, false, token, 1);
        }
      }
    },
    [fetchTabOrders]
  );

  // Handle search typing: activates loading state and switches tab to 'all' if needed
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    searchQueryRef.current = text;
    setIsLoadingOrders(true);
    if (text.trim().length > 0 && activeTabRef.current !== 'all') {
      setActiveTab('all');
      activeTabRef.current = 'all';
    }
  }, []);

  const prevSearchQueryRef = useRef(searchQuery);

  // Real-time debounced database search (500ms)
  useEffect(() => {
    if (!staffUser) return;
    const q = searchQuery.trim();
    const prevQ = prevSearchQueryRef.current.trim();
    prevSearchQueryRef.current = searchQuery;

    if (!q && !prevQ) return;

    // Search query cleared -> immediately restore cached tab view
    if (!q) {
      setSearchOrders(null);
      setIsLoadingOrders(false);
      return;
    }

    // Active search query typed -> debounced backend search
    setIsLoadingOrders(true);
    const timer = setTimeout(() => {
      performSearch(q, staffUser.token, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, staffUser, performSearch]);

  // Page navigation effect
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (!staffUser) return;
    if (prevPageRef.current === currentPage) return;
    prevPageRef.current = currentPage;

    const q = searchQueryRef.current.trim();
    if (q) {
      performSearch(q, staffUser.token, currentPage);
    } else {
      fetchTabOrders(activeTabRef.current, false, staffUser.token, currentPage);
    }
  }, [currentPage, staffUser, performSearch, fetchTabOrders]);

  // Background polling every 4 seconds:
  // Polls ONLY the active tab sequentially, NEVER overlapping
  useEffect(() => {
    if (!staffUser) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;

      // Do not poll while searching, foreground loading, or if a fetch is already in flight
      if (
        !searchQueryRef.current.trim() &&
        !isLoadingOrdersRef.current &&
        !isFetchingTabRef.current
      ) {
        await fetchTabOrders(activeTabRef.current, true, staffUser.token, currentPageRef.current);
      }

      if (!isCancelled) {
        timer = setTimeout(poll, ENV.POLLING_INTERVAL_MS);
      }
    };

    timer = setTimeout(poll, ENV.POLLING_INTERVAL_MS);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [staffUser, fetchTabOrders]);

  // Derived active tab data
  const currentTabEntry = tabCache[activeTab];

  const displayedOrders = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchOrders ?? [];
    }
    return currentTabEntry?.orders ?? [];
  }, [searchQuery, searchOrders, currentTabEntry]);

  const currentTotalCount = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchTotalCount;
    }
    return currentTabEntry?.totalCount ?? displayedOrders.length;
  }, [searchQuery, searchTotalCount, currentTabEntry, displayedOrders.length]);

  // Badge counts directly derived from server counts across all tabs
  const badgeCounts: StaffBadgeCounts = useMemo(
    () => ({
      all: tabCache.all?.totalCount ?? 0,
      active: tabCache.active?.totalCount ?? 0,
      ready: tabCache.ready?.totalCount ?? 0,
      unpaid: tabCache.unpaid?.totalCount ?? 0,
      claimed: tabCache.claimed?.totalCount ?? 0,
    }),
    [tabCache]
  );

  // Aggregated pool of all cached orders across all tabs (for global manual QR lookup)
  const allCachedOrders = useMemo(() => {
    const map = new Map<string, StaffOrder>();
    Object.values(tabCache).forEach((entry) => {
      entry?.orders.forEach((o) => map.set(o.id, o));
    });
    if (searchOrders) {
      searchOrders.forEach((o) => map.set(o.id, o));
    }
    return Array.from(map.values());
  }, [tabCache, searchOrders]);

  // Authentication actions
  const login = async (usernameOrEmail: string, password: string) => {
    const res = await staffApi.login(usernameOrEmail, password);
    const normalizedUsername = usernameOrEmail.trim().includes('@')
      ? usernameOrEmail.trim().split('@')[0].toLowerCase()
      : usernameOrEmail.trim().toLowerCase();
    const user: StaffUser = {
      id: 'STF-001',
      name: 'Jane Smith',
      username: normalizedUsername,
      email: normalizedUsername,
      role: 'STAFF',
      hubName: "LILY'S CATERING HUB",
      token: res.authToken,
    };
    setStaffUser(user);
    // Strategy A: Eagerly prefetch 20 orders for each tab on login
    await fetchAllTabs(false, res.authToken);
  };

  const logout = async () => {
    await staffApi.clearStoredSession();
    setStaffUser(null);
    setTabCache({
      all: undefined,
      ready: undefined,
      active: undefined,
      unpaid: undefined,
      claimed: undefined,
    });
    setSearchOrders(null);
    setSearchQuery('');
    setSelectedOrder(null);
    setIsDetailsOpen(false);
  };

  // Pull to refresh: refreshes search or all tabs
  const refreshOrders = useCallback(async () => {
    const token = staffUser?.token;
    if (!token) return;
    if (searchQueryRef.current.trim()) {
      await performSearch(searchQueryRef.current.trim(), token, currentPageRef.current);
    } else {
      await fetchAllTabs(false, token);
    }
  }, [staffUser, performSearch, fetchAllTabs]);

  // Order Details Modal helpers
  const findOrderByQrCode = async (code: string, signal: AbortSignal) => {
    const token = userRef.current?.token;
    if (!token) throw new StaffApiError('Please sign in to look up orders.', 401);

    try {
      return await staffApi.findOrderByQrCode(code, token, signal);
    } catch (error) {
      if (error instanceof StaffApiError && error.statusCode === 401 && userRef.current?.token === token) {
        setStaffUser(null);
      }
      throw error;
    }
  };

  const openOrderDetails = async (order: StaffOrder, hasDetails = false) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    if (hasDetails) return;
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
                notes: prev.notes,
                claimedAt: prev.claimedAt || detail.claimedAt,
                createdAt: detail.createdAt || prev.createdAt,
                statusTimeline: detail.statusTimeline || prev.statusTimeline,
                proofImageUrl: detail.proofImageUrl || prev.proofImageUrl || order.proofImageUrl,
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
    // Optimistically update tabCache so tabs reflect the updated order upon return to home
    setTabCache((prev) => {
      const next = { ...prev };
      let updatedOrder: StaffOrder | null = null;
      for (const tab of STAFF_TABS) {
        const found = next[tab]?.orders.find((o) => o.id === orderId);
        if (found) {
          updatedOrder = {
            ...found,
            status: 'AWAITING_PARCEL' as OrderStatus,
            amountReceived,
            change: res.change,
            timestamp: new Date().toISOString(),
          };
          break;
        }
      }
      if (!updatedOrder && selectedOrder?.id === orderId) {
        updatedOrder = {
          ...selectedOrder,
          status: 'AWAITING_PARCEL' as OrderStatus,
          amountReceived,
          change: res.change,
          timestamp: new Date().toISOString(),
        };
      }

      if (updatedOrder) {
        if (next.unpaid) {
          next.unpaid = {
            ...next.unpaid,
            orders: next.unpaid.orders.filter((o) => o.id !== orderId),
            totalCount: Math.max(0, next.unpaid.totalCount - 1),
          };
        }
        if (next.active) {
          const rest = next.active.orders.filter((o) => o.id !== orderId);
          next.active = {
            ...next.active,
            orders: [updatedOrder, ...rest],
            totalCount: next.active.totalCount + 1,
          };
        } else {
          next.active = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
        if (next.all) {
          const rest = next.all.orders.filter((o) => o.id !== orderId);
          next.all = {
            ...next.all,
            orders: [updatedOrder, ...rest],
          };
        } else {
          next.all = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
      }
      return next;
    });
    await fetchAllTabs(true, staffUser?.token);
  };

  const payCourier = async (orderId: string) => {
    await staffApi.payCourier(orderId, staffUser?.token);
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            courierPaid: true,
          }
        : prev
    );
    await fetchAllTabs(true, staffUser?.token);
  };

  const attachPhoto = async (orderId: string, imageUrl?: string) => {
    const payloadUrl = imageUrl?.trim();
    if (!payloadUrl) {
      throw new Error('Proof of delivery photo is required.');
    }
    await staffApi.attachPhoto(orderId, payloadUrl, staffUser?.token);

    // Optimistically update selectedOrder and tabCache with the new proof photo
    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            proofImageUrl: payloadUrl,
            status: 'READY_TO_CLAIM',
          }
        : prev
    );

    // Optimistically update tabCache so tabs reflect the updated order upon return to home
    setTabCache((prev) => {
      const next = { ...prev };
      let updatedOrder: StaffOrder | null = null;
      for (const tab of STAFF_TABS) {
        const found = next[tab]?.orders.find((o) => o.id === orderId);
        if (found) {
          updatedOrder = {
            ...found,
            status: 'READY_TO_CLAIM' as OrderStatus,
            proofImageUrl: payloadUrl,
            timestamp: new Date().toISOString(),
          };
          break;
        }
      }
      if (!updatedOrder && selectedOrder?.id === orderId) {
        updatedOrder = {
          ...selectedOrder,
          status: 'READY_TO_CLAIM' as OrderStatus,
          proofImageUrl: payloadUrl,
          timestamp: new Date().toISOString(),
        };
      }

      if (updatedOrder) {
        if (next.active) {
          next.active = {
            ...next.active,
            orders: next.active.orders.filter((o) => o.id !== orderId),
            totalCount: Math.max(0, next.active.totalCount - 1),
          };
        }
        if (next.ready) {
          const rest = next.ready.orders.filter((o) => o.id !== orderId);
          next.ready = {
            ...next.ready,
            orders: [updatedOrder, ...rest],
            totalCount: next.ready.totalCount + 1,
          };
        } else {
          next.ready = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
        if (next.all) {
          const rest = next.all.orders.filter((o) => o.id !== orderId);
          next.all = {
            ...next.all,
            orders: [updatedOrder, ...rest],
          };
        } else {
          next.all = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
      }
      return next;
    });
    await fetchAllTabs(true, staffUser?.token);
  };

  const claimOrder = async (orderId: string) => {
    await staffApi.claimOrder(orderId, staffUser?.token);
    const claimedAt = new Date().toISOString();

    // Optimistically update order in cache
    setTabCache((prev) => {
      const next = { ...prev };
      let updatedOrder: StaffOrder | null = null;
      for (const tab of STAFF_TABS) {
        const found = next[tab]?.orders.find((o) => o.id === orderId);
        if (found) {
          updatedOrder = {
            ...found,
            status: 'CLAIMED' as OrderStatus,
            isClaimActive: false,
            claimRemainingSeconds: 0,
            timestamp: claimedAt,
            claimedAt,
            createdAt: found.createdAt || found.statusTimeline?.[0]?.timestamp || found.timestamp,
            proofImageUrl: found.proofImageUrl,
          };
          break;
        }
      }
      if (!updatedOrder && selectedOrder?.id === orderId) {
        updatedOrder = {
          ...selectedOrder,
          status: 'CLAIMED' as OrderStatus,
          isClaimActive: false,
          claimRemainingSeconds: 0,
          timestamp: claimedAt,
          claimedAt,
          proofImageUrl: selectedOrder.proofImageUrl,
        };
      }

      if (updatedOrder) {
        if (next.ready) {
          next.ready = {
            ...next.ready,
            orders: next.ready.orders.filter((o) => o.id !== orderId),
            totalCount: Math.max(0, next.ready.totalCount - 1),
          };
        }
        if (next.claimed) {
          const rest = next.claimed.orders.filter((o) => o.id !== orderId);
          next.claimed = {
            ...next.claimed,
            orders: [updatedOrder, ...rest],
            totalCount: next.claimed.totalCount + 1,
          };
        } else {
          next.claimed = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
        if (next.all) {
          const rest = next.all.orders.filter((o) => o.id !== orderId);
          next.all = {
            ...next.all,
            orders: [updatedOrder, ...rest],
          };
        } else {
          next.all = {
            orders: [updatedOrder],
            totalCount: 1,
            lastFetched: Date.now(),
          };
        }
      }
      return next;
    });

    setSelectedOrder((prev) =>
      prev && prev.id === orderId
        ? {
            ...prev,
            status: 'CLAIMED',
            isClaimActive: false,
            claimRemainingSeconds: 0,
            timestamp: claimedAt,
            claimedAt,
            createdAt: prev.createdAt || prev.statusTimeline?.[0]?.timestamp || prev.timestamp,
            proofImageUrl: prev.proofImageUrl,
          }
        : prev
    );

    await fetchAllTabs(true, staffUser?.token);
  };

  const updateOrderNotes = (orderId: string, notes: string) => {
    setTabCache((prev) => {
      const next = { ...prev };
      STAFF_TABS.forEach((tab) => {
        const entry = next[tab];
        if (!entry) return;
        next[tab] = {
          ...entry,
          orders: entry.orders.map((o) => (o.id === orderId ? { ...o, notes } : o)),
        };
      });
      return next;
    });

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, notes } : null));
    }
  };

  return (
    <StaffContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        isOnline,
        isInitialLoading,
        isLoadingOrders,
        isRefreshing,
        orders: displayedOrders,
        filteredOrders: displayedOrders,
        allCachedOrders,
        tabCache,
        totalCount: currentTotalCount,
        currentPage,
        setCurrentPage,
        activeTab,
        setActiveTab: handleSelectTab,
        searchQuery,
        setSearchQuery: handleSearchChange,
        badgeCounts,
        selectedOrder,
        isDetailsOpen,
        openOrderDetails,
        findOrderByQrCode,
        closeOrderDetails,
        isLookupOpen,
        setIsLookupOpen,
        isDeskInfoOpen,
        setIsDeskInfoOpen,
        login,
        logout,
        refreshOrders,
        activateOrder,
        payCourier,
        attachPhoto,
        claimOrder,
        updateOrderNotes,
        justUpdatedOrder,
        setJustUpdatedOrder,
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
