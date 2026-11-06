import React, { useState, useEffect } from 'react';

export interface CustomerOrderSummary {
  id: string;
  trackingId: string;
  productName: string;
  status: 'PENDING_INITIALIZATION' | 'PAYMENT_REQUIRED' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'CLAIMED' | 'CANCELLED';
  timestamp: string;
  isClaimActive?: boolean;
}

export interface CustomerOrderDetail {
  id: string;
  trackingId: string;
  productName: string;
  recipientName: string;
  price: number;
  change: number;
  status: 'PENDING_INITIALIZATION' | 'PAYMENT_REQUIRED' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'CLAIMED' | 'CANCELLED';
  statusTimeline?: Array<{ status: string; timestamp: string }>;
  qrImageUrl?: string;
  claimInitiatedAt?: string;
  claimExpiresAt?: string;
  isClaimActive?: boolean;
  claimRemainingSeconds?: number;
}

const BACKEND_URL = '';

export const CustomerStandaloneApp: React.FC = () => {
  // Auth states
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('ph_customer_token') || '');
  const [preAuthToken, setPreAuthToken] = useState<string>(() => localStorage.getItem('ph_customer_preauth_token') || '');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login / Register Form states
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password');
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [phoneNumber, setPhoneNumber] = useState('+639123456789');

  // MPIN states
  const [mpin, setMpin] = useState('1234');
  const [isRegisterSetupMpin, setIsRegisterSetupMpin] = useState(false);

  // App / Orders states
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  // Create Order / Edit Order modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('https://storage.parcelhub.com/sample-receipt.jpg');
  const [newTrackingId, setNewTrackingId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(350);

  // Edit fields
  const [editTrackingId, setEditTrackingId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDisconnect = () => {
    setAuthToken('');
    setPreAuthToken('');
    localStorage.removeItem('ph_customer_token');
    localStorage.removeItem('ph_customer_preauth_token');
    setOrders([]);
    setSelectedOrderId(null);
    setOrderDetail(null);
    notify('Disconnected from Customer session');
  };

  // 1. Login flow
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.preAuthToken) {
        setPreAuthToken(data.preAuthToken);
        localStorage.setItem('ph_customer_preauth_token', data.preAuthToken);
        setIsRegisterSetupMpin(false);
        notify(data.statusMessage || 'Credentials verified. Please enter 4-digit MPIN.');
      } else {
        notify(data.message || data.error || 'Login failed', 'error');
      }
    } catch {
      notify(`Cannot connect to Backend (${BACKEND_URL}). Make sure it is running.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Register flow
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.preAuthToken) {
        setPreAuthToken(data.preAuthToken);
        localStorage.setItem('ph_customer_preauth_token', data.preAuthToken);
        setIsRegisterSetupMpin(true);
        notify(data.statusMessage || 'Registration successful! Set up your 4-digit MPIN.');
      } else {
        notify(data.message || data.error || 'Registration failed', 'error');
      }
    } catch {
      notify(`Cannot connect to Backend (${BACKEND_URL}). Make sure it is running.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. MPIN verify or create
  const handleVerifyOrSetMpin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!preAuthToken) {
      notify('Pre-auth token missing. Please sign in or register again.', 'error');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isRegisterSetupMpin
        ? `${BACKEND_URL}/api/customer/create-mpin`
        : `${BACKEND_URL}/api/customer/mpin`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken, mpin }),
      });
      const data = await res.json();
      if (res.ok && data.authToken) {
        setAuthToken(data.authToken);
        localStorage.setItem('ph_customer_token', data.authToken);
        setPreAuthToken('');
        localStorage.removeItem('ph_customer_preauth_token');
        setIsRegisterSetupMpin(false);
        notify(data.statusMessage || 'Authenticated successfully!');
      } else {
        notify(data.message || data.error || 'MPIN verification failed', 'error');
      }
    } catch {
      notify('Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch orders list
  const fetchOrders = async (showLoadingIndicator = false) => {
    if (!authToken) return;
    if (showLoadingIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
        }
        notify(data.message || 'Failed to fetch customer orders', 'error');
      }
    } catch {
      notify('Failed to reach backend server', 'error');
    } finally {
      if (showLoadingIndicator) setIsRefreshing(false);
    }
  };

  // 5. Fetch single order details
  const fetchOrderDetail = async (orderId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrderDetail(data.order);
        setEditTrackingId(data.order.trackingId || '');
        setEditProductName(data.order.productName || '');
        setEditRecipientName(data.order.recipientName || '');
        setEditPrice(data.order.price || 0);
      } else if (!res.ok) {
        notify(data.message || 'Failed to fetch order details', 'error');
      }
    } catch {
      notify('Failed to reach backend server for order details', 'error');
    }
  };

  // Polling loop
  useEffect(() => {
    if (authToken) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(false);
        if (selectedOrderId) {
          fetchOrderDetail(selectedOrderId);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [authToken, selectedOrderId]);

  // When selectedOrderId changes, load detail immediately
  useEffect(() => {
    if (selectedOrderId && authToken) {
      fetchOrderDetail(selectedOrderId);
    } else {
      setOrderDetail(null);
    }
  }, [selectedOrderId, authToken]);

  // Create Order (Initialize + Put details)
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step A: Initialize
      const initRes = await fetch(`${BACKEND_URL}/api/customer/orders/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: newImageUrl }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.orderId) {
        notify(initData.message || 'Failed to initialize order', 'error');
        setLoading(false);
        return;
      }

      const createdOrderId = initData.orderId;

      // Step B: Update details if provided
      const updateRes = await fetch(`${BACKEND_URL}/api/customer/orders/${createdOrderId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            trackingId: newTrackingId || `TRK-${Date.now().toString().slice(-6)}`,
            productName: newProductName || 'New Parcel',
            recipientName: newRecipientName || 'Customer Recipient',
            price: newPrice,
          },
        }),
      });

      if (updateRes.ok) {
        notify(`Order ${createdOrderId} created and submitted!`);
        setIsCreateOpen(false);
        setNewTrackingId('');
        setNewProductName('');
        setSelectedOrderId(createdOrderId);
        fetchOrders(true);
      } else {
        const updateData = await updateRes.json();
        notify(updateData.message || 'Order initialized, but failed to save details', 'error');
      }
    } catch {
      notify('Network error creating order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update order details
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    if (orderDetail && orderDetail.status !== 'PENDING_INITIALIZATION' && orderDetail.status !== 'PAYMENT_REQUIRED') {
      notify('Cannot edit order once paid or active.', 'error');
      setIsEditOpen(false);
      return;
    }
    setActionLoadingId(selectedOrderId);
    setActionType('update');
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            trackingId: editTrackingId,
            productName: editProductName,
            recipientName: editRecipientName,
            price: Number(editPrice),
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Order details updated successfully!');
        setIsEditOpen(false);
        fetchOrderDetail(selectedOrderId);
        fetchOrders(false);
      } else {
        notify(data.message || 'Failed to update order', 'error');
      }
    } catch {
      notify('Network error updating order', 'error');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  // Cancel Order
  const handleCancelOrder = async (id: string) => {
    if (!window.confirm(`Are you sure you want to cancel order ${id}?`)) return;
    setActionLoadingId(id);
    setActionType('cancel');
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/orders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.statusMessage || 'Order cancelled successfully!');
        fetchOrders(true);
        if (selectedOrderId === id) {
          fetchOrderDetail(id);
        }
      } else {
        notify(data.message || 'Failed to cancel order', 'error');
      }
    } catch {
      notify('Network error cancelling order', 'error');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  // Customer Initiate Claim
  const handleInitiateClaim = async (id: string) => {
    setActionLoadingId(id);
    setActionType('claim');
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/orders/${id}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Claim pass activated for ${data.durationMinutes || 5} minutes! Present your QR code to counter.`);
        fetchOrderDetail(id);
        fetchOrders(false);
      } else {
        notify(data.message || 'Failed to initiate claim', 'error');
      }
    } catch {
      notify('Network error initiating claim', 'error');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
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
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
            PH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white">ParcelHub Customer Web Debug</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                LIVE API DEBUG
              </span>
            </div>
            <p className="text-xs text-slate-400">Targeting {BACKEND_URL || 'Local Proxy'} • Customer package tracking & claim dispatch</p>
          </div>
        </div>

        {authToken ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected as Customer
            </span>
            <button
              onClick={handleDisconnect}
              className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
              {['ALL', 'PENDING_INITIALIZATION', 'PAYMENT_REQUIRED', 'AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    filter === st
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {authToken && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>+</span>
                  <span>New Order</span>
                </button>
              )}
              <button
                onClick={() => fetchOrders(true)}
                disabled={isRefreshing || !authToken}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer"
              >
                <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="flex flex-col gap-3">
            {!authToken ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <p className="text-sm font-medium">Please sign in or register with customer credentials on the right.</p>
                <p className="text-xs mt-1">Default seed: user@example.com / password (MPIN: 1234)</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <p className="text-sm font-medium">No orders found matching filter "{filter}".</p>
                <p className="text-xs mt-1">Click "+ New Order" to initialize and submit a package order!</p>
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                const claimActive = !!ord.isClaimActive;

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">{ord.id}</span>
                          <span className="text-xs text-slate-500 font-mono">• {ord.trackingId || 'No Tracking'}</span>
                        </div>
                        <h2 className="text-sm font-semibold text-white mt-1">{ord.productName || 'Unnamed Package'}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.status === 'READY_TO_CLAIM' && claimActive && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            CLAIM ACTIVE
                          </span>
                        )}

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
                              : ord.status === 'PENDING_INITIALIZATION'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <div>Created: {new Date(ord.timestamp).toLocaleString()}</div>
                      <span className="text-xs text-indigo-400">View details →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Actions / Authentication / Details */}
        <div>
          {!authToken ? (
            /* Auth Box */
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 sticky top-24">
              {preAuthToken ? (
                /* Step 2: MPIN Screen */
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {isRegisterSetupMpin ? 'Create 4-Digit MPIN' : 'Enter 4-Digit MPIN'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRegisterSetupMpin
                      ? 'Set up your secret 4-digit security PIN to finalize registration.'
                      : 'Provide your 4-digit MPIN to complete customer login.'}
                  </p>

                  <form onSubmit={handleVerifyOrSetMpin} className="flex flex-col gap-3 mt-4">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">4-Digit MPIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        value={mpin}
                        onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || mpin.length !== 4}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin text-sm">↻</span>
                          <span>Verifying MPIN...</span>
                        </>
                      ) : (
                        isRegisterSetupMpin ? 'Complete Registration' : 'Verify MPIN & Sign In'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreAuthToken('')}
                      className="text-xs text-slate-400 hover:text-slate-300 mt-1"
                    >
                      ← Back to Email / Password
                    </button>
                  </form>
                </div>
              ) : (
                /* Step 1: Login or Register Screen */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Customer Portal
                    </h2>
                    <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setAuthMode('login')}
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => setAuthMode('register')}
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          authMode === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    {authMode === 'login'
                      ? 'Sign in to monitor parcels, authorize counter releases, and inspect pickups.'
                      : 'Register a new customer account to start claiming parcels.'}
                  </p>

                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3">
                    {authMode === 'register' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">First Name</label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">Last Name</label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin text-sm">↻</span>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        authMode === 'login' ? 'Sign In & Verify Credentials' : 'Create Customer Account'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Selected Order Panel */
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 sticky top-24">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Customer Parcel Inspector
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  View tracking details, initiate customer release claim, or update parcel info.
                </p>
              </div>

              {selectedOrderId && orderDetail ? (
                <div className="flex flex-col gap-4">
                  {/* Order Overview Header */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-400">{orderDetail.id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {orderDetail.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">{orderDetail.productName}</div>
                    <div className="text-xs text-slate-400 font-mono">Tracking: {orderDetail.trackingId}</div>
                    <div className="text-xs text-slate-400">Recipient: {orderDetail.recipientName}</div>
                    <div className="text-xs text-slate-300 font-mono mt-1">
                      Price: ₱{orderDetail.price} | Change: ₱{orderDetail.change}
                    </div>
                  </div>

                  {/* QR Image preview if ready or active */}
                  {orderDetail.qrImageUrl && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-2 text-center">
                      <span className="text-xs text-slate-400 font-medium">Customer Pickup QR Pass</span>
                      <img
                        src={orderDetail.qrImageUrl}
                        alt="Pickup QR"
                        className="w-32 h-32 rounded-lg bg-white p-2 border border-slate-700 shadow"
                        onError={(e) => {
                          // Fallback if image path does not resolve
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[11px] font-mono text-slate-500">Show to staff at counter</span>
                    </div>
                  )}

                  {/* Claim Status & Initiate Claim Action */}
                  {orderDetail.status === 'READY_TO_CLAIM' && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                          Pickup Claim Status
                        </span>
                        {orderDetail.isClaimActive ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {Math.floor((orderDetail.claimRemainingSeconds || 0) / 60)}:
                            {String((orderDetail.claimRemainingSeconds || 0) % 60).padStart(2, '0')} active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Locked
                          </span>
                        )}
                      </div>

                      {orderDetail.isClaimActive ? (
                        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-300">
                          <p className="font-semibold flex items-center gap-1.5">
                            <span>✅</span> Claim Window Active
                          </p>
                          <p className="text-[11px] text-emerald-400/80 mt-1">
                            Staff terminal release button is now UNLOCKED. Present your pickup QR code at the counter now.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-slate-400">
                            Parcel is ready at the hub! Click below to unlock counter release (starts 5-minute timer).
                          </p>
                          <button
                            onClick={() => handleInitiateClaim(orderDetail.id)}
                            disabled={actionLoadingId === orderDetail.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-lg transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {actionLoadingId === orderDetail.id && actionType === 'claim' ? (
                              <>
                                <span className="animate-spin text-sm">↻</span>
                                <span>Activating Claim...</span>
                              </>
                            ) : (
                              'Initiate Pickup Claim (5 Mins)'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions: Edit Details or Cancel */}
                  <div className="flex gap-2">
                    {(orderDetail.status === 'PENDING_INITIALIZATION' || orderDetail.status === 'PAYMENT_REQUIRED') && (
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700 cursor-pointer"
                      >
                        Edit Details
                      </button>
                    )}

                    {(orderDetail.status === 'PENDING_INITIALIZATION' || orderDetail.status === 'PAYMENT_REQUIRED') && (
                      <button
                        onClick={() => handleCancelOrder(orderDetail.id)}
                        disabled={actionLoadingId === orderDetail.id}
                        className="flex-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold py-2 rounded-lg transition border border-rose-800/50 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>

                  {/* Timeline History */}
                  {orderDetail.statusTimeline && orderDetail.statusTimeline.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Status Timeline</span>
                      <div className="flex flex-col gap-2">
                        {orderDetail.statusTimeline.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{item.status}</span>
                            <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedOrderId ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <span className="animate-spin inline-block mr-2">↻</span> Loading order details...
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  Select an order on the left to inspect customer pickup status.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal: New Order Creation */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Initialize New Customer Order</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Submit receipt or tracking details to register a package at ParcelHub.
            </p>

            <form onSubmit={handleCreateOrder} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Receipt / Waybill Image URL</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Product / Parcel Name</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Ergonomic Keyboard"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={newTrackingId}
                  onChange={(e) => setNewTrackingId(e.target.value)}
                  placeholder="e.g. TRK-889911"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Price (₱)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Order */}
      {isEditOpen && orderDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Update Order Details ({orderDetail.id})</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tracking ID</label>
                <input
                  type="text"
                  value={editTrackingId}
                  onChange={(e) => setEditTrackingId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={editRecipientName}
                    onChange={(e) => setEditRecipientName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Price (₱)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedOrderId}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {actionLoadingId === selectedOrderId ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStandaloneApp;

