import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffFilter, Order } from '../../types';

export const StaffTerminalScreen: React.FC = () => {
  const {
    orders,
    staffFilter,
    setStaffFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    setRoleMode,
    staffAcceptPayment,
    staffReceiveCourier,
    staffReleaseParcel,
    getCurrentOrder,
    showToast,
  } = useApp();

  // Filter list by tab
  let list: Order[] = [];
  if (staffFilter === 'active') {
    list = orders.filter((o) => o.status === 'AWAITING_PARCEL');
  } else if (staffFilter === 'ready_to_claim') {
    list = orders.filter((o) => o.status === 'READY_TO_CLAIM');
  } else if (staffFilter === 'claimed') {
    list = orders.filter((o) => o.status === 'CLAIMED');
  } else if (staffFilter === 'inactive') {
    list = orders.filter((o) => o.status === 'PAYMENT_REQUIRED');
  }

  // Filter by search query
  const q = staffSearchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.alphanumericKey.toLowerCase().includes(q) ||
        o.trackingNumber.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.recipient.toLowerCase().includes(q) ||
        o.envelopeNumber.toLowerCase().includes(q)
    );
  }

  const simulateBarcodeScan = () => {
    const current = getCurrentOrder();
    const barcode = current.trackingNumber || 'PH2696153366792H';

    // Auto-switch to the relevant tab so the scanned parcel is immediately visible
    if (current.status === 'PAYMENT_REQUIRED') {
      setStaffFilter('inactive');
    } else if (current.status === 'AWAITING_PARCEL') {
      setStaffFilter('active');
    } else if (current.status === 'READY_TO_CLAIM') {
      setStaffFilter('ready_to_claim');
    } else if (current.status === 'CLAIMED') {
      setStaffFilter('claimed');
    }

    setStaffSearchQuery(barcode);
    showToast(`Barcode Scanner matched: ${barcode} (${current.product})`);
  };

  // Find matches across all orders if current tab is empty
  const crossTabMatches = q
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.alphanumericKey.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q) ||
          o.recipient.toLowerCase().includes(q) ||
          o.envelopeNumber.toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="flex flex-col min-h-[780px] bg-slate-900 text-slate-100 p-5 select-none font-sans">
      {/* Staff Terminal Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1">
            <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Lily’s Hub Staff Terminal</h1>
            <p className="text-[10px] text-slate-400 font-mono">Counter Desk #01 • Operator: STAFF-0488</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRoleMode('user')}
          className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Exit to App
        </button>
      </header>

      {/* Real-Time Search Box */}
      <div className="mt-4">
        <label htmlFor="staff-search-input" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Search Key or Waybill Barcode
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="staff-search-input"
            aria-label="Staff Search Key or Waybill"
            value={staffSearchQuery}
            onChange={(e) => setStaffSearchQuery(e.target.value)}
            placeholder="Type key (e.g. PH-402-5544) or tracking ID..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#215cd4]"
          />
          <button
            type="button"
            onClick={simulateBarcodeScan}
            className="px-3 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shrink-0 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Scan Barcode
          </button>
          {staffSearchQuery && (
            <button
              type="button"
              onClick={() => setStaffSearchQuery('')}
              className="px-2 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold shrink-0"
              title="Clear Search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 mt-4 text-center">
        {(
          [
            { id: 'active', label: 'Active', activeBg: 'bg-[#215cd4]' },
            { id: 'ready_to_claim', label: 'Ready', activeBg: 'bg-[#10b780]' },
            { id: 'inactive', label: 'Unpaid', activeBg: 'bg-[#c58b12]' },
            { id: 'claimed', label: 'Claimed', activeBg: 'bg-slate-700' },
          ] as { id: StaffFilter; label: string; activeBg: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStaffFilter(tab.id)}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
              staffFilter === tab.id
                ? `${tab.activeBg} text-white`
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content List */}
      <div id="staff-orders-list" className="mt-4 flex-1 overflow-y-auto space-y-3">
        {list.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p>
              {staffSearchQuery ? `No orders found in this tab matching "${staffSearchQuery}".` : 'No orders in this category.'}
            </p>
            {crossTabMatches.length > 0 && (
              <div className="pt-2">
                <p className="text-slate-300 text-xs font-semibold">
                  Found {crossTabMatches.length} matching order in another status:
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {crossTabMatches.map((m) => {
                    const targetTab: StaffFilter =
                      m.status === 'PAYMENT_REQUIRED'
                        ? 'inactive'
                        : m.status === 'AWAITING_PARCEL'
                        ? 'active'
                        : m.status === 'READY_TO_CLAIM'
                        ? 'ready_to_claim'
                        : 'claimed';
                    const targetLabel =
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
                        onClick={() => setStaffFilter(targetTab)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                      >
                        View {m.id} in {targetLabel} tab →
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          list.map((order) => (
            <div key={order.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400">
                  {order.id} • {order.alphanumericKey}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  Env: {order.envelopeNumber}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{order.product}</h3>
              <p className="text-xs text-slate-400">
                Recipient: {order.recipient} • COD:{' '}
                <span className="text-white font-mono font-bold">{order.codAmount}</span>
              </p>

              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
                {staffFilter === 'inactive' && (
                  <button
                    type="button"
                    onClick={() => staffAcceptPayment(order.id)}
                    className="flex-1 py-2 rounded-xl bg-[#c58b12] hover:bg-amber-600 text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                  >
                    Receive Cash &amp; Activate
                  </button>
                )}

                {staffFilter === 'active' && (
                  <button
                    type="button"
                    onClick={() => staffReceiveCourier(order.id)}
                    className="flex-1 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                  >
                    Log Courier Arrival (1:1 Payout)
                  </button>
                )}

                {staffFilter === 'ready_to_claim' && (
                  <button
                    type="button"
                    onClick={() => staffReleaseParcel(order.id)}
                    className="flex-1 py-2 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                  >
                    Verify Key &amp; Handover
                  </button>
                )}

                {staffFilter === 'claimed' && (
                  <span className="text-xs text-emerald-400 font-mono font-semibold">
                    ✔ Completed with Change {order.change}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payout Rule Banner */}
      <div className="mt-4 p-3 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-400 leading-tight">
        <strong className="text-slate-200">Rider Payout Policy Invariant:</strong> Amount paid to rider must strictly match the exact retail COD price. Any customer deposit excess is strictly change and never used as buffer.
      </div>
    </div>
  );
};
