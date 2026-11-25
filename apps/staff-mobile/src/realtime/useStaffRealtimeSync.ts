import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeOrderSignal } from '@parcelhub/contracts';
import { useStaffAuth } from '../context/StaffAuthContext';
import { staffQueryKeys } from '../query/queryClient';
import {
  StaffRealtimeClient,
  type StaffRealtimeConnectionStatus,
} from '../services/staffRealtimeClient';

const SIGNAL_COALESCE_MS = 300;

export interface StaffRealtimeSyncState {
  realtimeStatus: StaffRealtimeConnectionStatus;
  isRealtimeSubscribed: boolean;
}

/**
 * Subscribes to the staff broadcast channel (`staff:orders`) while authenticated.
 * Coalesces rapid bursts of `order_signal` events before invalidating TanStack Query caches,
 * and falls back cleanly to polling whenever the socket is disconnected or unavailable (503).
 */
export function useStaffRealtimeSync(): StaffRealtimeSyncState {
  const { staffUser, logout } = useStaffAuth();
  const queryClient = useQueryClient();
  const token = staffUser?.token ?? null;

  const [realtimeStatus, setRealtimeStatus] =
    useState<StaffRealtimeConnectionStatus>('disconnected');

  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const clientRef = useRef<StaffRealtimeClient | null>(null);
  const pendingOrderIdsRef = useRef<Set<string>>(new Set());
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flushInvalidations = () => {
      coalesceTimerRef.current = null;
      const orderIds = Array.from(pendingOrderIdsRef.current);
      pendingOrderIdsRef.current.clear();

      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
      for (const orderId of orderIds) {
        void queryClient.invalidateQueries({ queryKey: staffQueryKeys.detail(orderId) });
      }
    };

    const scheduleInvalidation = (signal: RealtimeOrderSignal) => {
      if (signal.orderId) {
        pendingOrderIdsRef.current.add(signal.orderId);
      }
      if (coalesceTimerRef.current) {
        return;
      }
      coalesceTimerRef.current = setTimeout(flushInvalidations, SIGNAL_COALESCE_MS);
    };

    const client = new StaffRealtimeClient({
      getAuthToken: () => tokenRef.current,
      onUnauthorized: () => {
        void logoutRef.current();
      },
      onSignal: scheduleInvalidation,
      onSubscribed: ({ isRejoin }) => {
        if (isRejoin) {
          void queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
        }
      },
      onStatusChange: (nextStatus) => {
        setRealtimeStatus(nextStatus);
      },
    });

    clientRef.current = client;

    if (tokenRef.current) {
      client.start();
    }

    let previousState: string = AppState.currentState ?? 'active';
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasActive = previousState === 'active';
      previousState = nextState;

      if (nextState === 'active' && !wasActive) {
        if (tokenRef.current) {
          client.handleForegroundResume();
          void queryClient.invalidateQueries({ queryKey: staffQueryKeys.orders() });
        }
      } else if (nextState !== 'active' && wasActive) {
        client.handleBackground();
      }
    });

    return () => {
      subscription.remove();
      if (coalesceTimerRef.current) {
        clearTimeout(coalesceTimerRef.current);
        coalesceTimerRef.current = null;
      }
      pendingOrderIdsRef.current.clear();
      client.stopAndResetSession();
      clientRef.current = null;
    };
  }, [queryClient]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (token) {
      client.start();
    } else {
      client.stopAndResetSession();
    }
  }, [token]);

  return {
    realtimeStatus,
    isRealtimeSubscribed: realtimeStatus === 'subscribed',
  };
}
