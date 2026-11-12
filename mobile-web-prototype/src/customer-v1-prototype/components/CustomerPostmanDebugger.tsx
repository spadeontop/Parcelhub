import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomerEndpointId,
  CustomerListOrdersRes,
  CustomerOrderSummary,
  RequestLogEntry,
} from '../types';
import {
  buildCustomerCurlSnippet,
  buildCustomerEndpointBody,
  buildCustomerEndpointUrl,
  CUSTOMER_ORDER_STATUS_OPTIONS,
  CUSTOMER_V1_ENDPOINTS,
  CustomerEndpointFormValues,
  getCustomerEndpointSpec,
  SAMPLE_RECEIPT_IMAGES,
  SEEDED_CUSTOMER_ACCOUNTS,
  SEEDED_CUSTOMER_SAMPLE_ORDERS,
} from '../endpoints';
import { UseCustomerV1SessionReturn } from '../useCustomerV1Session';

interface CustomerPostmanDebuggerProps {
  session: UseCustomerV1SessionReturn;
}

type BottomInspectorTab = 'dual' | 'headers' | 'history';

function getStatusBadgeClasses(status: number, ok: boolean): string {
  if (status === 0) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (ok) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (status === 401 || status === 403) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
}

function getMethodBadgeClasses(method: string): string {
  if (method === 'GET') return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  if (method === 'POST') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (method === 'PUT') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

function getOrderStatusPillClasses(status: string): string {
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
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  }
}

export const CustomerPostmanDebugger: React.FC<CustomerPostmanDebuggerProps> = ({ session }) => {
  const {
    baseUrl,
    preAuthToken,
    authToken,
    refreshToken,
    customerProfile,
    logout,
    orders,
    requestLogs,
    activeLog: _globalActiveLog,
    selectedLogId,
    setSelectedLogId,
    clearLogs,
    sendRequest,
    fullSeedLogin,
    fetchOrders,
    showToast,
    inspectedEndpointId,
    setInspectedEndpointId,
  } = session;

  const [activeEndpointId, setActiveEndpointId] = useState<CustomerEndpointId>('login');
  const [selectedSeedIdx, setSelectedSeedIdx] = useState<number>(0);
  const [includeAuthOverride, setIncludeAuthOverride] = useState<boolean>(false);
  const [useTicketCode, setUseTicketCode] = useState<boolean>(false);
  const [customBodyMode, setCustomBodyMode] = useState<boolean>(false);
  const [customBodyText, setCustomBodyText] = useState<string>('{}');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<BottomInspectorTab>('dual');
  const [showFullToken, setShowFullToken] = useState<boolean>(false);
  const [historyScope, setHistoryScope] = useState<'endpoint' | 'all'>('endpoint');

  // Separated Live HTTP Inspector state per /api/v1/customer collection endpoint
  const [selectedLogIdByEndpoint, setSelectedLogIdByEndpoint] = useState<
    Partial<Record<CustomerEndpointId, string>>
  >({});

  const activeSpec = useMemo(() => getCustomerEndpointSpec(activeEndpointId), [activeEndpointId]);

  // Logs filtered to the currently active endpoint
  const endpointLogs = useMemo(
    () => requestLogs.filter((l) => l.endpointId === activeEndpointId),
    [requestLogs, activeEndpointId]
  );

  // Dedicated active log for the selected collection endpoint
  const activeLog = useMemo(() => {
    const selectedId = selectedLogIdByEndpoint[activeEndpointId];
    if (selectedId) {
      const found = endpointLogs.find((l) => l.id === selectedId);
      if (found) return found;
    }
    return endpointLogs[0] || null;
  }, [endpointLogs, selectedLogIdByEndpoint, activeEndpointId]);

  const activeSeed = SEEDED_CUSTOMER_ACCOUNTS[selectedSeedIdx] || SEEDED_CUSTOMER_ACCOUNTS[0];

  const [form, setForm] = useState<CustomerEndpointFormValues>({
    email: activeSeed.email,
    password: activeSeed.password,
    firstName: activeSeed.firstName,
    lastName: activeSeed.lastName,
    middleInitial: activeSeed.middleInitial,
    phoneNumber: activeSeed.phoneNumber,
    mpin: activeSeed.mpin,
    preAuthToken,
    refreshToken,
    orderId: SEEDED_CUSTOMER_SAMPLE_ORDERS[0].id,
    typeFilter: 'ALL',
    limit: '20',
    offset: '0',
    initImageUrl: SAMPLE_RECEIPT_IMAGES[0].url,
    trackingId: SEEDED_CUSTOMER_SAMPLE_ORDERS[0].trackingId,
    productName: SEEDED_CUSTOMER_SAMPLE_ORDERS[0].productName,
    recipientName: SEEDED_CUSTOMER_SAMPLE_ORDERS[0].recipientName,
    price: String(SEEDED_CUSTOMER_SAMPLE_ORDERS[0].price || 480),
  });

  // Keep form's preAuthToken & refreshToken synced when session captures fresh tokens
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preAuthToken,
      refreshToken,
    }));
  }, [preAuthToken, refreshToken]);

  // Sync if Real UI jumped here via "Inspect in Debugger"
  useEffect(() => {
    if (inspectedEndpointId) {
      setActiveEndpointId(inspectedEndpointId);
      if (session.selectedLogId) {
        setSelectedLogIdByEndpoint((prev) => ({
          ...prev,
          [inspectedEndpointId]: session.selectedLogId!,
        }));
      }
      setBottomTab('dual');
      setInspectedEndpointId(null);
    }
  }, [inspectedEndpointId, setInspectedEndpointId, session.selectedLogId]);

  const availableOrders = useMemo(() => {
    if (orders.length > 0) {
      return orders.map((o) => ({
        id: o.id,
        ticketCode: o.ticketCode || '',
        status: o.status,
        price: 0,
        trackingId: o.trackingId || '',
        productName: o.productName || 'Draft Parcel',
        label: `${o.productName || 'Draft Parcel'} • ${o.trackingId || 'No Tracking'}`,
        isClaimActive: o.isClaimActive,
        raw: o as CustomerOrderSummary | undefined,
      }));
    }
    return SEEDED_CUSTOMER_SAMPLE_ORDERS.map((s) => ({
      id: s.id,
      ticketCode: s.ticketCode,
      status: s.status,
      price: s.price,
      trackingId: s.trackingId,
      productName: s.productName,
      label: s.label,
      isClaimActive: undefined as boolean | undefined,
      raw: undefined as CustomerOrderSummary | undefined,
    }));
  }, [orders]);

  const matchedSelectedOrder = useMemo(() => {
    const clean = form.orderId.trim();
    return availableOrders.find((o) => o.id === clean || (o.ticketCode && o.ticketCode === clean));
  }, [availableOrders, form.orderId]);

  const selectOrderChoice = (
    orderId: string,
    ticketCode?: string | null,
    trackingId?: string | null,
    productName?: string
  ) => {
    const nextVal = useTicketCode && ticketCode ? ticketCode : orderId;
    setForm((prev) => ({
      ...prev,
      orderId: nextVal,
      trackingId: trackingId || prev.trackingId,
      productName: productName || prev.productName,
    }));
  };

  const handleSelectSeedAccount = (idx: number) => {
    setSelectedSeedIdx(idx);
    const seed = SEEDED_CUSTOMER_ACCOUNTS[idx] || SEEDED_CUSTOMER_ACCOUNTS[0];
    setForm((prev) => ({
      ...prev,
      email: seed.email,
      password: seed.password,
      firstName: seed.firstName,
      lastName: seed.lastName,
      middleInitial: seed.middleInitial,
      phoneNumber: seed.phoneNumber,
      mpin: seed.mpin,
      recipientName: `${seed.firstName} ${seed.lastName}`,
    }));
  };

  const handleSelectEndpoint = (id: CustomerEndpointId) => {
    setActiveEndpointId(id);
    setCustomBodyMode(false);
    const nextSpec = getCustomerEndpointSpec(id);
    setIncludeAuthOverride(nextSpec.requiresAuth);
    // Note: Keep form.orderId consistent across collection switches;
    // only changes when clicking an order in Target Order (Live DB) or response pills.
  };

  const resolvedUrl = useMemo(
    () => buildCustomerEndpointUrl(activeSpec, baseUrl, form),
    [activeSpec, baseUrl, form]
  );

  const generatedBody = useMemo(
    () => buildCustomerEndpointBody(activeSpec.id, form),
    [activeSpec.id, form]
  );

  const generatedBodyText = useMemo(
    () => (generatedBody !== null ? JSON.stringify(generatedBody, null, 2) : ''),
    [generatedBody]
  );

  useEffect(() => {
    if (!customBodyMode) {
      setCustomBodyText(generatedBodyText || '{}');
    }
  }, [generatedBodyText, customBodyMode]);

  const resolvedHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (activeSpec.method !== 'GET') {
      h['Content-Type'] = 'application/json';
    }
    if (includeAuthOverride && authToken) {
      h['Authorization'] = `Bearer ${authToken}`;
    }
    return h;
  }, [activeSpec.method, includeAuthOverride, authToken]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const entry = await sendRequest({
        endpointId: activeSpec.id,
        source: 'debug',
        method: activeSpec.method,
        url: resolvedUrl,
        includeAuth: includeAuthOverride,
        body: customBodyMode ? undefined : generatedBody,
        rawBodyText: customBodyMode && activeSpec.method !== 'GET' ? customBodyText : undefined,
      });

      setSelectedLogIdByEndpoint((prev) => ({
        ...prev,
        [activeSpec.id]: entry.id,
      }));

      setBottomTab('dual');
      if (entry.response.ok) {
        if (activeSpec.id === 'login' || activeSpec.id === 'register') {
          showToast('preAuthToken captured! Proceed to Verify MPIN or Create MPIN.');
        } else if (activeSpec.id === 'verify_mpin' || activeSpec.id === 'create_mpin') {
          showToast('MPIN verified! authToken & refreshToken captured!');
          await fetchOrders({ silent: true, source: 'debug' });
        } else if (activeSpec.id === 'refresh_token') {
          showToast('Fresh 15m authToken unlocked via refreshToken!');
        } else {
          showToast(`${activeSpec.shortLabel}: ${entry.response.status} OK (${entry.response.durationMs}ms)`);
          if (
            activeSpec.id === 'initialize_order' ||
            activeSpec.id === 'update_order' ||
            activeSpec.id === 'claim_order'
          ) {
            await fetchOrders({ silent: true, source: 'debug' });
          }
        }
      } else {
        const errMsg =
          entry.response.body && typeof entry.response.body === 'object' && 'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : `HTTP ${entry.response.status}`;
        showToast(`${activeSpec.shortLabel} failed: ${errMsg}`, 'error');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickFullLogin = async () => {
    setIsQuickLoggingIn(true);
    try {
      const res = await fullSeedLogin(form.email, form.password, form.mpin, 'debug');
      if (res.mpinEntry) {
        setSelectedLogIdByEndpoint((prev) => ({
          ...prev,
          login: res.loginEntry?.id,
          verify_mpin: res.mpinEntry?.id,
        }));
      }
      setBottomTab('dual');
      if (res.ok) {
        showToast(`Full 2-step login succeeded for ${form.email} & synced orders!`);
      } else {
        showToast('Quick 2-step login failed — inspect Response panel.', 'error');
      }
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${label} to clipboard!`);
    } catch {
      showToast(`Unable to copy ${label}`, 'error');
    }
  };

  // Specific contextual action button per endpoint
  const simulatedAction = useMemo(() => {
    switch (activeSpec.id) {
      case 'login':
        return {
          label: 'Verify Credentials',
          icon: '🔑',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white',
        };
      case 'register':
        return {
          label: 'Register Customer',
          icon: '📝',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white',
        };
      case 'verify_mpin':
        return {
          label: 'Unlock with MPIN',
          icon: '🔢',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40 text-white',
        };
      case 'create_mpin':
        return {
          label: 'Set 4-Digit MPIN',
          icon: '🛡',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40 text-white',
        };
      case 'refresh_token':
        return {
          label: 'Refresh Session',
          icon: '🔄',
          buttonClass: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40 text-white',
        };
      case 'get_profile':
        return {
          label: 'Fetch Profile',
          icon: '👤',
          buttonClass: 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40 text-white',
        };
      case 'list_orders':
        return {
          label: 'Fetch My Orders',
          icon: '📦',
          buttonClass: 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40 text-white',
        };
      case 'initialize_order':
        return {
          label: 'Initialize Order',
          icon: '📸',
          buttonClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40 text-white',
        };
      case 'get_order':
        return {
          label: 'Load Order Details',
          icon: '🔍',
          buttonClass: 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40 text-white',
        };
      case 'update_order':
        return {
          label: 'Confirm Order Details',
          icon: '✏️',
          buttonClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 text-white',
        };
      case 'claim_order':
        return {
          label: 'Initiate 5m Claim',
          icon: '🎟',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white',
        };
      default:
        return {
          label: activeSpec.shortLabel,
          icon: '⚡',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
    }
  }, [activeSpec]);

  // Extract orders from active response for clickable target pills
  const responseOrders = useMemo(() => {
    const body = activeLog?.response.body;
    if (body && typeof body === 'object' && 'orders' in body) {
      const maybeList = (body as Partial<CustomerListOrdersRes>).orders;
      if (Array.isArray(maybeList)) return maybeList;
    }
    return [];
  }, [activeLog]);

  // Also allow targeting newly initialized orderId directly from response
  const responseInitializedOrder = useMemo(() => {
    const body = activeLog?.response.body;
    if (body && typeof body === 'object' && 'orderId' in body && 'ticketCode' in body) {
      const b = body as { orderId?: string; ticketCode?: string };
      if (b.orderId) return { id: b.orderId, ticketCode: b.ticketCode || '' };
    }
    return null;
  }, [activeLog]);

  return (
    <div className="flex-1 max-w-[1700px] w-full mx-auto p-2.5 sm:p-3.5 flex flex-col gap-2.5 overflow-hidden h-full">
      {/* 1. TOP HORIZONTAL /api/v1/customer COLLECTION BAR */}
      <section className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              /api/v1/customer Collection
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              ({CUSTOMER_V1_ENDPOINTS.length} Endpoints • Click to switch)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Selected Path &#123;id&#125;:</span>
            <span className="text-indigo-300 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              {form.orderId || 'None'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {CUSTOMER_V1_ENDPOINTS.map((ep) => {
            const isSelected = ep.id === activeEndpointId;
            return (
              <button
                key={ep.id}
                type="button"
                aria-label={`Select ${ep.title}`}
                onClick={() => handleSelectEndpoint(ep.id)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-900/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeClasses(
                    ep.method
                  )}`}
                >
                  {ep.method}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{ep.shortLabel}</span>
                  <span className="text-[9px] font-mono text-slate-400 leading-tight">
                    {ep.pathTemplate.replace('/api/v1/customer', '') || '/'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MIDDLE 3-COLUMN WORKSPACE: [Column 1: Customer Auth] | [Column 2: Main Function] | [Column 3: Target Order] */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch lg:h-[340px] lg:max-h-[340px]">
        {/* COLUMN 1 (Left): Customer Auth Session (2-step token pipeline) */}
        <aside className="lg:col-span-3 min-h-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm overflow-hidden">
          <div className="space-y-2 overflow-y-auto scrollbar-thin min-h-0 pr-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>🔐</span>
                <span>Customer Auth Session</span>
              </span>
              {authToken ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bearer Active
                </span>
              ) : preAuthToken ? (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Pre-Auth Only
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Unauthenticated
                </span>
              )}
            </div>

            {/* Seeded Customer Switcher */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Seeded Customer
                </span>
                <div className="flex gap-1">
                  {SEEDED_CUSTOMER_ACCOUNTS.map((acc, idx) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectSeedAccount(idx)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border cursor-pointer transition ${
                        selectedSeedIdx === idx
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {acc.firstName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div className="col-span-2 bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800/80 truncate">
                  <span className="text-slate-500 block text-[8px]">EMAIL</span>
                  <span className="text-slate-200 font-bold truncate">{activeSeed.email}</span>
                </div>
                <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px]">MPIN</span>
                  <span className="text-slate-200 font-bold">{activeSeed.mpin}</span>
                </div>
              </div>
            </div>

            {/* 3-Token Pipeline Status */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>
                  Customer:{' '}
                  <strong className="text-white">
                    {customerProfile
                      ? `${customerProfile.firstName} ${customerProfile.lastName}`
                      : 'None'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullToken((v) => !v)}
                  className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  {showFullToken ? 'Hide Tokens' : 'Show Tokens'}
                </button>
              </div>
              <div className="text-slate-400 break-all">
                <span className="text-emerald-400">auth:</span>{' '}
                {authToken
                  ? showFullToken
                    ? authToken
                    : `${authToken.slice(0, 18)}•••${authToken.slice(-6)}`
                  : 'empty'}
              </div>
              <div className="text-slate-400 break-all">
                <span className="text-blue-400">preAuth:</span>{' '}
                {preAuthToken
                  ? showFullToken
                    ? preAuthToken
                    : `${preAuthToken.slice(0, 18)}•••${preAuthToken.slice(-6)}`
                  : 'empty'}
              </div>
              <div className="text-slate-400 break-all">
                <span className="text-cyan-400">refresh:</span>{' '}
                {refreshToken
                  ? showFullToken
                    ? refreshToken
                    : `${refreshToken.slice(0, 18)}•••${refreshToken.slice(-6)}`
                  : 'empty'}
              </div>
            </div>

            {/* Quick Auth Actions */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleQuickFullLogin}
                disabled={isQuickLoggingIn}
                className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
                title="Chains POST /login -> POST /mpin automatically"
              >
                {isQuickLoggingIn ? 'Logging in...' : '⚡ 1-Click Full Seed Login'}
              </button>
              {authToken && (
                <>
                  <button
                    type="button"
                    onClick={() => fetchOrders({ source: 'debug' })}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    ↻ Sync
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/25 transition cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Persistent Auth Header Toggle */}
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAuthOverride}
                onChange={(e) => setIncludeAuthOverride(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900"
              />
              <span>Send Bearer Token</span>
            </label>
            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  buildCustomerCurlSnippet(
                    activeSpec.method,
                    resolvedUrl,
                    resolvedHeaders,
                    activeSpec.method !== 'GET'
                      ? customBodyMode
                        ? customBodyText
                        : generatedBodyText
                      : undefined
                  ),
                  'cURL command'
                )
              }
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 cursor-pointer"
            >
              cURL
            </button>
          </div>
        </aside>

        {/* COLUMN 2 (Center): Main Function & Parameter Controls */}
        <section className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
          {/* URL Bar & Dual Action Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate">{activeSpec.title}</h3>
                <p className="text-[11px] text-slate-400 truncate">{activeSpec.description}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-w-0">
                <span
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold border-r border-slate-800 shrink-0 ${getMethodBadgeClasses(
                    activeSpec.method
                  )}`}
                >
                  {activeSpec.method}
                </span>
                <input
                  type="text"
                  readOnly
                  aria-label="Resolved Request URL"
                  value={resolvedUrl}
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none min-w-0"
                />
              </div>

              {/* DUAL BUTTON BAR */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  aria-label={simulatedAction.label}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${simulatedAction.buttonClass}`}
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin inline-block">↻</span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{simulatedAction.icon}</span>
                      <span>{simulatedAction.label}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  aria-label="Send Request"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <span>Send</span>
                  <span>▶</span>
                </button>
              </div>
            </div>

            {activeSpec.guardHint && (
              <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="text-indigo-400 font-bold shrink-0">ℹ</span>
                <span className="truncate">{activeSpec.guardHint}</span>
              </div>
            )}
          </div>

          {/* Endpoint-Specific Form Controls */}
          <div className="border-t border-slate-800 pt-2 space-y-2">
            {/* Login / Register Fields */}
            {(activeSpec.id === 'login' || activeSpec.id === 'register') && (
              <div className="space-y-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="cdbg-email" className="block text-[10px] text-slate-400 mb-0.5">
                      email
                    </label>
                    <input
                      id="cdbg-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="cdbg-password" className="block text-[10px] text-slate-400 mb-0.5">
                      password
                    </label>
                    <input
                      id="cdbg-password"
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {activeSpec.id === 'register' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label htmlFor="cdbg-fname" className="block text-[10px] text-slate-400 mb-0.5">
                        firstName
                      </label>
                      <input
                        id="cdbg-fname"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="cdbg-lname" className="block text-[10px] text-slate-400 mb-0.5">
                        lastName
                      </label>
                      <input
                        id="cdbg-lname"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="cdbg-mi" className="block text-[10px] text-slate-400 mb-0.5">
                        middleInitial
                      </label>
                      <input
                        id="cdbg-mi"
                        type="text"
                        value={form.middleInitial}
                        onChange={(e) => setForm((p) => ({ ...p, middleInitial: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="cdbg-phone" className="block text-[10px] text-slate-400 mb-0.5">
                        phoneNumber
                      </label>
                      <input
                        id="cdbg-phone"
                        type="text"
                        value={form.phoneNumber}
                        onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                )}

                {activeSpec.id === 'register' && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        email: `test.${Date.now().toString().slice(-4)}@example.com`,
                      }))
                    }
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[10px] font-mono cursor-pointer"
                  >
                    + Generate Unique Email
                  </button>
                )}
              </div>
            )}

            {/* Verify MPIN / Create MPIN / Refresh Token */}
            {(activeSpec.id === 'verify_mpin' ||
              activeSpec.id === 'create_mpin' ||
              activeSpec.id === 'refresh_token') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                <div className="sm:col-span-2">
                  <label htmlFor="cdbg-token-input" className="block text-[10px] text-slate-400 mb-0.5">
                    {activeSpec.id === 'refresh_token' ? 'refreshToken (30d)' : 'preAuthToken (5m)'}
                  </label>
                  <input
                    id="cdbg-token-input"
                    type="text"
                    value={activeSpec.id === 'refresh_token' ? form.refreshToken : form.preAuthToken}
                    onChange={(e) =>
                      setForm((p) =>
                        activeSpec.id === 'refresh_token'
                          ? { ...p, refreshToken: e.target.value }
                          : { ...p, preAuthToken: e.target.value }
                      )
                    }
                    placeholder="Auto-captured from previous step"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label htmlFor="cdbg-mpin" className="block text-[10px] text-slate-400 mb-0.5">
                    mpin (4 digits)
                  </label>
                  <input
                    id="cdbg-mpin"
                    type="text"
                    maxLength={4}
                    value={form.mpin}
                    onChange={(e) => setForm((p) => ({ ...p, mpin: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white tracking-widest"
                  />
                </div>
              </div>
            )}

            {/* List Orders Query Params */}
            {activeSpec.id === 'list_orders' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                <div>
                  <label htmlFor="cdbg-type" className="block text-[10px] text-slate-400 mb-0.5">
                    ?type= (Status Filter)
                  </label>
                  <select
                    id="cdbg-type"
                    value={form.typeFilter}
                    onChange={(e) => setForm((p) => ({ ...p, typeFilter: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  >
                    <option value="ALL">ALL</option>
                    {CUSTOMER_ORDER_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cdbg-limit" className="block text-[10px] text-slate-400 mb-0.5">
                    ?limit=
                  </label>
                  <input
                    id="cdbg-limit"
                    type="number"
                    value={form.limit}
                    onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label htmlFor="cdbg-offset" className="block text-[10px] text-slate-400 mb-0.5">
                    ?offset=
                  </label>
                  <input
                    id="cdbg-offset"
                    type="number"
                    value={form.offset}
                    onChange={(e) => setForm((p) => ({ ...p, offset: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {/* Initialize Order Body */}
            {activeSpec.id === 'initialize_order' && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <label htmlFor="cdbg-init-img" className="block text-[10px] text-slate-400">
                  imageUrl (Receipt / Checkout Screenshot)
                </label>
                <input
                  id="cdbg-init-img"
                  type="text"
                  value={form.initImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, initImageUrl: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_RECEIPT_IMAGES.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, initImageUrl: sample.url }))}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer transition ${
                        form.initImageUrl === sample.url
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Path Parameter {id} */}
            {activeSpec.hasOrderIdParam && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="cdbg-order-id" className="text-[10px] font-semibold text-slate-300">
                    Path Parameter <code className="text-indigo-300">&#123;id&#125;</code> (UUID or ticketCode)
                  </label>
                  {matchedSelectedOrder && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getOrderStatusPillClasses(
                        matchedSelectedOrder.status
                      )}`}
                    >
                      {matchedSelectedOrder.status}
                    </span>
                  )}
                </div>
                <input
                  id="cdbg-order-id"
                  type="text"
                  value={form.orderId}
                  onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}
                  placeholder="ORD-C1-PEND-01 or 101-111"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                />
              </div>
            )}

            {/* Update / Confirm Order (PUT) */}
            {activeSpec.id === 'update_order' && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label htmlFor="cdbg-tracking" className="block text-[10px] text-slate-400 mb-0.5">
                      trackingId
                    </label>
                    <input
                      id="cdbg-tracking"
                      type="text"
                      value={form.trackingId}
                      onChange={(e) => setForm((p) => ({ ...p, trackingId: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="cdbg-product" className="block text-[10px] text-slate-400 mb-0.5">
                      productName
                    </label>
                    <input
                      id="cdbg-product"
                      type="text"
                      value={form.productName}
                      onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="cdbg-recipient" className="block text-[10px] text-slate-400 mb-0.5">
                      recipientName
                    </label>
                    <input
                      id="cdbg-recipient"
                      type="text"
                      value={form.recipientName}
                      onChange={(e) => setForm((p) => ({ ...p, recipientName: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="cdbg-price" className="block text-[10px] text-slate-400 mb-0.5">
                      price (₱)
                    </label>
                    <input
                      id="cdbg-price"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Raw JSON override toggle */}
            {activeSpec.method !== 'GET' && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  JSON Body {customBodyMode ? '(Raw Override)' : '(Auto-Synced)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomBodyMode((v) => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium cursor-pointer ${
                      customBodyMode
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {customBodyMode ? 'Reset Auto' : 'Edit Raw JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(customBodyMode ? customBodyText : generatedBodyText, 'JSON body')
                    }
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                  >
                    Copy Body
                  </button>
                </div>
              </div>
            )}

            {activeSpec.method !== 'GET' && customBodyMode && (
              <textarea
                rows={3}
                aria-label="Raw Request JSON Body"
                value={customBodyText}
                onChange={(e) => setCustomBodyText(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-xs font-mono text-amber-100 focus:outline-none"
              />
            )}
          </div>
        </section>

        {/* COLUMN 3 (Right): Target Order Picker */}
        <aside className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-2 shadow-sm min-h-0 max-h-[340px] lg:max-h-none overflow-hidden">
          <div className="shrink-0 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>🎯</span>
              <span>Target Order ({orders.length > 0 ? 'Live DB' : 'Presets'})</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextUseTicket = !useTicketCode;
                setUseTicketCode(nextUseTicket);
                if (matchedSelectedOrder) {
                  setForm((prev) => ({
                    ...prev,
                    orderId:
                      nextUseTicket && matchedSelectedOrder.ticketCode
                        ? matchedSelectedOrder.ticketCode
                        : matchedSelectedOrder.id,
                  }));
                }
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
              title="Switch between Order ID (ORD-...) and Ticket Code (101-111)"
            >
              {useTicketCode ? 'Ticket Code' : 'Order ID'}
            </button>
          </div>

          <p className="shrink-0 text-[10px] text-slate-400">
            Click any order to load its &#123;id&#125; cleanly into requests:
          </p>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
            {availableOrders.map((ord) => {
              const targetVal = useTicketCode && ord.ticketCode ? ord.ticketCode : ord.id;
              const isSelected =
                form.orderId.trim() === ord.id ||
                (ord.ticketCode && form.orderId.trim() === ord.ticketCode);
              return (
                <button
                  key={ord.id}
                  type="button"
                  aria-label={`Target order ${targetVal}`}
                  onClick={() =>
                    selectOrderChoice(ord.id, ord.ticketCode, ord.trackingId, ord.productName)
                  }
                  className={`w-full text-left p-2 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-indigo-300 truncate">
                      {targetVal}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${getOrderStatusPillClasses(
                        ord.status
                      )}`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="truncate">{ord.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM SECTION: SEPARATED DUAL SIDE-BY-SIDE REQUEST & RESPONSE INSPECTOR */}
      <section className="flex-1 min-h-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col space-y-2 overflow-hidden">
        {/* Header Bar */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>⚡</span>
              <span>
                Live HTTP Inspector • <strong className="text-indigo-300">{activeSpec.shortLabel}</strong>
              </span>
            </h2>
            {activeLog ? (
              <>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${getStatusBadgeClasses(
                    activeLog.response.status,
                    activeLog.response.ok
                  )}`}
                >
                  {activeLog.response.status === 0
                    ? 'NET ERR'
                    : `${activeLog.response.status} ${activeLog.response.statusText}`}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeLog.response.durationMs}ms
                </span>
              </>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                Awaiting Run
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setBottomTab('dual')}
              className={`py-0.5 px-2.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                bottomTab === 'dual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side (Req + Res)
            </button>
            <button
              type="button"
              onClick={() => setBottomTab('headers')}
              className={`py-0.5 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                bottomTab === 'headers'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Headers
            </button>
            <button
              type="button"
              onClick={() => setBottomTab('history')}
              className={`py-0.5 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                bottomTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              History ({endpointLogs.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        {bottomTab === 'dual' ? (
          /* DUAL SIDE-BY-SIDE PANES */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
            {/* LEFT SIDE: Exact Request Sent or Prepared Request */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 min-h-0 overflow-hidden">
              <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      activeLog
                        ? getMethodBadgeClasses(activeLog.request.method)
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {activeLog ? 'REQUEST SENT' : 'PREPARED REQUEST'}
                  </span>
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {activeLog
                      ? `${activeLog.request.method} ${activeLog.request.url}`
                      : `${activeSpec.method} ${resolvedUrl}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      JSON.stringify(
                        activeLog
                          ? {
                              method: activeLog.request.method,
                              url: activeLog.request.url,
                              headers: activeLog.request.headers,
                              body: activeLog.request.body,
                            }
                          : {
                              method: activeSpec.method,
                              url: resolvedUrl,
                              headers: resolvedHeaders,
                              body: customBodyMode
                                ? customBodyText
                                : generatedBody,
                            },
                        null,
                        2
                      ),
                      'Request details'
                    )
                  }
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer shrink-0 ml-2"
                >
                  Copy
                </button>
              </div>

              {/* Request Headers */}
              <div className="shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Request Headers:</div>
                <pre className="text-[10px] font-mono text-amber-200/90 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 max-h-16 overflow-y-auto whitespace-pre-wrap break-all">
                  {Object.entries(activeLog ? activeLog.request.headers : resolvedHeaders)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n') || '(None)'}
                </pre>
              </div>

              {/* Request Body (Scrolls internally) */}
              <div className="flex-1 min-h-0 flex flex-col space-y-0.5 overflow-hidden">
                <div className="shrink-0 text-[10px] font-bold uppercase text-slate-500">Request Body:</div>
                <pre className="flex-1 overflow-y-auto text-[11px] font-mono text-emerald-300 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 whitespace-pre-wrap break-words leading-relaxed scrollbar-thin">
                  {activeLog
                    ? activeLog.request.body !== null && activeLog.request.body !== undefined
                      ? JSON.stringify(activeLog.request.body, null, 2)
                      : '(No request body sent)'
                    : activeSpec.method !== 'GET'
                    ? customBodyMode
                      ? customBodyText
                      : generatedBodyText || '(No request body)'
                    : '(GET requests do not have a request body)'}
                </pre>
              </div>
            </div>

            {/* RIGHT SIDE: Exact Response Received or Awaiting State */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 min-h-0 overflow-hidden">
              <div className="shrink-0 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      activeLog
                        ? getStatusBadgeClasses(activeLog.response.status, activeLog.response.ok)
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {activeLog ? `RESPONSE (${activeLog.response.status || 'ERR'})` : 'RESPONSE (IDLE)'}
                  </span>
                  <span className="text-xs font-mono text-slate-300 truncate">
                    {activeLog
                      ? `${activeLog.response.statusText} • ${activeLog.response.durationMs}ms`
                      : `Awaiting execution for ${activeSpec.shortLabel}`}
                  </span>
                </div>
                {activeLog && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        typeof activeLog.response.body === 'string'
                          ? activeLog.response.body
                          : JSON.stringify(activeLog.response.body, null, 2),
                        'Response JSON'
                      )
                    }
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer shrink-0 ml-2"
                  >
                    Copy
                  </button>
                )}
              </div>

              {activeLog ? (
                <>
                  {/* Clickable initialized order pill */}
                  {responseInitializedOrder && (
                    <div className="shrink-0 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold text-slate-400">
                        Initialized Order Created:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          selectOrderChoice(
                            responseInitializedOrder.id,
                            responseInitializedOrder.ticketCode
                          );
                          showToast(`Targeted ${responseInitializedOrder.id}`);
                        }}
                        className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 cursor-pointer"
                      >
                        Target {responseInitializedOrder.id} ({responseInitializedOrder.ticketCode})
                      </button>
                    </div>
                  )}

                  {/* Clickable order pills if response contains an orders array */}
                  {responseOrders.length > 0 && (
                    <div className="shrink-0 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 space-y-0.5">
                      <div className="text-[9px] font-semibold text-slate-400">
                        Click order to target in next request:
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                        {responseOrders.slice(0, 10).map((ord) => (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => {
                              selectOrderChoice(
                                ord.id,
                                ord.ticketCode || undefined,
                                ord.trackingId || undefined,
                                ord.productName
                              );
                              showToast(`Targeted ${ord.id} (${ord.status})`);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-indigo-600/20 border border-slate-700 text-[9px] font-mono text-indigo-300 cursor-pointer"
                          >
                            {ord.id} • {ord.status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Body (Scrolls internally) */}
                  <div className="flex-1 min-h-0 flex flex-col space-y-0.5 overflow-hidden">
                    <div className="shrink-0 text-[10px] font-bold uppercase text-slate-500">Response Payload:</div>
                    <pre className="flex-1 overflow-y-auto text-[11px] font-mono text-slate-200 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 whitespace-pre-wrap break-words leading-relaxed scrollbar-thin">
                      {typeof activeLog.response.body === 'string'
                        ? activeLog.response.body
                        : JSON.stringify(activeLog.response.body, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800/80 rounded-xl text-slate-500 gap-1.5">
                  <div className="text-xl">📡</div>
                  <p className="text-xs font-semibold text-slate-300">
                    No response yet for {activeSpec.title}
                  </p>
                  <p className="text-[11px] max-w-sm text-slate-400">
                    Click <strong>{simulatedAction.label}</strong> or <strong>Send ▶</strong> above to execute this endpoint. Its live response headers, status, and payload will render here.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : bottomTab === 'headers' ? (
          /* HEADERS TAB (Scrolls internally) */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-1 min-h-0 overflow-hidden">
              <div className="shrink-0 text-[10px] font-bold uppercase text-slate-400">
                {activeLog ? 'Request Headers (Sent)' : 'Request Headers (Prepared)'}
              </div>
              <pre className="flex-1 overflow-y-auto text-[10px] font-mono text-amber-200 whitespace-pre-wrap break-all p-2 bg-slate-900 rounded-lg border border-slate-800 scrollbar-thin">
                {JSON.stringify(activeLog ? activeLog.request.headers : resolvedHeaders, null, 2)}
              </pre>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-1 min-h-0 overflow-hidden">
              <div className="shrink-0 text-[10px] font-bold uppercase text-slate-400">Response Headers</div>
              <pre className="flex-1 overflow-y-auto text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all p-2 bg-slate-900 rounded-lg border border-slate-800 scrollbar-thin">
                {activeLog
                  ? Object.keys(activeLog.response.headers).length > 0
                    ? JSON.stringify(activeLog.response.headers, null, 2)
                    : '(No response headers captured)'
                  : '(Awaiting execution — no response headers yet)'}
              </pre>
            </div>
          </div>
        ) : (
          /* HISTORY TAB (Scrolls internally) */
          <div className="flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setHistoryScope('endpoint')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                    historyScope === 'endpoint'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeSpec.shortLabel} Only ({endpointLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryScope('all')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                    historyScope === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Endpoints ({requestLogs.length})
                </button>
              </div>

              <button
                type="button"
                onClick={clearLogs}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Clear All History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 scrollbar-thin">
              {(historyScope === 'endpoint' ? endpointLogs : requestLogs).length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  No request history recorded for {historyScope === 'endpoint' ? activeSpec.shortLabel : 'any endpoint'} yet.
                </div>
              ) : (
                (historyScope === 'endpoint' ? endpointLogs : requestLogs).map((item: RequestLogEntry) => {
                  const selected = activeLog ? item.id === activeLog.id : false;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedLogId(item.id);
                        setSelectedLogIdByEndpoint((prev) => ({
                          ...prev,
                          [item.endpointId]: item.id,
                        }));
                        if (item.endpointId !== activeEndpointId) {
                          setActiveEndpointId(item.endpointId);
                        }
                        setBottomTab('dual');
                      }}
                      className={`text-left p-2 rounded-xl border transition cursor-pointer space-y-0.5 ${
                        selected
                          ? 'bg-indigo-950/50 border-indigo-500/70'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeClasses(
                            item.request.method
                          )}`}
                        >
                          {item.request.method}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getStatusBadgeClasses(
                            item.response.status,
                            item.response.ok
                          )}`}
                        >
                          {item.response.status || 'ERR'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white truncate">{item.endpointTitle}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{item.request.url}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
