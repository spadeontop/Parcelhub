import {
  OrderStatus,
  PaginationMeta,
  StaffActivateOrderResponse,
  StaffAttachPhotoResponse,
  StaffClaimOrderResponse,
  StaffGetOrderPhotoResponse,
  StaffLoginResponse,
  StaffOrder,
  StaffOrderDetailResponse,
  StaffPayCourierResponse,
  StaffRefundOrderResponse,
} from '../types';
import { ENV } from '../config/env';
import { StaffApiError, staffFetch } from './apiClient';
import { staffStorage } from './staffStorage';

export { StaffApiError };

export type StaffQrLookupResult =
  | { kind: 'found'; order: StaffOrder; hasDetails: boolean }
  | { kind: 'not-found' | 'ambiguous' };

function mapSummaryOrder(o: any): StaffOrder {
  return {
    id: o.id || o.orderId,
    ticketCode: o.ticketCode || null,
    trackingId: o.trackingId || '',
    customer: o.customer || o.recipientName || 'Unknown Customer',
    amountToPay: typeof o.amountToPay === 'number' ? o.amountToPay : o.price || 0,
    amountReceived: o.amountReceived,
    change: o.change || 0,
    timestamp: o.timestamp || new Date().toISOString(),
    status: o.status,
    statusMessage: o.statusMessage,
    isClaimActive: o.isClaimActive,
    claimRemainingSeconds: o.claimRemainingSeconds,
    claimInitiatedAt: o.claimInitiatedAt,
    claimExpiresAt: o.claimExpiresAt,
    courierPaid: o.courierPaid,
    courierPaidBy: o.courierPaidBy ?? undefined,
    courierPaidByName: o.courierPaidByName,
    courierPaidAt: o.courierPaidAt ?? undefined,
    claimedAt: o.claimedAt,
    createdAt: o.createdAt || o.statusTimeline?.[0]?.timestamp || o.timestamp,
    statusTimeline: o.statusTimeline,
    proofImageUrl: o.proofImageUrl || o.imageUrl,
    notes: o.notes,
    cancelledBy: o.cancelledBy ?? null,
    cancelledByRole: o.cancelledByRole ?? null,
    cancelReasonCode: o.cancelReasonCode ?? null,
    cancelReason: o.cancelReason ?? null,
    cancelledAt: o.cancelledAt ?? null,
    isRefundEligible: o.isRefundEligible,
    refundAmount: typeof o.refundAmount === 'number' ? o.refundAmount : undefined,
    refundRequested: o.refundRequested,
    refundInitiatedAt: o.refundInitiatedAt ?? null,
    refundExpiresAt: o.refundExpiresAt ?? null,
    isRefundActive: o.isRefundActive,
    refundRemainingSeconds: o.refundRemainingSeconds,
    refundReasonCode: o.refundReasonCode ?? null,
    refundReason: o.refundReason ?? null,
    isRefunded: o.isRefunded,
    refundedBy: o.refundedBy ?? null,
    refundedByName: o.refundedByName,
    refundedAt: o.refundedAt ?? null,
  };
}

export const staffApi = {
  async findOrderByQrCode(
    code: string,
    token: string,
    signal: AbortSignal
  ): Promise<StaffQrLookupResult> {
    const normalizedCode = code.trim().toLowerCase();
    if (!normalizedCode) return { kind: 'not-found' };

    // Customer QR codes fall back to the order UUID when there is no ticket code.
    if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(normalizedCode)) {
      try {
        const order = await this.getOrder(normalizedCode, token, signal);
        if (order.id.toLowerCase() === normalizedCode && order.status !== 'PENDING_INITIALIZATION') {
          return { kind: 'found', order, hasDetails: true };
        }
      } catch (error) {
        if (!(error instanceof StaffApiError && error.statusCode === 404)) throw error;
      }
    }

    const pageSize = 20;
    let offset = 0;
    let match: StaffOrder | undefined;
    // Staff search returns partial matches, and an exact tracking ID can belong to multiple orders.
    while (!signal.aborted) {
      const { orders, pagination } = await this.getOrders(
        undefined,
        pageSize,
        offset,
        token,
        normalizedCode,
        signal
      );
      for (const order of orders) {
        const isExactMatch = [order.ticketCode, order.trackingId].some(
          (value) => value?.trim().toLowerCase() === normalizedCode
        );
        if (!isExactMatch) continue;
        if (match && match.id !== order.id) return { kind: 'ambiguous' };
        match = order;
      }
      if (!pagination.hasMore || orders.length === 0) break;
      offset += orders.length;
    }

    return match ? { kind: 'found', order: match, hasDetails: false } : { kind: 'not-found' };
  },

  getStoredAuthToken: () => staffStorage.getAuthToken(),
  setStoredAuthToken: (token: string) => staffStorage.setAuthToken(token),
  getStoredRefreshToken: () => staffStorage.getRefreshToken(),
  setStoredRefreshToken: (token: string) => staffStorage.setRefreshToken(token),
  getStoredStaffEmail: () => staffStorage.getStaffEmail(),
  setStoredStaffEmail: (email: string) => staffStorage.setStaffEmail(email),
  clearStoredSession: () => staffStorage.clearSession(),

  async login(usernameOrEmail: string, password: string): Promise<StaffLoginResponse> {
    const normalizedUsername = usernameOrEmail.trim().includes('@')
      ? usernameOrEmail.trim().split('@')[0].toLowerCase()
      : usernameOrEmail.trim().toLowerCase();

    const data = await staffFetch<StaffLoginResponse>('/api/v1/staff/login', {
      method: 'POST',
      requiresAuth: false,
      body: { username: normalizedUsername, password },
      fallbackErrorMessage: 'Login failed',
      networkErrorMessage: `Cannot reach backend at ${ENV.API_BASE_URL}. Ensure Next.js server is running.`,
    });

    await staffStorage.setAuthToken(data.authToken);
    if (data.refreshToken) {
      await staffStorage.setRefreshToken(data.refreshToken);
    }
    if (data.staff) {
      await staffStorage.setStaffProfile(data.staff);
      await staffStorage.setStaffEmail(data.staff.username);
    } else {
      await staffStorage.setStaffEmail(normalizedUsername);
    }

    return data;
  },

  async getOrders(
    status?: OrderStatus,
    limit?: number,
    offset?: number,
    explicitToken?: string,
    search?: string,
    signal?: AbortSignal,
    refundEligible?: boolean
  ): Promise<{ orders: StaffOrder[]; pagination: PaginationMeta }> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (offset !== undefined) queryParams.append('offset', offset.toString());
    if (search && search.trim()) queryParams.append('search', search.trim());
    if (refundEligible !== undefined) queryParams.append('refundEligible', String(refundEligible));

    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await staffFetch<{ orders?: any[]; pagination?: Partial<PaginationMeta> }>(
      `/api/v1/staff/orders${qs}`,
      {
        method: 'GET',
        token: explicitToken,
        signal,
        fallbackErrorMessage: 'Failed to fetch orders',
        networkErrorMessage: `Backend offline: Cannot connect to ${ENV.API_BASE_URL}.`,
      }
    );

    const mappedOrders = (data?.orders || []).map(mapSummaryOrder);
    return {
      orders: mappedOrders,
      pagination: {
        totalCount: data?.pagination?.totalCount ?? mappedOrders.length,
        limit: data?.pagination?.limit ?? limit ?? 20,
        offset: data?.pagination?.offset ?? offset ?? 0,
        hasMore: Boolean(data?.pagination?.hasMore),
      },
    };
  },

  async getOrderPhoto(
    orderId: string,
    type: 'proof' | 'screenshot' | 'all' = 'proof',
    explicitToken?: string,
    signal?: AbortSignal
  ): Promise<{ imageUrl: string | null; proofImageUrl: string | null }> {
    if (signal?.aborted) return { imageUrl: null, proofImageUrl: null };
    try {
      const data = await staffFetch<StaffGetOrderPhotoResponse>(
        `/api/v1/staff/orders/${encodeURIComponent(orderId)}/photo?type=${type}`,
        {
          method: 'GET',
          token: explicitToken,
          signal,
          fallbackErrorMessage: 'Failed to fetch order photo',
        }
      );
      return {
        imageUrl: data?.imageUrl || null,
        proofImageUrl: data?.proofImageUrl || null,
      };
    } catch {
      return { imageUrl: null, proofImageUrl: null };
    }
  },

  async getOrder(orderId: string, explicitToken?: string, signal?: AbortSignal): Promise<StaffOrder> {
    const o = await staffFetch<StaffOrderDetailResponse & { proofImageUrl?: string; claimedAt?: string }>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'GET',
        token: explicitToken,
        signal,
        fallbackErrorMessage: `Failed to fetch order ${orderId}`,
      }
    );

    // Scope eager /photo prefetch to statuses that actually have a proof photo.
    let proofImageUrl = o.proofImageUrl;
    if (!proofImageUrl && (o.status === 'READY_TO_CLAIM' || o.status === 'CLAIMED')) {
      const photoData = await this.getOrderPhoto(orderId, 'proof', explicitToken, signal);
      proofImageUrl = photoData.proofImageUrl || photoData.imageUrl || undefined;
    }

    return {
      id: o.orderId || orderId,
      ticketCode: o.ticketCode || null,
      trackingId: o.trackingId || '',
      customer: o.customer,
      amountToPay: o.amountToPay,
      amountReceived: typeof o.amountReceived === 'number' ? o.amountReceived : undefined,
      change: o.change || 0,
      timestamp: o.timestamp,
      status: o.status,
      statusMessage: o.statusMessage,
      isClaimActive: o.isClaimActive,
      claimRemainingSeconds: o.claimRemainingSeconds,
      courierPaid: o.courierPaid,
      courierPaidBy: o.courierPaidBy ?? undefined,
      courierPaidByName: o.courierPaidByName,
      courierPaidAt: o.courierPaidAt ?? undefined,
      claimedAt: o.claimedAt,
      createdAt: o.createdAt || o.statusTimeline?.[0]?.timestamp || o.timestamp,
      statusTimeline: o.statusTimeline,
      proofImageUrl,
      cancelledBy: o.cancelledBy ?? null,
      cancelledByRole: o.cancelledByRole ?? null,
      cancelReasonCode: o.cancelReasonCode ?? null,
      cancelReason: o.cancelReason ?? null,
      cancelledAt: o.cancelledAt ?? null,
      isRefundEligible: o.isRefundEligible,
      refundAmount: typeof o.refundAmount === 'number' ? o.refundAmount : undefined,
      refundRequested: o.refundRequested,
      refundInitiatedAt: o.refundInitiatedAt ?? null,
      refundExpiresAt: o.refundExpiresAt ?? null,
      isRefundActive: o.isRefundActive,
      refundRemainingSeconds: o.refundRemainingSeconds,
      refundReasonCode: o.refundReasonCode ?? null,
      refundReason: o.refundReason ?? null,
      isRefunded: o.isRefunded,
      refundedBy: o.refundedBy ?? null,
      refundedByName: o.refundedByName,
      refundedAt: o.refundedAt ?? null,
    };
  },

  activateOrder(orderId: string, amountReceived: number, explicitToken?: string) {
    return staffFetch<StaffActivateOrderResponse>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}/activate`,
      {
        method: 'POST',
        token: explicitToken,
        body: { amountReceived },
        fallbackErrorMessage: 'Activation failed',
      }
    );
  },

  payCourier(orderId: string, explicitToken?: string) {
    return staffFetch<StaffPayCourierResponse>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}/make-claimable/pay`,
      {
        method: 'POST',
        token: explicitToken,
        body: {},
        fallbackErrorMessage: 'Courier payment failed',
      }
    );
  },

  attachPhoto(orderId: string, imageUrl: string, explicitToken?: string) {
    return staffFetch<StaffAttachPhotoResponse>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}/make-claimable/attach-photo`,
      {
        method: 'POST',
        token: explicitToken,
        body: { imageUrl },
        fallbackErrorMessage: 'Photo attach failed',
      }
    );
  },

  claimOrder(orderId: string, explicitToken?: string) {
    return staffFetch<StaffClaimOrderResponse>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}/claim`,
      {
        method: 'POST',
        token: explicitToken,
        body: {},
        fallbackErrorMessage: 'Claim failed',
      }
    );
  },

  refundOrder(orderId: string, explicitToken?: string) {
    return staffFetch<StaffRefundOrderResponse>(
      `/api/v1/staff/orders/${encodeURIComponent(orderId)}/refund`,
      {
        method: 'POST',
        token: explicitToken,
        body: {},
        fallbackErrorMessage: 'Refund failed',
      }
    );
  },
};
