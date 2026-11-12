import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, StaffFilter, StaffBadgeCounts } from '../../staff/types';
import { StaffHeader } from '../../staff/components/header/StaffHeader';
import { StaffSearchBar } from '../../staff/components/header/StaffSearchBar';
import { StaffOrdersList } from '../../staff/components/cards/StaffOrdersList';
import { StaffScanFab } from '../../staff/components/navigation/StaffScanFab';
import { StaffFilterTabs } from '../../staff/components/navigation/StaffFilterTabs';
import { StaffBottomNav } from '../../staff/components/navigation/StaffBottomNav';
import { StaffOrderDetailsModal } from '../../staff/components/modals/details/StaffOrderDetailsModal';
import { StaffQrScannerModal } from '../../staff/components/modals/scanner/StaffQrScannerModal';
import { mapStaffOrderToUiOrder } from '../staffV1Client';
import { SEEDED_STAFF_CREDENTIALS } from '../endpoints';
import { UseStaffV1SessionReturn } from '../useStaffV1Session';
import { UiOrderMapped } from '../types';

interface StaffRealUiLiveProps {
  session: UseStaffV1SessionReturn;
}

export const StaffRealUiLive: React.FC<StaffRealUiLiveProps> = ({ session }) => {
  const {
    authToken,
    staffUsername,
    orders: apiOrders,
    ordersLoading,
    requestLogs,
    login,
    logout,
    fetchOrders,
    fetchOrderDetail,
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
    showToast,
    inspectLogInDebugger,
  } = session;

  // Login form state when unauthenticated
  const [username, setUsername] = useState<string>(SEEDED_STAFF_CREDENTIALS.username);
  const [password, setPassword] = useState<string>(SEEDED_STAFF_CREDENTIALS.password);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Terminal UI state
  const [staffFilter, setStaffFilter] = useState<StaffFilter>('inactive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [notesByOrderId, setNotesByOrderId] = useState<Record<string, string>>({});
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(() => Date.now());

  // Fetch orders immediately when entering Real UI while authenticated
  useEffect(() => {
    if (!authToken) return;
    fetchOrders({ source: 'real' }).then((entry) => {
      if (entry?.response.ok) setLastFetchedAt(Date.now());
    });
  }, [authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional background polling for live customer claim passes
  useEffect(() => {
    if (!authToken || !autoPoll) return;
    const interval = setInterval(() => {
      fetchOrders({ silent: true, source: 'real' }).then((entry) => {
        if (entry?.response.ok) setLastFetchedAt(Date.now());
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [authToken, autoPoll, fetchOrders]);

  const mappedOrders: UiOrderMapped[] = useMemo(
    () => apiOrders.map((o) => mapStaffOrderToUiOrder(o, notesByOrderId[o.id])),
    [apiOrders, notesByOrderId]
  );

  const badgeCounts: StaffBadgeCounts = useMemo(
    () => ({
      active: mappedOrders.filter((o) => o.status === 'AWAITING_PARCEL').length,
      ready: mappedOrders.filter((o) => o.status === 'READY_TO_CLAIM').length,
      unpaid: mappedOrders.filter((o) => o.status === 'PAYMENT_REQUIRED').length,
      claimed: mappedOrders.filter((o) => o.status === 'CLAIMED').length,
    }),
    [mappedOrders]
  );

  const tabOrders = useMemo(() => {
    if (staffFilter === 'active') return mappedOrders.filter((o) => o.status === 'AWAITING_PARCEL');
    if (staffFilter === 'ready_to_claim') return mappedOrders.filter((o) => o.status === 'READY_TO_CLAIM');
    if (staffFilter === 'claimed') return mappedOrders.filter((o) => o.status === 'CLAIMED');
    return mappedOrders.filter((o) => o.status === 'PAYMENT_REQUIRED');
  }, [mappedOrders, staffFilter]);

  const q = searchQuery.trim().toLowerCase();
  const cleanQ = q.replace(/[^a-z0-9]/g, '');

  const matchesQuery = useCallback(
    (o: UiOrderMapped) => {
      if (!q) return true;
      const id = o.id.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const prod = o.product.toLowerCase();
      const rec = o.recipient.toLowerCase();
      return (
        id.includes(q) ||
        key.includes(q) ||
        cleanKey.includes(cleanQ) ||
        track.includes(q) ||
        prod.includes(q) ||
        rec.includes(q)
      );
    },
    [q, cleanQ]
  );

  const filteredOrders = useMemo(() => tabOrders.filter(matchesQuery), [tabOrders, matchesQuery]);
  const crossTabMatches = useMemo(
    () => (q ? mappedOrders.filter(matchesQuery) : []),
    [q, mappedOrders, matchesQuery]
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const entry = await login(username, password, 'real');
      if (entry.response.ok) {
        showToast('Staff signed in! Loading live orders...');
        await fetchOrders({ source: 'real' });
        setLastFetchedAt(Date.now());
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'Invalid username or password';
        showToast(msg, 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOpenDetails = useCallback(
    (order: Order) => {
      setSelectedOrderId(order.id);
      setIsDetailsOpen(true);
      // Also hit GET /api/v1/staff/orders/{id} so live detail is inspected & logged
      fetchOrderDetail(order.id, 'real');
    },
    [fetchOrderDetail]
  );

  const handleSearchOrBarcodeScan = useCallback(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setIsScannerOpen(true);
      return;
    }
    const clean = trimmed.replace(/[^a-z0-9]/g, '');
    const matched = mappedOrders.find((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingNumber.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      return (
        id === trimmed ||
        id.replace(/[^a-z0-9]/g, '') === clean ||
        track === trimmed ||
        key === trimmed ||
        key.replace(/[^a-z0-9]/g, '') === clean
      );
    });
    if (matched) {
      const targetTab: StaffFilter =
        matched.status === 'PAYMENT_REQUIRED'
          ? 'inactive'
          : matched.status === 'AWAITING_PARCEL'
          ? 'active'
          : matched.status === 'READY_TO_CLAIM'
          ? 'ready_to_claim'
          : 'claimed';
      setStaffFilter(targetTab);
      handleOpenDetails(matched);
    } else {
      showToast(`No live order matched "${searchQuery}".`, 'error');
    }
  }, [searchQuery, mappedOrders, handleOpenDetails, showToast]);

  const handleQrMatched = useCallback(
    (order: Order) => {
      const targetTab: StaffFilter =
        order.status === 'PAYMENT_REQUIRED'
          ? 'inactive'
          : order.status === 'AWAITING_PARCEL'
          ? 'active'
          : order.status === 'READY_TO_CLAIM'
          ? 'ready_to_claim'
          : 'claimed';
      setStaffFilter(targetTab);
      setSearchQuery(order.id);
      handleOpenDetails(order);
    },
    [handleOpenDetails]
  );

  const extractErrMsg = (entry: { response: { body: unknown; status: number } }) => {
    if (entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body) {
      return String((entry.response.body as { message?: unknown }).message);
    }
    return `HTTP ${entry.response.status}`;
  };

  const handleActivateOrder = useCallback(
    (orderId: string, amount: number) => {
      activateOrder(orderId, amount, 'real').then((entry) => {
        if (entry.response.ok) {
          const change =
            entry.response.body && typeof entry.response.body === 'object' && 'change' in entry.response.body
              ? (entry.response.body as { change?: number }).change ?? 0
              : 0;
          showToast(`Order ${orderId} activated! Change: ₱${change}`);
          setStaffFilter('active');
        } else {
          showToast(extractErrMsg(entry), 'error');
        }
      });
    },
    [activateOrder, showToast]
  );

  const handlePayCourier = useCallback(
    (orderId: string) => {
      payCourier(orderId, 'real').then((entry) => {
        if (entry.response.ok) {
          showToast(`Courier payment recorded for ${orderId}.`);
        } else {
          showToast(extractErrMsg(entry), 'error');
        }
      });
    },
    [payCourier, showToast]
  );

  const handleAttachPhoto = useCallback(
    (orderId: string, imageUrl: string) => {
      attachPhoto(orderId, imageUrl, 'real').then((entry) => {
        if (entry.response.ok) {
          showToast(`Proof photo attached! ${orderId} is now READY_TO_CLAIM.`);
          setStaffFilter('ready_to_claim');
        } else {
          showToast(extractErrMsg(entry), 'error');
        }
      });
    },
    [attachPhoto, showToast]
  );

  const handleReleaseOrder = useCallback(
    (orderId: string) => {
      claimOrder(orderId, 'real').then((entry) => {
        if (entry.response.ok) {
          showToast(`Order ${orderId} successfully claimed & released!`);
          setStaffFilter('claimed');
          setIsDetailsOpen(false);
        } else {
          showToast(extractErrMsg(entry), 'error');
        }
      });
    },
    [claimOrder, showToast]
  );

  const handleRefreshClaimStatus = useCallback(
    (orderId: string) => {
      fetchOrderDetail(orderId, 'real').then((entry) => {
        if (entry.response.ok) {
          const body = entry.response.body as { isClaimActive?: boolean } | null;
          if (body?.isClaimActive) {
            showToast(`Customer claim pass is ACTIVE for ${orderId}!`);
            fetchOrders({ silent: true, source: 'real' });
          } else {
            showToast(
              'Still locked: customer must initiate claim pass from Customer App (/api/v1/customer/orders/{id}/claim).',
              'error'
            );
          }
        }
      });
    },
    [fetchOrderDetail, fetchOrders, showToast]
  );

  const isOrderClaimUnlocked = useCallback(
    (order: Order) => {
      const live = mappedOrders.find((o) => o.id === order.id);
      return Boolean(live?.isClaimActive);
    },
    [mappedOrders]
  );

  const getOrderClaimRemainingSeconds = useCallback(
    (order: Order) => {
      const live = mappedOrders.find((o) => o.id === order.id);
      if (!live || !live.isClaimActive) return 0;
      const elapsedSec = Math.floor((Date.now() - lastFetchedAt) / 1000);
      return Math.max(0, live.claimRemainingSeconds - elapsedSec);
    },
    [mappedOrders, lastFetchedAt]
  );

  const getOrderFee = useCallback((order: Order) => {
    const live = mappedOrders.find((o) => o.id === order.id);
    return live?.amountToPay ?? order.statedFee ?? 0;
  }, [mappedOrders]);

  const activeModalOrder =
    mappedOrders.find((o) => o.id === selectedOrderId) ||
    filteredOrders[0] ||
    mappedOrders[0] ||
    null;

  const latestLog = requestLogs[0] || null;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-5 gap-4 overflow-y-auto">
      {/* Real UI Toolbar */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setDeviceFrame((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
          >
            {deviceFrame ? 'Fullscreen View' : 'Device Frame View'}
          </button>

          {authToken && (
            <>
              <button
                type="button"
                onClick={() => fetchOrders({ source: 'real' })}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 font-semibold cursor-pointer"
              >
                ↻ Refresh Live Orders
              </button>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPoll}
                  onChange={(e) => setAutoPoll(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950"
                />
                <span>Auto-sync (4s)</span>
              </label>
            </>
          )}
        </div>

        {/* Last API Call Pill with 1-click jump to Debugger */}
        {latestLog ? (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span
              className={`px-2 py-0.5 rounded border font-bold ${
                latestLog.response.ok
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {latestLog.request.method} {latestLog.response.status || 'ERR'} ({latestLog.response.durationMs}ms)
            </span>
            <button
              type="button"
              onClick={() => inspectLogInDebugger(latestLog.id)}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
            >
              Inspect in Debugging UI →
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">Live /api/v1/staff mode</span>
        )}
      </div>

      {/* Mobile Device Frame / Fullscreen Container */}
      <div
        className={`overflow-hidden transition-all duration-300 relative flex flex-col bg-slate-900 text-slate-100 ${
          deviceFrame
            ? 'w-full max-w-[420px] rounded-[44px] border-4 border-slate-800 shadow-2xl h-[790px]'
            : 'w-full max-w-2xl min-h-[760px] rounded-2xl border border-slate-800 shadow-xl'
        }`}
      >
        {deviceFrame && (
          <div className="px-7 pt-3 pb-1 flex items-center justify-between text-xs font-semibold select-none shrink-0 bg-slate-900 text-slate-200">
            <span className="tracking-tight">9:41</span>
            <div className="w-24 h-5 bg-black rounded-full" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              v1 LIVE
            </div>
          </div>
        )}

        {!authToken ? (
          /* Real UI Staff Login Screen */
          <div className="flex-1 flex flex-col justify-center p-6 bg-slate-900 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-2.5">
                <img
                  src="./assets/parcelhub_logo.png"
                  alt="ParcelHub Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-lg font-extrabold text-white">Staff Counter Sign In</h2>
              <p className="text-xs text-slate-400">
                Authenticates against <code className="font-mono text-blue-300">POST /api/v1/staff/login</code>
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="real-staff-username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Staff Username
                </label>
                <input
                  id="real-staff-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="real-staff-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  id="real-staff-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/40 transition cursor-pointer disabled:opacity-60"
              >
                {isLoggingIn ? 'Signing In...' : 'Sign In to Staff Terminal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername(SEEDED_STAFF_CREDENTIALS.username);
                  setPassword(SEEDED_STAFF_CREDENTIALS.password);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Fill Seeded Account (staff / string)
              </button>
            </form>
          </div>
        ) : (
          /* Real Staff Terminal Components wired to Live v1 API */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-100 relative select-none font-sans overflow-hidden">
            <StaffHeader
              onExit={logout}
              deskLabel="Sign Out"
              operatorLabel={staffUsername.toUpperCase()}
            >
              <StaffSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onTriggerSearchOrScan={handleSearchOrBarcodeScan}
                onClear={() => setSearchQuery('')}
              />
            </StaffHeader>

            <StaffOrdersList
              orders={filteredOrders}
              searchQuery={searchQuery}
              crossTabMatches={crossTabMatches}
              onOpenDetails={handleOpenDetails}
              onSelectFilter={setStaffFilter}
              getOrderFee={getOrderFee}
              isLoading={ordersLoading && mappedOrders.length === 0}
            />

            <StaffScanFab onClick={() => setIsScannerOpen(true)} />

            <StaffFilterTabs
              activeFilter={staffFilter}
              badgeCounts={badgeCounts}
              onSelectFilter={setStaffFilter}
            />

            <StaffBottomNav
              onNavigateHome={() => setStaffFilter('active')}
              onOpenScanner={() => setIsScannerOpen(true)}
              onViewActivity={() => {
                setStaffFilter('claimed');
                showToast('Viewing claimed orders from live DB.');
              }}
              onShowDeskInfo={() =>
                showToast(`Signed in as "${staffUsername}" • ${mappedOrders.length} live orders loaded.`)
              }
            />

            <StaffOrderDetailsModal
              order={activeModalOrder}
              isOpen={isDetailsOpen}
              onClose={() => {
                setIsDetailsOpen(false);
                setSelectedOrderId(null);
              }}
              onPayCourier={handlePayCourier}
              onAttachPhoto={handleAttachPhoto}
              onActivateOrder={handleActivateOrder}
              onReleaseOrder={handleReleaseOrder}
              onUpdateNotes={(orderId, notes) =>
                setNotesByOrderId((prev) => ({ ...prev, [orderId]: notes }))
              }
              onSimulatePrompt={handleRefreshClaimStatus}
              isOrderClaimUnlocked={isOrderClaimUnlocked}
              getOrderClaimRemainingSeconds={getOrderClaimRemainingSeconds}
              showToast={(msg) => showToast(msg)}
            />

            <StaffQrScannerModal
              isOpen={isScannerOpen}
              onClose={() => setIsScannerOpen(false)}
              onOrderMatched={handleQrMatched}
              orders={mappedOrders}
              showToast={(msg) => showToast(msg)}
            />
          </div>
        )}

        {deviceFrame && (
          <div className="py-2 flex justify-center select-none shrink-0 bg-slate-900">
            <div className="w-32 h-1 rounded-full bg-slate-700" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRealUiLive;
