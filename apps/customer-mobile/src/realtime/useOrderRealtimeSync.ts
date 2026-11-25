import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { customerQueryKeys } from '../query/queryClient';
import {
  OrderRealtimeClient,
  type RealtimeConnectionStatus,
} from '../services/orderRealtimeClient';
import type {
  CustomerOrderDetail,
  CustomerOrderSummary,
  JWTToken,
  RealtimeOrderSignal,
} from '../types/api';

interface UseOrderRealtimeSyncParams {
  readonly authToken: JWTToken | null;
  readonly isAuthenticated: boolean;
  readonly selectedOrderId: string | null;
  readonly orders: readonly CustomerOrderSummary[];
  readonly onUnauthorized: () => Promise<void> | void;
  readonly onOrderSignal?: (signal: RealtimeOrderSignal) => void;
}

const INITIAL_JOIN_COALESCE_WINDOW_MS = 2000;

/**
 * Coordinates OrderRealtimeClient with TanStack Query invalidation,
 * AppState foreground/background transitions, initial-join coalescing,
 * and ticketCode <-> canonicalOrderId resolution.
 */
export function useOrderRealtimeSync({
  authToken,
  isAuthenticated,
  selectedOrderId,
  orders,
  onUnauthorized,
  onOrderSignal,
}: UseOrderRealtimeSyncParams) {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeConnectionStatus>('disconnected');

  const authTokenRef = useRef<JWTToken | null>(authToken);
  const selectedOrderIdRef = useRef<string | null>(selectedOrderId);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const onOrderSignalRef = useRef(onOrderSignal);
  const ticketToIdMapRef = useRef<Map<string, string>>(new Map());
  const clientRef = useRef<OrderRealtimeClient | null>(null);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    onOrderSignalRef.current = onOrderSignal;
  }, [onOrderSignal]);

  // Keep ticketCode -> canonicalOrderId map warm from orders list
  useEffect(() => {
    for (const order of orders) {
      if (order.ticketCode && order.id) {
        ticketToIdMapRef.current.set(order.ticketCode, order.id);
      }
    }
  }, [orders]);

  // Also map from any currently cached detail query if opened by ticketCode
  const syncTicketMapFromDetailCache = useCallback(
    (idOrCode: string | null) => {
      if (!idOrCode) return;
      const cached = queryClient.getQueryData<CustomerOrderDetail>(
        customerQueryKeys.orderDetail(idOrCode)
      );
      if (cached?.ticketCode && cached?.id) {
        ticketToIdMapRef.current.set(cached.ticketCode, cached.id);
      }
    },
    [queryClient]
  );

  const invalidateOrderQueries = useCallback(
    (signal?: RealtimeOrderSignal) => {
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.orders(),
      });

      const activeIdOrCode = selectedOrderIdRef.current;
      syncTicketMapFromDetailCache(activeIdOrCode);

      if (signal) {
        if (signal.ticketCode && signal.orderId) {
          ticketToIdMapRef.current.set(signal.ticketCode, signal.orderId);
        }

        void queryClient.invalidateQueries({
          queryKey: customerQueryKeys.orderDetail(signal.orderId),
        });
        if (signal.ticketCode) {
          void queryClient.invalidateQueries({
            queryKey: customerQueryKeys.orderDetail(signal.ticketCode),
          });
        }

        // If active screen was opened by ticketCode (or UUID), check canonical match
        if (activeIdOrCode) {
          const mappedCanonical = ticketToIdMapRef.current.get(activeIdOrCode);
          if (
            activeIdOrCode === signal.orderId ||
            activeIdOrCode === signal.ticketCode ||
            mappedCanonical === signal.orderId
          ) {
            void queryClient.invalidateQueries({
              queryKey: customerQueryKeys.orderDetail(activeIdOrCode),
            });
          }
        }
        return;
      }

      if (activeIdOrCode) {
        void queryClient.invalidateQueries({
          queryKey: customerQueryKeys.orderDetail(activeIdOrCode),
        });
      }
    },
    [queryClient, syncTicketMapFromDetailCache]
  );

  const invalidateOrdersListCoalesced = useCallback(() => {
    const ordersState = queryClient.getQueryState(customerQueryKeys.ordersList());
    const lastUpdatedAt = ordersState?.dataUpdatedAt ?? 0;
    if (Date.now() - lastUpdatedAt < INITIAL_JOIN_COALESCE_WINDOW_MS) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: customerQueryKeys.orders(),
    });
  }, [queryClient]);

  useEffect(() => {
    const client = new OrderRealtimeClient({
      getAuthToken: () => authTokenRef.current,
      onUnauthorized: () => onUnauthorizedRef.current(),
      onSignal: (signal) => {
        invalidateOrderQueries(signal);
        onOrderSignalRef.current?.(signal);
      },
      onSubscribed: ({ isRejoin }) => {
        if (isRejoin) {
          invalidateOrderQueries();
          return;
        }
        invalidateOrdersListCoalesced();
      },
      onStatusChange: setRealtimeStatus,
    });

    clientRef.current = client;

    return () => {
      client.stopAndResetSession();
      clientRef.current = null;
    };
  }, [invalidateOrderQueries, invalidateOrdersListCoalesced]);

  // Connect when authenticated; tear down immediately on lock/logout/account switch
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (isAuthenticated && authToken) {
      client.start();
    } else {
      ticketToIdMapRef.current.clear();
      client.stopAndResetSession();
    }
  }, [isAuthenticated, authToken]);

  // Foreground/background lifecycle
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const client = clientRef.current;
      if (!client) return;

      if (nextState === 'active') {
        if (authTokenRef.current) {
          client.handleForegroundResume();
          invalidateOrderQueries();
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        client.handleBackground();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [invalidateOrderQueries]);

  return {
    realtimeStatus,
    isRealtimeSubscribed: realtimeStatus === 'subscribed',
    invalidateOrdersListCoalesced,
  };
}
