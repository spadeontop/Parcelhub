import React from 'react';
import { Order } from '../../../types';

export interface StaffFinancialLedgerSectionProps {
  order: Order;
}

export const StaffFinancialLedgerSection: React.FC<StaffFinancialLedgerSectionProps> = React.memo(({
  order,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-2.5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        FINANCIAL LEDGER
      </h4>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 block mb-0.5">Retail COD</span>
          <span className="text-xs font-mono font-bold text-white font-mono-numbers">{order.codAmount}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 block mb-0.5">Paid / Deposit</span>
          <span className="text-xs font-mono font-bold text-blue-400 font-mono-numbers">
            {order.paidAmount || 'Pending'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 block mb-0.5">Change Due</span>
          <span className="text-xs font-mono font-bold text-emerald-400 font-mono-numbers">
            {order.change || (order.status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : '₱0')}
          </span>
        </div>
      </div>
    </div>
  );
});

StaffFinancialLedgerSection.displayName = 'StaffFinancialLedgerSection';

