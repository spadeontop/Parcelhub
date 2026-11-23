import { AppState, Platform } from 'react-native';
import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { ENV } from '../config/env';
import type { JWTToken, RealtimeOrderSignal } from '../types/api';
import { V1ApiError } from './apiClient';
import { realtimeApi } from './realtimeApi';

export type RealtimeConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'subscribed'
  | 'reconnecting'
  | 'disabled_503';

export interface OrderRealtimeClientOptions {
  readonly getAuthToken: () => JWTToken | null;
  readonly onUnauthorized: () => Promise<void> | void;
  readonly onSignal: (signal: RealtimeOrderSignal) => void;
  readonly onSubscribed: (info: { readonly isRejoin: boolean }) => void;
  readonly onStatusChange?: (status: RealtimeConnectionStatus) => void;
}

const BACKOFF_DELAYS_MS = [1000, 2000, 4000, 8000, 15_000, 30_000] as const;
const TOKEN_RENEWAL_BUFFER_MS = 60_000;
const MIN_RENEWAL_DELAY_MS = 15_000;

function isAppActive(): boolean {
  return Platform.OS === 'web' || AppState.currentState === 'active';
}

function isRealtimeSignalPayload(value: unknown): value is RealtimeOrderSignal {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.event === 'string' &&
    typeof record.orderId === 'string' &&
    typeof record.status === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

/**
 * Standalone Supabase Realtime WebSocket client for customer order signals.
 * Enforces session-epoch isolation, AppState foreground-only connections,
 * wall-clock token expiry checks on resume, 503 degradation, and 401 lock routing.
 */
export class OrderRealtimeClient {
  private readonly options: OrderRealtimeClientOptions;
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;

  private sessionEpoch = 0;
  private status: RealtimeConnectionStatus = 'disconnected';
  private retryAttempt = 0;
  private hasCompletedInitialJoin = false;
  private hadDropOrError = false;

  private currentRealtimeToken: string | null = null;
  private currentChannelTopic: string | null = null;
  private tokenExpiresAtMs = 0;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private renewalTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnectingInFlight = false;

  constructor(options: OrderRealtimeClientOptions) {
    this.options = options;
  }

  getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  /**
   * Starts or resumes the realtime connection if authenticated and foregrounded.
   */
  start(): void {
    if (!this.options.getAuthToken() || !isAppActive()) {
      return;
    }

    if (
      this.status === 'subscribed' ||
      this.status === 'connecting' ||
      this.isConnectingInFlight
    ) {
      return;
    }

    void this.connect(this.sessionEpoch);
  }

  /**
   * Handles AppState returning to 'active' while authenticated.
   */
  handleForegroundResume(): void {
    if (!this.options.getAuthToken() || !isAppActive()) {
      return;
    }

    // Retry from disabled_503 or reconnecting/disconnected on explicit foreground resume
    if (this.status === 'disabled_503') {
      this.retryAttempt = 0;
    }

    if (this.status === 'subscribed') {
      if (this.isTokenExpiringSoon()) {
        void this.renewTokenAndResubscribe(this.sessionEpoch);
      }
      return;
    }

    this.clearReconnectTimer();
    void this.connect(this.sessionEpoch);
  }

  /**
   * Tears down active channel and timers when backgrounded (keeps sessionEpoch unless full reset).
   */
  handleBackground(): void {
    this.sessionEpoch += 1;
    this.teardownConnection('disconnected');
  }

  /**
   * Full teardown for MPIN lock, sign out, or account switch.
   */
  stopAndResetSession(): void {
    this.sessionEpoch += 1;
    this.hasCompletedInitialJoin = false;
    this.hadDropOrError = false;
    this.currentRealtimeToken = null;
    this.currentChannelTopic = null;
    this.tokenExpiresAtMs = 0;
    this.retryAttempt = 0;
    this.teardownConnection('disconnected');
  }

  private setStatus(next: RealtimeConnectionStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.options.onStatusChange?.(next);
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.currentRealtimeToken || !this.currentChannelTopic || !this.tokenExpiresAtMs) {
      return true;
    }
    return Date.now() >= this.tokenExpiresAtMs - TOKEN_RENEWAL_BUFFER_MS;
  }

  private ensureSupabaseClient(): SupabaseClient | null {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      return null;
    }
    if (!this.supabase) {
      this.supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
    return this.supabase;
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearRenewalTimer(): void {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
  }

  private teardownChannel(): void {
    if (this.supabase && this.channel) {
      try {
        void this.supabase.removeChannel(this.channel);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.channel = null;
  }

  private teardownConnection(nextStatus: RealtimeConnectionStatus): void {
    this.isConnectingInFlight = false;
    this.clearReconnectTimer();
    this.clearRenewalTimer();
    this.teardownChannel();
    this.setStatus(nextStatus);
  }

  private async mintFreshTokenIfNeeded(epoch: number): Promise<boolean> {
    if (!this.isTokenExpiringSoon()) {
      return true;
    }

    const authToken = this.options.getAuthToken();
    if (!authToken || epoch !== this.sessionEpoch || !isAppActive()) {
      return false;
    }

    const res = await realtimeApi.mintToken(authToken);
    if (epoch !== this.sessionEpoch || !isAppActive()) {
      return false;
    }

    this.currentRealtimeToken = res.token;
    this.currentChannelTopic = res.channel;
    const parsedExp = Date.parse(res.expiresAt);
    this.tokenExpiresAtMs = Number.isFinite(parsedExp)
      ? parsedExp
      : Date.now() + 14 * 60_000;

    return true;
  }

  private scheduleProactiveRenewal(epoch: number): void {
    this.clearRenewalTimer();
    if (!this.tokenExpiresAtMs || epoch !== this.sessionEpoch) {
      return;
    }

    const delayMs = Math.max(
      MIN_RENEWAL_DELAY_MS,
      this.tokenExpiresAtMs - Date.now() - TOKEN_RENEWAL_BUFFER_MS
    );

    this.renewalTimer = setTimeout(() => {
      if (epoch !== this.sessionEpoch || !isAppActive()) {
        return;
      }
      void this.renewTokenAndResubscribe(epoch);
    }, delayMs);
  }

  private async renewTokenAndResubscribe(epoch: number): Promise<void> {
    if (epoch !== this.sessionEpoch || !isAppActive()) return;
    this.currentRealtimeToken = null;
    this.tokenExpiresAtMs = 0;

    const client = this.ensureSupabaseClient();
    if (!client) {
      this.teardownConnection('disabled_503');
      return;
    }

    try {
      const ok = await this.mintFreshTokenIfNeeded(epoch);
      if (!ok || epoch !== this.sessionEpoch || !this.currentRealtimeToken) {
        return;
      }
      await client.realtime.setAuth(this.currentRealtimeToken);
      this.scheduleProactiveRenewal(epoch);
    } catch (err) {
      this.handleConnectError(err, epoch);
    }
  }

  private scheduleReconnect(epoch: number): void {
    this.clearReconnectTimer();
    if (epoch !== this.sessionEpoch || !isAppActive() || !this.options.getAuthToken()) {
      return;
    }

    const baseDelay =
      BACKOFF_DELAYS_MS[Math.min(this.retryAttempt, BACKOFF_DELAYS_MS.length - 1)];
    const jitter = Math.floor(Math.random() * 500);
    this.retryAttempt += 1;

    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      if (epoch !== this.sessionEpoch || !isAppActive()) {
        return;
      }
      void this.connect(epoch);
    }, baseDelay + jitter);
  }

  private handleConnectError(err: unknown, epoch: number): void {
    if (epoch !== this.sessionEpoch) return;

    if (err instanceof V1ApiError) {
      if (err.statusCode === 401) {
        this.stopAndResetSession();
        void this.options.onUnauthorized();
        return;
      }
      if (err.statusCode === 503) {
        this.teardownConnection('disabled_503');
        return;
      }
    }

    this.hadDropOrError = true;
    this.teardownChannel();
    this.scheduleReconnect(epoch);
  }

  private async connect(epoch: number): Promise<void> {
    if (
      epoch !== this.sessionEpoch ||
      this.isConnectingInFlight ||
      !this.options.getAuthToken() ||
      !isAppActive()
    ) {
      return;
    }

    const client = this.ensureSupabaseClient();
    if (!client) {
      this.teardownConnection('disabled_503');
      return;
    }

    this.isConnectingInFlight = true;
    this.setStatus(this.retryAttempt > 0 ? 'reconnecting' : 'connecting');

    try {
      const ready = await this.mintFreshTokenIfNeeded(epoch);
      if (!ready || epoch !== this.sessionEpoch || !this.currentRealtimeToken || !this.currentChannelTopic) {
        this.isConnectingInFlight = false;
        return;
      }

      this.teardownChannel();
      await client.realtime.setAuth(this.currentRealtimeToken);

      if (epoch !== this.sessionEpoch || !isAppActive()) {
        this.isConnectingInFlight = false;
        return;
      }

      const channel = client
        .channel(this.currentChannelTopic, { config: { private: true } })
        .on('broadcast', { event: 'order_signal' }, (payload) => {
          if (epoch !== this.sessionEpoch) return;
          const signal = (payload as { payload?: unknown })?.payload ?? payload;
          if (isRealtimeSignalPayload(signal)) {
            this.options.onSignal(signal);
          }
        })
        .subscribe((state) => {
          if (epoch !== this.sessionEpoch) return;

          if (state === 'SUBSCRIBED') {
            this.isConnectingInFlight = false;
            this.retryAttempt = 0;
            this.setStatus('subscribed');
            this.scheduleProactiveRenewal(epoch);

            const isRejoin = this.hasCompletedInitialJoin && this.hadDropOrError;
            this.hasCompletedInitialJoin = true;
            this.hadDropOrError = false;
            this.options.onSubscribed({ isRejoin });
            return;
          }

          if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            this.isConnectingInFlight = false;
            this.hadDropOrError = true;
            this.clearRenewalTimer();
            this.teardownChannel();
            if (isAppActive() && this.options.getAuthToken()) {
              this.scheduleReconnect(epoch);
            } else {
              this.setStatus('disconnected');
            }
          }
        });

      this.channel = channel;
    } catch (err) {
      this.isConnectingInFlight = false;
      this.handleConnectError(err, epoch);
    }
  }
}
