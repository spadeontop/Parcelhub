import { useCallback } from 'react';
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus, StaffOrder, StaffTab } from '../types';
import { staffApi } from '../services/staffApi';
import { useStaffAuth } from '../context/StaffAuthContext';
import { STAFF_TABS, staffQueryKeys } from '../query/queryClient';
import type { StaffOrdersPageData } from './useStaffOrders';

function findOrderInCaches(queryClient: QueryClient, orderId: string): StaffOrder | undefined {
  for (const tab of STAFF_TABS) {
    const data = queryClient.getQueryData<StaffOrdersPageData>(staffQueryKeys.tab(tab, 1));
    const found = data?.orders.find((o) => o.id === orderId);
    if (found) return found;
  }
  return undefined;
}

function moveOrderBetweenTabCaches(
  queryClient: QueryClient,
  orderId: string,
  fromTab: StaffTab,
  toTab: StaffTab,
  updater: (order: StaffOrder) => StaffOrder,
  fallbackOrder?: StaffOrder | null
): StaffOrder | null {
  const existing = findOrderInCaches(queryClient, orderId) ?? fallbackOrder ?? null;
  if (!existing) return null;

  const updated = updater(existing);

  queryClient.setQueryData<StaffOrdersPageData>(staffQueryKeys.tab(fromTab, 1), (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      orders: prev.orders.filter((o) => o.id !== orderId),
      pagination: {
        ...prev.pagination,
        totalCount: Math.max(0, prev.pagination.totalCount - 1),
      },
    };
  });

  queryClient.setQueryData<StaffOrdersPageData>(staffQueryKeys.tab(toTab, 1), (prev) => {
    if (!prev) {
      return {
        orders: [updated],
        pagination: { totalCount: 1, limit: 20, offset: 0, hasMore: false },
      };
    }
    const rest = prev.orders.filter((o) => o.id !== orderId);
    return {
      ...prev,
      orders: [updated, ...rest],
      pagination: {
        ...prev.pagination,
        totalCount: prev.pagination.totalCount + 1,
      },
    };
  });

  queryClient.setQueryData<StaffOrdersPageData>(staffQueryKeys.tab('all', 1), (prev) => {
    if (!prev) {
      return {
        orders: [updated],
        pagination: { totalCount: 1, limit: 20, offset: 0, hasMore: false },
      };
    }
    const rest = prev.orders.filter((o) => o.id !== orderId);
    return {
      ...prev,
      orders: [updated, ...rest],
    };
  });

  return updated;
}

export function useStaffOrderActions(onOrderUpdated?: (order: StaffOrder) => void) {
  const { staffUser } = useStaffAuth();
  const queryClient = useQueryClient();
  const token = staffUser?.token;

  const activateMutation = useMutation({
    mutationFn: ({ orderId, amountReceived }: { orderId: string; amountReceived: number }) =>
      staffApi.activateOrder(orderId, amountReceived, token),
    onSuccess: (res, { orderId, amountReceived }) => {
      const updated = moveOrderBetweenTabCaches(queryClient, orderId, 'unpaid', 'active', (o) => ({
        ...o,
        status: 'AWAITING_PARCEL' as OrderStatus,
        amountReceived,
        change: res.change,
        timestamp: new Date().toISOString(),
      }));
      if (updated) onOrderUpdated?.(updated);
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
    },
  });

  const payCourierMutation = useMutation({
    mutationFn: (orderId: string) => staffApi.payCourier(orderId, token),
    onSuccess: (_res, orderId) => {
      const existing = findOrderInCaches(queryClient, orderId);
      if (existing) {
        onOrderUpdated?.({ ...existing, courierPaid: true });
      }
      for (const tab of STAFF_TABS) {
        queryClient.setQueryData<StaffOrdersPageData>(staffQueryKeys.tab(tab, 1), (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            orders: prev.orders.map((o) => (o.id === orderId ? { ...o, courierPaid: true } : o)),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
    },
  });

  const attachPhotoMutation = useMutation({
    mutationFn: async ({ orderId, imageUrl }: { orderId: string; imageUrl?: string }) => {
      const payloadUrl = imageUrl?.trim();
      if (!payloadUrl) {
        throw new Error('Proof of delivery photo is required.');
      }
      await staffApi.attachPhoto(orderId, payloadUrl, token);
      return payloadUrl;
    },
    onSuccess: (payloadUrl, { orderId }) => {
      const updated = moveOrderBetweenTabCaches(queryClient, orderId, 'active', 'ready', (o) => ({
        ...o,
        status: 'READY_TO_CLAIM' as OrderStatus,
        proofImageUrl: payloadUrl,
        timestamp: new Date().toISOString(),
      }));
      if (updated) onOrderUpdated?.(updated);
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (orderId: string) => staffApi.claimOrder(orderId, token),
    onSuccess: (_res, orderId) => {
      const claimedAt = new Date().toISOString();
      const updated = moveOrderBetweenTabCaches(queryClient, orderId, 'ready', 'claimed', (o) => ({
        ...o,
        status: 'CLAIMED' as OrderStatus,
        isClaimActive: false,
        claimRemainingSeconds: 0,
        timestamp: claimedAt,
        claimedAt,
        createdAt: o.createdAt || o.statusTimeline?.[0]?.timestamp || o.timestamp,
      }));
      if (updated) onOrderUpdated?.(updated);
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
    },
  });

  const activateOrder = useCallback(
    async (orderId: string, amountReceived: number) => {
      await activateMutation.mutateAsync({ orderId, amountReceived });
    },
    [activateMutation]
  );

  const payCourier = useCallback(
    async (orderId: string) => {
      await payCourierMutation.mutateAsync(orderId);
    },
    [payCourierMutation]
  );

  const attachPhoto = useCallback(
    async (orderId: string, imageUrl?: string) => {
      await attachPhotoMutation.mutateAsync({ orderId, imageUrl });
    },
    [attachPhotoMutation]
  );

  const claimOrder = useCallback(
    async (orderId: string) => {
      await claimMutation.mutateAsync(orderId);
    },
    [claimMutation]
  );

  return {
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
  };
}
