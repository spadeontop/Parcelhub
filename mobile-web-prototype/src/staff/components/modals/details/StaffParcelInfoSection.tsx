import React from 'react';
import { Order } from '../../../types';

export interface StaffParcelInfoSectionProps {
  order: Order;
  isOpen: boolean;
  onCopyTracking: () => void;
}

export const StaffParcelInfoSection: React.FC<StaffParcelInfoSectionProps> = React.memo(({
  order,
  isOpen,
  onCopyTracking,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block mb-1">
          PARCEL INFORMATION
        </span>
        {isOpen && (
          <h2 className="text-base font-bold text-white tracking-wide leading-snug">
            {order.product}
          </h2>
        )}
      </div>

      {/* Tracking Number & Pickup Key */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Tracking Number:</span>
          <button
            type="button"
            id="copy-tracking-btn"
            onClick={onCopyTracking}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 text-[11px] font-mono font-mono-numbers transition-colors cursor-pointer"
            title="Copy Tracking Number"
          >
            <span>{order.trackingNumber}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        <div className="pt-1.5 border-t border-slate-800 text-[11px] flex items-center justify-between">
          <span className="text-slate-400">Pickup Key:</span>
          <span className="font-mono font-semibold text-slate-200 font-mono-numbers bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80">
            {order.alphanumericKey}
          </span>
        </div>
      </div>

      {/* Recipient */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-slate-400">Recipient:</span>
          <strong className="text-slate-200 font-medium">{order.recipient}</strong>
        </div>
      </div>
    </div>
  );
});

StaffParcelInfoSection.displayName = 'StaffParcelInfoSection';

