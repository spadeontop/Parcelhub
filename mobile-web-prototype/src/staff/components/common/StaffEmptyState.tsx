import React from 'react';
import { Order, StaffFilter } from '../../types';

export interface StaffEmptyStateProps {
  searchQuery: string;
  crossTabMatches: Order[];
  onSelectFilter: (filter: StaffFilter) => void;
}

export const StaffEmptyState: React.FC<StaffEmptyStateProps> = React.memo(({
  searchQuery,
  crossTabMatches,
  onSelectFilter,
}) => {
  return (
    <div className="py-12 px-4 text-center rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-300">
        {searchQuery ? `No parcels found matching "${searchQuery}"` : 'No parcels in this tab.'}
      </p>
      <p className="text-xs text-slate-500">
        {searchQuery
          ? 'Try searching a different order ID or customer name.'
          : 'Use the Scan QR button or search bar above to look up orders.'}
      </p>

      {crossTabMatches.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/60 text-center">
          <p className="text-xs font-semibold text-slate-300">Found in another category:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-2.5">
            {crossTabMatches.map((m) => {
              const targetFilter: StaffFilter =
                m.status === 'PAYMENT_REQUIRED'
                  ? 'inactive'
                  : m.status === 'AWAITING_PARCEL'
                  ? 'active'
                  : m.status === 'READY_TO_CLAIM'
                  ? 'ready_to_claim'
                  : 'claimed';
              const label =
                m.status === 'PAYMENT_REQUIRED'
                  ? 'Unpaid'
                  : m.status === 'AWAITING_PARCEL'
                  ? 'Active'
                  : m.status === 'READY_TO_CLAIM'
                  ? 'Ready'
                  : 'Claimed';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectFilter(targetFilter)}
                  className="view-crosstab-btn px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
                >
                  View <strong>{m.id}</strong> in {label} tab &rarr;
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

StaffEmptyState.displayName = 'StaffEmptyState';

