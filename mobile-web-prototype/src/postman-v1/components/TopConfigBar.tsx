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
    <header className="shrink-0 h-12 border-b border-zinc-200 bg-white px-4 flex items-center justify-between gap-3">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center p-0.5 shrink-0">
          <img
            src="./assets/parcelhub_logo.png"
            alt="ParcelHub"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xs font-semibold tracking-tight text-zinc-900 truncate">
            ParcelHub Postman
          </h1>
          <span className="font-mono text-[10px] text-zinc-500 border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 rounded shrink-0">
            v1 · {endpointCount} routes
          </span>
        </div>
      </div>

      {/* Environment Controls */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {/* Base URL Preset */}
        {addingUrl ? (
          <div className="flex items-center gap-1 border border-zinc-900 rounded px-2 py-1 bg-white">
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
              className="w-40 text-[11px] font-mono text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={commitUrl}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-white cursor-pointer"
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
              className="text-[10px] text-zinc-500 hover:text-zinc-900 px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 border border-zinc-200 rounded px-2 py-1 bg-zinc-50">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Host
            </span>
            <select
              aria-label="Backend Host Preset"
              value={baseUrl}
              onChange={(e) => onChangeBaseUrl(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-zinc-800 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {DEFAULT_BASE_URL_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
              {customUrlPresets.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {isCustomUrlSelected && (
              <button
                type="button"
                aria-label="Remove Custom Host"
                onClick={() => onRemoveCustomUrl(baseUrl)}
                className="text-[11px] text-zinc-400 hover:text-rose-600 px-0.5 cursor-pointer"
              >
                ×
              </button>
            )}
            <button
              type="button"
              aria-label="Add Custom Host"
              title="Add custom host URL"
              onClick={() => setAddingUrl(true)}
              className="w-4 h-4 rounded border border-zinc-300 bg-white hover:border-zinc-900 text-zinc-600 hover:text-zinc-900 text-[11px] leading-none flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        {/* API Prefix Preset */}
        {addingPrefix ? (
          <div className="flex items-center gap-1 border border-zinc-900 rounded px-2 py-1 bg-white">
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
              className="w-24 text-[11px] font-mono text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={commitPrefix}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-white cursor-pointer"
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
              className="text-[10px] text-zinc-500 hover:text-zinc-900 px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 border border-zinc-200 rounded px-2 py-1 bg-zinc-50">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Prefix
            </span>
            <select
              aria-label="API Prefix Preset"
              value={apiPrefix}
              onChange={(e) => onChangeApiPrefix(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-zinc-800 focus:outline-none cursor-pointer"
            >
              {DEFAULT_PREFIX_PRESETS.map((pfx) => (
                <option key={pfx} value={pfx}>
                  {pfx}
                </option>
              ))}
              {customPrefixPresets.map((pfx) => (
                <option key={pfx} value={pfx}>
                  {pfx}
                </option>
              ))}
            </select>
            {isCustomPrefixSelected && (
              <button
                type="button"
                aria-label="Remove Custom Prefix"
                onClick={() => onRemoveCustomPrefix(apiPrefix)}
                className="text-[11px] text-zinc-400 hover:text-rose-600 px-0.5 cursor-pointer"
              >
                ×
              </button>
            )}
            <button
              type="button"
              aria-label="Add Custom Prefix"
              title="Add custom API prefix"
              onClick={() => setAddingPrefix(true)}
              className="w-4 h-4 rounded border border-zinc-300 bg-white hover:border-zinc-900 text-zinc-600 hover:text-zinc-900 text-[11px] leading-none flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        )}

        {/* Active Token Indicators */}
        <div className="hidden md:flex items-center gap-1.5 pl-1 border-l border-zinc-200">
          <span
            title={tokens.customerAuthToken ? `Customer: ${customerEmail || 'active'}` : 'Customer not signed in'}
            className={`font-mono text-[10px] px-2 py-1 rounded border ${
              tokens.customerAuthToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 bg-white text-zinc-400'
            }`}
          >
            C: {tokens.customerAuthToken ? customerEmail || 'active' : 'off'}
          </span>
          <span
            title={tokens.staffAuthToken ? `Staff: ${staffUsername}` : 'Staff not signed in'}
            className={`font-mono text-[10px] px-2 py-1 rounded border ${
              tokens.staffAuthToken
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-white text-zinc-400'
            }`}
          >
            S: {tokens.staffAuthToken ? staffUsername : 'off'}
          </span>
        </div>

        {/* Toggle Session / Target Panel */}
        <button
          type="button"
          onClick={onToggleRightRail}
          aria-pressed={showRightRail}
          className={`px-2.5 py-1 text-[11px] font-medium rounded border cursor-pointer transition-colors ${
            showRightRail
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
          }`}
        >
          Session &amp; Orders
        </button>
      </div>
    </header>
  );
};
