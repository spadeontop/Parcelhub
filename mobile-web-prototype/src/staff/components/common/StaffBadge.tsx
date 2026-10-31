import React from 'react';

export interface StaffBadgeProps {
  status: 'active' | 'ready' | 'unpaid' | 'claimed' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'PAYMENT_REQUIRED' | 'CLAIMED' | string;
  variant?: 'card' | 'modal';
  className?: string;
  showDot?: boolean;
}

export const StaffBadge: React.FC<StaffBadgeProps> = React.memo(({
  status,
  variant = 'card',
  className = '',
  showDot = true,
}) => {
  let label = 'Active';
  let badgeClasses = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  let dotClasses = 'bg-blue-400 animate-pulse';

  const normalized = (status || '').toUpperCase();

  if (normalized === 'READY_TO_CLAIM' || normalized === 'READY') {
    label = 'Ready';
    badgeClasses = variant === 'modal'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    dotClasses = 'bg-emerald-400';
  } else if (normalized === 'PAYMENT_REQUIRED' || normalized === 'UNPAID') {
    label = 'Unpaid';
    badgeClasses = variant === 'modal'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    dotClasses = 'bg-amber-400';
  } else if (normalized === 'CLAIMED') {
    label = 'Claimed';
    badgeClasses = 'bg-slate-700/60 text-slate-300 border-slate-600/50';
    dotClasses = 'bg-slate-400';
  } else {
    // Default active / AWAITING_PARCEL
    badgeClasses = variant === 'modal'
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      : 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    dotClasses = 'bg-blue-400 animate-pulse';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>}
      {label}
    </span>
  );
});

StaffBadge.displayName = 'StaffBadge';

