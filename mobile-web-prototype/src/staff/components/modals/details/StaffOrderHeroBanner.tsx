import React from 'react';
import { Order } from '../../../types';
import { StaffBadge } from '../../common/StaffBadge';

export interface StaffOrderHeroBannerProps {
  order: Order;
  formattedOrderId: string;
  onCopyId: () => void;
}

export const StaffOrderHeroBanner: React.FC<StaffOrderHeroBannerProps> = React.memo(({
  order,
  formattedOrderId,
  onCopyId,
}) => {
  let statusDotClass = 'bg-blue-400 animate-pulse';
  if (order.status === 'READY_TO_CLAIM') {
    statusDotClass = 'bg-emerald-400';
  } else if (order.status === 'PAYMENT_REQUIRED') {
    statusDotClass = 'bg-amber-400';
  } else if (order.status === 'CLAIMED') {
    statusDotClass = 'bg-slate-400';
  }

  return (
    <div
      id="hero-order-id-card"
      className="inner-detail-card p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/40 shadow-lg shadow-blue-950/30 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="hero-card-label text-[10px] font-bold tracking-widest text-blue-400 uppercase font-mono flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusDotClass}`}></span>
          INTERNAL PARCEL ID
        </span>
        <StaffBadge status={order.status} variant="modal" />
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-baseline gap-2">
          <span className="hero-card-id text-2xl font-black font-mono tracking-widest text-white font-mono-numbers drop-shadow-sm">
            {formattedOrderId}
          </span>
        </div>
        <button
          type="button"
          id="copy-order-id-btn"
          onClick={onCopyId}
          className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Copy Internal Order ID"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>Copy ID</span>
        </button>
      </div>
    </div>
  );
});

StaffOrderHeroBanner.displayName = 'StaffOrderHeroBanner';

