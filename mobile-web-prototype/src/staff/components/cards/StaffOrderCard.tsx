import React from 'react';
import { Order } from '../../types';
import { StaffBadge } from '../common/StaffBadge';

export interface StaffOrderCardProps {
  order: Order;
  fee: number;
  onOpenDetails: (order: Order) => void;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = React.memo(({
  order,
  fee,
  onOpenDetails,
}) => {
  const isUnpaid = order.status === 'PAYMENT_REQUIRED';
  const displayAmount = isUnpaid ? `Fee: ₱${fee.toLocaleString()}` : `COD: ${order.codAmount}`;

  return (
    <div
      id={`card-${order.id}`}
      data-open-order={order.id}
      onClick={() => onOpenDetails(order)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(order);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View complete details and actions for ${order.id}`}
      className="terminal-card group p-3.5 rounded-2xl bg-slate-800/85 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-150 space-y-2.5 active:scale-[0.99] select-none"
    >
      {/* Top Row: Status Badge, Order ID, and Display Amount */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StaffBadge status={order.status} variant="card" />
          <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
            {order.id}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-white font-mono-numbers">{displayAmount}</span>
        </div>
      </div>

      {/* Middle Row: Product Title & Tracking Number */}
      <div>
        <h3 className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-1 leading-snug">
          {order.product}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[11px] font-mono text-blue-400 font-mono-numbers flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            {order.trackingNumber}
          </span>
          {order.notes ? (
            <span
              className="text-[10px] text-amber-300 font-medium flex items-center gap-1 truncate max-w-[150px]"
              title={`Staff Note: ${order.notes}`}
            >
              <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{order.notes}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom Row: Recipient & Action Prompt Affordance */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-[11px] font-medium text-slate-300">{order.recipient}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
          <span>Details</span>
          <svg
            className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
});

StaffOrderCard.displayName = 'StaffOrderCard';

