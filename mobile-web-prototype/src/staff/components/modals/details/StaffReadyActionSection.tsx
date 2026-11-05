import React from 'react';
import { Order } from '../../../types';
import { StaffSpinner } from '../../common/StaffLoadingIndicator';

export interface StaffReadyActionSectionProps {
  order: Order;
  unlocked: boolean;
  timeFormatted: string;
  onSimulatePrompt: () => void;
  onReleaseOrder: (orderId: string) => boolean | void;
  isReleasing?: boolean;
}

export const StaffReadyActionSection: React.FC<StaffReadyActionSectionProps> = React.memo(({
  order,
  unlocked,
  timeFormatted,
  onSimulatePrompt,
  onReleaseOrder,
  isReleasing = false,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          STAFF ACTION: CUSTOMER CLAIM &amp; RELEASE
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Release parcel when customer initiates pickup at the counter desk.
        </p>
      </div>

      {!unlocked ? (
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2.5 text-slate-300 text-xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-white">Terminal Counter Locked</p>
                <p className="text-[11px] text-slate-400">
                  Awaiting customer to press &ldquo;Initiate Claim&rdquo; in customer mobile app.
                  <span className="sr-only">🔒 Locked (Awaiting Customer Prompt)</span>
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                id="detail-simulate-prompt-btn"
                onClick={onSimulatePrompt}
                className="btn-press flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Simulate Customer Claim Prompt</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled
            aria-label="Release"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700 cursor-not-allowed opacity-60"
          >
            Release Parcel (Locked)
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-300">Customer Present at Counter</span>
              </div>
              <span
                id="detail-claim-timer"
                className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono-numbers"
              >
                Active ({timeFormatted})
                <span className="sr-only">Claim Active</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Customer claim verified. Hand over parcel and change of{' '}
              <strong className="text-emerald-300 font-mono">{order.change || '₱0'}</strong>.
            </p>
          </div>

          <button
            type="button"
            id="detail-release-order-btn"
            aria-label="Release"
            disabled={isReleasing}
            onClick={() => onReleaseOrder(order.id)}
            className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isReleasing ? (
              <>
                <StaffSpinner size="xs" color="white" />
                <span>Releasing Parcel...</span>
              </>
            ) : (
              `Release Parcel & Hand Over Change (${order.change || '₱0'})`
            )}
          </button>
        </div>
      )}
    </div>
  );
});

StaffReadyActionSection.displayName = 'StaffReadyActionSection';
