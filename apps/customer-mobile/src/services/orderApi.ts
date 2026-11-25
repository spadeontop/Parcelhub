import { v1Fetch } from './apiClient';
import {
  CustomerListOrdersQueryParams,
  CustomerListOrdersRes,
  CustomerInitOrderRes,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  CustomerGetOrderRes,
  CustomerClaimOrderRes,
  CustomerCancelOrderReq,
  CustomerCancelOrderRes,
  CustomerInitiateRefundReq,
  CustomerInitiateRefundRes,
  CustomerGetOrderPhotoRes,
  OrderPhotoType,
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

  /**
   * GET /api/v1/customer/orders/{id}
   * Fetches single order detail by UUID or ticketCode
   */
  async getOrder(
    authToken: string,
    orderId: string
  ): Promise<CustomerGetOrderRes> {
    return await v1Fetch<CustomerGetOrderRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'GET',
        token: authToken,
      }
    );
  },

  /**
   * POST /api/v1/customer/orders/initialize
   * Initializes a draft order with a receipt screenshot and generates a ticketCode
   */
  async initializeOrder(
    authToken: string,
    imageUrl: string
  ): Promise<CustomerInitOrderRes> {
    return await v1Fetch<CustomerInitOrderRes>('/api/v1/customer/orders/initialize', {
      method: 'POST',
      token: authToken,
      body: JSON.stringify({ imageUrl }),
      timeoutMs: 30000,
    });
  },

  /**
   * PUT /api/v1/customer/orders/{id}
   * Updates order details from PENDING_INITIALIZATION to PAYMENT_REQUIRED (one-shot)
   */
  async confirmOrder(
    authToken: string,
    orderId: string,
    orderData: CustomerUpdateOrderReq['order']
  ): Promise<CustomerUpdateOrderRes> {
    return await v1Fetch<CustomerUpdateOrderRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'PUT',
        token: authToken,
        body: JSON.stringify({ order: orderData }),
      }
    );
  },

  /**
   * POST /api/v1/customer/orders/{id}/claim
   * Initiates claim pass countdown for READY_TO_CLAIM order
   */
  async claimOrder(
    authToken: string,
    orderId: string
  ): Promise<CustomerClaimOrderRes> {
    return await v1Fetch<CustomerClaimOrderRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}/claim`,
      {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({}),
      }
    );
  },

  /**
   * POST /api/v1/customer/orders/{id}/cancel
   * Cancels/voids an unpaid order (PAYMENT_REQUIRED)
   */
  async cancelOrder(
    authToken: string,
    orderId: string,
    payload: CustomerCancelOrderReq = {}
  ): Promise<CustomerCancelOrderRes> {
    return await v1Fetch<CustomerCancelOrderRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: 'POST',
        token: authToken,
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * POST /api/v1/customer/orders/{id}/refund
   * Initiates or refreshes a 5-minute refund pass window for AWAITING_PARCEL order
   */
  async initiateRefund(
    authToken: string,
    orderId: string,
    payload: CustomerInitiateRefundReq = {}
  ): Promise<CustomerInitiateRefundRes> {
    return await v1Fetch<CustomerInitiateRefundRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}/refund`,
      {
        method: 'POST',
        token: authToken,
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * GET /api/v1/customer/orders/{id}/photo
   * Retrieves parcel screenshot and/or proof of delivery photo
   */
  async getOrderPhoto(
    authToken: string,
    orderId: string,
    type: OrderPhotoType = 'all'
  ): Promise<CustomerGetOrderPhotoRes> {
    return await v1Fetch<CustomerGetOrderPhotoRes>(
      `/api/v1/customer/orders/${encodeURIComponent(orderId)}/photo?type=${type}`,
      {
        method: 'GET',
        token: authToken,
      }
    );
  },
};
