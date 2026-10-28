import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScenarioId } from '../../types';

export const StudioControlBar: React.FC = () => {
  const {
    activeScreen,
    roleMode,
    hasOrders,
    hubOpen,
    viewMode,
    claimConfirmed,
    getCurrentOrder,
    applyScenario,
    setRoleMode,
    setHubOpen,
    setViewMode,
    simulateStaffFlow,
  } = useApp();

  // Compute active scenario dropdown value
  const getSelectedScenario = (): ScenarioId => {
    if (activeScreen === 'staff_ui' || roleMode === 'staff') {
      return 'figma-staff';
    }
    if (activeScreen === 'login') return 'figma-login';
    if (activeScreen === 'register') return 'figma-register';
    if (activeScreen === 'mpin_login') return 'figma-mpin-login';
    if (activeScreen === 'mpin_create') return 'figma-mpin-create';
    if (activeScreen === 'home') {
      return hasOrders ? 'figma-2' : 'figma-1';
    }
    if (activeScreen === 'create_order') {
      return 'figma-3';
    }
    if (activeScreen === 'confirm_order') {
      return 'figma-4';
    }
    if (activeScreen === 'payment_verification') {
      return 'figma-5';
    }
    if (activeScreen === 'qr_screen') {
      return 'figma-6';
    }
    if (activeScreen === 'order_details') {
      const cur = getCurrentOrder();
      if (cur.status === 'PAYMENT_REQUIRED') return 'figma-7';
      if (cur.status === 'AWAITING_PARCEL') return 'figma-8';
      if (cur.status === 'READY_TO_CLAIM') {
        if (!hubOpen) return 'figma-11';
        return claimConfirmed ? 'figma-10' : 'figma-9';
      }
      if (cur.status === 'CLAIMED') return 'figma-12';
    }
    return 'figma-2';
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center p-1">
            <img src="./assets/parcelhub_logo.png" alt="ParcelHub Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">ParcelHub v3</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#215cd4]/20 text-blue-400 border border-[#215cd4]/30">
                React + Vite
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modular Component Architecture • React 18 (TSX) + Tailwind v4
            </p>
          </div>
        </div>

        {/* Jump to Figma Screen Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="screen-select" className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Scenario:
          </label>
          <select
            id="screen-select"
            aria-label="Select Figma Screen Scenario"
            value={getSelectedScenario()}
            onChange={(e) => applyScenario(e.target.value as ScenarioId)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#215cd4] focus:outline-none cursor-pointer"
          >
            <option value="figma-1">1. Home (Zero orders)</option>
            <option value="figma-2">2. Home (With orders)</option>
            <option value="figma-3">3. Create Order (Receipt upload)</option>
            <option value="figma-4">4. Confirm Order Details</option>
            <option value="figma-5">5. Payment Verification (Awaiting Payment)</option>
            <option value="figma-6">6. Counter Staff QR Scan</option>
            <option value="figma-7">7. Tracking Stage 1: Payment Required (Gold)</option>
            <option value="figma-8">8. Tracking Stage 2: Awaiting Parcel (Blue)</option>
            <option value="figma-9">9. Tracking Stage 3: Ready to Claim (Green)</option>
            <option value="figma-10">10. Claim Request Confirmation Checkbox</option>
            <option value="figma-11">11. If Hub Closed (Disabled state)</option>
            <option value="figma-12">12. Tracking Stage 4: Claimed</option>
            <option value="figma-staff">Staff UI: Counter Ops (Figma Flow)</option>
            <optgroup label="Authentication Flows">
              <option value="figma-login">Auth: Login Interface</option>
              <option value="figma-register">Auth: Register Interface</option>
              <option value="figma-mpin-login">Auth: MPIN Login</option>
              <option value="figma-mpin-create">Auth: MPIN Create (Confirmation)</option>
            </optgroup>
          </select>
        </div>

        {/* Role Mode & Quick Toggles */}
        <div className="flex items-center gap-3">
          {/* Customer / Staff Role Selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setRoleMode('user')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
                roleMode === 'user'
                  ? 'bg-[#215cd4] text-white hover:bg-[#194cb5]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Customer App
            </button>
            <button
              type="button"
              onClick={() => setRoleMode('staff')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
                roleMode === 'staff'
                  ? 'bg-[#215cd4] text-white hover:bg-[#194cb5]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Staff Counter
            </button>
          </div>

          {/* Hub Open / Closed Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <label htmlFor="hub-status-toggle" className="text-xs font-medium text-slate-300 cursor-pointer">
              Hub Open:
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="hub-status-toggle"
                aria-label="Toggle Hub Open or Closed status"
                checked={hubOpen}
                onChange={(e) => setHubOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#10b780]"></div>
            </label>
          </div>

          {/* View Mode Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'device' ? 'fullscreen' : 'device')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            {viewMode === 'device' ? 'Fullscreen Mode' : 'Device Frame Mode'}
          </button>

          {/* Simulate Lifecycle Advance (Ported from v2 simulateStaffFlow) */}
          <button
            type="button"
            onClick={simulateStaffFlow}
            title="Advance status of current order (simulate cash deposit / courier arrival / MPIN)"
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            ⚡ Step Flow
          </button>
        </div>
      </div>
    </header>
  );
};
