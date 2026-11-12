import React, { useState, useEffect, useMemo } from 'react';
import {
  RequestLogEntry,
  StaffEndpointId,
  StaffListOrdersRes,
  StaffOrderSummary,
} from '../types';
import {
  buildCurlSnippet,
  buildEndpointBody,
  buildEndpointUrl,
  EndpointFormValues,
  getEndpointSpec,
  SAMPLE_PROOF_IMAGES,
  SEEDED_SAMPLE_ORDERS,
  SEEDED_STAFF_CREDENTIALS,
  STAFF_ORDER_STATUS_OPTIONS,
  STAFF_V1_ENDPOINTS,
} from '../endpoints';
import { UseStaffV1SessionReturn } from '../useStaffV1Session';

interface StaffPostmanDebuggerProps {
  session: UseStaffV1SessionReturn;
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
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

function getOrderStatusPillClasses(status: string): string {
  switch (status) {
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

export const StaffPostmanDebugger: React.FC<StaffPostmanDebuggerProps> = ({ session }) => {
  const {
    baseUrl,
    authToken,
    staffUsername,
    orders,
    requestLogs,
    activeLog: _globalActiveLog,
    setSelectedLogId,
    clearLogs,
    showToast,
    sendRequest,
    login,
    fetchOrders,
    logout,
    inspectedEndpointId,
    setInspectedEndpointId,
  } = session;

  const [activeEndpointId, setActiveEndpointId] = useState<StaffEndpointId>('login');
  const [useTicketCode, setUseTicketCode] = useState<boolean>(false);
  const [includeAuthOverride, setIncludeAuthOverride] = useState<boolean>(true);
  const [customBodyMode, setCustomBodyMode] = useState<boolean>(false);
  const [customBodyText, setCustomBodyText] = useState<string>('{}');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<BottomInspectorTab>('dual');
  const [showFullToken, setShowFullToken] = useState<boolean>(true);
  const [historyScope, setHistoryScope] = useState<'endpoint' | 'all'>('endpoint');

  // Separated Live HTTP Inspector state per /api/v1/staff collection endpoint
  const [selectedLogIdByEndpoint, setSelectedLogIdByEndpoint] = useState<Partial<Record<StaffEndpointId, string>>>({});

  const activeSpec = useMemo(() => getEndpointSpec(activeEndpointId), [activeEndpointId]);

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

  const [form, setForm] = useState<EndpointFormValues>({
    username: SEEDED_STAFF_CREDENTIALS.username,
    password: SEEDED_STAFF_CREDENTIALS.password,
    orderId: SEEDED_SAMPLE_ORDERS[0].id,
    statusFilter: 'ALL',
    limit: '20',
    offset: '0',
    amountReceived: String(SEEDED_SAMPLE_ORDERS[0].price),
    imageUrl: SAMPLE_PROOF_IMAGES[0].url,
  });

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

  // Combined order choices: live DB orders if loaded, otherwise seeded samples
  const availableOrders = useMemo(() => {
    if (orders.length > 0) {
      return orders.map((o) => ({
        id: o.id,
        ticketCode: o.ticketCode || '',
        status: o.status,
        price: o.amountToPay,
        label: `${o.customer} • ${o.trackingId}`,
        courierPaid: o.courierPaid,
        isClaimActive: o.isClaimActive,
        raw: o,
      }));
    }
    return SEEDED_SAMPLE_ORDERS.map((s) => ({
      id: s.id,
      ticketCode: s.ticketCode,
      status: s.status,
      price: s.price,
      label: s.label,
      courierPaid: undefined as boolean | undefined,
      isClaimActive: undefined as boolean | undefined,
      raw: undefined as StaffOrderSummary | undefined,
    }));
  }, [orders]);

  const matchedSelectedOrder = useMemo(() => {
    const clean = form.orderId.trim();
    return availableOrders.find((o) => o.id === clean || (o.ticketCode && o.ticketCode === clean));
  }, [availableOrders, form.orderId]);

  const selectOrderChoice = (orderId: string, ticketCode?: string, price?: number) => {
    const nextVal = useTicketCode && ticketCode ? ticketCode : orderId;
    setForm((prev: EndpointFormValues) => ({
      ...prev,
      orderId: nextVal,
      amountReceived: typeof price === 'number' && price > 0 ? String(price) : prev.amountReceived,
    }));
  };

  const handleSelectEndpoint = (id: StaffEndpointId) => {
    setActiveEndpointId(id);
    setCustomBodyMode(false);
    const nextSpec = getEndpointSpec(id);
    setIncludeAuthOverride(nextSpec.requiresAuth);
    // Note: Do not automatically reassign form.orderId on endpoint switch!
    // The Selected Path {id} remains consistent across all /api/v1/staff collection endpoints,
    // and only changes when explicitly clicking an order in the Target Order picker.
  };

  const resolvedUrl = useMemo(
    () => buildEndpointUrl(activeSpec, baseUrl, form),
    [activeSpec, baseUrl, form]
  );

  const generatedBody = useMemo(
    () => buildEndpointBody(activeSpec.id, form),
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
        if (activeSpec.id === 'login') {
          showToast('Staff logged in & JWT Bearer token captured automatically!');
          await fetchOrders({ silent: true, source: 'debug' });
        } else {
          showToast(`${activeSpec.shortLabel}: ${entry.response.status} OK (${entry.response.durationMs}ms)`);
          if (
            activeSpec.id === 'activate_order' ||
            activeSpec.id === 'pay_courier' ||
            activeSpec.id === 'attach_photo' ||
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

  const handleQuickLogin = async () => {
    setIsQuickLoggingIn(true);
    try {
      const entry = await login(
        SEEDED_STAFF_CREDENTIALS.username,
        SEEDED_STAFF_CREDENTIALS.password,
        'debug'
      );
      setSelectedLogIdByEndpoint((prev) => ({
        ...prev,
        login: entry.id,
      }));
      setBottomTab('dual');
      if (entry.response.ok) {
        showToast('Logged in as "staff" & fetched live orders!');
        await fetchOrders({ silent: true, source: 'debug' });
      } else {
        showToast('Quick login failed — inspect Response panel.', 'error');
      }
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    showToast(`${label} copied to clipboard.`);
  };

  // Specific simulation action label and styling depending on endpoint
  const simulatedAction = useMemo(() => {
    switch (activeSpec.id) {
      case 'login':
        return {
          label: 'Login',
          icon: '🔑',
          badge: 'Simulate Auth',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40 text-white',
        };
      case 'activate_order':
        return {
          label: 'Receive Cash & Activate',
          icon: '💵',
          badge: 'Simulate Cash In',
          buttonClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40 text-white',
        };
      case 'pay_courier':
        return {
          label: 'Pay Courier COD',
          icon: '🏍️',
          badge: 'Simulate Courier Payment',
          buttonClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 text-white',
        };
      case 'attach_photo':
        return {
          label: 'Attach Photo & Make Claimable',
          icon: '📸',
          badge: 'Simulate Proof Intake',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white',
        };
      case 'claim_order':
        return {
          label: 'Release Parcel to Customer',
          icon: '📦',
          badge: 'Simulate Handover',
          buttonClass: 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/40 text-white',
        };
      case 'list_orders':
        return {
          label: 'Fetch Order List',
          icon: '📋',
          badge: 'Simulate Query',
          buttonClass: 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/40 text-white',
        };
      case 'get_order':
        return {
          label: 'Fetch Order Detail',
          icon: '🔍',
          badge: 'Simulate Lookup',
          buttonClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40 text-white',
        };
      default:
        return {
          label: activeSpec.title,
          icon: '⚡',
          badge: 'Simulate Action',
          buttonClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 text-white',
        };
    }
  }, [activeSpec]);

  // Extract orders from active response if it's a list_orders payload for clickable IDs
  const responseOrders = useMemo(() => {
    const body = activeLog?.response.body;
    if (body && typeof body === 'object' && 'orders' in body) {
      const maybeList = (body as Partial<StaffListOrdersRes>).orders;
      if (Array.isArray(maybeList)) return maybeList;
    }
    return [];
  }, [activeLog]);

  return (
    <div className="flex-1 max-w-[1700px] w-full mx-auto p-2.5 sm:p-3.5 flex flex-col gap-2.5 overflow-hidden h-full">
      {/* 1. TOP HORIZONTAL: /api/v1/staff Collection Ribbon */}
      <section className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              /api/v1/staff Collection
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              ({STAFF_V1_ENDPOINTS.length} Endpoints • Click to switch)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Targeting: <strong className="text-blue-300 font-semibold">{activeSpec.title}</strong></span>
          </div>
        </div>

        {/* Horizontal Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {STAFF_V1_ENDPOINTS.map((ep) => {
            const isActive = ep.id === activeEndpointId;
            return (
              <button
                key={ep.id}
                type="button"
                aria-label={`Select ${ep.title}`}
                onClick={() => handleSelectEndpoint(ep.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/80 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${getMethodBadgeClasses(
                    ep.method
                  )}`}
                >
                  {ep.method}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{ep.shortLabel}</span>
                  <span className="text-[9px] font-mono text-slate-400 leading-tight">
                    {ep.pathTemplate.replace('/api/v1/staff', '') || '/'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MIDDLE 3-COLUMN WORKSPACE: [Column 1: Staff Auth] | [Column 2: Main Function] | [Column 3: Target Order] */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch lg:h-[340px] lg:max-h-[340px]">
        {/* COLUMN 1 (Left): Staff Auth Session (Always visible) */}
        <aside className="lg:col-span-3 min-h-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm overflow-hidden">
          <div className="space-y-2 overflow-y-auto scrollbar-thin min-h-0 pr-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>🔐</span>
                <span>Staff Auth Session</span>
              </span>
              {authToken ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bearer Active
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Unauthenticated
                </span>
              )}
            </div>

            {/* Default Seed Account Credentials (Always visible so default credentials are clear) */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Default Staff Account</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  Hub Staff (Default)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800/80">
                  <span className="text-slate-500 block text-[9px]">USER</span>
                  <span className="text-slate-200 font-bold">{SEEDED_STAFF_CREDENTIALS.username}</span>
                </div>
                <div className="bg-slate-900/90 rounded-lg px-2 py-1 border border-slate-800/80">
                  <span className="text-slate-500 block text-[9px]">PASSWORD</span>
                  <span className="text-slate-200 font-bold">{SEEDED_STAFF_CREDENTIALS.password}</span>
                </div>
              </div>
            </div>

            {/* Token details or 1-Click quick login */}
            {authToken ? (
              <div className="space-y-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-[11px] font-mono text-slate-300 break-all max-h-24 overflow-y-auto scrollbar-thin">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 sticky top-0 bg-slate-950 pb-0.5">
                    <span>Operator: <strong className="text-white">{staffUsername}</strong></span>
                    <button
                      type="button"
                      onClick={() => setShowFullToken((v) => !v)}
                      className="text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {showFullToken ? 'Hide' : 'Show JWT'}
                    </button>
                  </div>
                  {showFullToken ? authToken : `${authToken.slice(0, 24)}•••••${authToken.slice(-8)}`}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fetchOrders({ source: 'debug' })}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    ↻ Sync Orders
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    disabled={isQuickLoggingIn}
                    className="py-1.5 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                  >
                    {isQuickLoggingIn ? '...' : '⚡ 1-Click Seed Login'}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/25 transition cursor-pointer"
                    title="Clear token to test 401 Unauthorized responses"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 leading-snug">
                  Sign in with official hub credentials to obtain Bearer tokens for lifecycle requests.
                </p>
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={isQuickLoggingIn}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition cursor-pointer disabled:opacity-60"
                >
                  {isQuickLoggingIn ? 'Logging in...' : '⚡ 1-Click Seed Login (staff / string)'}
                </button>
              </div>
            )}
          </div>

          {/* Persistent Auth Header Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between shrink-0">
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
                  buildCurlSnippet(
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
        <section className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm min-h-0 flex flex-col overflow-y-auto scrollbar-thin">
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
                <span className="text-blue-400 font-bold shrink-0">ℹ</span>
                <span className="truncate">{activeSpec.guardHint}</span>
              </div>
            )}
          </div>

          {/* Form Fields & Presets */}
          <div className="border-t border-slate-800 pt-2 space-y-2">
            {/* 1. Login Form */}
            {activeSpec.id === 'login' && (
              <div className="space-y-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="dbg-username" className="block text-[10px] text-slate-400 mb-0.5">
                      username
                    </label>
                    <input
                      id="dbg-username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, username: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="dbg-password" className="block text-[10px] text-slate-400 mb-0.5">
                      password
                    </label>
                    <input
                      id="dbg-password"
                      type="text"
                      value={form.password}
                      onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p: EndpointFormValues) => ({
                        ...p,
                        username: SEEDED_STAFF_CREDENTIALS.username,
                        password: SEEDED_STAFF_CREDENTIALS.password,
                      }))
                    }
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold cursor-pointer"
                  >
                    Fill Seeded (staff / string)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p: EndpointFormValues) => ({ ...p, username: 'staff', password: 'wrong-password' }))
                    }
                    className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-[10px] font-semibold cursor-pointer"
                  >
                    Test 401 Wrong Password
                  </button>
                </div>
              </div>
            )}

            {/* 2. List Orders Query Params */}
            {activeSpec.id === 'list_orders' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                <div>
                  <label htmlFor="dbg-status-filter" className="block text-[10px] text-slate-400 mb-0.5">
                    status
                  </label>
                  <select
                    id="dbg-status-filter"
                    value={form.statusFilter}
                    onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, statusFilter: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  >
                    <option value="ALL">ALL (omit)</option>
                    {STAFF_ORDER_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dbg-limit" className="block text-[10px] text-slate-400 mb-0.5">
                    limit
                  </label>
                  <input
                    id="dbg-limit"
                    type="number"
                    value={form.limit}
                    onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, limit: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label htmlFor="dbg-offset" className="block text-[10px] text-slate-400 mb-0.5">
                    offset
                  </label>
                  <input
                    id="dbg-offset"
                    type="number"
                    value={form.offset}
                    onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, offset: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {/* 3. Path Parameter {id} Selector */}
            {activeSpec.hasOrderIdParam && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="dbg-order-id" className="text-[10px] text-slate-400">
                    Selected Path <code className="text-blue-300">{'{id}'}</code>
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

                <div className="flex gap-2">
                  <input
                    id="dbg-order-id"
                    type="text"
                    value={form.orderId}
                    onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, orderId: e.target.value }))}
                    placeholder="ORD-C1-PAY-01 or 101-201"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {/* 4. Activate Order Body */}
            {activeSpec.id === 'activate_order' && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <label htmlFor="dbg-amount-received" className="block text-[10px] text-slate-400">
                  amountReceived (₱)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    id="dbg-amount-received"
                    type="number"
                    value={form.amountReceived}
                    onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, amountReceived: e.target.value }))}
                    className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                  />
                  <div className="flex flex-wrap gap-1">
                    {matchedSelectedOrder && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p: EndpointFormValues) => ({ ...p, amountReceived: String(matchedSelectedOrder.price) }))
                          }
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono cursor-pointer"
                        >
                          Exact ₱{matchedSelectedOrder.price}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p: EndpointFormValues) => ({
                              ...p,
                              amountReceived: String(matchedSelectedOrder.price + 100),
                            }))
                          }
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono cursor-pointer"
                        >
                          +₱100 (₱{matchedSelectedOrder.price + 100})
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((p: EndpointFormValues) => ({ ...p, amountReceived: '500' }))}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono cursor-pointer"
                    >
                      ₱500
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p: EndpointFormValues) => ({ ...p, amountReceived: '10' }))}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-[10px] font-mono cursor-pointer"
                    >
                      Underpay (₱10)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Attach Photo Body */}
            {activeSpec.id === 'attach_photo' && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <label htmlFor="dbg-image-url" className="block text-[10px] text-slate-400">
                  imageUrl
                </label>
                <input
                  id="dbg-image-url"
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((p: EndpointFormValues) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                />
                <div className="flex flex-wrap gap-1">
                  {SAMPLE_PROOF_IMAGES.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      onClick={() => setForm((p: EndpointFormValues) => ({ ...p, imageUrl: sample.url }))}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[10px] font-medium cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
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
                  setForm((prev: EndpointFormValues) => ({
                    ...prev,
                    orderId:
                      nextUseTicket && matchedSelectedOrder.ticketCode
                        ? matchedSelectedOrder.ticketCode
                        : matchedSelectedOrder.id,
                  }));
                }
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 cursor-pointer"
              title="Switch between Order ID (ORD-...) and Ticket Code (101-201)"
            >
              {useTicketCode ? 'Ticket Code' : 'Order ID'}
            </button>
          </div>

          <p className="shrink-0 text-[10px] text-slate-400">
            Click any order to load its ID &amp; price directly into the request:
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
                  onClick={() => selectOrderChoice(ord.id, ord.ticketCode, ord.price)}
                  className={`w-full text-left p-2 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500/80 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-blue-300 truncate">
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
                    <span className="font-mono text-slate-300 shrink-0 ml-2">₱{ord.price}</span>
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
                Live HTTP Inspector • <strong className="text-blue-300">{activeSpec.shortLabel}</strong>
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

          <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setBottomTab('dual')}
              className={`py-0.5 px-2 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                bottomTab === 'dual'
                  ? 'bg-blue-600 text-white'
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
                  ? 'bg-blue-600 text-white'
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
                  ? 'bg-blue-600 text-white'
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
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
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
                  className="text-[10px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer shrink-0 ml-2"
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
                    className="text-[10px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer shrink-0 ml-2"
                  >
                    Copy
                  </button>
                )}
              </div>

              {activeLog ? (
                <>
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
                              selectOrderChoice(ord.id, ord.ticketCode || undefined, ord.amountToPay);
                              showToast(`Targeted ${ord.id} (${ord.status})`);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-blue-600/20 border border-slate-700 text-[9px] font-mono text-blue-300 cursor-pointer"
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
                      ? 'bg-blue-600 text-white'
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
                      ? 'bg-blue-600 text-white'
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
                          ? 'bg-blue-950/50 border-blue-500/70'
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

export default StaffPostmanDebugger;
