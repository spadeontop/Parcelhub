import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffFilter, Order } from '../../types';
import { StaffOrderDetailsModal } from './staff/StaffOrderDetailsModal';
import { StaffQrScannerModal } from './staff/StaffQrScannerModal';

export const StaffTerminalScreen: React.FC = () => {
  const {
    orders,
    staffFilter,
    setStaffFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    setRoleMode,
    staffActivateOrder,
    staffPayCourier,
    staffAttachPhoto,
    staffReleaseOrder,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    getOrderStatedFee,
    getCurrentOrder,
    selectedOrderId,
    showToast,
  } = useApp();

  const [selectedModalOrder, setSelectedModalOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Compute badge counts for tabs
  const badgeCounts = {
    active: orders.filter((o) => o.status === 'AWAITING_PARCEL').length,
    ready: orders.filter((o) => o.status === 'READY_TO_CLAIM').length,
    unpaid: orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length,
    claimed: orders.filter((o) => o.status === 'CLAIMED').length,
  };

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
  const cleanQ = q.replace(/[^a-z0-9]/g, '');
  if (q) {
    list = list.filter((o) => {
      const id = o.id.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const prod = o.product.toLowerCase();
      const rec = o.recipient.toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      return (
        id.includes(q) ||
        key.includes(q) ||
        cleanKey.includes(cleanQ) ||
        track.includes(q) ||
        prod.includes(q) ||
        rec.includes(q) ||
        notes.includes(q)
      );
    });
  }

  // Cross-tab matches if current list is empty
  const crossTabMatches = q
    ? orders.filter((o) => {
        const id = o.id.toLowerCase();
        const key = o.alphanumericKey.toLowerCase();
        const cleanKey = key.replace(/[^a-z0-9]/g, '');
        const track = o.trackingNumber.toLowerCase();
        const prod = o.product.toLowerCase();
        const rec = o.recipient.toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        return (
          id.includes(q) ||
          key.includes(q) ||
          cleanKey.includes(cleanQ) ||
          track.includes(q) ||
          prod.includes(q) ||
          rec.includes(q) ||
          notes.includes(q)
        );
      })
    : [];

  const handleOpenDetails = (order: Order) => {
    setSelectedModalOrder(order);
    setIsDetailsOpen(true);
  };

  const handleSearchOrBarcodeScan = () => {
    const query = staffSearchQuery.trim();
    if (!query) {
      // Simulate Barcode Scan for current active order
      const current = getCurrentOrder();
      const barcode = current.trackingNumber || 'PH2696153366792H';

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
      setSelectedModalOrder(current);
      showToast(`Barcode Scanner matched: ${barcode} (${current.product})`);
      return;
    }

    // Lookup matching order across all orders
    const cleanQuery = query.toLowerCase();
    const cleanAlnum = cleanQuery.replace(/[^a-z0-9]/g, '');

    const matched = orders.find((o) => {
      const id = o.id.toLowerCase();
      const cleanId = id.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');

      return (
        cleanId === cleanAlnum ||
        id === cleanQuery ||
        (cleanAlnum.length >= 3 && cleanId.endsWith(cleanAlnum)) ||
        track === cleanQuery ||
        key === cleanQuery ||
        cleanKey === cleanAlnum ||
        track.includes(cleanQuery) ||
        cleanQuery.includes(track)
      );
    });

    if (matched) {
      const targetFilter: StaffFilter =
        matched.status === 'PAYMENT_REQUIRED'
          ? 'inactive'
          : matched.status === 'AWAITING_PARCEL'
          ? 'active'
          : matched.status === 'READY_TO_CLAIM'
          ? 'ready_to_claim'
          : 'claimed';

      setStaffFilter(targetFilter);
      handleOpenDetails(matched);
      showToast(`Found match: ${matched.id} (${matched.product})`);
    } else {
      showToast(`Showing search results for "${query}".`);
    }
  };

  const handleQrMatched = (order: Order) => {
    const targetFilter: StaffFilter =
      order.status === 'PAYMENT_REQUIRED'
        ? 'inactive'
        : order.status === 'AWAITING_PARCEL'
        ? 'active'
        : order.status === 'READY_TO_CLAIM'
        ? 'ready_to_claim'
        : 'claimed';

    setStaffFilter(targetFilter);
    setStaffSearchQuery(order.id);
    handleOpenDetails(order);
  };

  const [, setTick] = useState<number>(0);

  const handleUpdateNotes = (orderId: string, notes: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      ord.notes = notes;
      setTick((t) => t + 1);
    }
  };

  // Determine which order to populate into the modal
  const currentOrderInTab = list.find((o) => o.id === selectedOrderId);
  const activeModalOrder: Order =
    (selectedModalOrder && list.some((o) => o.id === selectedModalOrder.id) ? selectedModalOrder : null) ||
    currentOrderInTab ||
    list[0] ||
    getCurrentOrder() ||
    orders[0];

  return (
    <div className="flex flex-col min-h-[780px] bg-slate-900 text-slate-100 relative select-none font-sans overflow-hidden">
      {/* Staff Terminal Header (Frame 109 from Figma Spec) */}
      <header className="terminal-header px-5 py-3 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1.5 shadow-inner">
              <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">Lily’s Hub Staff Terminal</h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Counter Desk #01 • Operator: STAFF-0488</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRoleMode('user')}
            aria-label="Exit to App"
            title="Exit to App"
            className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Desk #01
          </button>
        </div>

        {/* Real-Time Search & Manual Search Trigger */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                id="staff-search-input"
                aria-label="Staff Search Key or Waybill"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchOrBarcodeScan();
                  }
                }}
                placeholder="Search order ID, customer name, or tr..."
                className="w-full bg-slate-800/90 border border-slate-700/80 text-white rounded-xl pl-8 pr-7 py-2 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#215cd4]"
              />
              {staffSearchQuery && (
                <button
                  type="button"
                  id="clear-search-btn"
                  onClick={() => setStaffSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold p-0.5"
                  title="Clear Search"
                  aria-label="Clear Search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              id="header-search-btn"
              aria-label="Scan Barcode"
              onClick={handleSearchOrBarcodeScan}
              className="btn-press px-4 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
              title="Manual Search / Scan Barcode"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cards Area (Frame 114 from Figma Spec - Showcase Mode) */}
      <section className="terminal-cards-area flex-1 overflow-y-auto p-4 space-y-3 relative min-h-[380px]">
        <div id="staff-orders-list" className="space-y-3 pb-28">
          {list.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {staffSearchQuery ? `No parcels found matching "${staffSearchQuery}"` : 'No parcels in this tab.'}
              </p>
              <p className="text-xs text-slate-500">
                {staffSearchQuery ? 'Try searching a different order ID or customer name.' : 'Use the Scan QR button or search bar above to look up orders.'}
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
                          onClick={() => setStaffFilter(targetFilter)}
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
          ) : (
            list.map((order) => {
              const isUnpaid = order.status === 'PAYMENT_REQUIRED';
              const fee = getOrderStatedFee(order);
              const displayAmount = isUnpaid ? `Fee: ₱${fee.toLocaleString()}` : `COD: ${order.codAmount}`;

              let badgeClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
              let dotClass = 'bg-blue-400 animate-pulse';
              let statusText = 'Active';

              if (order.status === 'READY_TO_CLAIM') {
                statusText = 'Ready';
                badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                dotClass = 'bg-emerald-400';
              } else if (order.status === 'PAYMENT_REQUIRED') {
                statusText = 'Unpaid';
                badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                dotClass = 'bg-amber-400';
              } else if (order.status === 'CLAIMED') {
                statusText = 'Claimed';
                badgeClass = 'bg-slate-700/60 text-slate-300 border-slate-600/50';
                dotClass = 'bg-slate-400';
              }

              return (
                <div
                  key={order.id}
                  id={`card-${order.id}`}
                  data-open-order={order.id}
                  onClick={() => handleOpenDetails(order)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenDetails(order);
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                        {statusText}
                      </span>
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
                        <span className="text-[10px] text-amber-300 font-medium flex items-center gap-1 truncate max-w-[150px]" title={`Staff Note: ${order.notes}`}>
                          <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-[11px] font-medium text-slate-300">{order.recipient}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span>Details</span>
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Floating Scan QR Action Button: Lower Right Side for Thumb Accessibility */}
      <div id="scan-qr-fab-container" className="terminal-fab-wrapper pointer-events-auto">
        <button
          type="button"
          id="floating-scan-qr-btn"
          aria-label="Scan QR Code"
          onClick={() => setIsScannerOpen(true)}
          className="terminal-scan-fab btn-press group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs shadow-xl shadow-blue-900/50 border border-blue-400/40 ring-4 ring-blue-500/10 active:scale-95 transition-all select-none cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="tracking-wide pr-0.5">Scan QR</span>
        </button>
      </div>

      {/* Filter Area (Frame 111 from Suggested Figma Spec: staff-ui-home.png / staff-ui-figma-css.txt) */}
      {/* Docked at the bottom directly above Frame 113 Navigation Bar */}
      <div id="bottom-filter-bar" className="terminal-filter-area bg-slate-900/95 border-t border-slate-800/80 px-4 py-2 shrink-0 z-20 transition-colors">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>FILTER CATEGORIES</span>
          <span className="text-[9px] font-mono text-slate-500">FRAME 111</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <button
            type="button"
            data-filter-tab="active"
            aria-label="Active"
            onClick={() => setStaffFilter('active')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
              staffFilter === 'active'
                ? 'bg-[#215cd4] text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <span>Active</span>
            <span id="badge-active" className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {badgeCounts.active}
            </span>
          </button>
          <button
            type="button"
            data-filter-tab="ready_to_claim"
            aria-label="Ready"
            onClick={() => setStaffFilter('ready_to_claim')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
              staffFilter === 'ready_to_claim'
                ? 'bg-[#10b780] text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <span>Ready</span>
            <span id="badge-ready" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
              {badgeCounts.ready}
            </span>
          </button>
          <button
            type="button"
            data-filter-tab="inactive"
            aria-label="Unpaid"
            onClick={() => setStaffFilter('inactive')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
              staffFilter === 'inactive'
                ? 'bg-[#c58b12] text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <span>Unpaid</span>
            <span id="badge-unpaid" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
              {badgeCounts.unpaid}
            </span>
          </button>
          <button
            type="button"
            data-filter-tab="claimed"
            aria-label="Claimed"
            onClick={() => setStaffFilter('claimed')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
              staffFilter === 'claimed'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <span>Claimed</span>
            <span id="badge-claimed" className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono">
              {badgeCounts.claimed}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Area (Frame 113 from Suggested Figma Spec) */}
      <nav className="terminal-nav-area bg-slate-900 border-t border-slate-800/80 px-4 py-2 shrink-0 z-20 transition-colors">
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-slate-400">
          <button
            type="button"
            data-nav-item="terminal"
            onClick={() => setStaffFilter('active')}
            className="flex flex-col items-center gap-1 py-1 text-blue-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>
          <button
            type="button"
            data-nav-item="scanner"
            onClick={() => setIsScannerOpen(true)}
            className="flex flex-col items-center gap-1 py-1 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Scan QR</span>
          </button>
          <button
            type="button"
            data-nav-item="activity"
            onClick={() => {
              setStaffFilter('claimed');
              showToast('Viewing completed activity log.');
            }}
            className="flex flex-col items-center gap-1 py-1 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Notifications</span>
          </button>
          <button
            type="button"
            data-nav-item="settings"
            onClick={() => showToast('Counter Desk #01 • Connected to Lily’s Hub Backend.')}
            className="flex flex-col items-center gap-1 py-1 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Account/Desk</span>
          </button>
        </div>
      </nav>

      {/* Dedicated Inner Order Details & Actions Modal (Frame 114 Drill-Down) */}
      <StaffOrderDetailsModal
        order={activeModalOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onPayCourier={staffPayCourier}
        onAttachPhoto={staffAttachPhoto}
        onActivateOrder={staffActivateOrder}
        onReleaseOrder={staffReleaseOrder}
        onUpdateNotes={handleUpdateNotes}
        onSimulatePrompt={customerInitiateClaim}
        isOrderClaimUnlocked={isOrderClaimUnlocked}
        getOrderClaimRemainingSeconds={getOrderClaimRemainingSeconds}
        showToast={showToast}
      />

      {/* Dedicated QR Scanner Modal Screen */}
      <StaffQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onOrderMatched={handleQrMatched}
        orders={orders}
        showToast={showToast}
      />
    </div>
  );
};

export default StaffTerminalScreen;
