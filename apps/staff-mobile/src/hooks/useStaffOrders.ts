import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationMeta, StaffBadgeCounts, StaffOrder, StaffTab } from '../types';
import { staffApi, StaffApiError, type StaffQrLookupResult } from '../services/staffApi';
import { useStaffAuth } from '../context/StaffAuthContext';
import { getStatusForTab, STAFF_TABS, staffQueryKeys } from '../query/queryClient';

export interface StaffOrdersPageData {
  orders: StaffOrder[];
  pagination: PaginationMeta;
}

const ITEMS_PER_PAGE = 20;
const POLL_INTERVAL_MS = 4_000;

export function useStaffOrders(activeTab: StaffTab, currentPage: number, searchQuery: string) {
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

  // Keep page 1 of all 5 tabs warm for instant tab switching and badge counts.
  const tabPage1Queries = useQueries({
    queries: STAFF_TABS.map((tab) => ({
      queryKey: staffQueryKeys.tab(tab, 1),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        staffApi.getOrders(getStatusForTab(tab), ITEMS_PER_PAGE, 0, token, undefined, signal),
      enabled: !!token,
      refetchInterval: !isSearching && activeTab === tab && currentPage === 1 ? POLL_INTERVAL_MS : false,
    })),
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
    refetchInterval: !isSearching && currentPage > 1 ? POLL_INTERVAL_MS : false,
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

  const activeTabIndex = STAFF_TABS.indexOf(activeTab);
  const activeTabPage1Query = tabPage1Queries[activeTabIndex >= 0 ? activeTabIndex : 0];
  const activeQuery = isSearching
    ? searchQueryResult
    : currentPage === 1
      ? activeTabPage1Query
      : pagedTabQuery;

  const orders = activeQuery.data?.orders ?? [];
  const totalCount = activeQuery.data?.pagination.totalCount ?? orders.length;
  const isLoadingOrders = activeQuery.isPending && !activeQuery.data;

  const tab0Data = tabPage1Queries[0]?.data;
  const tab1Data = tabPage1Queries[1]?.data;
  const tab2Data = tabPage1Queries[2]?.data;
  const tab3Data = tabPage1Queries[3]?.data;
  const tab4Data = tabPage1Queries[4]?.data;

  const badgeCounts: StaffBadgeCounts = useMemo(
    () => ({
      all: tab0Data?.pagination.totalCount ?? 0,
      ready: tab1Data?.pagination.totalCount ?? 0,
      active: tab2Data?.pagination.totalCount ?? 0,
      unpaid: tab3Data?.pagination.totalCount ?? 0,
      claimed: tab4Data?.pagination.totalCount ?? 0,
    }),
    [tab0Data, tab1Data, tab2Data, tab3Data, tab4Data]
  );

  const allCachedOrders = useMemo(() => {
    const map = new Map<string, StaffOrder>();
    for (const data of [tab0Data, tab1Data, tab2Data, tab3Data, tab4Data]) {
      data?.orders.forEach((o) => map.set(o.id, o));
    }
    pagedTabQuery.data?.orders.forEach((o) => map.set(o.id, o));
    searchQueryResult.data?.orders.forEach((o) => map.set(o.id, o));
    return Array.from(map.values());
  }, [tab0Data, tab1Data, tab2Data, tab3Data, tab4Data, pagedTabQuery.data, searchQueryResult.data]);

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
    isRefreshing,
    refreshOrders,
    findOrderByQrCode,
  };
}
