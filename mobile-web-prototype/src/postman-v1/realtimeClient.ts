import type {
  RealtimeMessageDirection,
  RealtimeMessageEntry,
  RealtimeMessageKind,
  RealtimeOrderSignal,
  RealtimeSocketStatus,
} from './types';

const HEARTBEAT_INTERVAL_MS = 25_000;

export function isRealtimeOrderSignal(value: unknown): value is RealtimeOrderSignal {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.event === 'string' &&
    typeof rec.orderId === 'string' &&
    typeof rec.status === 'string' &&
    typeof rec.updatedAt === 'string'
  );
}

export function buildSupabaseRealtimeWsUrl(supabaseUrl: string, apiKey: string): string {
  const cleanedUrl = supabaseUrl.trim().replace(/\/+$/, '');
  const cleanedKey = apiKey.trim();
  if (!cleanedUrl) {
    throw new Error('Supabase URL is required (e.g. https://<project>.supabase.co)');
  }
  if (!cleanedKey) {
    throw new Error('Supabase Publishable / Anon Key is required');
  }

  let normalized = cleanedUrl;
  if (/^https:\/\//i.test(normalized)) {
    normalized = `wss://${normalized.slice(8)}`;
  } else if (/^http:\/\//i.test(normalized)) {
    normalized = `ws://${normalized.slice(7)}`;
  } else if (!/^wss?:\/\//i.test(normalized)) {
    normalized = `wss://${normalized}`;
  }

  const hasRealtimePath = /\/realtime\/v1\/websocket$/i.test(normalized);
  const endpoint = hasRealtimePath ? normalized : `${normalized}/realtime/v1/websocket`;

  const url = new URL(endpoint);
  if (!url.searchParams.has('apikey')) {
    url.searchParams.set('apikey', cleanedKey);
  }
  if (!url.searchParams.has('vsn')) {
    url.searchParams.set('vsn', '1.0.0');
  }
  return url.toString();
}

export function formatSignalSummary(signal: RealtimeOrderSignal): string {
  const ref = signal.ticketCode ? `${signal.ticketCode} (${signal.orderId})` : signal.orderId;
  return `${signal.event} · ${ref} -> ${signal.status}`;
}

function makeMessageEntry(args: {
  direction: RealtimeMessageDirection;
  kind: RealtimeMessageKind;
  event: string;
  topic?: string;
  summary: string;
  payload: unknown;
  rawText: string;
  signal?: RealtimeOrderSignal;
}): RealtimeMessageEntry {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...args,
  };
}

export interface SupabaseRealtimeConnectOptions {
  readonly mode: 'supabase';
  readonly supabaseUrl: string;
  readonly supabaseKey: string;
  readonly channel: string;
  readonly realtimeToken: string;
  readonly onStatus: (status: RealtimeSocketStatus, error?: string) => void;
  readonly onMessage: (entry: RealtimeMessageEntry) => void;
}

export interface RawWebSocketConnectOptions {
  readonly mode: 'raw';
  readonly wsUrl: string;
  readonly onStatus: (status: RealtimeSocketStatus, error?: string) => void;
  readonly onMessage: (entry: RealtimeMessageEntry) => void;
}

export type PostmanRealtimeConnectOptions =
  | SupabaseRealtimeConnectOptions
  | RawWebSocketConnectOptions;

/**
 * Zero-dependency WebSocket transport for ParcelHub Postman:
 * - Supabase Realtime Phoenix v1.0.0 protocol (private broadcast channels with JWT access_token)
 * - Raw ws:// / wss:// debugging mode
 */
export class PostmanRealtimeConnection {
  private readonly options: PostmanRealtimeConnectOptions;
  private socket: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private refCounter = 0;
  private joinRef: string | null = null;
  private intentionalClose = false;
  private resolvedTopic = '';

  constructor(options: PostmanRealtimeConnectOptions) {
    this.options = options;
  }

  private nextRef(): string {
    this.refCounter += 1;
    return String(this.refCounter);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  connect(): string {
    this.disconnect();
    this.intentionalClose = false;

    let wsUrl: string;
    if (this.options.mode === 'supabase') {
      wsUrl = buildSupabaseRealtimeWsUrl(this.options.supabaseUrl, this.options.supabaseKey);
      const rawChannel = this.options.channel.trim();
      this.resolvedTopic = rawChannel.startsWith('realtime:')
        ? rawChannel
        : `realtime:${rawChannel}`;
    } else {
      wsUrl = this.options.wsUrl.trim();
      if (!/^wss?:\/\//i.test(wsUrl)) {
        throw new Error('WebSocket URL must start with ws:// or wss://');
      }
      this.resolvedTopic = '';
    }

    this.options.onStatus('connecting');
    this.options.onMessage(
      makeMessageEntry({
        direction: 'system',
        kind: 'system',
        event: 'connecting',
        topic: this.resolvedTopic || undefined,
        summary: `Connecting to ${wsUrl.replace(/apikey=[^&]+/i, 'apikey=***')}`,
        payload: { url: wsUrl.replace(/apikey=[^&]+/i, 'apikey=***') },
        rawText: wsUrl.replace(/apikey=[^&]+/i, 'apikey=***'),
      })
    );

    const ws = new WebSocket(wsUrl);
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;

      if (this.options.mode === 'supabase') {
        this.options.onStatus('joining');
        const ref = this.nextRef();
        this.joinRef = ref;

        const joinFrame = {
          topic: this.resolvedTopic,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { ack: false, self: false },
              presence: { key: '', enabled: false },
              postgres_changes: [],
              private: true,
            },
            access_token: this.options.realtimeToken,
          },
          ref,
          join_ref: ref,
        };

        const serialized = JSON.stringify(joinFrame);
        ws.send(serialized);

        this.options.onMessage(
          makeMessageEntry({
            direction: 'out',
            kind: 'system',
            event: 'phx_join',
            topic: this.resolvedTopic,
            summary: `Joining private channel ${this.options.channel}`,
            payload: {
              ...joinFrame,
              payload: {
                ...joinFrame.payload,
                access_token: this.options.realtimeToken ? '***redacted***' : '',
              },
            },
            rawText: serialized,
          })
        );

        this.clearHeartbeat();
        this.heartbeatTimer = setInterval(() => {
          if (this.socket !== ws || ws.readyState !== WebSocket.OPEN) return;
          const hbRef = this.nextRef();
          const hbFrame = {
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: hbRef,
          };
          const hbRaw = JSON.stringify(hbFrame);
          try {
            ws.send(hbRaw);
            this.options.onMessage(
              makeMessageEntry({
                direction: 'out',
                kind: 'heartbeat',
                event: 'heartbeat',
                topic: 'phoenix',
                summary: `Heartbeat ping (#${hbRef})`,
                payload: hbFrame,
                rawText: hbRaw,
              })
            );
          } catch {
            // Ignore send errors on closing sockets
          }
        }, HEARTBEAT_INTERVAL_MS);
      } else {
        this.options.onStatus('subscribed');
        this.options.onMessage(
          makeMessageEntry({
            direction: 'system',
            kind: 'system',
            event: 'open',
            summary: 'WebSocket connection open',
            payload: { status: 'open' },
            rawText: 'open',
          })
        );
      }
    };

    ws.onmessage = (evt: MessageEvent) => {
      if (this.socket !== ws) return;
      const rawText = typeof evt.data === 'string' ? evt.data : String(evt.data);
      let parsed: unknown = rawText;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }

      if (this.options.mode === 'supabase' && parsed && typeof parsed === 'object') {
        const frame = parsed as {
          topic?: string;
          event?: string;
          payload?: Record<string, unknown>;
          ref?: string | null;
        };
        const topic = typeof frame.topic === 'string' ? frame.topic : undefined;
        const event = typeof frame.event === 'string' ? frame.event : 'message';
        const payload = frame.payload;

        if (event === 'phx_reply') {
          if (topic === 'phoenix') {
            this.options.onMessage(
              makeMessageEntry({
                direction: 'in',
                kind: 'heartbeat',
                event: 'phx_reply',
                topic,
                summary: `Heartbeat ack (${String(payload?.status ?? 'ok')})`,
                payload: frame,
                rawText,
              })
            );
            return;
          }

          const replyStatus = typeof payload?.status === 'string' ? payload.status : 'unknown';
          if (this.joinRef && frame.ref === this.joinRef) {
            if (replyStatus === 'ok') {
              this.options.onStatus('subscribed');
              this.options.onMessage(
                makeMessageEntry({
                  direction: 'in',
                  kind: 'system',
                  event: 'phx_reply',
                  topic,
                  summary: `Subscribed to ${this.options.channel}`,
                  payload: frame,
                  rawText,
                })
              );
            } else {
              const reason =
                payload?.response && typeof payload.response === 'object' && 'reason' in payload.response
                  ? String((payload.response as { reason?: unknown }).reason)
                  : JSON.stringify(payload?.response ?? payload);
              this.options.onStatus('error', `Channel join rejected: ${reason}`);
              this.options.onMessage(
                makeMessageEntry({
                  direction: 'in',
                  kind: 'error',
                  event: 'phx_reply',
                  topic,
                  summary: `Join rejected: ${reason}`,
                  payload: frame,
                  rawText,
                })
              );
            }
            return;
          }

          this.options.onMessage(
            makeMessageEntry({
              direction: 'in',
              kind: replyStatus === 'error' ? 'error' : 'reply',
              event: 'phx_reply',
              topic,
              summary: `Reply (${replyStatus}) on ${topic || 'socket'}`,
              payload: frame,
              rawText,
            })
          );
          return;
        }

        if (event === 'broadcast') {
          const innerEvent =
            payload && typeof payload.event === 'string' ? payload.event : 'broadcast';
          const innerPayload =
            payload && 'payload' in payload ? payload.payload : payload;

          if (isRealtimeOrderSignal(innerPayload)) {
            this.options.onMessage(
              makeMessageEntry({
                direction: 'in',
                kind: 'signal',
                event: innerEvent,
                topic,
                summary: formatSignalSummary(innerPayload),
                payload: frame,
                rawText,
                signal: innerPayload,
              })
            );
            return;
          }

          this.options.onMessage(
            makeMessageEntry({
              direction: 'in',
              kind: 'signal',
              event: innerEvent,
              topic,
              summary: `Broadcast "${innerEvent}" on ${topic || this.options.channel}`,
              payload: frame,
              rawText,
            })
          );
          return;
        }

        if (event === 'phx_error' || event === 'phx_close') {
          const isErr = event === 'phx_error';
          this.options.onStatus(
            isErr ? 'error' : 'disconnected',
            isErr ? 'Channel reported phx_error' : undefined
          );
          this.options.onMessage(
            makeMessageEntry({
              direction: 'in',
              kind: isErr ? 'error' : 'system',
              event,
              topic,
              summary: isErr ? `Channel error on ${topic || ''}` : `Channel closed (${topic || ''})`,
              payload: frame,
              rawText,
            })
          );
          return;
        }
      }

      // Raw WS or unrecognized JSON frame
      const maybeSignal = isRealtimeOrderSignal(parsed) ? parsed : undefined;
      this.options.onMessage(
        makeMessageEntry({
          direction: 'in',
          kind: maybeSignal ? 'signal' : 'message',
          event: maybeSignal ? maybeSignal.event : 'message',
          summary: maybeSignal
            ? formatSignalSummary(maybeSignal)
            : rawText.length > 110
              ? `${rawText.slice(0, 110)}...`
              : rawText || '(empty frame)',
          payload: parsed,
          rawText,
          signal: maybeSignal,
        })
      );
    };

    ws.onerror = () => {
      if (this.socket !== ws) return;
      this.options.onStatus('error', 'WebSocket transport error (check URL, key, or network)');
      this.options.onMessage(
        makeMessageEntry({
          direction: 'system',
          kind: 'error',
          event: 'error',
          topic: this.resolvedTopic || undefined,
          summary: 'WebSocket transport error',
          payload: { error: 'WebSocket transport error' },
          rawText: 'WebSocket transport error',
        })
      );
    };

    ws.onclose = (evt: CloseEvent) => {
      if (this.socket !== ws) return;
      this.clearHeartbeat();
      this.socket = null;
      const reason = evt.reason ? ` (${evt.reason})` : '';
      const clean = this.intentionalClose || evt.code === 1000;
      this.options.onStatus(
        clean ? 'disconnected' : 'error',
        clean ? undefined : `Socket closed unexpectedly (code ${evt.code}${reason})`
      );
      this.options.onMessage(
        makeMessageEntry({
          direction: 'system',
          kind: clean ? 'system' : 'error',
          event: 'close',
          topic: this.resolvedTopic || undefined,
          summary: `Disconnected (code ${evt.code}${reason})`,
          payload: { code: evt.code, reason: evt.reason || '', wasClean: evt.wasClean },
          rawText: `close:${evt.code}`,
        })
      );
    };

    return wsUrl;
  }

  refreshAccessToken(nextToken: string): void {
    if (
      this.options.mode !== 'supabase' ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    const ref = this.nextRef();
    const frame = {
      topic: this.resolvedTopic,
      event: 'access_token',
      payload: { access_token: nextToken },
      ref,
    };
    const serialized = JSON.stringify(frame);
    this.socket.send(serialized);
    this.options.onMessage(
      makeMessageEntry({
        direction: 'out',
        kind: 'system',
        event: 'access_token',
        topic: this.resolvedTopic,
        summary: 'Pushed refreshed access_token to channel',
        payload: { topic: this.resolvedTopic, event: 'access_token', ref },
        rawText: serialized,
      })
    );
  }

  sendRaw(rawText: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(rawText);
    let parsed: unknown = rawText;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
    this.options.onMessage(
      makeMessageEntry({
        direction: 'out',
        kind: 'message',
        event: 'send',
        topic: this.resolvedTopic || undefined,
        summary: rawText.length > 110 ? `${rawText.slice(0, 110)}...` : rawText,
        payload: parsed,
        rawText,
      })
    );
    return true;
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearHeartbeat();
    const ws = this.socket;
    this.socket = null;
    if (!ws) return;

    if (this.options.mode === 'supabase' && ws.readyState === WebSocket.OPEN && this.resolvedTopic) {
      try {
        const leaveFrame = {
          topic: this.resolvedTopic,
          event: 'phx_leave',
          payload: {},
          ref: this.nextRef(),
        };
        ws.send(JSON.stringify(leaveFrame));
      } catch {
        // Ignore leave errors during teardown
      }
    }

    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client disconnect');
      }
    } catch {
      // Ignore close errors
    }

    this.options.onStatus('disconnected');
  }
}
