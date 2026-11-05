import React from 'react';
import { Order } from '../../../types';
import { StaffSpinner } from '../../common/StaffLoadingIndicator';

export interface StaffUnpaidActionSectionProps {
  order: Order;
  fee: number;
  cashInput: string;
  onCashInputChange: (val: string) => void;
  onActivateOrder: (orderId: string, amount: number) => boolean | void;
  isLoading?: boolean;
}

export const StaffUnpaidActionSection: React.FC<StaffUnpaidActionSectionProps> = React.memo(({
  order,
  fee,
  cashInput,
  onCashInputChange,
  onActivateOrder,
  isLoading = false,
}) => {
  const numericCash = parseInt(cashInput, 10);
  const isCashValid = !isNaN(numericCash) && numericCash >= fee;
  const codNum = parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) || 0;
  const previewChange = isCashValid ? Math.max(0, numericCash - codNum) : 0;

  const handleActivate = () => {
    if (isCashValid && !isLoading) {
      onActivateOrder(order.id, numericCash);
      onCashInputChange('');
    }
  };

  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            STAFF ACTION: RECEIVE CASH &amp; ACTIVATE
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Collect the stated counter fee from the customer to activate package handling.
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Stated Fee: <strong className="text-amber-400 font-mono">₱{fee.toLocaleString()}</strong>
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
          Min ₱{fee.toLocaleString()}
        </span>
      </div>

      <div className="space-y-2">
        <label htmlFor="cash-received-input" className="text-xs font-semibold text-slate-300 block">
          Amount Received (₱)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400 font-bold">
            ₱
          </span>
          <input
            type="number"
            id="cash-received-input"
            aria-label={`Amount Received for ${order.id}`}
            placeholder={String(fee)}
            value={cashInput}
            disabled={isLoading}
            onChange={(e) => onCashInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isCashValid && !isLoading) {
                e.preventDefault();
                handleActivate();
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-60"
          />
        </div>

        {/* Quick Cash Presets */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Presets:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onCashInputChange(String(fee))}
            className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            Exact ₱{fee}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onCashInputChange(String(fee + 100))}
            className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            ₱{(fee + 100).toLocaleString()}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onCashInputChange('1000')}
            className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            ₱1,000
          </button>
        </div>

        {isCashValid ? (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Customer Change Due:</span>
            <span className="font-mono font-bold text-emerald-400">₱{previewChange.toLocaleString()}</span>
          </div>
        ) : cashInput !== '' ? (
          <p className="text-[11px] text-red-400 font-medium">
            Amount received must be ≥ ₱{fee.toLocaleString()}
          </p>
        ) : null}

        <button
          type="button"
          id="detail-activate-btn"
          aria-label="Receive Cash & Activate"
          disabled={!isCashValid || isLoading}
          onClick={handleActivate}
          className={`btn-press w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1 ${
            isCashValid && !isLoading
              ? 'bg-[#c58b12] hover:bg-amber-600 text-white cursor-pointer shadow-lg shadow-amber-900/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <StaffSpinner size="xs" color="white" />
              <span>Activating Order...</span>
            </>
          ) : (
            'Receive Cash & Activate Order'
          )}
        </button>
      </div>
    </div>
  );
});

StaffUnpaidActionSection.displayName = 'StaffUnpaidActionSection';
