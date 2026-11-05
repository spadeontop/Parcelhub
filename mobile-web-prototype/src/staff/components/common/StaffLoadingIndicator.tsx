import React from 'react';

export interface StaffSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const StaffSpinner: React.FC<StaffSpinnerProps> = React.memo(({
  size = 'md',
  className = '',
  color = 'currentColor',
}) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <svg
      className={`animate-spin ${dim} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3.5"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
});

StaffSpinner.displayName = 'StaffSpinner';

export interface StaffSkeletonProps {
  className?: string;
}

export const StaffCardSkeleton: React.FC<StaffSkeletonProps> = React.memo(({ className = '' }) => {
  return (
    <div
      className={`p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 animate-pulse space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 bg-slate-700/80 rounded-full"></div>
          <div className="h-3 w-16 bg-slate-700/60 rounded"></div>
        </div>
        <div className="h-3 w-20 bg-slate-700/60 rounded"></div>
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-3/4 bg-slate-700/80 rounded"></div>
        <div className="h-3 w-1/2 bg-slate-700/50 rounded"></div>
      </div>
      <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-700/50 rounded"></div>
        <div className="h-3 w-16 bg-slate-700/50 rounded"></div>
      </div>
    </div>
  );
});

StaffCardSkeleton.displayName = 'StaffCardSkeleton';

