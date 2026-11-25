import { QueryClient } from '@tanstack/react-query';
import type { OrderStatus, StaffTab } from '../types';

export const STAFF_TABS: readonly StaffTab[] = [
  'all',
  'ready',
  'active',
  'unpaid',
  'claimed',
  'cancelled',
  'refunded',
];

export function getStatusForTab(tab: StaffTab): OrderStatus | undefined {
  switch (tab) {
    case 'ready':
      return 'READY_TO_CLAIM';
    case 'active':
      return 'AWAITING_PARCEL';
    case 'unpaid':
      return 'PAYMENT_REQUIRED';
    case 'claimed':
      return 'CLAIMED';
    case 'cancelled':
      return 'CANCELLED';
    case 'refunded':
      return 'REFUNDED';
    case 'all':
    default:
      return undefined;
  }
}

export const staffQueryKeys = {
  all: ['staff'] as const,
  orders: () => [...staffQueryKeys.all, 'orders'] as const,
  tab: (tab: StaffTab, page = 1) => [...staffQueryKeys.orders(), 'tab', tab, page] as const,
  search: (query: string, page = 1) => [...staffQueryKeys.orders(), 'search', query, page] as const,
  detail: (orderId: string) => [...staffQueryKeys.orders(), 'detail', orderId] as const,
};

export const staffQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 4_000,
      refetchOnWindowFocus: false,
    },
  },
});
