import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus, PaginationMeta, StaffBadgeCounts, StaffOrder, StaffTab } from '../types';
import { staffApi, StaffApiError, type StaffQrLookupResult } from '../services/staffApi';
import { useStaffAuth } from '../context/StaffAuthContext';
import { ENV } from '../config/env';
import { getStatusForTab, staffQueryKeys } from '../query/queryClient';

export interface StaffOrdersPageData {
  orders: StaffOrder[];
  pagination: PaginationMeta;
  statusCounts?: Partial<Record<OrderStatus, number>>;
}

const ITEMS_PER_PAGE = 20;

export function useStaffOrders(
  activeTab: StaffTab,
  currentPage: number,
  searchQuery: string,
  isRealtimeSubscribed = false
) {
  const { staffUser } = useStaffAuth();
  const queryClient = useQueryClient();
  const token = staffUser?.token;

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery.trim());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedSearch('');
      return;
    }
    const timer = setTimeout(() => setDebouncedSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedSearch.length > 0;

  // Fetch page 1 of all status buckets in a single forEach=true request
  // for instant tab switching and badge counts.
  // Disable polling while Supabase Realtime is subscribed; fall back automatically on disconnect/503.
  const pollingInterval = isRealtimeSubscribed ? false : ENV.POLLING_INTERVAL_MS;
  const resolveRefetchInterval = useCallback(
    (query: { state: { status: string } }) => {
      if (pollingInterval === false) return false;
      return query.state.status === 'error'
        ? Math.max(pollingInterval, 15_000)
        : pollingInterval;
    },
    [pollingInterval]
  );
  const forEachPage1Query = useQuery<StaffOrdersPageData>({
    queryKey: staffQueryKeys.forEachPage1(),
    queryFn: ({ signal }) =>
      staffApi.getOrders(
        undefined,
        ITEMS_PER_PAGE,
        0,
        token,
        undefined,
        signal,
        undefined,
        true
      ),
    enabled: !!token,
    refetchInterval: !isSearching && currentPage === 1 ? resolveRefetchInterval : false,
  });

  // Separate query for pages > 1 on the active tab (prevents BUG-05 pagination races).
  const pagedTabQuery = useQuery<StaffOrdersPageData>({
    queryKey: staffQueryKeys.tab(activeTab, currentPage),
    queryFn: ({ signal }) =>
      staffApi.getOrders(
        getStatusForTab(activeTab),
        ITEMS_PER_PAGE,
        (currentPage - 1) * ITEMS_PER_PAGE,
        token,
        undefined,
        signal
      ),
    enabled: !!token && !isSearching && currentPage > 1,
    refetchInterval: !isSearching && currentPage > 1 ? resolveRefetchInterval : false,
  });

  // Dedicated search query (never pollutes tab caches).
  const searchQueryResult = useQuery<StaffOrdersPageData>({
    queryKey: staffQueryKeys.search(debouncedSearch, currentPage),
    queryFn: ({ signal }) =>
      staffApi.getOrders(
        undefined,
        ITEMS_PER_PAGE,
        (currentPage - 1) * ITEMS_PER_PAGE,
        token,
        debouncedSearch,
        signal
      ),
    enabled: !!token && isSearching,
  });

  const activeQuery = isSearching
    ? searchQueryResult
    : currentPage === 1
      ? forEachPage1Query
      : pagedTabQuery;

  const forEachData = forEachPage1Query.data;

  const badgeCounts: StaffBadgeCounts = useMemo(() => {
    const counts = forEachData?.statusCounts;
    const allOrders = forEachData?.orders ?? [];
    const countFor = (status: OrderStatus) =>
      counts?.[status] ?? allOrders.filter((o) => o.status === status).length;

    return {
      all: forEachData?.pagination.totalCount ?? allOrders.length,
      ready: countFor('READY_TO_CLAIM'),
      active: countFor('AWAITING_PARCEL'),
      unpaid: countFor('PAYMENT_REQUIRED'),
      claimed: countFor('CLAIMED'),
      cancelled: countFor('CANCELLED'),
      refunded: countFor('REFUNDED'),
    };
  }, [forEachData]);

  const orders = useMemo(() => {
    if (isSearching) {
      return searchQueryResult.data?.orders ?? [];
    }
    if (currentPage > 1) {
      return pagedTabQuery.data?.orders ?? [];
    }
    const allPage1Orders = forEachData?.orders ?? [];
    const targetStatus = getStatusForTab(activeTab);
    if (!targetStatus) {
      return allPage1Orders.slice(0, ITEMS_PER_PAGE);
    }
    return allPage1Orders.filter((o) => o.status === targetStatus);
  }, [isSearching, searchQueryResult.data, currentPage, pagedTabQuery.data, forEachData, activeTab]);

  const totalCount = useMemo(() => {
    if (isSearching) {
      return searchQueryResult.data?.pagination.totalCount ?? orders.length;
    }
    if (currentPage > 1) {
      return pagedTabQuery.data?.pagination.totalCount ?? orders.length;
    }
    return badgeCounts[activeTab] ?? orders.length;
  }, [isSearching, searchQueryResult.data, currentPage, pagedTabQuery.data, badgeCounts, activeTab, orders.length]);

  const isLoadingOrders = activeQuery.isPending && !activeQuery.data;
  const isOrdersError = activeQuery.isError;
  const ordersErrorMessage = activeQuery.isError
    ? activeQuery.error instanceof Error
      ? activeQuery.error.message
      : 'Unable to load orders.'
    : null;

  const allCachedOrders = useMemo(() => {
    const map = new Map<string, StaffOrder>();
    forEachData?.orders.forEach((o) => map.set(o.id, o));
    pagedTabQuery.data?.orders.forEach((o) => map.set(o.id, o));
    searchQueryResult.data?.orders.forEach((o) => map.set(o.id, o));
    return Array.from(map.values());
  }, [forEachData, pagedTabQuery.data, searchQueryResult.data]);

  const refreshOrders = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      if (isSearching) {
        await queryClient.refetchQueries({
          queryKey: staffQueryKeys.search(debouncedSearch, currentPage),
        });
      } else {
        await queryClient.refetchQueries({ queryKey: staffQueryKeys.orders() });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [token, isSearching, debouncedSearch, currentPage, queryClient]);

  const findOrderByQrCode = useCallback(
    async (code: string, signal: AbortSignal): Promise<StaffQrLookupResult> => {
      if (!token) {
        throw new StaffApiError('Please sign in to look up orders.', 401);
      }
      return staffApi.findOrderByQrCode(code, token, signal);
    },
    [token]
  );

  return {
    orders,
    filteredOrders: orders,
    allCachedOrders,
    totalCount,
    badgeCounts,
    isLoadingOrders,
    isOrdersError,
    ordersErrorMessage,
    isRefreshing,
    refreshOrders,
    findOrderByQrCode,
  };
}
