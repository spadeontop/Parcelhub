import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OrderStatusBadge } from './MethodBadge';
import type {
  PostmanTokenVault,
  RealtimeMessageEntry,
  RealtimeSession,
  RealtimeSocketStatus,
} from '../types';

export interface RealtimeDockPanelProps {
  readonly sessions: readonly RealtimeSession[];
  readonly activeSession: RealtimeSession | null;
  readonly dockMinimized: boolean;
  readonly dockMaximized: boolean;
  readonly dockHeight: number;
  readonly totalUnread: number;
  readonly connectedCount: number;
  readonly supabaseUrl: string;
  readonly onChangeSupabaseUrl: (url: string) => void;
  readonly supabaseKey: string;
  readonly onChangeSupabaseKey: (key: string) => void;
  readonly tokens: PostmanTokenVault;
  readonly onSelectSession: (sessionId: string) => void;
  readonly onCreateSupabaseSession: (actor: 'customer' | 'staff' | 'vault') => Promise<void>;
  readonly onCreateRawSession: (wsUrl: string, label?: string) => void;
  readonly onReconnectSession: (sessionId: string) => Promise<void>;
  readonly onDisconnectSession: (sessionId: string) => void;
  readonly onCloseSession: (sessionId: string) => void;
  readonly onSendFrame: (sessionId: string, rawText: string) => boolean;
  readonly onClearMessages: (sessionId: string) => void;
  readonly onToggleMinimized: () => void;
  readonly onToggleMaximized: () => void;
  readonly onChangeDockHeight: (height: number) => void;
  readonly onCloseDock: () => void;
  readonly onCopyText: (text: string, label: string) => void;
  readonly onTargetOrder: (payload: {
    id: string;
    ticketCode?: string | null;
  }) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  } catch {
    return iso;
  }
}

const STATUS_DOT_CLASSES: Record<RealtimeSocketStatus, string> = {
  subscribed: 'bg-emerald-500',
  connecting: 'bg-amber-500 animate-pulse',
  joining: 'bg-amber-500 animate-pulse',
  minting: 'bg-blue-500 animate-pulse',
  error: 'bg-rose-500',
  disconnected: 'bg-zinc-400 dark:bg-zinc-600',
};

const STATUS_BADGE_CLASSES: Record<RealtimeSocketStatus, string> = {
  subscribed:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-400',
  connecting:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-300',
  joining:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-300',
  minting:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-400',
  error:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-400',
  disconnected:
    'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
};

const KIND_BADGE_CLASSES: Record<RealtimeMessageEntry['kind'], string> = {
  signal:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/70 dark:text-emerald-300',
  reply:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-400',
  heartbeat:
    'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500',
  message:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/60 dark:text-violet-300',
  error:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-400',
  system:
    'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
};

export const RealtimeDockPanel: React.FC<RealtimeDockPanelProps> = ({
  sessions,
  activeSession,
  dockMinimized,
  dockMaximized,
  dockHeight,
  totalUnread,
  connectedCount,
  supabaseUrl,
  onChangeSupabaseUrl,
  supabaseKey,
  onChangeSupabaseKey,
  tokens,
  onSelectSession,
  onCreateSupabaseSession,
  onCreateRawSession,
  onReconnectSession,
  onDisconnectSession,
  onCloseSession,
  onSendFrame,
  onClearMessages,
  onToggleMinimized,
  onToggleMaximized,
  onChangeDockHeight,
  onCloseDock,
  onCopyText,
  onTargetOrder,
}) => {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showRawCreator, setShowRawCreator] = useState<boolean>(false);
  const [rawUrlDraft, setRawUrlDraft] = useState<string>('ws://localhost:3000');
  const [showHeartbeats, setShowHeartbeats] = useState<boolean>(false);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [frameDraft, setFrameDraft] = useState<string>('');

  const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const missingSupabaseConfig = !supabaseUrl.trim() || !supabaseKey.trim();

  // Auto-open config bar when a Supabase session needs credentials
  useEffect(() => {
    if (
      activeSession &&
      activeSession.mode === 'supabase' &&
      missingSupabaseConfig &&
      !dockMinimized
    ) {
      setShowConfig(true);
    }
  }, [activeSession, missingSupabaseConfig, dockMinimized]);

  // Reset selected message when switching sessions
  useEffect(() => {
    setSelectedMessageId(null);
  }, [activeSession?.id]);

  // Drag-to-resize handler (VS Code bottom panel style)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaY = dragStartRef.current.startY - e.clientY;
      onChangeDockHeight(dragStartRef.current.startHeight + deltaY);
    };
    const onMouseUp = () => {
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onChangeDockHeight]);

  const visibleMessages = useMemo(() => {
    if (!activeSession) return [];
    const q = eventFilter.trim().toLowerCase();
    return activeSession.messages.filter((msg) => {
      if (!showHeartbeats && msg.kind === 'heartbeat') return false;
      if (!q) return true;
      return (
        msg.event.toLowerCase().includes(q) ||
        msg.summary.toLowerCase().includes(q) ||
        msg.rawText.toLowerCase().includes(q) ||
        (msg.topic?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [activeSession, eventFilter, showHeartbeats]);

  const selectedMessage = useMemo(() => {
    if (visibleMessages.length === 0) return null;
    if (selectedMessageId) {
      const found = visibleMessages.find((m) => m.id === selectedMessageId);
      if (found) return found;
    }
    return visibleMessages[0];
  }, [visibleMessages, selectedMessageId]);

  const formattedSelectedPayload = useMemo(() => {
    if (!selectedMessage) return '';
    return typeof selectedMessage.payload === 'string'
      ? selectedMessage.payload
      : JSON.stringify(selectedMessage.payload, null, 2);
  }, [selectedMessage]);

  const latestSignalPreview = useMemo(() => {
    for (const s of sessions) {
      const firstNonHb = s.messages.find((m) => m.kind === 'signal' || m.direction === 'in');
      if (firstNonHb) {
        return { sessionLabel: s.channel || s.label, entry: firstNonHb };
      }
    }
    return null;
  }, [sessions]);

  const handleSubmitRawWs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawUrlDraft.trim()) return;
    onCreateRawSession(rawUrlDraft.trim());
    setShowRawCreator(false);
  };

  const handleSendFrameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !frameDraft.trim()) return;
    if (onSendFrame(activeSession.id, frameDraft)) {
      setFrameDraft('');
    }
  };

  // Minimized VS Code-style status strip (keeps all WebSockets alive!)
  if (dockMinimized) {
    return (
      <section
        aria-label="Realtime WebSocket Dock (Minimized)"
        className="shrink-0 h-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 flex items-center justify-between gap-3 select-none"
      >
        <button
          type="button"
          onClick={onToggleMinimized}
          aria-label="Restore Realtime Dock"
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connectedCount > 0
                ? 'bg-emerald-500 animate-pulse'
                : sessions.some((s) => s.status === 'error')
                  ? 'bg-rose-500'
                  : 'bg-zinc-400 dark:bg-zinc-600'
            }`}
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white shrink-0">
            Realtime WS
          </span>

          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {sessions.length === 0 ? (
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                No active channels
              </span>
            ) : (
              sessions.map((s) => (
                <span
                  key={s.id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] shrink-0 ${STATUS_BADGE_CLASSES[s.status]}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[s.status]}`} />
                  <span className="max-w-[140px] truncate">{s.channel || s.label}</span>
                </span>
              ))
            )}

            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-semibold shrink-0">
                {totalUnread} new
              </span>
            )}

            {latestSignalPreview && (
              <span className="hidden md:inline font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                · {latestSignalPreview.entry.summary}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden sm:inline font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mr-1">
            Ctrl+`
          </span>
          <button
            type="button"
            onClick={onToggleMinimized}
            aria-label="Expand Realtime Dock"
            title="Restore Realtime Dock (Ctrl+`)"
            className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={onCloseDock}
            aria-label="Close Realtime Dock"
            title="Disconnect all and close dock"
            className="px-1.5 py-0.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
          >
            ×
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Realtime WebSocket Dock"
      style={dockMaximized ? { height: '65vh' } : { height: `${dockHeight}px` }}
      className="shrink-0 border-t border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 flex flex-col min-h-[150px] relative"
    >
      {/* Draggable Top Resize Handle */}
      {!dockMaximized && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize Realtime Dock"
          onMouseDown={(e) => {
            e.preventDefault();
            dragStartRef.current = { startY: e.clientY, startHeight: dockHeight };
          }}
          className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-10 hover:bg-zinc-400/30 dark:hover:bg-zinc-500/30 transition-colors"
        />
      )}

      {/* Dock Title + Session Tabs Bar (VS Code Integrated Terminal Style) */}
      <div className="shrink-0 h-9 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                connectedCount > 0
                  ? 'bg-emerald-500'
                  : sessions.some((s) => s.status === 'error')
                    ? 'bg-rose-500'
                    : 'bg-zinc-400 dark:bg-zinc-600'
              }`}
            />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
              Realtime WS
            </span>
          </div>

          {/* Live Session Tabs */}
          {sessions.map((session) => {
            const active = activeSession?.id === session.id;
            return (
              <div
                key={session.id}
                className={`inline-flex items-center rounded border text-[11px] font-mono shrink-0 transition-colors ${
                  active
                    ? 'border-zinc-900 bg-white text-zinc-900 dark:border-zinc-200 dark:bg-zinc-950 dark:text-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession(session.id)}
                  className="px-2 py-0.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[session.status]}`} />
                  <span className="max-w-[150px] truncate">{session.channel || session.label}</span>
                  {session.unreadCount > 0 && (
                    <span className="px-1 rounded bg-emerald-600 text-white text-[9px] font-semibold">
                      {session.unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Close ${session.label} tab`}
                  onClick={() => onCloseSession(session.id)}
                  className="pr-1.5 pl-0.5 py-0.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Quick Channel Creators */}
          <div className="flex items-center gap-1 pl-1 shrink-0">
            <button
              type="button"
              onClick={() => void onCreateSupabaseSession('customer')}
              title="Mint customer realtime token and connect to customer:<id>"
              className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 cursor-pointer"
            >
              + Customer WS
            </button>
            <button
              type="button"
              onClick={() => void onCreateSupabaseSession('staff')}
              title="Mint staff realtime token and connect to staff:orders"
              className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 cursor-pointer"
            >
              + Staff WS
            </button>
            <button
              type="button"
              onClick={() => setShowRawCreator((v) => !v)}
              title="Open raw ws:// or wss:// WebSocket connection"
              className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                showRawCreator
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300'
              }`}
            >
              + Raw WS
            </button>
          </div>
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfig((v) => !v)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer transition-colors ${
              missingSupabaseConfig
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : showConfig
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
            }`}
          >
            {missingSupabaseConfig ? 'WS Config (!)' : 'WS Config'}
          </button>

          <button
            type="button"
            onClick={onToggleMaximized}
            aria-label={dockMaximized ? 'Restore Dock Height' : 'Maximize Realtime Dock'}
            title={dockMaximized ? 'Restore panel height' : 'Maximize panel'}
            className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            {dockMaximized ? 'Restore' : 'Max'}
          </button>

          <button
            type="button"
            onClick={onToggleMinimized}
            aria-label="Minimize Realtime Dock"
            title="Minimize to status bar (keeps sockets alive · Ctrl+`)"
            className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 cursor-pointer"
          >
            Minimize
          </button>

          <button
            type="button"
            onClick={onCloseDock}
            aria-label="Close Realtime Dock"
            title="Disconnect all sockets and close dock"
            className="px-1.5 py-0.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Collapsible Supabase WS Config Bar */}
      {showConfig && (
        <div className="shrink-0 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
            Supabase Realtime:
          </span>
          <input
            type="text"
            aria-label="Supabase Project URL"
            value={supabaseUrl}
            onChange={(e) => onChangeSupabaseUrl(e.target.value)}
            placeholder="https://<project-ref>.supabase.co"
            className="flex-1 min-w-[200px] px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
          />
          <input
            type="password"
            aria-label="Supabase Publishable or Anon Key"
            value={supabaseKey}
            onChange={(e) => onChangeSupabaseKey(e.target.value)}
            placeholder="sb_publishable_... or anon key"
            className="flex-1 min-w-[200px] px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
          />
          {activeSession && activeSession.mode === 'supabase' && (
            <button
              type="button"
              onClick={() => void onReconnectSession(activeSession.id)}
              className="px-2.5 py-1 text-[10px] font-mono font-medium rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer shrink-0"
            >
              Connect Now
            </button>
          )}
        </div>
      )}

      {/* Optional Inline Raw WebSocket Creator */}
      {showRawCreator && (
        <form
          onSubmit={handleSubmitRawWs}
          className="shrink-0 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
            Raw WS URL:
          </span>
          <input
            type="text"
            autoFocus
            aria-label="Raw WebSocket URL"
            value={rawUrlDraft}
            onChange={(e) => setRawUrlDraft(e.target.value)}
            placeholder="wss://example.com/socket"
            className="flex-1 px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-[10px] font-mono font-medium rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer"
          >
            Connect
          </button>
          <button
            type="button"
            onClick={() => setShowRawCreator(false)}
            className="px-1.5 py-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Body: Empty State OR Active Session Split Inspector */}
      {!activeSession ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 text-center gap-2.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Persistent Realtime WebSocket Monitor
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-lg">
              Listen to live Supabase Realtime <span className="font-mono">order_signal</span> events while manually running Staff or Customer HTTP requests above. Minimize anytime without dropping the socket.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void onCreateSupabaseSession('customer')}
              className="px-3 py-1.5 text-[11px] font-medium rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
            >
              Connect Customer Channel
            </button>
            <button
              type="button"
              onClick={() => void onCreateSupabaseSession('staff')}
              className="px-3 py-1.5 text-[11px] font-medium rounded border border-zinc-900 dark:border-zinc-200 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-950 cursor-pointer"
            >
              Connect Staff Channel (staff:orders)
            </button>
            {tokens.realtimeToken && (
              <button
                type="button"
                onClick={() => void onCreateSupabaseSession('vault')}
                className="px-3 py-1.5 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer"
              >
                Use Vault Token ({tokens.realtimeChannel || 'channel'})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Active Session Control Bar */}
          <div className="shrink-0 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border font-mono text-[10px] font-semibold uppercase ${STATUS_BADGE_CLASSES[activeSession.status]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASSES[activeSession.status]}`} />
                {activeSession.status}
              </span>
              <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                {activeSession.channel || activeSession.wsUrl || 'Pending channel'}
              </span>
              {activeSession.lastError && (
                <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[320px]">
                  · {activeSession.lastError}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="search"
                aria-label="Filter realtime events"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                placeholder="Filter events..."
                className="w-32 sm:w-40 px-2 py-0.5 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
              <label className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={showHeartbeats}
                  onChange={(e) => setShowHeartbeats(e.target.checked)}
                />
                <span>HB</span>
              </label>

              {activeSession.status === 'subscribed' ||
              activeSession.status === 'connecting' ||
              activeSession.status === 'joining' ? (
                <button
                  type="button"
                  onClick={() => onDisconnectSession(activeSession.id)}
                  className="px-2 py-0.5 text-[10px] font-mono rounded border border-rose-200 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 hover:border-rose-400 cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onReconnectSession(activeSession.id)}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
                >
                  Reconnect
                </button>
              )}

              <button
                type="button"
                onClick={() => onClearMessages(activeSession.id)}
                className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Split Event Stream + JSON Inspector */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Event Stream */}
            <div className="md:col-span-7 min-h-0 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
              {visibleMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                  Listening for live WebSocket events... Run a Staff or Customer mutation above to observe broadcasts.
                </div>
              ) : (
                visibleMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const dirGlyph = msg.direction === 'in' ? '↓' : msg.direction === 'out' ? '↑' : '•';
                  const dirColor =
                    msg.direction === 'in'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : msg.direction === 'out'
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-zinc-400 dark:text-zinc-500';
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessageId(msg.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedMessageId(msg.id);
                        }
                      }}
                      className={`px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800/90'
                          : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                          {formatTime(msg.timestamp)}
                        </span>
                        <span className={`font-mono text-xs font-bold shrink-0 ${dirColor}`}>
                          {dirGlyph}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded border font-mono text-[9px] uppercase font-semibold shrink-0 ${KIND_BADGE_CLASSES[msg.kind]}`}
                        >
                          {msg.kind === 'signal' ? msg.event : msg.kind}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                          {msg.summary}
                        </span>
                      </div>

                      {msg.signal && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <OrderStatusBadge status={msg.signal.status} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTargetOrder({
                                id: msg.signal!.orderId,
                                ticketCode: msg.signal!.ticketCode ?? null,
                              });
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-200 cursor-pointer"
                          >
                            Target
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Frame JSON Inspector + Raw Sender */}
            <div className="md:col-span-5 min-h-0 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden">
              <div className="shrink-0 px-3 py-1 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                  {selectedMessage ? `Payload · ${selectedMessage.event}` : 'Payload Inspector'}
                </span>
                {selectedMessage && (
                  <button
                    type="button"
                    onClick={() => onCopyText(formattedSelectedPayload, 'WebSocket frame JSON')}
                    className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                )}
              </div>

              <pre className="flex-1 min-h-0 overflow-auto p-2.5 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words leading-relaxed">
                {selectedMessage
                  ? formattedSelectedPayload
                  : 'Select an event row on the left to inspect the raw WebSocket frame.'}
              </pre>

              {/* Inline Raw Frame Sender */}
              <form
                onSubmit={handleSendFrameSubmit}
                className="shrink-0 p-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  aria-label="Send WebSocket Frame"
                  disabled={activeSession.status !== 'subscribed'}
                  value={frameDraft}
                  onChange={(e) => setFrameDraft(e.target.value)}
                  placeholder={
                    activeSession.status === 'subscribed'
                      ? 'Send raw JSON frame...'
                      : 'Connect socket to send frames'
                  }
                  className="flex-1 px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:opacity-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
                <button
                  type="submit"
                  disabled={activeSession.status !== 'subscribed' || !frameDraft.trim()}
                  className="px-2.5 py-1 text-[10px] font-mono font-medium rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
