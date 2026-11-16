import { v1Fetch } from './apiClient';
import {
  CustomerListOrdersQueryParams,
  CustomerListOrdersRes,
} from '../types/api';

export const orderApi = {
  /**
   * GET /api/v1/customer/orders
   * Retrieves paginated summary list of customer orders with optional status filter
   */
  async listOrders(
    authToken: string,
    query?: CustomerListOrdersQueryParams
  ): Promise<CustomerListOrdersRes> {
    const params = new URLSearchParams();
    if (query?.type) params.append('type', query.type);
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.offset) params.append('offset', String(query.offset));

    const queryString = params.toString();
    const endpoint = `/api/v1/customer/orders${queryString ? `?${queryString}` : ''}`;

    return await v1Fetch<CustomerListOrdersRes>(endpoint, {
      method: 'GET',
      token: authToken,
    });
  },
};
