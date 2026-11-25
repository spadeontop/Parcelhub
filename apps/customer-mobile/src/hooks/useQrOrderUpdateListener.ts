import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationUi } from '../context/NavigationAndUiContext';
import { useNotifications } from '../context/NotificationsContext';
import { useToast } from '../context/ToastContext';
import { customerQueryKeys } from '../query/queryClient';
import type { OrderStatus, RealtimeOrderSignal } from '../types/api';

export const QR_FALLBACK_POLL_INTERVAL_MS = 3000;

const PRUNE_ON_ORDER_UPDATE_SCREENS = [
  'qr_screen',
  'payment_verification',
  'confirm_order',
  'create_order',
  'order_details',
] as const;

function getOrderUpdateToastMessage(status?: OrderStatus): string {
  switch (status) {
    case 'AWAITING_PARCEL':
      return 'Payment verified! Opening complete details.';
    case 'READY_TO_CLAIM':
      return 'Parcel is ready to claim! Opening complete details.';
    case 'CLAIMED':
      return 'Parcel claimed! Opening complete details.';
    case 'CANCELLED':
      return 'Order was cancelled. Opening complete details.';
    case 'REFUNDED':
      return 'Order refunded. Opening complete details.';
    default:
      return 'Order updated! Opening complete details.';
  }
}

interface UseQrOrderUpdateListenerParams {
  readonly orderId: string;
  readonly ticketCode?: string | null;
  readonly selectedOrderId: string | null;
  readonly selectedOrderTicketCode: string | null;
  readonly currentStatus?: OrderStatus;
  readonly refetchOrderDetail: () => Promise<unknown>;
}

/**
 * Listens for live updates on the order displayed by QrScreen (via Supabase Realtime
 * signals plus TanStack Query status-change fallback when offline/disconnected) and
 * redirects the customer directly to that order's Complete Details screen.
 */
export function useQrOrderUpdateListener({
  orderId,
  ticketCode,
  selectedOrderId,
  selectedOrderTicketCode,
  currentStatus,
  refetchOrderDetail,
}: UseQrOrderUpdateListenerParams) {
  const queryClient = useQueryClient();
  const { replaceScreen } = useNavigationUi();
  const { subscribeToOrderSignals } = useNotifications();
  const { showToast } = useToast();

  const [isOrderUpdated, setIsOrderUpdated] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  const hasRedirectedRef = useRef<boolean>(false);
  const baselineStatusRef = useRef<OrderStatus | undefined>(undefined);
  const trackedKeyRef = useRef<string>('');
  const refetchRef = useRef(refetchOrderDetail);

  useEffect(() => {
    refetchRef.current = refetchOrderDetail;
  }, [refetchOrderDetail]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const redirectToOrderDetails = useCallback(
    async (options: {
      nextStatus?: OrderStatus;
      resolvedOrderId?: string | null;
      resolvedTicketCode?: string | null;
      shouldRefetch: boolean;
    }) => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      if (options.shouldRefetch) {
        if (options.nextStatus && options.nextStatus !== 'CANCELLED') {
          setIsOrderUpdated(true);
        }
        try {
          await refetchRef.current();
        } catch {
          // Proceed to Complete Details even if immediate detail refetch fails
        }
      }

      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.orders(),
      });

      if (!isMountedRef.current) return;

      const targetOrderId =
        options.resolvedOrderId || orderId || selectedOrderId || null;
      const targetTicketCode =
        options.resolvedTicketCode || ticketCode || selectedOrderTicketCode || null;

      showToast(getOrderUpdateToastMessage(options.nextStatus));
      replaceScreen('order_details', {
        orderId: targetOrderId,
        ticketCode: targetTicketCode,
        pruneScreens: PRUNE_ON_ORDER_UPDATE_SCREENS,
      });
    },
    [
      orderId,
      ticketCode,
      selectedOrderId,
      selectedOrderTicketCode,
      queryClient,
      showToast,
      replaceScreen,
    ]
  );

  // Track baseline status per viewed order and detect fallback status transitions
  const activeKey = selectedOrderId || orderId || ticketCode || '';
  useEffect(() => {
    if (trackedKeyRef.current !== activeKey) {
      trackedKeyRef.current = activeKey;
      hasRedirectedRef.current = false;
      baselineStatusRef.current = currentStatus;
      return;
    }

    if (hasRedirectedRef.current || !currentStatus) return;

    const baseline = baselineStatusRef.current;
    if (!baseline) {
      baselineStatusRef.current = currentStatus;
      return;
    }

    // Never redirect on stale PENDING_INITIALIZATION -> PAYMENT_REQUIRED cache sync
    if (baseline === 'PENDING_INITIALIZATION' && currentStatus === 'PAYMENT_REQUIRED') {
      baselineStatusRef.current = currentStatus;
      return;
    }

    if (currentStatus !== baseline) {
      void redirectToOrderDetails({
        nextStatus: currentStatus,
        shouldRefetch: false,
      });
    }
  }, [activeKey, currentStatus, redirectToOrderDetails]);

  // Primary instant listener: Supabase Realtime order signal
  useEffect(() => {
    const matchIds = new Set(
      [orderId, selectedOrderId, ticketCode, selectedOrderTicketCode].filter(
        (v): v is string => Boolean(v)
      )
    );
    if (matchIds.size === 0) return;

    return subscribeToOrderSignals((signal: RealtimeOrderSignal) => {
      if (hasRedirectedRef.current) return;
      if (signal.event === 'ORDER_CREATED') return;

      const matchesOrder =
        matchIds.has(signal.orderId) ||
        Boolean(signal.ticketCode && matchIds.has(signal.ticketCode));
      if (!matchesOrder) return;

      if (baselineStatusRef.current && signal.status === baselineStatusRef.current) {
        return;
      }

      if (
        signal.status === 'PAYMENT_REQUIRED' &&
        (!baselineStatusRef.current || baselineStatusRef.current === 'PENDING_INITIALIZATION')
      ) {
        baselineStatusRef.current = 'PAYMENT_REQUIRED';
        return;
      }

      void redirectToOrderDetails({
        nextStatus: signal.status,
        resolvedOrderId: signal.orderId,
        resolvedTicketCode: signal.ticketCode,
        shouldRefetch: true,
      });
    });
  }, [
    orderId,
    selectedOrderId,
    ticketCode,
    selectedOrderTicketCode,
    subscribeToOrderSignals,
    redirectToOrderDetails,
  ]);

  return {
    isOrderUpdated,
  };
}
