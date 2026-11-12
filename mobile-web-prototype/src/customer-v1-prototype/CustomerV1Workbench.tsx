import React from 'react';
import { UiMode } from './types';
import { useCustomerV1Session } from './useCustomerV1Session';
import { CustomerPostmanDebugger } from './components/CustomerPostmanDebugger';
import { CustomerRealUiLive } from './components/CustomerRealUiLive';

export interface CustomerV1WorkbenchProps {
  initialMode?: UiMode;
}

export const CustomerV1Workbench: React.FC<CustomerV1WorkbenchProps> = ({
  initialMode = 'debug',
}) => {
  const session = useCustomerV1Session(initialMode);
  const { uiMode, setUiMode, baseUrl, setBaseUrl, authToken, customerProfile, toast } = session;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
      {/* Unified Top Workbench Bar */}
      <header className="shrink-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Route Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center p-1.5">
              <img
                src="./assets/parcelhub_logo.png"
                alt="ParcelHub Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  ParcelHub Customer v1 Prototype
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  /api/v1/customer
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Zero-Copy-Paste Customer API Postman &amp; Complete Customer UI
              </p>
            </div>
          </div>

          {/* Center: Debugging UI / Real UI Toggle */}
          <div
            role="group"
            aria-label="Customer UI Mode Toggle"
            className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner"
          >
            <button
              type="button"
              aria-pressed={uiMode === 'debug'}
              onClick={() => setUiMode('debug')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                uiMode === 'debug'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
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
              <span>🖥</span>
              <span>Real UI</span>
            </button>
          </div>

          {/* Right: Target Backend & Session Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-semibold uppercase text-slate-500">Target:</span>
              <select
                aria-label="Customer Backend Base URL Preset"
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
                {baseUrl !== '' && baseUrl !== 'http://localhost:3000' && (
                  <option value="__custom__" className="bg-slate-900">
                    {baseUrl}
                  </option>
                )}
              </select>
            </div>

            {authToken ? (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {customerProfile ? customerProfile.email : 'customer'}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                No Token
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex-1 min-h-0 flex flex-col ${uiMode === 'debug' ? '' : 'hidden'}`}>
        <CustomerPostmanDebugger session={session} />
      </div>
      <div className={`flex-1 min-h-0 flex flex-col ${uiMode === 'real' ? '' : 'hidden'}`}>
        <CustomerRealUiLive session={session} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-2xl border shadow-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-100'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};
