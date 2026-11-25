import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { orderApi } from '../services/orderApi';
import {
  CustomerListOrdersQueryParams,
  CustomerListOrdersRes,
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
  authToken: JWTToken | null
) {
  return useInfiniteQuery<CustomerListOrdersRes>({
    queryKey: customerQueryKeys.ordersInfinite(),
    initialPageParam: 0,
    staleTime: Infinity,
    queryFn: async ({ pageParam }) => {
      if (!authToken) {
        throw new Error('Missing auth token');
      }
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return await orderApi.listOrders(authToken, {
        forEach: true,
        limit: CUSTOMER_ORDERS_PAGE_SIZE,
        offset,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const countsByStatus = new Map<OrderStatus, number>();
      for (const order of lastPage.orders || []) {
        countsByStatus.set(order.status, (countsByStatus.get(order.status) ?? 0) + 1);
      }
      const hasMoreInAnyBucket = Array.from(countsByStatus.values()).some(
        (count) => count >= CUSTOMER_ORDERS_PAGE_SIZE
      );
      if (!hasMoreInAnyBucket) {
        return undefined;
      }
      return allPages.length * CUSTOMER_ORDERS_PAGE_SIZE;
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
