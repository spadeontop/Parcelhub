import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  trackingId: string;
  customer: string;
  amountReceived: number;
  change: number;
  timestamp: string;
  status: 'PENDING_INITIALIZATION' | 'PAYMENT_REQUIRED' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'CLAIMED' | 'CANCELLED';
  statusMessage: string;
}

const BACKEND_URL = 'http://localhost:3000';

export const StaffStandaloneApp: React.FC = () => {
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('ph_staff_token') || '');
  const [email, setEmail] = useState('staff@parcelhub.com');
  const [password, setPassword] = useState('staff123');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [proofUrl, setProofUrl] = useState<string>('https://storage.parcelhub.com/proof/mock-delivered.jpg');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.authToken) {
        setAuthToken(data.authToken);
        localStorage.setItem('ph_staff_token', data.authToken);
        notify('Staff authenticated successfully!');
      } else {
        notify(data.message || 'Login failed', 'error');
      }
    } catch {
      notify(`Cannot connect to Backend (${BACKEND_URL}). Make sure it is running on port 3000.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else {
        notify(data.message || 'Failed to fetch orders', 'error');
      }
    } catch {
      notify('Failed to reach backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [authToken]);

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/orders/${id}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amountReceived: depositAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Order activated! Change: ₱${data.change}`);
        fetchOrders();
      } else {
        notify(data.message || 'Activation failed', 'error');
      }
    } catch {
      notify('Network error activating order', 'error');
    }
  };

  const handlePayCourier = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/orders/${id}/make-claimable/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Courier payment recorded!');
        fetchOrders();
      } else {
        notify(data.message || 'Failed recording courier payment', 'error');
      }
    } catch {
      notify('Network error recording payment', 'error');
    }
  };

  const handleAttachPhoto = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/orders/${id}/make-claimable/attach-photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: proofUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Proof attached! Order marked as READY_TO_CLAIM.');
        fetchOrders();
      } else {
        notify(data.message || 'Failed attaching photo', 'error');
      }
    } catch {
      notify('Network error attaching photo', 'error');
    }
  };

  const handleClaim = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/staff/orders/${id}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Parcel successfully released to customer!');
        fetchOrders();
      } else {
        notify(data.message || 'Claim error', 'error');
      }
    } catch {
      notify('Network error releasing order', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
            PH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white">ParcelHub Staff Web Terminal</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                LIVE API DEBUG
              </span>
            </div>
            <p className="text-xs text-slate-400">Targeting {BACKEND_URL} • Real-time order dispatch & counter operations</p>
          </div>
        </div>

        {authToken ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected as Staff
            </span>
            <button
              onClick={() => {
                setAuthToken('');
                localStorage.removeItem('ph_staff_token');
              }}
              className="text-xs text-slate-400 hover:text-rose-400 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Not Authenticated
          </span>
        )}
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200 shadow-emerald-900/40'
              : 'bg-rose-950 border-rose-700 text-rose-200 shadow-rose-900/40'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'PAYMENT_REQUIRED', 'AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    filter === st
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={fetchOrders}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>↻</span>
              Refresh Queue
            </button>
          </div>

          {/* Orders List */}
          <div className="flex flex-col gap-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <p className="text-sm font-medium">No orders found matching status "{filter}".</p>
                <p className="text-xs mt-1">Initialize orders from the Customer Mobile app to see them arrive live!</p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col gap-3 ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/80 ring-1 ring-blue-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">{ord.id}</span>
                          <span className="text-xs text-slate-500 font-mono">• {ord.trackingId}</span>
                        </div>
                        <h2 className="text-sm font-semibold text-white mt-1">Customer: {ord.customer}</h2>
                      </div>

                      <span
                        className={`text-[11px] font-semibold font-mono px-2.5 py-1 rounded-full uppercase border ${
                          ord.status === 'READY_TO_CLAIM'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ord.status === 'AWAITING_PARCEL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : ord.status === 'PAYMENT_REQUIRED'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : ord.status === 'CLAIMED'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <div>Deposit Received: ₱{ord.amountReceived} (Change: ₱{ord.change})</div>
                      <div className="font-mono text-[11px] text-slate-500">{new Date(ord.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Actions / Inspector */}
        <div className="flex flex-col gap-6">
          {/* Quick Staff Authentication Card */}
          {!authToken ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Staff Login Credentials
              </h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-500 font-semibold text-xs py-2.5 rounded-xl text-white transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In as Staff'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Action Panel
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select an order on the left to execute counter lifecycle transitions.
                </p>
              </div>

              {selectedOrderId ? (
                (() => {
                  const ord = orders.find((o) => o.id === selectedOrderId);
                  if (!ord) return <p className="text-xs text-slate-500">Selected order not found.</p>;

                  return (
                    <div className="flex flex-col gap-4">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-xs text-slate-400">Target Order</div>
                        <div className="text-sm font-mono font-bold text-white">{ord.id}</div>
                        <div className="text-xs text-blue-400 font-mono mt-0.5">{ord.trackingId}</div>
                      </div>

                      {/* Action 1: Activate (Cash in counter) */}
                      {ord.status === 'PAYMENT_REQUIRED' && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 flex flex-col gap-3">
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                            Step 1: Cash Deposit & Activation
                          </span>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Cash Received (₱)</label>
                            <input
                              type="number"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <button
                            onClick={() => handleActivate(ord.id)}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs py-2 rounded-lg transition"
                          >
                            Receive Cash & Activate Order
                          </button>
                        </div>
                      )}

                      {/* Action 2: Courier Arrival */}
                      {ord.status === 'AWAITING_PARCEL' && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col gap-3">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                            Step 2: Courier Arrival & Proof
                          </span>
                          <button
                            onClick={() => handlePayCourier(ord.id)}
                            className="w-full bg-amber-600/80 hover:bg-amber-600 text-white font-semibold text-xs py-2 rounded-lg transition"
                          >
                            Pay Courier Upon Arrival
                          </button>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Proof Photo URL</label>
                            <input
                              type="text"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                            />
                          </div>
                          <button
                            onClick={() => handleAttachPhoto(ord.id)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded-lg transition"
                          >
                            Attach Photo & Mark Claimable
                          </button>
                        </div>
                      )}

                      {/* Action 3: Release to Customer */}
                      {ord.status === 'READY_TO_CLAIM' && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 flex flex-col gap-3">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                            Step 3: Customer Claim Handover
                          </span>
                          <button
                            onClick={() => handleClaim(ord.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-lg transition shadow-lg shadow-emerald-600/20"
                          >
                            Verify QR & Hand Over Parcel
                          </button>
                        </div>
                      )}

                      {ord.status === 'CLAIMED' && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                          Order is already completed and claimed.
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  Click on an order from the list to see staff actions.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffStandaloneApp;
