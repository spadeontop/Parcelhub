import {
  Order,
  OrderStatus,
  CustomerOrderSummary,
  CustomerOrderDetail,
  CustomerInitOrderRes,
  CustomerUpdateOrderRes,
  CustomerClaimOrderRes,
} from '../types';
import { ENV } from '../config/env';

export const parseCurrency = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
};

export const getStatedFee = (order: Order): number => {
  if (order.statedFee) return order.statedFee;
  return parseCurrency(order.codAmount || order.paidAmount);
};

export const isClaimUnlocked = (order: Order): boolean => {
  if (order.claimExpiresAt) {
    return new Date(order.claimExpiresAt).getTime() > Date.now();
  }
  if (order.claimInitiatedAt) {
    const elapsed = Date.now() - order.claimInitiatedAt;
    return elapsed < ENV.HANDOFF_CUTOFF_TIME_MINS * 60 * 1000;
  }
  return false;
};

export const getClaimTimeRemainingSeconds = (order: Order): number => {
  if (order.claimExpiresAt) {
    const remaining = Math.floor((new Date(order.claimExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  }
  if (order.claimInitiatedAt) {
    const elapsed = Math.floor((Date.now() - order.claimInitiatedAt) / 1000);
    return Math.max(0, ENV.HANDOFF_CUTOFF_TIME_MINS * 60 - elapsed);
  }
  return 0;
};

export function mapOrderDetailToOrder(detail: CustomerOrderDetail): Order {
  const numId = detail.id.replace('ORD-', '');
  const priceFormatted = `₱${detail.price.toLocaleString('en-US')}`;
  const changeFormatted = detail.change !== undefined ? `₱${detail.change.toLocaleString('en-US')}` : '₱0';
  const totalPaid = detail.price + (detail.change || 0);

  const awaitingTime = detail.statusTimeline?.find((t) => t.status === 'AWAITING_PARCEL')?.timestamp;
  const readyTime = detail.statusTimeline?.find((t) => t.status === 'READY_TO_CLAIM')?.timestamp;
  const claimedTime = detail.statusTimeline?.find((t) => t.status === 'CLAIMED')?.timestamp;

  return {
    id: detail.id,
    product: detail.productName || 'Parcel Package',
    recipient: detail.recipientName || 'Valued Customer',
    paidAmount: totalPaid > 0 ? `₱${totalPaid.toLocaleString('en-US')}` : '',
    codAmount: priceFormatted,
    change: changeFormatted,
    trackingNumber: detail.trackingId || 'PH00000000000X',
    refCode: `0001-${numId.padStart(4, '0')}-5555`,
    alphanumericKey: detail.id,
    envelopeNumber: `ENV-${numId}`,
    status: detail.status,
    orderPlacedTime: detail.statusTimeline?.[0]?.timestamp
      ? new Date(detail.statusTimeline[0].timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Just now',
    awaitingParcelTime: awaitingTime ? new Date(awaitingTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    readyToClaimTime: readyTime ? new Date(readyTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    claimedTime: claimedTime ? new Date(claimedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    dateLabel: detail.statusTimeline?.[0]?.timestamp
      ? new Date(detail.statusTimeline[0].timestamp).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent Order',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: detail.status === 'READY_TO_CLAIM' || detail.status === 'CLAIMED',
    parcelImageUrl: null,
    claimInitiatedAt: detail.claimInitiatedAt ? new Date(detail.claimInitiatedAt).getTime() : null,
    claimExpiresAt: detail.claimExpiresAt || null,
    notes: 'Official Counter Order',
    statedFee: detail.price,
    qrImageUrl: detail.qrImageUrl || null,
    statusTimeline: [...(detail.statusTimeline || [])],
  };
}

export function mapSummaryToOrder(summary: CustomerOrderSummary): Order {
  const numId = summary.id.replace('ORD-', '');
  return {
    id: summary.id,
    product: summary.productName || 'Purchased Item',
    recipient: 'John Vince Dumaguit',
    paidAmount: '',
    codAmount: '₱480',
    change: '₱0',
    trackingNumber: summary.trackingId || 'PH00000000000X',
    refCode: `0001-${numId.padStart(4, '0')}-1122`,
    alphanumericKey: summary.id,
    envelopeNumber: `ENV-${numId}`,
    status: summary.status,
    orderPlacedTime: summary.timestamp ? new Date(summary.timestamp).toLocaleTimeString() : 'Recent',
    awaitingParcelTime: null,
    readyToClaimTime: null,
    claimedTime: null,
    dateLabel: summary.timestamp ? new Date(summary.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recent Order',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu",
    courierPaid: summary.status === 'READY_TO_CLAIM' || summary.status === 'CLAIMED',
    parcelImageUrl: null,
    claimInitiatedAt: null,
    claimExpiresAt: null,
    notes: '',
    statedFee: 480,
    qrImageUrl: null,
  };
}

export const orderApi = {
  /**
   * GET /api/customer/orders
   * Lists all customer orders, optionally filtered by status
   */
  async getOrders(
    token: string | null,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true,
    filter?: OrderStatus
  ): Promise<CustomerOrderSummary[]> {
    if (!isLiveMode || !token) {
      return [];
    }

    try {
      const url = new URL(`${baseUrl}/api/customer/orders`);
      if (filter) url.searchParams.set('type', filter);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to list orders (HTTP ${res.status})`);
      }

      const data = await res.json();
      return (data.orders as CustomerOrderSummary[]) || [];
    } catch (err) {
      throw err;
    }
  },

  /**
   * GET /api/customer/orders/{id}
   * Fetches full order details including timeline and live claim state
   */
  async getOrder(
    token: string | null,
    orderId: string,
    baseUrl: string = ENV.API_BASE_URL,
    isLiveMode: boolean = true
  ): Promise<CustomerOrderDetail | null> {
    if (!isLiveMode || !token) {
      return null;
    }

    try {
      const res = await fetch(`${baseUrl}/api/customer/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch order ${orderId} (HTTP ${res.status})`);
      }

      const data = await res.json();
      return (data.order as CustomerOrderDetail) || null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * POST /api/customer/orders/initialize
   * Step 1: Initialize order with receipt screenshot
   */
  async initializeOrder(
    token: string | null,
    imageUrl: string,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerInitOrderRes> {
    if (!token) {
      throw new Error('Authentication token is required to create an order.');
    }

    const res = await fetch(`${baseUrl}/api/customer/orders/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error: any = new Error(data.message || data.error || `Initialization failed (HTTP ${res.status})`);
      error.status = res.status;
      error.errorType = data.error;
      error.data = data;
      throw error;
    }

    return data as CustomerInitOrderRes;
  },

  /**
   * PUT /api/customer/orders/{id}
   * Step 2: Update initialized order with confirmed details
   */
  async updateOrder(
    token: string | null,
    orderId: string,
    orderData: {
      trackingId?: string;
      productName?: string;
      recipientName?: string;
      price?: number;
    },
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerUpdateOrderRes> {
    if (!token) {
      throw new Error('Authentication token is required to update order.');
    }

    const res = await fetch(`${baseUrl}/api/customer/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: orderData }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error: any = new Error(data.message || data.error || `Update failed (HTTP ${res.status})`);
      error.status = res.status;
      error.errorType = data.error;
      error.data = data;
      throw error;
    }

    return data as CustomerUpdateOrderRes;
  },

  /**
   * POST /api/customer/orders/{id}/claim
   * Initiates counter release claim, unlocking pickup countdown
   */
  async claimOrder(
    token: string | null,
    orderId: string,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerClaimOrderRes> {
    if (!token) {
      throw new Error('Authentication token is required to claim order.');
    }

    const res = await fetch(`${baseUrl}/api/customer/orders/${orderId}/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || `Claim failed (HTTP ${res.status})`);
    }

    return data as CustomerClaimOrderRes;
  },

  /**
   * DELETE /api/customer/orders/{id}
   * Cancels order while unpaid
   */
  async cancelOrder(
    token: string | null,
    orderId: string,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<{ statusMessage: string }> {
    if (!token) {
      throw new Error('Authentication token is required to cancel order.');
    }

    const res = await fetch(`${baseUrl}/api/customer/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || `Cancellation failed (HTTP ${res.status})`);
    }

    return data;
  },
};
