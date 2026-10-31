import React from 'react';

export interface StaffManualLookupProps {
  manualInput: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLookup: (code: string) => void;
}

export const StaffManualLookup: React.FC<StaffManualLookupProps> = React.memo(({
  manualInput,
  inputRef,
  onInputChange,
  onLookup,
}) => {
  return (
    <div className="qr-frame-box p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 shadow-md">
      <div>
        <label htmlFor="manual-scan-input" className="text-xs font-bold text-white block">
          Internal Order ID Lookup
        </label>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Enter internal Order ID to locate parcel (e.g. ORD - 408):
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          id="manual-scan-input"
          maxLength={12}
          placeholder="ORD - 408"
          autoComplete="off"
          value={manualInput}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onLookup(manualInput);
            }
          }}
          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#215cd4] focus:border-[#215cd4]"
        />
        <button
          type="button"
          id="manual-scan-btn"
          onClick={() => onLookup(manualInput)}
          className="btn-press px-4 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-bold shrink-0 shadow-md border border-blue-500/40 cursor-pointer"
        >
          Lookup
        </button>
      </div>
    </div>
  );
});

StaffManualLookup.displayName = 'StaffManualLookup';
