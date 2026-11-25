import { ENV } from '../config/env';
import { staffStorage } from './staffStorage';

const DEFAULT_TIMEOUT_MS = 10_000;

export class StaffApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'StaffApiError';
    this.statusCode = statusCode;
  }
}

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedInFlight: Promise<void> | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

async function handleUnauthorized(): Promise<void> {
  if (unauthorizedInFlight) {
    await unauthorizedInFlight;
    return;
  }
  unauthorizedInFlight = (async () => {
    try {
      await staffStorage.clearSession();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    } finally {
      unauthorizedInFlight = null;
    }
  })();
  await unauthorizedInFlight;
}

export interface StaffFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  requiresAuth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  fallbackErrorMessage?: string;
  networkErrorMessage?: string;
}

export async function staffFetch<T>(
  path: string,
  options: StaffFetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    token: explicitToken,
    requiresAuth = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fallbackErrorMessage = 'Request failed',
    networkErrorMessage,
  } = options;

  let authToken: string | null = null;
  if (requiresAuth) {
    authToken = explicitToken || (await staffStorage.getAuthToken());
    if (!authToken) {
      throw new StaffApiError('Missing staff authorization token. Please sign in.', 401);
    }
  }

  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', onExternalAbort);
    }
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${ENV.API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401 && requiresAuth) {
        await handleUnauthorized();
      }
      const errorMsg =
        data?.message ||
        data?.error ||
        data?.statusMessage ||
        `${fallbackErrorMessage} (${res.status})`;
      throw new StaffApiError(errorMsg, res.status);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof StaffApiError) throw err;
    if (err?.name === 'AbortError') {
      if (timedOut && !signal?.aborted) {
        throw new StaffApiError('Request timed out. Please try again.');
      }
      throw err;
    }
    if (err?.message?.includes('Network request failed')) {
      throw new StaffApiError(
        networkErrorMessage || `Cannot reach backend at ${ENV.API_BASE_URL}.`
      );
    }
    throw new StaffApiError(err?.message || fallbackErrorMessage);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
