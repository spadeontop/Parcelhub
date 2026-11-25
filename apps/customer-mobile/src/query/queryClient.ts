import { AppState, AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { V1ApiError } from '../services/apiClient';
import { CustomerListOrdersQueryParams, OrderStatus } from '../types/api';

export const customerQueryKeys = {
  all: ['customer'] as const,
  profile: () => [...customerQueryKeys.all, 'profile'] as const,
  orders: () => [...customerQueryKeys.all, 'orders'] as const,
  ordersList: (query?: CustomerListOrdersQueryParams) =>
    [...customerQueryKeys.orders(), query ?? 'all'] as const,
  ordersInfinite: (type?: OrderStatus) =>
    [...customerQueryKeys.orders(), 'infinite', type ?? 'ALL'] as const,
  orderDetail: (idOrCode: string) =>
    [...customerQueryKeys.all, 'order', idOrCode] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error instanceof V1ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

/**
 * Connects React Native AppState changes to TanStack Query's focusManager
 * so foregrounding the app automatically refreshes stale queries.
 */
export function setupQueryFocusManager(): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => {
    subscription.remove();
  };
}
