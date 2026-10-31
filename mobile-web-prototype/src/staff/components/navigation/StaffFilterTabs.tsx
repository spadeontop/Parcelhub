import React from 'react';
import { StaffFilter, StaffBadgeCounts } from '../../types';

export interface StaffFilterTabsProps {
  activeFilter: StaffFilter;
  badgeCounts: StaffBadgeCounts;
  onSelectFilter: (filter: StaffFilter) => void;
}

export const StaffFilterTabs: React.FC<StaffFilterTabsProps> = React.memo(({
  activeFilter,
  badgeCounts,
  onSelectFilter,
}) => {
  return (
    <div
      id="bottom-filter-bar"
      className="terminal-filter-area bg-slate-900/95 border-t border-slate-800/80 px-4 py-2 shrink-0 z-20 transition-colors"
    >
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
        <span>FILTER CATEGORIES</span>
        <span className="text-[9px] font-mono text-slate-500">FRAME 111</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <button
          type="button"
          data-filter-tab="active"
          aria-label="Active"
          onClick={() => onSelectFilter('active')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
            activeFilter === 'active'
              ? 'bg-[#215cd4] text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span>Active</span>
          <span id="badge-active" className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {badgeCounts.active}
          </span>
        </button>
        <button
          type="button"
          data-filter-tab="ready_to_claim"
          aria-label="Ready"
          onClick={() => onSelectFilter('ready_to_claim')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
            activeFilter === 'ready_to_claim'
              ? 'bg-[#10b780] text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span>Ready</span>
          <span id="badge-ready" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
            {badgeCounts.ready}
          </span>
        </button>
        <button
          type="button"
          data-filter-tab="inactive"
          aria-label="Unpaid"
          onClick={() => onSelectFilter('inactive')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
            activeFilter === 'inactive'
              ? 'bg-[#c58b12] text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span>Unpaid</span>
          <span id="badge-unpaid" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
            {badgeCounts.unpaid}
          </span>
        </button>
        <button
          type="button"
          data-filter-tab="claimed"
          aria-label="Claimed"
          onClick={() => onSelectFilter('claimed')}
          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
            activeFilter === 'claimed'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span>Claimed</span>
          <span id="badge-claimed" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
            {badgeCounts.claimed}
          </span>
        </button>
      </div>
    </div>
  );
});

StaffFilterTabs.displayName = 'StaffFilterTabs';

