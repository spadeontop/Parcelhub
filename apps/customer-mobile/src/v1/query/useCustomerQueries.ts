import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { orderApi } from '../services/orderApi';
import {
  CustomerListOrdersQueryParams,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  JWTToken,
} from '../types/api';
import { customerQueryKeys, queryClient } from './queryClient';

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

export function useCustomerOrderDetailQuery(
  authToken: JWTToken | null,
  orderIdOrCode: string | null
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
