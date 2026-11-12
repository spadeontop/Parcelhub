import React, { useState, useEffect, useMemo } from 'react';
import { UseCustomerV1SessionReturn } from '../useCustomerV1Session';
import {
  CUSTOMER_ORDER_STATUS_OPTIONS,
  SAMPLE_RECEIPT_IMAGES,
  SEEDED_CUSTOMER_ACCOUNTS,
} from '../endpoints';
import { ApiOrderStatus } from '../types';

interface CustomerRealUiLiveProps {
  session: UseCustomerV1SessionReturn;
}

type RealUiTab = 'orders' | 'new_order' | 'profile';

function getStatusColors(status: ApiOrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
    case 'PAYMENT_REQUIRED':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'AWAITING_PARCEL':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'READY_TO_CLAIM':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'CLAIMED':
      return 'bg-slate-600/20 text-slate-300 border-slate-600/40';
    default:
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
}

export const CustomerRealUiLive: React.FC<CustomerRealUiLiveProps> = ({ session }) => {
  const {
    authToken,
    preAuthToken,
    refreshToken,
    customerProfile,
    orders,
    selectedOrderDetail,
    ordersLoading,
    requestLogs,
    loginCustomer,
    registerCustomer,
    verifyMpin,
    createMpin,
    refreshAuth,
    fullSeedLogin,
    fetchProfile,
    fetchOrders,
    fetchOrderDetail,
    initializeOrder,
    updateOrder,
    claimOrder,
    logout,
    showToast,
    inspectLogInDebugger,
  } = session;

  const [activeTab, setActiveTab] = useState<RealUiTab>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Auth form states (when unauthenticated)
  const [authStep, setAuthStep] = useState<'credentials' | 'mpin'>('credentials');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(SEEDED_CUSTOMER_ACCOUNTS[0].email);
  const [password, setPassword] = useState<string>(SEEDED_CUSTOMER_ACCOUNTS[0].password);
  const [firstName, setFirstName] = useState<string>('New');
  const [lastName, setLastName] = useState<string>('Customer');
  const [phoneNumber, setPhoneNumber] = useState<string>('+639123450000');
  const [mpin, setMpin] = useState<string>(SEEDED_CUSTOMER_ACCOUNTS[0].mpin);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Initialize new order state
  const [initImageUrl, setInitImageUrl] = useState<string>(SAMPLE_RECEIPT_IMAGES[0].url);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Confirm draft order (PUT) state
  const [confirmTrackingId, setConfirmTrackingId] = useState<string>('PH-NEW-1001');
  const [confirmProductName, setConfirmProductName] = useState<string>('Wireless Mechanical Keyboard');
  const [confirmRecipientName, setConfirmRecipientName] = useState<string>(
    customerProfile ? `${customerProfile.firstName} ${customerProfile.lastName}` : 'John Doe'
  );
  const [confirmPrice, setConfirmPrice] = useState<string>('1450');
  const [isConfirmingOrder, setIsConfirmingOrder] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Refresh unlock state
  const [unlockMpin, setUnlockMpin] = useState<string>('1234');
  const [isRefreshingAuth, setIsRefreshingAuth] = useState<boolean>(false);

  // Sync recipient default from profile
  useEffect(() => {
    if (customerProfile) {
      setConfirmRecipientName(`${customerProfile.firstName} ${customerProfile.lastName}`);
    }
  }, [customerProfile]);

  const latestLog = requestLogs[0] || null;

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter !== 'ALL' && ord.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${ord.id} ${ord.ticketCode || ''} ${ord.trackingId || ''} ${ord.productName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleSelectOrderCard = async (id: string) => {
    setSelectedOrderId(id);
    const entry = await fetchOrderDetail(id, 'real');
    if (!entry.response.ok) {
      showToast('Failed to load order details.', 'error');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    try {
      const entry = isRegisterMode
        ? await registerCustomer({ email, password, firstName, lastName, phoneNumber }, 'real')
        : await loginCustomer(email, password, 'real');

      if (entry.response.ok) {
        setAuthStep('mpin');
        showToast(
          isRegisterMode
            ? 'Registered! Enter your 4-digit MPIN to complete setup.'
            : 'Credentials verified! Enter your 4-digit MPIN.'
        );
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'Authentication failed';
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleMpinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    try {
      const entry = isRegisterMode
        ? await createMpin(mpin, preAuthToken, 'real')
        : await verifyMpin(mpin, preAuthToken, 'real');

      if (entry.response.ok) {
        showToast('Signed in! Fetching your live orders...');
        await fetchOrders({ silent: false, source: 'real' });
        await fetchProfile('real');
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'MPIN verification failed';
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleQuickDemoSignIn = async (seedIdx: number) => {
    const acc = SEEDED_CUSTOMER_ACCOUNTS[seedIdx] || SEEDED_CUSTOMER_ACCOUNTS[0];
    setIsSubmittingAuth(true);
    try {
      const res = await fullSeedLogin(acc.email, acc.password, acc.mpin, 'real');
      if (res.ok) {
        showToast(`Signed in as ${acc.firstName} ${acc.lastName}!`);
      } else {
        showToast('Quick sign-in failed — check Debugging UI response.', 'error');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleInitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    try {
      const entry = await initializeOrder(initImageUrl, 'real');
      if (entry.response.ok && entry.response.body && typeof entry.response.body === 'object') {
        const createdId = (entry.response.body as { orderId?: string }).orderId;
        showToast(`Draft order ${createdId || ''} created! Confirm details below.`);
        setActiveTab('orders');
        setStatusFilter('ALL');
        if (createdId) {
          setSelectedOrderId(createdId);
          await fetchOrderDetail(createdId, 'real');
        }
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'Failed to initialize order';
        showToast(msg, 'error');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderDetail) return;
    setIsConfirmingOrder(true);
    try {
      const entry = await updateOrder(
        selectedOrderDetail.id,
        {
          trackingId: confirmTrackingId,
          productName: confirmProductName,
          recipientName: confirmRecipientName,
          price: Number(confirmPrice) || 0,
        },
        'real'
      );
      if (entry.response.ok) {
        showToast(`Order ${selectedOrderDetail.id} confirmed! Status is now PAYMENT_REQUIRED.`);
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'Update failed';
        showToast(msg, 'error');
      }
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  const handleClaimOrder = async () => {
    if (!selectedOrderDetail) return;
    setIsClaiming(true);
    try {
      const entry = await claimOrder(selectedOrderDetail.id, 'real');
      if (entry.response.ok) {
        showToast('5-minute claim pickup pass started! Present your ticket code at the counter.');
      } else {
        const msg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : 'Claim initiation failed';
        showToast(msg, 'error');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRefreshUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRefreshingAuth(true);
    try {
      const entry = await refreshAuth(unlockMpin, refreshToken, 'real');
      if (entry.response.ok) {
        showToast('Session unlocked! Fresh 15m authToken issued.');
      } else {
        showToast('MPIN unlock failed.', 'error');
      }
    } finally {
      setIsRefreshingAuth(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Sync & Debugger Jump Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white">ParcelHub Customer Portal (Live API v1)</h2>
              <p className="text-[11px] text-slate-400">
                Complete Customer UI wired directly to <code className="text-indigo-300">/api/v1/customer/*</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {latestLog && (
              <button
                type="button"
                onClick={() => inspectLogInDebugger(latestLog.id)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition cursor-pointer"
              >
                Inspect in Debugging UI →
              </button>
            )}
            {authToken && (
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Unauthenticated 2-Step Login / MPIN Flow */}
        {!authToken ? (
          <div className="max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {authStep === 'credentials'
                    ? isRegisterMode
                      ? 'Create Customer Account'
                      : 'Customer Sign In'
                    : 'Enter 4-Digit MPIN'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {authStep === 'credentials'
                    ? 'Step 1 of 2 — Verify credentials to obtain preAuthToken'
                    : 'Step 2 of 2 — Verify 4-digit MPIN to unlock Bearer session'}
                </p>
              </div>
              {authStep === 'credentials' && (
                <button
                  type="button"
                  onClick={() => setIsRegisterMode((v) => !v)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {isRegisterMode ? 'Switch to Login' : 'Register New'}
                </button>
              )}
            </div>

            {authStep === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                {isRegisterMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingAuth
                    ? 'Verifying...'
                    : isRegisterMode
                    ? 'Register & Continue to MPIN →'
                    : 'Sign In & Continue to MPIN →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMpinSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">4-Digit MPIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-[0.5em] text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthStep('credentials')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingAuth ? 'Verifying MPIN...' : 'Unlock Account'}
                  </button>
                </div>
              </form>
            )}

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="text-[11px] text-slate-400 font-semibold">
                1-Click Seeded Demo Accounts (Chains Login + MPIN):
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SEEDED_CUSTOMER_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickDemoSignIn(idx)}
                    disabled={isSubmittingAuth}
                    className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white">
                      {acc.firstName} {acc.lastName}
                    </div>
                    <div className="text-[10px] font-mono text-indigo-300 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Full Customer Portal */
          <div className="space-y-4">
            {/* Navigation Tabs + Sync Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5">
              <div className="flex items-center gap-1.5">
                {(
                  [
                    ['orders', '📦 My Orders'],
                    ['new_order', '➕ Initialize Parcel'],
                    ['profile', '👤 My Profile'],
                  ] as Array<[RealUiTab, string]>
                ).map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => {
                      setActiveTab(tabId);
                      if (tabId === 'profile') fetchProfile('real');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === tabId
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchOrders({ silent: false, source: 'real' })}
                  disabled={ordersLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  {ordersLoading ? 'Syncing...' : '↻ Refresh Live Orders'}
                </button>
              </div>
            </div>

            {/* TAB 1: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Orders List Panel */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, Ticket Code, or Product..."
                      className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <span className="text-[11px] font-mono text-slate-400">
                      Showing {filteredOrders.length} orders
                    </span>
                  </div>

                  {/* Status Filter Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['ALL', ...CUSTOMER_ORDER_STATUS_OPTIONS].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st);
                          fetchOrders({ type: st, source: 'real' });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition cursor-pointer ${
                          statusFilter === st
                            ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Order Cards */}
                  <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredOrders.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                        <p className="text-xs text-slate-400">
                          No orders loaded yet. Click <strong>Refresh Live Orders</strong> or initialize a
                          new parcel.
                        </p>
                      </div>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isSelected = selectedOrderId === ord.id;
                        return (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => handleSelectOrderCard(ord.id)}
                            aria-label={`View order details for ${ord.id}`}
                            className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                              isSelected
                                ? 'bg-indigo-950/50 border-indigo-500 shadow-md'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-indigo-300">
                                  {ord.id}
                                </span>
                                {ord.ticketCode && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    Ticket {ord.ticketCode}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusColors(
                                  ord.status
                                )}`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white font-semibold">
                                {ord.productName || 'Draft Parcel (Awaiting Confirmation)'}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {ord.trackingId || 'No Tracking #'}
                              </span>
                            </div>

                            {ord.isClaimActive && (
                              <div className="text-[10px] font-semibold text-emerald-300">
                                🎟 Active 5m Pickup Pass — Ready at Counter
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Order Details & Interactive Actions */}
                <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Order Details &amp; Actions
                  </h3>

                  {selectedOrderDetail ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono font-bold text-indigo-300">
                            {selectedOrderDetail.id}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusColors(
                              selectedOrderDetail.status
                            )}`}
                          >
                            {selectedOrderDetail.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Product</span>
                            <span className="text-white font-semibold">
                              {selectedOrderDetail.productName || 'Unconfirmed Draft'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Ticket Code</span>
                            <span className="font-mono text-white">
                              {selectedOrderDetail.ticketCode || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Tracking ID</span>
                            <span className="font-mono text-white">
                              {selectedOrderDetail.trackingId || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Stated Fee / Change</span>
                            <span className="font-mono text-white">
                              ₱{selectedOrderDetail.price} / ₱{selectedOrderDetail.change}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PENDING_INITIALIZATION -> PUT /api/v1/customer/orders/{id} */}
                      {selectedOrderDetail.status === 'PENDING_INITIALIZATION' && (
                        <form
                          onSubmit={handleConfirmOrder}
                          className="bg-violet-950/20 border border-violet-500/30 rounded-xl p-3.5 space-y-2.5"
                        >
                          <div className="text-xs font-bold text-violet-300">
                            Confirm Draft Order Details (PUT)
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Tracking ID
                              </label>
                              <input
                                type="text"
                                required
                                value={confirmTrackingId}
                                onChange={(e) => setConfirmTrackingId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                COD Price (₱)
                              </label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={confirmPrice}
                                onChange={(e) => setConfirmPrice(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Product Name
                              </label>
                              <input
                                type="text"
                                required
                                value={confirmProductName}
                                onChange={(e) => setConfirmProductName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">
                                Recipient Name
                              </label>
                              <input
                                type="text"
                                required
                                value={confirmRecipientName}
                                onChange={(e) => setConfirmRecipientName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isConfirmingOrder}
                            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            {isConfirmingOrder ? 'Confirming...' : 'Confirm Order → Payment Required'}
                          </button>
                        </form>
                      )}

                      {/* READY_TO_CLAIM -> POST /api/v1/customer/orders/{id}/claim */}
                      {selectedOrderDetail.status === 'READY_TO_CLAIM' && (
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300">
                              Ready for Hub Pickup
                            </span>
                            {selectedOrderDetail.isClaimActive && (
                              <span className="text-[11px] font-mono text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-lg">
                                {selectedOrderDetail.claimRemainingSeconds}s remaining
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleClaimOrder}
                            disabled={isClaiming}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                          >
                            {isClaiming
                              ? 'Starting Claim Timer...'
                              : selectedOrderDetail.isClaimActive
                              ? '↻ Restart 5-Minute Claim Pass'
                              : '🎟 Initiate 5-Minute Pickup Claim'}
                          </button>
                        </div>
                      )}

                      {/* Timeline */}
                      {selectedOrderDetail.statusTimeline?.length > 0 && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Status Timeline
                          </div>
                          {selectedOrderDetail.statusTimeline.map((entry, idx) => (
                            <div
                              key={`${entry.status}-${idx}`}
                              className="flex items-center justify-between text-[11px] font-mono"
                            >
                              <span className="text-slate-200">{entry.status}</span>
                              <span className="text-slate-500">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                      Click any order card on the left to inspect its details and run v1 customer
                      actions.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INITIALIZE NEW PARCEL */}
            {activeTab === 'new_order' && (
              <div className="max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Initialize New Parcel Drop-Off</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Calls <code className="text-indigo-300">POST /api/v1/customer/orders/initialize</code>{' '}
                    to create a <code className="text-violet-300">PENDING_INITIALIZATION</code> draft with a
                    unique ticket code.
                  </p>
                </div>

                <form onSubmit={handleInitOrder} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Checkout Screenshot Image URL
                    </label>
                    <input
                      type="text"
                      required
                      value={initImageUrl}
                      onChange={(e) => setInitImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_RECEIPT_IMAGES.map((sample) => (
                      <button
                        key={sample.url}
                        type="button"
                        onClick={() => setInitImageUrl(sample.url)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 cursor-pointer"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isInitializing}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isInitializing ? 'Creating Draft Order...' : '📸 Initialize Parcel Order'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: PROFILE & REFRESH */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Customer Profile</h3>
                    <button
                      type="button"
                      onClick={() => fetchProfile('real')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      ↻ Refresh Profile
                    </button>
                  </div>
                  {customerProfile ? (
                    <div className="space-y-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                      <div>
                        <span className="text-slate-500">ID:</span>{' '}
                        <span className="text-indigo-300">{customerProfile.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Name:</span>{' '}
                        <span className="text-white">
                          {customerProfile.firstName} {customerProfile.middleInitial}{' '}
                          {customerProfile.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>{' '}
                        <span className="text-white">{customerProfile.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>{' '}
                        <span className="text-white">{customerProfile.phoneNumber}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Click Refresh Profile to fetch from API.</p>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">MPIN Session Unlock (Refresh Token)</h3>
                  <p className="text-xs text-slate-400">
                    Calls <code className="text-indigo-300">POST /api/v1/customer/refresh</code> with your
                    30-day refreshToken and 4-digit MPIN.
                  </p>
                  <form onSubmit={handleRefreshUnlock} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={unlockMpin}
                      onChange={(e) => setUnlockMpin(e.target.value)}
                      placeholder="1234"
                      className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white text-center tracking-widest"
                    />
                    <button
                      type="submit"
                      disabled={isRefreshingAuth}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                    >
                      {isRefreshingAuth ? 'Refreshing...' : '🔄 Unlock & Refresh authToken'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
