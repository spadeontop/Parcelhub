import { CapturedRequest, CapturedResponse, HttpMethod } from './types';

export interface ExecuteCustomerRequestParams {
  method: HttpMethod;
  url: string;
  authToken?: string;
  includeAuth?: boolean;
  body?: unknown | null;
  rawBodyText?: string;
}

export interface ExecuteCustomerRequestResult {
  request: CapturedRequest;
  response: CapturedResponse;
}

export async function executeCustomerV1Request(
  params: ExecuteCustomerRequestParams
): Promise<ExecuteCustomerRequestResult> {
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
