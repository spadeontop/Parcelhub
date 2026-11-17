import { ApiErrorResponse } from '../types/api';
import { getDetectedApiUrl } from '../../config/env';

export class V1ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    error: string = 'ApiError',
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'V1ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.isNetworkError = isNetworkError;
  }
}

export type UnauthorizedHandler = (error: V1ApiError, endpoint: string) => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

type V1FetchOptions = RequestInit & {
  readonly token?: string | null;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
};

/**
 * Executes an HTTP request against the ParcelHub V1 Backend.
 * Strictly adheres to V1 Feature #9: Backend-Authoritative Error Response Handling.
 */
export async function v1Fetch<T>(
  endpoint: string,
  options: V1FetchOptions = {}
): Promise<T> {
  const baseUrl = options.baseUrl || getDetectedApiUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err?.name === 'AbortError';
    throw new V1ApiError(
      isAbort ? 'Connection timed out. Unable to reach server.' : 'Network error: Unable to reach server',
      0,
      'NetworkError',
      true
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.ok) {
    return data as T;
  }

  // Backend-authoritative error extraction
  const errorEnvelope = data as Partial<ApiErrorResponse> | null;
  const message =
    errorEnvelope?.message ||
    errorEnvelope?.error ||
    `Request failed with status ${response.status}`;
  const errorType = errorEnvelope?.error || 'ApiError';
  const statusCode = errorEnvelope?.statusCode || response.status;

  const apiError = new V1ApiError(message, statusCode, errorType, false);

  if (statusCode === 401 && options.token && unauthorizedHandler) {
    try {
      unauthorizedHandler(apiError, endpoint);
    } catch (e) {
      console.warn('[apiClient] Error executing unauthorized handler:', e);
    }
  }

  throw apiError;
}
