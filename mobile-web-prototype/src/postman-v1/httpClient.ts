import type { CapturedRequest, CapturedResponse, HttpMethod } from './types';

export interface ExecutePostmanRequestParams {
  readonly method: HttpMethod;
  readonly url: string;
  readonly authToken?: string;
  readonly includeAuth?: boolean;
  readonly customHeaders?: Record<string, string>;
  readonly body?: unknown | null;
  readonly rawBodyText?: string;
}

export interface ExecutePostmanRequestResult {
  readonly request: CapturedRequest;
  readonly response: CapturedResponse;
}

export async function executePostmanRequest(
  params: ExecutePostmanRequestParams
): Promise<ExecutePostmanRequestResult> {
  const {
    method,
    url,
    authToken,
    includeAuth = false,
    customHeaders = {},
    body,
    rawBodyText,
  } = params;

  const headers: Record<string, string> = {};

  for (const [k, v] of Object.entries(customHeaders)) {
    const trimmedKey = k.trim();
    if (trimmedKey) {
      headers[trimmedKey] = v;
    }
  }

  let serializedBody: string | undefined;
  let capturedBody: unknown | null = null;

  if (method !== 'GET') {
    if (typeof rawBodyText === 'string') {
      const trimmed = rawBodyText.trim();
      if (trimmed.length > 0) {
        serializedBody = rawBodyText;
        try {
          capturedBody = JSON.parse(rawBodyText);
        } catch {
          capturedBody = rawBodyText;
        }
      }
    } else if (body !== undefined && body !== null) {
      serializedBody = JSON.stringify(body, null, 2);
      capturedBody = body;
    }
  }

  if (serializedBody !== undefined && !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth && authToken?.trim()) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
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
    const sizeBytes = new Blob([rawText]).size;

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
        sizeBytes,
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
        sizeBytes: 0,
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
