import React from 'react';
import { Order } from '../../../types';

export interface StaffClaimedSummarySectionProps {
  order: Order;
}

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = React.memo(({
  order,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/30 shadow-md space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-300">Parcel Handover Completed</h4>
          <p className="text-[11px] text-slate-400">Customer claimed parcel and received change.</p>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>Change Handed Over:</span>
          <strong className="font-mono text-emerald-400 font-mono-numbers">{order.change || '₱0'}</strong>
        </div>
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>Verification Desk:</span>
          <span className="font-mono">Counter Desk #01</span>
        </div>
      </div>
    </div>
  );
});

StaffClaimedSummarySection.displayName = 'StaffClaimedSummarySection';

