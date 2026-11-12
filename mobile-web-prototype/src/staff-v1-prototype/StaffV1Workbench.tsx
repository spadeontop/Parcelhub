import React from 'react';
import { UiMode } from './types';
import { useStaffV1Session } from './useStaffV1Session';
import { StaffPostmanDebugger } from './components/StaffPostmanDebugger';
import { StaffRealUiLive } from './components/StaffRealUiLive';

export interface StaffV1WorkbenchProps {
  initialMode?: UiMode;
  onBackToStudio?: () => void;
}

export const StaffV1Workbench: React.FC<StaffV1WorkbenchProps> = ({
  initialMode = 'debug',
  onBackToStudio,
}) => {
  const session = useStaffV1Session(initialMode);
  const { uiMode, setUiMode, baseUrl, setBaseUrl, authToken, staffUsername, toast } = session;

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
                  /api/v1/staff
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

          {/* Right: Target Backend & Session Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-semibold uppercase text-slate-500">Target:</span>
              <select
                aria-label="Backend Base URL Preset"
                value={baseUrl === '' || baseUrl === 'http://localhost:3000' ? baseUrl : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setBaseUrl(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  Vite Proxy (/api)
                </option>
                <option value="http://localhost:3000" className="bg-slate-900">
                  http://localhost:3000
                </option>
              </select>
            </div>

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
