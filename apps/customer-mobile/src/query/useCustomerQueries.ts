import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { orderApi } from '../services/orderApi';
import {
  CustomerListOrdersQueryParams,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  JWTToken,
  OrderStatus,
} from '../types/api';
import { customerQueryKeys, queryClient } from './queryClient';

export const CUSTOMER_ORDERS_PAGE_SIZE = 20;

export function useCustomerProfileQuery(authToken: JWTToken | null) {
  return useQuery<CustomerProfile>({
    queryKey: customerQueryKeys.profile(),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Missing auth token');
      }
      const res = await customerApi.getProfile(authToken);
      return res.customer;
    },
    enabled: Boolean(authToken),
  });
}

export function useCustomerOrdersQuery(
  authToken: JWTToken | null,
  query?: CustomerListOrdersQueryParams,
  options?: {
    readonly refetchInterval?: number | false;
  }
) {
  return useQuery<readonly CustomerOrderSummary[]>({
    queryKey: customerQueryKeys.ordersList(query),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Missing auth token');
      }
      const res = await orderApi.listOrders(authToken, query);
      return res.orders || [];
    },
    enabled: Boolean(authToken),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCustomerInfiniteOrdersQuery(
  authToken: JWTToken | null,
  type?: OrderStatus
) {
  return useInfiniteQuery<readonly CustomerOrderSummary[]>({
    queryKey: customerQueryKeys.ordersInfinite(type),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!authToken) {
        throw new Error('Missing auth token');
      }
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const res = await orderApi.listOrders(authToken, {
        type,
        limit: CUSTOMER_ORDERS_PAGE_SIZE,
        offset,
      });
      return res.orders || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < CUSTOMER_ORDERS_PAGE_SIZE) {
        return undefined;
      }
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    enabled: Boolean(authToken),
  });
}

export function useCustomerOrderDetailQuery(
  authToken: JWTToken | null,
  orderIdOrCode: string | null,
  options?: {
    readonly refetchInterval?: number | false;
  }
) {
  return useQuery<CustomerOrderDetail>({
    queryKey: customerQueryKeys.orderDetail(orderIdOrCode || ''),
    queryFn: async () => {
      if (!authToken || !orderIdOrCode) {
        throw new Error('Missing auth token or order identifier');
      }
      const res = await orderApi.getOrder(authToken, orderIdOrCode);
      return res.order;
    },
    enabled: Boolean(authToken && orderIdOrCode),
    refetchInterval: options?.refetchInterval ?? false,
    placeholderData: () => {
      if (!orderIdOrCode) return undefined;
      const cachedList = queryClient.getQueryData<readonly CustomerOrderSummary[]>(
        customerQueryKeys.ordersList()
      );
      const match = cachedList?.find(
        (o) => o.id === orderIdOrCode || o.ticketCode === orderIdOrCode
      );
      if (!match) return undefined;
      return {
        id: match.id,
        ticketCode: match.ticketCode,
        trackingId: match.trackingId,
        productName: match.productName,
        recipientName: '',
        price: 0,
        change: 0,
        status: match.status,
        statusTimeline: [],
        isClaimActive: match.isClaimActive,
      };
    },
  });
}
