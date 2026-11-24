import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PostmanRealtimeConnection } from './realtimeClient';
import type { SendPostmanRequestArgs } from './usePostmanSession';
import type {
  PostmanTokenVault,
  RealtimeMessageEntry,
  RealtimeSession,
  RealtimeSessionActor,
  RealtimeSocketStatus,
  RequestLogEntry,
} from './types';

const RT_STORAGE_KEYS = {
  supabaseUrl: 'ph_postman_v1_supabase_url',
  supabaseKey: 'ph_postman_v1_supabase_key',
  dockHeight: 'ph_postman_v1_rt_dock_height',
} as const;

const MAX_MESSAGES_PER_SESSION = 250;
const DEFAULT_DOCK_HEIGHT = 280;
const MIN_DOCK_HEIGHT = 150;
const MAX_DOCK_HEIGHT = 600;

function readEnvString(...keys: string[]): string {
  const envObj =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, unknown>)
      : undefined;
  for (const key of keys) {
    const val = envObj?.[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  return '';
}

function readStorage(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function makeSystemEntry(
  event: string,
  summary: string,
  kind: 'system' | 'error' = 'system',
  payload?: unknown
): RealtimeMessageEntry {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    direction: 'system',
    kind,
    event,
    summary,
    payload: payload ?? { message: summary },
    rawText: summary,
  };
}

export interface UsePostmanRealtimeParams {
  readonly baseUrl: string;
  readonly apiPrefix: string;
  readonly tokens: PostmanTokenVault;
  readonly sendRequest: (args: SendPostmanRequestArgs) => Promise<RequestLogEntry>;
  readonly showToast: (msg: string, type?: 'success' | 'error') => void;
}

export interface UsePostmanRealtimeReturn {
  readonly supabaseUrl: string;
  readonly setSupabaseUrl: (url: string) => void;
  readonly supabaseKey: string;
  readonly setSupabaseKey: (key: string) => void;
  readonly sessions: readonly RealtimeSession[];
  readonly activeSessionId: string | null;
  readonly activeSession: RealtimeSession | null;
  readonly dockOpen: boolean;
  readonly dockMinimized: boolean;
  readonly dockMaximized: boolean;
  readonly dockHeight: number;
  readonly totalUnread: number;
  readonly connectedCount: number;
  readonly openDock: () => void;
  readonly closeDock: () => void;
  readonly setDockMinimized: (minimized: boolean) => void;
  readonly toggleDockMinimized: () => void;
  readonly toggleDockMaximized: () => void;
  readonly setDockHeight: (height: number) => void;
  readonly selectSession: (sessionId: string) => void;
  readonly createSupabaseSession: (
    actor: 'customer' | 'staff' | 'vault',
    overrides?: { supabaseUrl?: string; supabaseKey?: string }
  ) => Promise<void>;
  readonly createRawSession: (wsUrl: string, label?: string) => void;
  readonly reconnectSession: (sessionId: string) => Promise<void>;
  readonly disconnectSession: (sessionId: string) => void;
  readonly closeSession: (sessionId: string) => void;
  readonly sendFrame: (sessionId: string, rawText: string) => boolean;
  readonly clearSessionMessages: (sessionId: string) => void;
}

export function usePostmanRealtime({
  baseUrl,
  apiPrefix,
  tokens,
  sendRequest,
  showToast,
}: UsePostmanRealtimeParams): UsePostmanRealtimeReturn {
  const [supabaseUrl, setSupabaseUrlState] = useState<string>(() =>
    readStorage(
      RT_STORAGE_KEYS.supabaseUrl,
      readEnvString('VITE_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL')
    )
  );
  const [supabaseKey, setSupabaseKeyState] = useState<string>(() =>
    readStorage(
      RT_STORAGE_KEYS.supabaseKey,
      readEnvString(
        'VITE_SUPABASE_PUBLISHABLE_KEY',
        'VITE_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
      )
    )
  );
  const [sessions, setSessions] = useState<RealtimeSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState<boolean>(false);
  const [dockMinimized, setDockMinimizedState] = useState<boolean>(false);
  const [dockMaximized, setDockMaximized] = useState<boolean>(false);
  const [dockHeight, setDockHeightState] = useState<number>(() => {
    const raw = Number(readStorage(RT_STORAGE_KEYS.dockHeight, String(DEFAULT_DOCK_HEIGHT)));
    if (Number.isFinite(raw) && raw >= MIN_DOCK_HEIGHT && raw <= MAX_DOCK_HEIGHT) {
      return raw;
    }
    return DEFAULT_DOCK_HEIGHT;
  });

  const connectionsRef = useRef<Map<string, PostmanRealtimeConnection>>(new Map());
  const sessionsRef = useRef<RealtimeSession[]>(sessions);
  sessionsRef.current = sessions;
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const dockMinimizedRef = useRef<boolean>(dockMinimized);
  dockMinimizedRef.current = dockMinimized;
  const supabaseUrlRef = useRef<string>(supabaseUrl);
  supabaseUrlRef.current = supabaseUrl;
  const supabaseKeyRef = useRef<string>(supabaseKey);
  supabaseKeyRef.current = supabaseKey;
  const tokensRef = useRef<PostmanTokenVault>(tokens);
  tokensRef.current = tokens;

  useEffect(() => {
    return () => {
      for (const conn of connectionsRef.current.values()) {
        conn.disconnect();
      }
      connectionsRef.current.clear();
    };
  }, []);

  const setSupabaseUrl = useCallback((url: string) => {
    setSupabaseUrlState(url);
    supabaseUrlRef.current = url;
    writeStorage(RT_STORAGE_KEYS.supabaseUrl, url);
  }, []);

  const setSupabaseKey = useCallback((key: string) => {
    setSupabaseKeyState(key);
    supabaseKeyRef.current = key;
    writeStorage(RT_STORAGE_KEYS.supabaseKey, key);
  }, []);

  const setDockHeight = useCallback((height: number) => {
    const clamped = Math.max(MIN_DOCK_HEIGHT, Math.min(MAX_DOCK_HEIGHT, Math.round(height)));
    setDockHeightState(clamped);
    writeStorage(RT_STORAGE_KEYS.dockHeight, String(clamped));
  }, []);

  const updateSession = useCallback(
    (sessionId: string, updater: (prev: RealtimeSession) => RealtimeSession) => {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
    },
    []
  );

  const appendMessage = useCallback(
    (sessionId: string, entry: RealtimeMessageEntry) => {
      const shouldIncrementUnread =
        entry.direction === 'in' &&
        entry.kind !== 'heartbeat' &&
        (dockMinimizedRef.current || activeSessionIdRef.current !== sessionId);

      updateSession(sessionId, (prev) => ({
        ...prev,
        unreadCount: shouldIncrementUnread ? prev.unreadCount + 1 : prev.unreadCount,
        messages: [entry, ...prev.messages].slice(0, MAX_MESSAGES_PER_SESSION),
      }));
    },
    [updateSession]
  );

  const updateSessionStatus = useCallback(
    (sessionId: string, status: RealtimeSocketStatus, error?: string) => {
      updateSession(sessionId, (prev) => ({
        ...prev,
        status,
        lastError: error !== undefined ? error : status === 'subscribed' ? undefined : prev.lastError,
      }));
    },
    [updateSession]
  );

  const attachSupabaseSocket = useCallback(
    (
      sessionId: string,
      params: {
        supabaseUrl: string;
        supabaseKey: string;
        channel: string;
        realtimeToken: string;
        tokenExpiresAt?: string;
      }
    ) => {
      const existing = connectionsRef.current.get(sessionId);
      if (existing) {
        existing.disconnect();
        connectionsRef.current.delete(sessionId);
      }

      const cleanUrl = params.supabaseUrl.trim();
      const cleanKey = params.supabaseKey.trim();
      if (!cleanUrl || !cleanKey) {
        const msg =
          'Enter Supabase URL and Publishable/Anon Key in WS Config above, then click Connect.';
        updateSession(sessionId, (prev) => ({
          ...prev,
          channel: params.channel,
          realtimeToken: params.realtimeToken,
          tokenExpiresAt: params.tokenExpiresAt,
          status: 'disconnected',
          lastError: msg,
        }));
        appendMessage(sessionId, makeSystemEntry('config_required', msg, 'error'));
        return;
      }

      const conn = new PostmanRealtimeConnection({
        mode: 'supabase',
        supabaseUrl: cleanUrl,
        supabaseKey: cleanKey,
        channel: params.channel,
        realtimeToken: params.realtimeToken,
        onStatus: (status, err) => updateSessionStatus(sessionId, status, err),
        onMessage: (entry) => appendMessage(sessionId, entry),
      });

      connectionsRef.current.set(sessionId, conn);

      try {
        const resolvedWsUrl = conn.connect();
        updateSession(sessionId, (prev) => ({
          ...prev,
          channel: params.channel,
          wsUrl: resolvedWsUrl.replace(/apikey=[^&]+/i, 'apikey=***'),
          realtimeToken: params.realtimeToken,
          tokenExpiresAt: params.tokenExpiresAt,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to open WebSocket';
        updateSessionStatus(sessionId, 'error', msg);
        appendMessage(sessionId, makeSystemEntry('connect_error', msg, 'error'));
      }
    },
    [appendMessage, updateSession, updateSessionStatus]
  );

  const mintAndConnect = useCallback(
    async (
      sessionId: string,
      actor: 'customer' | 'staff',
      overrides?: { supabaseUrl?: string; supabaseKey?: string }
    ) => {
      const bearer =
        actor === 'customer'
          ? tokensRef.current.customerAuthToken
          : tokensRef.current.staffAuthToken;

      if (!bearer) {
        const msg = `No ${actor} Bearer token in Auth Vault. Use 1-Click ${
          actor === 'customer' ? 'Customer' : 'Staff'
        } Login first.`;
        updateSessionStatus(sessionId, 'error', msg);
        appendMessage(sessionId, makeSystemEntry('auth_missing', msg, 'error'));
        showToast(msg, 'error');
        return;
      }

      updateSessionStatus(sessionId, 'minting', undefined);
      appendMessage(
        sessionId,
        makeSystemEntry('mint_token', `Minting ${actor} realtime token via POST /realtime/token...`)
      );

      const cleanBase = baseUrl.trim().replace(/\/+$/, '');
      const cleanPrefix = apiPrefix.trim().replace(/\/+$/, '');
      const url = `${cleanBase}${cleanPrefix}/realtime/token`;

      const entry = await sendRequest({
        endpointId: 'realtime_token',
        method: 'POST',
        url,
        authActor: actor,
        includeAuth: true,
        body: {},
      });

      if (!entry.response.ok || !entry.response.body || typeof entry.response.body !== 'object') {
        const errMsg =
          entry.response.body &&
          typeof entry.response.body === 'object' &&
          'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : `Failed to mint realtime token (HTTP ${entry.response.status})`;
        updateSessionStatus(sessionId, 'error', errMsg);
        appendMessage(
          sessionId,
          makeSystemEntry('mint_failed', errMsg, 'error', entry.response.body)
        );
        showToast(errMsg, 'error');
        return;
      }

      const data = entry.response.body as {
        token?: string;
        channel?: string;
        expiresAt?: string;
      };

      if (!data.token || !data.channel) {
        const msg = 'Realtime token endpoint returned an incomplete payload (missing token or channel).';
        updateSessionStatus(sessionId, 'error', msg);
        appendMessage(sessionId, makeSystemEntry('mint_failed', msg, 'error', data));
        return;
      }

      updateSession(sessionId, (prev) => ({
        ...prev,
        label: actor === 'staff' ? 'Staff WS' : `Customer WS`,
        channel: data.channel!,
        realtimeToken: data.token!,
        tokenExpiresAt: data.expiresAt,
      }));

      appendMessage(
        sessionId,
        makeSystemEntry(
          'token_minted',
          `Token minted for channel "${data.channel}"${data.expiresAt ? ` (expires ${data.expiresAt})` : ''}`,
          'system',
          { channel: data.channel, expiresAt: data.expiresAt }
        )
      );

      attachSupabaseSocket(sessionId, {
        supabaseUrl: overrides?.supabaseUrl ?? supabaseUrlRef.current,
        supabaseKey: overrides?.supabaseKey ?? supabaseKeyRef.current,
        channel: data.channel,
        realtimeToken: data.token,
        tokenExpiresAt: data.expiresAt,
      });
    },
    [apiPrefix, appendMessage, attachSupabaseSocket, baseUrl, sendRequest, showToast, updateSession, updateSessionStatus]
  );

  const createSupabaseSession = useCallback(
    async (
      actor: 'customer' | 'staff' | 'vault',
      overrides?: { supabaseUrl?: string; supabaseKey?: string }
    ) => {
      setDockOpen(true);
      setDockMinimizedState(false);

      if (overrides?.supabaseUrl !== undefined) setSupabaseUrl(overrides.supabaseUrl);
      if (overrides?.supabaseKey !== undefined) setSupabaseKey(overrides.supabaseKey);

      const sessionId = `rt-${actor}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const initialLabel =
        actor === 'staff'
          ? 'Staff WS'
          : actor === 'customer'
            ? 'Customer WS'
            : tokensRef.current.realtimeChannel || 'Vault WS';

      const newSession: RealtimeSession = {
        id: sessionId,
        label: initialLabel,
        mode: 'supabase',
        actor: actor as RealtimeSessionActor,
        status: actor === 'vault' ? 'disconnected' : 'minting',
        channel: actor === 'vault' ? tokensRef.current.realtimeChannel : '',
        wsUrl: '',
        realtimeToken: actor === 'vault' ? tokensRef.current.realtimeToken : undefined,
        unreadCount: 0,
        messages: [],
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(sessionId);

      if (actor === 'vault') {
        if (!tokensRef.current.realtimeToken || !tokensRef.current.realtimeChannel) {
          const msg = 'No realtime token captured in Auth Vault yet. Run POST /api/v1/realtime/token first.';
          updateSessionStatus(sessionId, 'error', msg);
          appendMessage(sessionId, makeSystemEntry('vault_empty', msg, 'error'));
          showToast(msg, 'error');
          return;
        }
        attachSupabaseSocket(sessionId, {
          supabaseUrl: overrides?.supabaseUrl ?? supabaseUrlRef.current,
          supabaseKey: overrides?.supabaseKey ?? supabaseKeyRef.current,
          channel: tokensRef.current.realtimeChannel,
          realtimeToken: tokensRef.current.realtimeToken,
        });
        return;
      }

      await mintAndConnect(sessionId, actor, overrides);
    },
    [
      appendMessage,
      attachSupabaseSocket,
      mintAndConnect,
      setSupabaseKey,
      setSupabaseUrl,
      showToast,
      updateSessionStatus,
    ]
  );

  const createRawSession = useCallback(
    (wsUrl: string, label?: string) => {
      const cleaned = wsUrl.trim();
      setDockOpen(true);
      setDockMinimizedState(false);

      const sessionId = `rt-raw-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const newSession: RealtimeSession = {
        id: sessionId,
        label: label?.trim() || 'Raw WS',
        mode: 'raw',
        actor: 'custom',
        status: 'connecting',
        channel: cleaned,
        wsUrl: cleaned,
        unreadCount: 0,
        messages: [],
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(sessionId);

      const conn = new PostmanRealtimeConnection({
        mode: 'raw',
        wsUrl: cleaned,
        onStatus: (status, err) => updateSessionStatus(sessionId, status, err),
        onMessage: (entry) => appendMessage(sessionId, entry),
      });
      connectionsRef.current.set(sessionId, conn);

      try {
        conn.connect();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid WebSocket URL';
        updateSessionStatus(sessionId, 'error', msg);
        appendMessage(sessionId, makeSystemEntry('connect_error', msg, 'error'));
      }
    },
    [appendMessage, updateSessionStatus]
  );

  const reconnectSession = useCallback(
    async (sessionId: string) => {
      const target = sessionsRef.current.find((s) => s.id === sessionId);
      if (!target) return;

      if (target.mode === 'raw') {
        const existing = connectionsRef.current.get(sessionId);
        if (existing) {
          existing.disconnect();
          connectionsRef.current.delete(sessionId);
        }
        const conn = new PostmanRealtimeConnection({
          mode: 'raw',
          wsUrl: target.wsUrl,
          onStatus: (status, err) => updateSessionStatus(sessionId, status, err),
          onMessage: (entry) => appendMessage(sessionId, entry),
        });
        connectionsRef.current.set(sessionId, conn);
        try {
          conn.connect();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unable to reconnect WebSocket';
          updateSessionStatus(sessionId, 'error', msg);
          appendMessage(sessionId, makeSystemEntry('connect_error', msg, 'error'));
        }
        return;
      }

      if (target.actor === 'customer' || target.actor === 'staff') {
        await mintAndConnect(sessionId, target.actor);
        return;
      }

      const token = target.realtimeToken || tokensRef.current.realtimeToken;
      const channel = target.channel || tokensRef.current.realtimeChannel;
      if (!token || !channel) {
        const msg = 'No realtime token available to reconnect.';
        updateSessionStatus(sessionId, 'error', msg);
        appendMessage(sessionId, makeSystemEntry('token_missing', msg, 'error'));
        return;
      }

      attachSupabaseSocket(sessionId, {
        supabaseUrl: supabaseUrlRef.current,
        supabaseKey: supabaseKeyRef.current,
        channel,
        realtimeToken: token,
        tokenExpiresAt: target.tokenExpiresAt,
      });
    },
    [appendMessage, attachSupabaseSocket, mintAndConnect, updateSessionStatus]
  );

  const disconnectSession = useCallback((sessionId: string) => {
    const conn = connectionsRef.current.get(sessionId);
    if (conn) {
      conn.disconnect();
      connectionsRef.current.delete(sessionId);
    } else {
      updateSessionStatus(sessionId, 'disconnected');
    }
  }, [updateSessionStatus]);

  const closeSession = useCallback((sessionId: string) => {
    const conn = connectionsRef.current.get(sessionId);
    if (conn) {
      conn.disconnect();
      connectionsRef.current.delete(sessionId);
    }

    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (activeSessionIdRef.current === sessionId) {
        setActiveSessionId(remaining[remaining.length - 1]?.id ?? null);
      }
      if (remaining.length === 0) {
        setDockOpen(false);
        setDockMinimizedState(false);
        setDockMaximized(false);
      }
      return remaining;
    });
  }, []);

  const sendFrame = useCallback(
    (sessionId: string, rawText: string): boolean => {
      const conn = connectionsRef.current.get(sessionId);
      if (!conn) {
        showToast('Socket is not connected', 'error');
        return false;
      }
      const ok = conn.sendRaw(rawText);
      if (!ok) {
        showToast('Socket is not open yet', 'error');
      }
      return ok;
    },
    [showToast]
  );

  const clearSessionMessages = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (prev) => ({
        ...prev,
        unreadCount: 0,
        messages: [],
      }));
    },
    [updateSession]
  );

  const selectSession = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
      updateSession(sessionId, (prev) =>
        prev.unreadCount > 0 ? { ...prev, unreadCount: 0 } : prev
      );
    },
    [updateSession]
  );

  const setDockMinimized = useCallback(
    (minimized: boolean) => {
      setDockMinimizedState(minimized);
      if (minimized) {
        setDockMaximized(false);
      } else if (activeSessionIdRef.current) {
        updateSession(activeSessionIdRef.current, (prev) =>
          prev.unreadCount > 0 ? { ...prev, unreadCount: 0 } : prev
        );
      }
    },
    [updateSession]
  );

  const toggleDockMinimized = useCallback(() => {
    setDockMinimized(!dockMinimizedRef.current);
  }, [setDockMinimized]);

  const toggleDockMaximized = useCallback(() => {
    setDockMinimizedState(false);
    setDockMaximized((v) => !v);
  }, []);

  const openDock = useCallback(() => {
    setDockOpen(true);
    setDockMinimized(false);
  }, [setDockMinimized]);

  const closeDock = useCallback(() => {
    for (const conn of connectionsRef.current.values()) {
      conn.disconnect();
    }
    connectionsRef.current.clear();
    setSessions([]);
    setActiveSessionId(null);
    setDockOpen(false);
    setDockMinimizedState(false);
    setDockMaximized(false);
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null,
    [sessions, activeSessionId]
  );

  const totalUnread = useMemo(
    () => sessions.reduce((acc, s) => acc + s.unreadCount, 0),
    [sessions]
  );

  const connectedCount = useMemo(
    () => sessions.filter((s) => s.status === 'subscribed').length,
    [sessions]
  );

  return {
    supabaseUrl,
    setSupabaseUrl,
    supabaseKey,
    setSupabaseKey,
    sessions,
    activeSessionId: activeSession?.id ?? null,
    activeSession,
    dockOpen,
    dockMinimized,
    dockMaximized,
    dockHeight,
    totalUnread,
    connectedCount,
    openDock,
    closeDock,
    setDockMinimized,
    toggleDockMinimized,
    toggleDockMaximized,
    setDockHeight,
    selectSession,
    createSupabaseSession,
    createRawSession,
    reconnectSession,
    disconnectSession,
    closeSession,
    sendFrame,
    clearSessionMessages,
  };
}
