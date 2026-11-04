import React from 'react';

export interface StaffScanFabProps {
  onClick: () => void;
}

export const StaffScanFab: React.FC<StaffScanFabProps> = React.memo(({ onClick }) => {
  return (
    <div id="scan-qr-fab-container" className="terminal-fab-wrapper pointer-events-auto">
      <button
        type="button"
        id="floating-scan-qr-btn"
        aria-label="Scan QR Code"
        onClick={onClick}
        className="terminal-scan-fab btn-press group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs shadow-xl shadow-blue-900/50 border border-blue-400/40 ring-4 ring-blue-500/10 active:scale-95 transition-all select-none cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
        <span className="tracking-wide pr-0.5">Scan QR</span>
      </button>
    </div>
  );
});

StaffScanFab.displayName = 'StaffScanFab';

