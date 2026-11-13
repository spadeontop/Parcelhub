import React, { useState } from 'react';
import { UiMode } from './types';
import { useStaffV1Session } from './useStaffV1Session';
import { StaffPostmanDebugger } from './components/StaffPostmanDebugger';
import { StaffRealUiLive } from './components/StaffRealUiLive';

export interface StaffV1WorkbenchProps {
  initialMode?: UiMode;
  onBackToStudio?: () => void;
}

const CUSTOM_PRESETS_KEY = 'ph_v1_staff_custom_presets';
const PREFIX_PRESETS_KEY = 'ph_v1_staff_prefix_presets';

function getStoredCustomPresets(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredCustomPresets(presets: string[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage errors
  }
}

function getStoredPrefixPresets(): string[] {
  try {
    const raw = localStorage.getItem(PREFIX_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredPrefixPresets(presets: string[]): void {
  try {
    localStorage.setItem(PREFIX_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage errors
  }
}

function normalizePresetUrl(raw: string): string {
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned;
}

function normalizePrefix(raw: string): string {
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  return cleaned;
}

export const StaffV1Workbench: React.FC<StaffV1WorkbenchProps> = ({
  initialMode = 'debug',
  onBackToStudio,
}) => {
  const session = useStaffV1Session(initialMode);
  const {
    uiMode,
    setUiMode,
    baseUrl,
    setBaseUrl,
    apiPrefix,
    setApiPrefix,
    authToken,
    staffUsername,
    toast,
    showToast,
  } = session;

  const [customPresets, setCustomPresets] = useState<string[]>(getStoredCustomPresets);
  const [isAddingPreset, setIsAddingPreset] = useState<boolean>(false);
  const [newPresetUrl, setNewPresetUrl] = useState<string>('');

  const [customPrefixes, setCustomPrefixes] = useState<string[]>(getStoredPrefixPresets);
  const [isAddingPrefix, setIsAddingPrefix] = useState<boolean>(false);
  const [newPrefixText, setNewPrefixText] = useState<string>('');

  const handleSavePreset = () => {
    const normalized = normalizePresetUrl(newPresetUrl);
    if (!normalized) {
      setIsAddingPreset(false);
      setNewPresetUrl('');
      return;
    }
    const isHardcoded =
      normalized === '' ||
      normalized === 'http://localhost:3000' ||
      normalized === 'https://parcelhub-spade.vercel.app';

    if (!isHardcoded && !customPresets.includes(normalized)) {
      const updated = [...customPresets, normalized];
      setCustomPresets(updated);
      saveStoredCustomPresets(updated);
    }
    setBaseUrl(normalized);
    setIsAddingPreset(false);
    setNewPresetUrl('');
    showToast(`Active backend preset set to ${normalized}`, 'success');
  };

  const handleCancelPreset = () => {
    setIsAddingPreset(false);
    setNewPresetUrl('');
  };

  const handleDeleteCustomPreset = () => {
    const updated = customPresets.filter((p) => p !== baseUrl);
    setCustomPresets(updated);
    saveStoredCustomPresets(updated);
    setBaseUrl('');
    showToast('Custom preset removed; reverted to Vite Proxy', 'success');
  };

  const handleSavePrefix = () => {
    const normalized = normalizePrefix(newPrefixText);
    if (!normalized) {
      setIsAddingPrefix(false);
      setNewPrefixText('');
      return;
    }
    const isHardcoded = normalized === '/api/v1' || normalized === '/api';
    if (!isHardcoded && !customPrefixes.includes(normalized)) {
      const updated = [...customPrefixes, normalized];
      setCustomPrefixes(updated);
      saveStoredPrefixPresets(updated);
    }
    setApiPrefix(normalized);
    setIsAddingPrefix(false);
    setNewPrefixText('');
    showToast(`Active API prefix set to ${normalized}`, 'success');
  };

  const handleCancelPrefix = () => {
    setIsAddingPrefix(false);
    setNewPrefixText('');
  };

  const handleDeleteCustomPrefix = () => {
    const updated = customPrefixes.filter((p) => p !== apiPrefix);
    setCustomPrefixes(updated);
    saveStoredPrefixPresets(updated);
    setApiPrefix('/api/v1');
    showToast('Custom prefix removed; reverted to /api/v1', 'success');
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
      {/* Unified Top Workbench Bar */}
      <header className="shrink-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Route Badge */}
          <div className="flex items-center gap-3">
            {onBackToStudio && (
              <button
                type="button"
                onClick={onBackToStudio}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition"
              >
                ← Studio
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1.5">
              <img
                src="./assets/parcelhub_logo.png"
                alt="ParcelHub Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  ParcelHub Staff v1 Prototype
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {apiPrefix}/staff
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero-Copy-Paste API Postman &amp; Live Staff Counter Terminal
              </p>
            </div>
          </div>

          {/* Center: Debugging UI / Real UI Toggle */}
          <div
            role="group"
            aria-label="UI Mode Toggle"
            className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner"
          >
            <button
              type="button"
              aria-pressed={uiMode === 'debug'}
              onClick={() => setUiMode('debug')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                uiMode === 'debug'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛠</span>
              <span>Debugging UI</span>
            </button>
            <button
              type="button"
              aria-pressed={uiMode === 'real'}
              onClick={() => setUiMode('real')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                uiMode === 'real'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱</span>
              <span>Real UI</span>
            </button>
          </div>

          {/* Right: Target Backend, API Prefix & Session Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isAddingPreset ? (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-blue-500/50 rounded-xl px-2.5 py-1 shadow-inner">
                <span className="text-[10px] font-semibold uppercase text-blue-400">New URL:</span>
                <input
                  type="text"
                  autoFocus
                  value={newPresetUrl}
                  onChange={(e) => setNewPresetUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePreset();
                    if (e.key === 'Escape') handleCancelPreset();
                  }}
                  placeholder="e.g. localhost:3000 or URL"
                  className="bg-transparent text-xs font-mono text-white focus:outline-none w-44 sm:w-52"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  aria-label="Save Preset"
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition shadow"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelPreset}
                  aria-label="Cancel Preset"
                  className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500">Target:</span>
                <select
                  aria-label="Backend Base URL Preset"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer max-w-[220px] truncate"
                >
                  <option value="" className="bg-slate-900">
                    Vite Proxy (/api)
                  </option>
                  <option value="http://localhost:3000" className="bg-slate-900">
                    http://localhost:3000
                  </option>
                  <option value="https://parcelhub-spade.vercel.app" className="bg-slate-900">
                    https://parcelhub-spade.vercel.app
                  </option>
                  {customPresets.map((preset) => (
                    <option key={preset} value={preset} className="bg-slate-900">
                      {preset} (Custom)
                    </option>
                  ))}
                  {baseUrl !== '' &&
                    baseUrl !== 'http://localhost:3000' &&
                    baseUrl !== 'https://parcelhub-spade.vercel.app' &&
                    !customPresets.includes(baseUrl) && (
                      <option value={baseUrl} className="bg-slate-900">
                        {baseUrl}
                      </option>
                    )}
                </select>

                {customPresets.includes(baseUrl) && (
                  <button
                    type="button"
                    title="Remove this custom preset"
                    aria-label="Remove custom preset"
                    onClick={handleDeleteCustomPreset}
                    className="text-slate-400 hover:text-rose-400 transition px-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  title="Add custom backend preset"
                  aria-label="Add custom preset"
                  onClick={() => setIsAddingPreset(true)}
                  className="w-5 h-5 rounded-md bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                >
                  +
                </button>
              </div>
            )}

            {/* API Prefix Control */}
            {isAddingPrefix ? (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-blue-500/50 rounded-xl px-2.5 py-1 shadow-inner">
                <span className="text-[10px] font-semibold uppercase text-blue-400">New Prefix:</span>
                <input
                  type="text"
                  autoFocus
                  value={newPrefixText}
                  onChange={(e) => setNewPrefixText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePrefix();
                    if (e.key === 'Escape') handleCancelPrefix();
                  }}
                  placeholder="e.g. /api/v2 or /custom"
                  className="bg-transparent text-xs font-mono text-white focus:outline-none w-32 sm:w-40"
                />
                <button
                  type="button"
                  onClick={handleSavePrefix}
                  aria-label="Save Prefix"
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition shadow"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelPrefix}
                  aria-label="Cancel Prefix"
                  className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500">Prefix:</span>
                <select
                  aria-label="Staff Backend API Prefix Preset"
                  value={apiPrefix}
                  onChange={(e) => setApiPrefix(e.target.value)}
                  className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="/api/v1" className="bg-slate-900">
                    /api/v1
                  </option>
                  <option value="/api" className="bg-slate-900">
                    /api
                  </option>
                  {customPrefixes.map((pfx) => (
                    <option key={pfx} value={pfx} className="bg-slate-900">
                      {pfx} (Custom)
                    </option>
                  ))}
                  {apiPrefix !== '/api/v1' &&
                    apiPrefix !== '/api' &&
                    !customPrefixes.includes(apiPrefix) && (
                      <option value={apiPrefix} className="bg-slate-900">
                        {apiPrefix}
                      </option>
                    )}
                </select>

                {customPrefixes.includes(apiPrefix) && (
                  <button
                    type="button"
                    title="Remove this custom prefix"
                    aria-label="Remove custom prefix"
                    onClick={handleDeleteCustomPrefix}
                    className="text-slate-400 hover:text-rose-400 transition px-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  title="Add custom API prefix"
                  aria-label="Add custom prefix"
                  onClick={() => setIsAddingPrefix(true)}
                  className="w-5 h-5 rounded-md bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-sm"
                >
                  +
                </button>
              </div>
            )}

            {authToken ? (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {staffUsername}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                Logged Out
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - keep both mounted to preserve forms, tabs, filters, and scroll states */}
      <div className={`flex-1 min-h-0 flex flex-col ${uiMode === 'debug' ? '' : 'hidden'}`}>
        <StaffPostmanDebugger session={session} />
      </div>
      <div className={`flex-1 min-h-0 flex flex-col ${uiMode === 'real' ? '' : 'hidden'}`}>
        <StaffRealUiLive session={session} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border shadow-2xl text-xs font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/95 border-rose-700 text-rose-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default StaffV1Workbench;
