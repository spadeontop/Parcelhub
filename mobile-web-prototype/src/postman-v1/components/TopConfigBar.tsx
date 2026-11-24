import React, { useState } from 'react';
import {
  DEFAULT_BASE_URL_PRESETS,
  DEFAULT_PREFIX_PRESETS,
} from '../usePostmanSession';
import type { PostmanTokenVault } from '../types';

export interface TopConfigBarProps {
  readonly endpointCount: number;
  readonly baseUrl: string;
  readonly onChangeBaseUrl: (url: string) => void;
  readonly customUrlPresets: readonly string[];
  readonly onAddCustomUrl: (raw: string) => void;
  readonly onRemoveCustomUrl: (url: string) => void;
  readonly apiPrefix: string;
  readonly onChangeApiPrefix: (prefix: string) => void;
  readonly customPrefixPresets: readonly string[];
  readonly onAddCustomPrefix: (raw: string) => void;
  readonly onRemoveCustomPrefix: (prefix: string) => void;
  readonly tokens: PostmanTokenVault;
  readonly customerEmail?: string;
  readonly staffUsername: string;
  readonly showRightRail: boolean;
  readonly onToggleRightRail: () => void;
  readonly theme: 'light' | 'dark';
  readonly onToggleTheme: () => void;
  readonly realtimeDockOpen: boolean;
  readonly realtimeDockMinimized: boolean;
  readonly realtimeConnectedCount: number;
  readonly realtimeUnreadCount: number;
  readonly onToggleRealtimeDock: () => void;
}

export const TopConfigBar: React.FC<TopConfigBarProps> = ({
  endpointCount,
  baseUrl,
  onChangeBaseUrl,
  customUrlPresets,
  onAddCustomUrl,
  onRemoveCustomUrl,
  apiPrefix,
  onChangeApiPrefix,
  customPrefixPresets,
  onAddCustomPrefix,
  onRemoveCustomPrefix,
  tokens,
  customerEmail,
  staffUsername,
  showRightRail,
  onToggleRightRail,
  theme,
  onToggleTheme,
  realtimeDockOpen,
  realtimeDockMinimized,
  realtimeConnectedCount,
  realtimeUnreadCount,
  onToggleRealtimeDock,
}) => {
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [addingPrefix, setAddingPrefix] = useState(false);
  const [prefixDraft, setPrefixDraft] = useState('');

  const commitUrl = () => {
    if (urlDraft.trim()) onAddCustomUrl(urlDraft);
    setUrlDraft('');
    setAddingUrl(false);
  };

  const commitPrefix = () => {
    if (prefixDraft.trim()) onAddCustomPrefix(prefixDraft);
    setPrefixDraft('');
    setAddingPrefix(false);
  };

  const isCustomUrlSelected = customUrlPresets.includes(baseUrl);
  const isCustomPrefixSelected = customPrefixPresets.includes(apiPrefix);

  return (
    <header className="shrink-0 h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 flex items-center justify-between gap-3">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-0.5 shrink-0">
          <img
            src="./assets/parcelhub_logo.png"
            alt="ParcelHub"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            ParcelHub Postman
          </h1>
          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded shrink-0">
            v1 · {endpointCount} routes
          </span>
        </div>
      </div>

      {/* Environment Controls */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {/* Base URL Preset */}
        {addingUrl ? (
          <div className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 rounded px-2 py-1 bg-white dark:bg-zinc-900">
            <input
              type="text"
              autoFocus
              aria-label="New Target URL"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitUrl();
                if (e.key === 'Escape') {
                  setAddingUrl(false);
                  setUrlDraft('');
                }
              }}
              placeholder="http://localhost:3000"
              className="w-40 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 bg-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={commitUrl}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingUrl(false);
                setUrlDraft('');
              }}
              aria-label="Cancel URL"
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 bg-zinc-50 dark:bg-zinc-900">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Host
            </span>
            <select
              aria-label="Backend Host Preset"
              value={baseUrl}
              onChange={(e) => onChangeBaseUrl(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {DEFAULT_BASE_URL_PRESETS.map((p) => (
                <option key={p.label} value={p.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {p.label}
                </option>
              ))}
              {customUrlPresets.map((u) => (
                <option key={u} value={u} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {u}
                </option>
              ))}
            </select>
            {isCustomUrlSelected && (
              <button
                type="button"
                aria-label="Remove Custom Host"
                onClick={() => onRemoveCustomUrl(baseUrl)}
                className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 px-0.5 cursor-pointer"
              >
                ×
              </button>
            )}
            <button
              type="button"
              aria-label="Add Custom Host"
              title="Add custom host URL"
              onClick={() => setAddingUrl(true)}
              className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-zinc-900 dark:hover:border-zinc-300 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-[11px] leading-none flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        {/* API Prefix Preset */}
        {addingPrefix ? (
          <div className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 rounded px-2 py-1 bg-white dark:bg-zinc-900">
            <input
              type="text"
              autoFocus
              aria-label="New API Prefix"
              value={prefixDraft}
              onChange={(e) => setPrefixDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPrefix();
                if (e.key === 'Escape') {
                  setAddingPrefix(false);
                  setPrefixDraft('');
                }
              }}
              placeholder="/api/v1"
              className="w-24 text-[11px] font-mono text-zinc-900 dark:text-zinc-100 bg-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={commitPrefix}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingPrefix(false);
                setPrefixDraft('');
              }}
              aria-label="Cancel Prefix"
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 bg-zinc-50 dark:bg-zinc-900">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Prefix
            </span>
            <select
              aria-label="API Prefix Preset"
              value={apiPrefix}
              onChange={(e) => onChangeApiPrefix(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              {DEFAULT_PREFIX_PRESETS.map((pfx) => (
                <option key={pfx} value={pfx} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {pfx}
                </option>
              ))}
              {customPrefixPresets.map((pfx) => (
                <option key={pfx} value={pfx} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {pfx}
                </option>
              ))}
            </select>
            {isCustomPrefixSelected && (
              <button
                type="button"
                aria-label="Remove Custom Prefix"
                onClick={() => onRemoveCustomPrefix(apiPrefix)}
                className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 px-0.5 cursor-pointer"
              >
                ×
              </button>
            )}
            <button
              type="button"
              aria-label="Add Custom Prefix"
              title="Add custom API prefix"
              onClick={() => setAddingPrefix(true)}
              className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:border-zinc-900 dark:hover:border-zinc-300 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-[11px] leading-none flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        {/* Active Token Indicators */}
        <div className="hidden md:flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
          <span
            title={tokens.customerAuthToken ? `Customer: ${customerEmail || 'active'}` : 'Customer not signed in'}
            className={`font-mono text-[10px] px-2 py-1 rounded border ${
              tokens.customerAuthToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'
            }`}
          >
            C: {tokens.customerAuthToken ? customerEmail || 'active' : 'off'}
          </span>
          <span
            title={tokens.staffAuthToken ? `Staff: ${staffUsername}` : 'Staff not signed in'}
            className={`font-mono text-[10px] px-2 py-1 rounded border ${
              tokens.staffAuthToken
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-400'
                : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'
            }`}
          >
            S: {tokens.staffAuthToken ? staffUsername : 'off'}
          </span>
        </div>

        {/* Toggle Realtime WebSocket Dock */}
        <button
          type="button"
          onClick={onToggleRealtimeDock}
          aria-pressed={realtimeDockOpen && !realtimeDockMinimized}
          title="Open or minimize persistent Realtime WebSocket dock (Ctrl+`)"
          className={`px-2.5 py-1 text-[11px] font-medium rounded border cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${
            realtimeDockOpen && !realtimeDockMinimized
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              realtimeConnectedCount > 0
                ? 'bg-emerald-500 animate-pulse'
                : realtimeDockOpen
                  ? 'bg-amber-500'
                  : 'bg-zinc-400 dark:bg-zinc-600'
            }`}
          />
          <span>Realtime WS</span>
          {realtimeUnreadCount > 0 && (
            <span className="px-1 rounded bg-emerald-600 text-white font-mono text-[9px] font-semibold">
              {realtimeUnreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer transition-colors flex items-center gap-1 shrink-0"
        >
          {theme === 'dark' ? (
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
          <span className="hidden xl:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Toggle Session / Target Panel */}
        <button
          type="button"
          onClick={onToggleRightRail}
          aria-pressed={showRightRail}
          className={`px-2.5 py-1 text-[11px] font-medium rounded border cursor-pointer transition-colors shrink-0 ${
            showRightRail
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >
          Session &amp; Orders
        </button>
      </div>
    </header>
  );
};
