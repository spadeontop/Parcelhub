import React from 'react';

export interface StaffSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerSearchOrScan: () => void;
  onClear: () => void;
}

export const StaffSearchBar: React.FC<StaffSearchBarProps> = React.memo(({
  searchQuery,
  onSearchChange,
  onTriggerSearchOrScan,
  onClear,
}) => {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            id="staff-search-input"
            aria-label="Staff Search Key or Waybill"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onTriggerSearchOrScan();
              }
            }}
            placeholder="Search order ID, customer name, or tr..."
            className="w-full bg-slate-800/90 border border-slate-700/80 text-white rounded-xl pl-8 pr-7 py-2 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#215cd4]"
          />
          {searchQuery && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={onClear}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold p-0.5"
              title="Clear Search"
              aria-label="Clear Search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          id="header-search-btn"
          aria-label="Scan Barcode"
          onClick={onTriggerSearchOrScan}
          className="btn-press px-4 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
          title="Manual Search / Scan Barcode"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Search</span>
        </button>
      </div>
    </div>
  );
});

StaffSearchBar.displayName = 'StaffSearchBar';

