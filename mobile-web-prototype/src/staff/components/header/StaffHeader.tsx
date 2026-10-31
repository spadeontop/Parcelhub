import React from 'react';

export interface StaffHeaderProps {
  onExit: () => void;
  title?: string;
  deskLabel?: string;
  operatorLabel?: string;
  children?: React.ReactNode;
}

export const StaffHeader: React.FC<StaffHeaderProps> = React.memo(({
  onExit,
  title = 'Lily’s Hub Staff Terminal',
  deskLabel = 'Desk #01',
  operatorLabel = 'STAFF-0488',
  children,
}) => {
  return (
    <header className="terminal-header px-5 py-3 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1.5 shadow-inner">
            <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">{title}</h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Counter Desk #01 • Operator: {operatorLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          aria-label="Exit to App"
          title="Exit to App"
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          {deskLabel}
        </button>
      </div>

      {children}
    </header>
  );
});

StaffHeader.displayName = 'StaffHeader';

