import {
  CapturedRequest,
  CapturedResponse,
  HttpMethod,
  StaffOrderDetail,
  StaffOrderSummary,
  UiOrderMapped,
} from './types';
import { OrderStatus } from '../types';

export interface ExecuteRequestParams {
  method: HttpMethod;
  url: string;
  authToken?: string;
  includeAuth?: boolean;
  body?: unknown | null;
  rawBodyText?: string;
}

export interface ExecuteRequestResult {
  request: CapturedRequest;
  response: CapturedResponse;
}

export async function executeStaffV1Request(
  params: ExecuteRequestParams
): Promise<ExecuteRequestResult> {
  const { method, url, authToken, includeAuth = false, body, rawBodyText } = params;

  const headers: Record<string, string> = {};
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  if (includeAuth && authToken?.trim()) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
  }

  let serializedBody: string | undefined;
  let capturedBody: unknown | null = null;

  if (method !== 'GET') {
    if (typeof rawBodyText === 'string') {
      serializedBody = rawBodyText;
      try {
        capturedBody = JSON.parse(rawBodyText);
      } catch {
        capturedBody = rawBodyText;
      }
    } else if (body !== undefined && body !== null) {
      serializedBody = JSON.stringify(body, null, 2);
      capturedBody = body;
    }
  }

  const capturedRequest: CapturedRequest = {
    method,
    url,
    headers,
    body: capturedBody,
    rawBodyText: serializedBody,
    timestamp: new Date().toISOString(),
  };

  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: serializedBody,
    });

    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = Math.max(0, Math.round(endedAt - startedAt));

    const responseHeaders: Record<string, string> = {};
    res.headers?.forEach?.((value, key) => {
      responseHeaders[key] = value;
    });

    const rawText = await res.text();
    let parsedBody: unknown = rawText;
    try {
      parsedBody = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsedBody = rawText;
    }

    return {
      request: capturedRequest,
      response: {
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        ok: res.ok,
        durationMs,
        headers: responseHeaders,
        body: parsedBody,
        rawText,
      },
    };
  } catch (err: unknown) {
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = Math.max(0, Math.round(endedAt - startedAt));
    const message = err instanceof Error ? err.message : 'Network connection failed';

    return {
      request: capturedRequest,
      response: {
        status: 0,
        statusText: 'Network Error',
        ok: false,
        durationMs,
        headers: {},
        body: {
          success: false,
          error: 'NetworkError',
          message: `${message}. Check that the backend server is running and reachable.`,
        },
        rawText: '',
        networkError: message,
      },
    };
  }
}

function formatShortDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toUiOrderStatus(status: StaffOrderSummary['status']): OrderStatus {
  if (
    status === 'PAYMENT_REQUIRED' ||
    status === 'AWAITING_PARCEL' ||
    status === 'READY_TO_CLAIM' ||
    status === 'CLAIMED'
  ) {
    return status;
  }
  return 'PAYMENT_REQUIRED';
}

export function mapStaffOrderToUiOrder(
  item: StaffOrderSummary | StaffOrderDetail,
  notesOverride?: string
): UiOrderMapped {
  const id = 'id' in item ? item.id : item.orderId;
  const timeline = item.statusTimeline || [];
  const findStageTime = (stage: string) =>
    formatShortDateTime(timeline.find((t) => t.status === stage)?.timestamp);

  const amountReceived = item.amountReceived ?? 0;
  const change = item.change ?? 0;
  const remainingSec = item.claimRemainingSeconds ?? 0;
  const isClaimActive = Boolean(item.isClaimActive && remainingSec > 0);

  return {
    id,
    product: item.ticketCode
      ? `Ticket ${item.ticketCode} • ${item.statusMessage}`
      : item.statusMessage || item.trackingId,
    recipient: item.customer,
    paidAmount: amountReceived > 0 ? `₱${amountReceived.toLocaleString()}` : '',
    codAmount: `₱${item.amountToPay.toLocaleString()}`,
    change:
      item.status === 'PAYMENT_REQUIRED' && amountReceived === 0
        ? 'To Be Determined'
        : `₱${change.toLocaleString()}`,
    trackingNumber: item.trackingId,
    refCode: item.ticketCode || id,
    alphanumericKey: item.ticketCode || id,
    envelopeNumber: item.ticketCode ? `TKT-${item.ticketCode}` : id,
    status: toUiOrderStatus(item.status),
    apiStatus: item.status,
    ticketCode: item.ticketCode,
    amountToPay: item.amountToPay,
    orderPlacedTime: formatShortDateTime(item.createdAt || item.timestamp) || 'Recent',
    awaitingParcelTime: findStageTime('AWAITING_PARCEL'),
    readyToClaimTime: findStageTime('READY_TO_CLAIM'),
    claimedTime: findStageTime('CLAIMED'),
    dateLabel: formatShortDateTime(item.timestamp) || item.timestamp,
    carrier: 'ParcelHub v1 Live',
    hubLocation: "Lily's Catering Hub • Live API",
    courierPaid: Boolean(item.courierPaid),
    parcelImageUrl: item.proofImageUrl || item.imageUrl || null,
    claimInitiatedAt: isClaimActive ? Date.now() : null,
    notes: notesOverride ?? '',
    statedFee: item.amountToPay,
    isClaimActive,
    claimRemainingSeconds: remainingSec,
    courierPaidByName: item.courierPaidByName,
    courierPaidAt: item.courierPaidAt,
  };
}
