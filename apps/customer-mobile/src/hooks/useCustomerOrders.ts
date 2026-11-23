import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CustomerInitOrderRes,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  CustomerClaimOrderRes,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerListOrdersQueryParams,
} from '../types/api';
import { orderApi } from '../services/orderApi';
import { customerQueryKeys } from '../query/queryClient';
import { useCustomerOrdersQuery } from '../query/useCustomerQueries';
import { v1Storage } from '../utils/storage';
import { useAuthSession } from '../context/AuthSessionContext';
import { useNavigationUi } from '../context/NavigationAndUiContext';
import { useToast } from '../context/ToastContext';
import { useOrderDraft } from '../context/OrderDraftContext';

/**
 * Subscribes to the customer's orders list via TanStack Query and provides `refetchOrders`.
 * Polls every 5 seconds only while the user is authenticated and viewing `'home'`.
 */
export const useCustomerOrders = () => {
  const { authToken } = useAuthSession();
  const { activeScreen } = useNavigationUi();
  const queryClient = useQueryClient();

  const ordersQuery = useCustomerOrdersQuery(authToken, undefined, {
    refetchInterval: activeScreen === 'home' && authToken ? 5000 : false,
  });

  const orders = useMemo<readonly CustomerOrderSummary[]>(
    () => ordersQuery.data ?? [],
    [ordersQuery.data]
  );

  const refetchOrders = useCallback(
    async (query?: CustomerListOrdersQueryParams): Promise<void> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) return;

      try {
        await queryClient.fetchQuery({
          queryKey: customerQueryKeys.ordersList(query),
          queryFn: async () => {
            const res = await orderApi.listOrders(token, query);
            return res.orders || [];
          },
          staleTime: 0,
        });
      } catch {
        // 401 is handled centrally by apiClient unauthorizedHandler
      }
    },
    [authToken, queryClient]
  );

  return {
    orders,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    refetchOrders,
  };
};

/**
 * Provides imperative order workflow mutations (initialize, confirm, fetch detail, claim).
 */
export const useCustomerOrderActions = () => {
  const { authToken, customer } = useAuthSession();
  const {
    navigateTo,
    setActiveScreen,
    setSelectedOrderId,
    setSelectedOrderTicketCode,
  } = useNavigationUi();
  const { showToast } = useToast();
  const { orderDraft, updateOrderDraft, clearOrderDraft } = useOrderDraft();

  const initializeCustomerOrder = useCallback(
    async (imageUrl: string): Promise<CustomerInitOrderRes> => {
      let token = authToken;
      if (!token) token = await v1Storage.getAuthToken();
      if (!token) {
        showToast('Session expired. Please log in again.');
        setActiveScreen('login');
        throw new Error('Please log in again');
      }

      const res = await orderApi.initializeOrder(token, imageUrl);

      const defaultRecipient = customer
        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
        : '';

      const autofill = res.autofill;
      updateOrderDraft({
        orderId: res.orderId,
        ticketCode: res.ticketCode,
        imageUrl,
        recipientName: autofill?.recipientName || defaultRecipient,
        trackingId: autofill?.trackingId || '',
        productName: autofill?.productName || '',
        price: typeof autofill?.price === 'number' ? autofill.price : undefined,
        totalAmount: typeof autofill?.price === 'number' ? String(autofill.price) : '',
        trackingIdLocked: Boolean(autofill?.trackingIdLocked && autofill?.trackingId),
        sourceApp: autofill?.sourceApp,
      });

      setSelectedOrderTicketCode(res.ticketCode);
      showToast(res.statusMessage || 'Order initialized');
      navigateTo('confirm_order');
      return res;
    },
    [
      authToken,
      customer,
      showToast,
      updateOrderDraft,
      setSelectedOrderTicketCode,
      navigateTo,
      setActiveScreen,
    ]
  );

  const confirmCustomerOrder = useCallback(
    async (orderData: CustomerUpdateOrderReq['order']): Promise<CustomerUpdateOrderRes> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
        throw new Error('Please log in again');
      }

      const orderId = orderDraft.orderId;
      const ticketCode = orderDraft.ticketCode;
      if (!orderId) {
        showToast('No active order to confirm. Please start again.');
        setActiveScreen('create_order');
        throw new Error('No active order ID');
      }

      try {
        const res = await orderApi.confirmOrder(token, orderId, orderData);
        setSelectedOrderId(orderId);
        if (ticketCode) {
          setSelectedOrderTicketCode(ticketCode);
        }
        showToast(res.statusMessage || 'Order details confirmed');
        clearOrderDraft();
        setActiveScreen('payment_verification');
        return res;
      } catch (err: any) {
        if (
          err?.statusCode === 400 &&
          (err?.error === 'OrderNotEditable' ||
            err?.message?.includes('Only PENDING_INITIALIZATION'))
        ) {
          showToast(err?.message || 'This order was already confirmed.');
          setSelectedOrderId(orderId);
          if (ticketCode) {
            setSelectedOrderTicketCode(ticketCode);
          }
          clearOrderDraft();
          setActiveScreen('payment_verification');
        }
        throw err;
      }
    },
    [
      authToken,
      orderDraft.orderId,
      orderDraft.ticketCode,
      showToast,
      clearOrderDraft,
      setActiveScreen,
      setSelectedOrderId,
      setSelectedOrderTicketCode,
    ]
  );

  const fetchOrderDetail = useCallback(
    async (orderId: string): Promise<CustomerOrderDetail> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
        throw new Error('Please log in again');
      }
      const res = await orderApi.getOrder(token, orderId);
      return res.order;
    },
    [authToken, setActiveScreen]
  );

  const claimCustomerOrder = useCallback(
    async (orderId: string): Promise<CustomerClaimOrderRes> => {
      const token = authToken || (await v1Storage.getAuthToken());
      if (!token) {
        setActiveScreen('login');
        throw new Error('Please log in again');
      }
      const res = await orderApi.claimOrder(token, orderId);
      showToast(res.statusMessage || 'Order claim initiated');
      return res;
    },
    [authToken, setActiveScreen, showToast]
  );

  return {
    initializeCustomerOrder,
    confirmCustomerOrder,
    fetchOrderDetail,
    claimCustomerOrder,
  };
};
