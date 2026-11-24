import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildCurlSnippet,
  buildPostmanBody,
  buildPostmanUrl,
  createInitialFormState,
  getDefaultAuthActor,
  getPostmanEndpointSpec,
  POSTMAN_V1_ENDPOINTS,
  SEEDED_CUSTOMER_ACCOUNTS,
  SEEDED_CUSTOMER_ORDERS,
  SEEDED_STAFF_ACCOUNT,
  SEEDED_STAFF_ORDERS,
} from './endpoints';
import { usePostmanSession } from './usePostmanSession';
import { TopConfigBar } from './components/TopConfigBar';
import { EndpointSidebar } from './components/EndpointSidebar';
import { RequestBar } from './components/RequestBar';
import { RequestConfigPanel } from './components/RequestConfigPanel';
import { ResponseInspector } from './components/ResponseInspector';
import { AuthSessionPanel } from './components/AuthSessionPanel';
import { TargetOrderPanel } from './components/TargetOrderPanel';
import type {
  AuthActor,
  CustomHeaderRow,
  PostmanEndpointId,
  PostmanFormKey,
  PostmanFormState,
  RequestLogEntry,
  TargetOrderItem,
} from './types';

type RightRailTab = 'session' | 'orders';

const CUSTOMER_ORDER_MUTATIONS = new Set<PostmanEndpointId>([
  'customer_initialize_order',
  'customer_update_order',
  'customer_cancel_order',
  'customer_claim_order',
  'customer_refund_order',
]);

const STAFF_ORDER_MUTATIONS = new Set<PostmanEndpointId>([
  'staff_activate_order',
  'staff_pay_courier',
  'staff_attach_photo',
  'staff_claim_order',
  'staff_refund_order',
]);

export const PostmanWorkbench: React.FC = () => {
  const session = usePostmanSession();
  const {
    baseUrl,
    setBaseUrl,
    customUrlPresets,
    addCustomUrlPreset,
    removeCustomUrlPreset,
    apiPrefix,
    setApiPrefix,
    customPrefixPresets,
    addCustomPrefixPreset,
    removeCustomPrefixPreset,
    tokens,
    clearCustomerAuth,
    clearStaffAuth,
    customerProfile,
    staffUsername,
    customerOrders,
    staffOrders,
    requestLogs,
    clearLogs,
    toast,
    showToast,
    sendRequest,
    quickCustomerLogin,
    quickStaffLogin,
    syncCustomerOrders,
    syncStaffOrders,
  } = session;

  const [activeEndpointId, setActiveEndpointId] = useState<PostmanEndpointId>('customer_login');
  const [form, setForm] = useState<PostmanFormState>(createInitialFormState);
  const [selectedSeedIdx, setSelectedSeedIdx] = useState<number>(0);
  const [authActor, setAuthActor] = useState<AuthActor>('none');
  const [includeAuth, setIncludeAuth] = useState<boolean>(false);
  const [customHeaders, setCustomHeaders] = useState<CustomHeaderRow[]>([]);
  const [customBodyMode, setCustomBodyMode] = useState<boolean>(false);
  const [customBodyText, setCustomBodyText] = useState<string>('{}');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isCustomerLoggingIn, setIsCustomerLoggingIn] = useState<boolean>(false);
  const [isStaffLoggingIn, setIsStaffLoggingIn] = useState<boolean>(false);

  const [showRightRail, setShowRightRail] = useState<boolean>(true);
  const [rightRailTab, setRightRailTab] = useState<RightRailTab>('session');
  const [targetScope, setTargetScope] = useState<'customer' | 'staff'>('customer');
  const [useTicketCode, setUseTicketCode] = useState<boolean>(false);

  const [selectedLogIdByEndpoint, setSelectedLogIdByEndpoint] = useState<
    Partial<Record<PostmanEndpointId, string>>
  >({});

  const activeSpec = useMemo(() => getPostmanEndpointSpec(activeEndpointId), [activeEndpointId]);

  // Keep form token inputs synced with session vault captures
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      preAuthToken: tokens.customerPreAuthToken || prev.preAuthToken,
      refreshToken: tokens.customerRefreshToken || prev.refreshToken,
      resetToken: tokens.customerResetToken || prev.resetToken,
    }));
  }, [tokens.customerPreAuthToken, tokens.customerRefreshToken, tokens.customerResetToken]);

  const handleSelectEndpoint = useCallback(
    (id: PostmanEndpointId) => {
      setActiveEndpointId(id);
      setCustomBodyMode(false);
      const nextSpec = getPostmanEndpointSpec(id);
      let nextActor = getDefaultAuthActor(nextSpec);
      if (nextSpec.authPolicy === 'any_bearer') {
        nextActor = tokens.customerAuthToken
          ? 'customer'
          : tokens.staffAuthToken
            ? 'staff'
            : 'customer';
      }
      setAuthActor(nextActor);
      setIncludeAuth(nextActor !== 'none');
      if (nextSpec.domain === 'staff') {
        setTargetScope('staff');
      } else if (nextSpec.domain === 'customer') {
        setTargetScope('customer');
      }
    },
    [tokens.customerAuthToken, tokens.staffAuthToken]
  );

  const handleChangeField = useCallback((key: PostmanFormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectSeedAccount = useCallback((idx: number) => {
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
  }, []);

  const resolvedUrl = useMemo(
    () => buildPostmanUrl(activeSpec, baseUrl, form, apiPrefix),
    [activeSpec, baseUrl, form, apiPrefix]
  );

  const generatedBody = useMemo(
    () => buildPostmanBody(activeSpec.id, form),
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

  const enabledCustomHeadersMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of customHeaders) {
      if (row.enabled && row.key.trim()) {
        map[row.key.trim()] = row.value;
      }
    }
    return map;
  }, [customHeaders]);

  const activeAuthToken =
    authActor === 'customer'
      ? tokens.customerAuthToken
      : authActor === 'staff'
        ? tokens.staffAuthToken
        : '';

  const preparedHeaders = useMemo(() => {
    const h: Record<string, string> = { ...enabledCustomHeadersMap };
    if (activeSpec.method !== 'GET') {
      const hasContentType = Object.keys(h).some((k) => k.toLowerCase() === 'content-type');
      if (!hasContentType) h['Content-Type'] = 'application/json';
    }
    if (includeAuth && authActor !== 'none' && activeAuthToken) {
      h['Authorization'] = `Bearer ${activeAuthToken}`;
    }
    return h;
  }, [enabledCustomHeadersMap, activeSpec.method, includeAuth, authActor, activeAuthToken]);

  const endpointLogs = useMemo(
    () => requestLogs.filter((l) => l.endpointId === activeEndpointId),
    [requestLogs, activeEndpointId]
  );

  const activeLog = useMemo(() => {
    const selectedId = selectedLogIdByEndpoint[activeEndpointId];
    if (selectedId) {
      const found = endpointLogs.find((l) => l.id === selectedId);
      if (found) return found;
    }
    return endpointLogs[0] || null;
  }, [endpointLogs, selectedLogIdByEndpoint, activeEndpointId]);

  // Build target order items (live DB when available, seeded fallback otherwise)
  const customerTargetOrders: TargetOrderItem[] = useMemo(() => {
    if (customerOrders.length > 0) {
      return customerOrders.map((o) => ({
        id: o.id,
        ticketCode: o.ticketCode || '',
        trackingId: o.trackingId || '',
        status: o.status,
        label: o.productName || o.trackingId || 'Order',
        productName: o.productName,
        isClaimActive: o.isClaimActive,
        isRefundEligible: o.isRefundEligible,
        isRefundActive: o.isRefundActive,
      }));
    }
    return [...SEEDED_CUSTOMER_ORDERS];
  }, [customerOrders]);

  const staffTargetOrders: TargetOrderItem[] = useMemo(() => {
    if (staffOrders.length > 0) {
      return staffOrders.map((o) => ({
        id: o.id,
        ticketCode: o.ticketCode || '',
        trackingId: o.trackingId || '',
        status: o.status,
        label: `${o.customer} · ${o.trackingId || 'No Tracking'}`,
        recipientName: o.customer,
        price: o.amountToPay,
        isClaimActive: o.isClaimActive,
        isRefundEligible: o.isRefundEligible,
        isRefundActive: o.isRefundActive,
        courierPaid: o.courierPaid,
      }));
    }
    return [...SEEDED_STAFF_ORDERS];
  }, [staffOrders]);

  const visibleTargetOrders = targetScope === 'staff' ? staffTargetOrders : customerTargetOrders;
  const isTargetLive = targetScope === 'staff' ? staffOrders.length > 0 : customerOrders.length > 0;

  const matchedOrder = useMemo(() => {
    const clean = form.orderId.trim();
    const pool = [...customerTargetOrders, ...staffTargetOrders];
    return pool.find((o) => o.id === clean || (o.ticketCode && o.ticketCode === clean));
  }, [customerTargetOrders, staffTargetOrders, form.orderId]);

  const applyTargetOrder = useCallback(
    (payload: {
      id: string;
      ticketCode?: string | null;
      trackingId?: string | null;
      productName?: string;
      price?: number;
    }) => {
      const nextId = useTicketCode && payload.ticketCode ? payload.ticketCode : payload.id;
      setForm((prev) => ({
        ...prev,
        orderId: nextId,
        trackingId: payload.trackingId || prev.trackingId,
        productName: payload.productName || prev.productName,
        price: typeof payload.price === 'number' && payload.price > 0 ? String(payload.price) : prev.price,
        amountReceived:
          typeof payload.price === 'number' && payload.price > 0
            ? String(payload.price)
            : prev.amountReceived,
      }));
      showToast(`Targeted ${nextId}`);
    },
    [useTicketCode, showToast]
  );

  const handleToggleUseTicketCode = useCallback(() => {
    setUseTicketCode((prev) => {
      const next = !prev;
      if (matchedOrder) {
        setForm((f) => ({
          ...f,
          orderId: next && matchedOrder.ticketCode ? matchedOrder.ticketCode : matchedOrder.id,
        }));
      }
      return next;
    });
  }, [matchedOrder]);

  const handleCopyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${label}`);
      } catch {
        showToast(`Unable to copy ${label}`, 'error');
      }
    },
    [showToast]
  );

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      const entry = await sendRequest({
        endpointId: activeSpec.id,
        method: activeSpec.method,
        url: resolvedUrl,
        authActor,
        includeAuth,
        customHeaders: enabledCustomHeadersMap,
        body: customBodyMode ? undefined : generatedBody,
        rawBodyText: customBodyMode && activeSpec.method !== 'GET' ? customBodyText : undefined,
      });

      setSelectedLogIdByEndpoint((prev) => ({
        ...prev,
        [activeSpec.id]: entry.id,
      }));

      if (entry.response.ok) {
        showToast(`${activeSpec.shortLabel}: ${entry.response.status} (${entry.response.durationMs}ms)`);
        if (CUSTOMER_ORDER_MUTATIONS.has(activeSpec.id) && tokens.customerAuthToken) {
          void syncCustomerOrders();
        } else if (STAFF_ORDER_MUTATIONS.has(activeSpec.id) && tokens.staffAuthToken) {
          void syncStaffOrders();
        }
      } else {
        const errMsg =
          entry.response.body &&
          typeof entry.response.body === 'object' &&
          'message' in entry.response.body
            ? String((entry.response.body as { message?: unknown }).message)
            : `HTTP ${entry.response.status}`;
        showToast(`${activeSpec.shortLabel} failed: ${errMsg}`, 'error');
      }
    } finally {
      setIsSending(false);
    }
  }, [
    sendRequest,
    activeSpec,
    resolvedUrl,
    authActor,
    includeAuth,
    enabledCustomHeadersMap,
    customBodyMode,
    generatedBody,
    customBodyText,
    showToast,
    tokens.customerAuthToken,
    tokens.staffAuthToken,
    syncCustomerOrders,
    syncStaffOrders,
  ]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter sends the active request
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSending) {
        e.preventDefault();
        void handleSend();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSend, isSending]);

  const handleQuickCustomerLogin = useCallback(async () => {
    setIsCustomerLoggingIn(true);
    try {
      const res = await quickCustomerLogin(form.email, form.password, form.mpin);
      if (res.loginEntry || res.mpinEntry) {
        setSelectedLogIdByEndpoint((prev) => ({
          ...prev,
          ...(res.loginEntry ? { customer_login: res.loginEntry.id } : {}),
          ...(res.mpinEntry ? { customer_verify_mpin: res.mpinEntry.id } : {}),
        }));
      }
    } finally {
      setIsCustomerLoggingIn(false);
    }
  }, [quickCustomerLogin, form.email, form.password, form.mpin]);

  const handleQuickStaffLogin = useCallback(async () => {
    setIsStaffLoggingIn(true);
    try {
      const res = await quickStaffLogin(
        form.staffUsername || SEEDED_STAFF_ACCOUNT.username,
        form.staffPassword || SEEDED_STAFF_ACCOUNT.password
      );
      if (res.loginEntry) {
        setSelectedLogIdByEndpoint((prev) => ({
          ...prev,
          staff_login: res.loginEntry!.id,
        }));
      }
    } finally {
      setIsStaffLoggingIn(false);
    }
  }, [quickStaffLogin, form.staffUsername, form.staffPassword]);

  const handleSelectLog = useCallback((entry: RequestLogEntry) => {
    setSelectedLogIdByEndpoint((prev) => ({
      ...prev,
      [entry.endpointId]: entry.id,
    }));
    setActiveEndpointId(entry.endpointId);
  }, []);

  const handleAddHeader = useCallback(() => {
    setCustomHeaders((prev) => [
      ...prev,
      { id: `hdr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, key: '', value: '', enabled: true },
    ]);
  }, []);

  const handleUpdateHeader = useCallback((id: string, patch: Partial<CustomHeaderRow>) => {
    setCustomHeaders((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const handleRemoveHeader = useCallback((id: string) => {
    setCustomHeaders((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const preparedBodyText = customBodyMode ? customBodyText : generatedBodyText;

  return (
    <div className="h-screen w-screen bg-white text-zinc-900 flex flex-col overflow-hidden font-sans antialiased">
      {/* Top Bar */}
      <TopConfigBar
        endpointCount={POSTMAN_V1_ENDPOINTS.length}
        baseUrl={baseUrl}
        onChangeBaseUrl={setBaseUrl}
        customUrlPresets={customUrlPresets}
        onAddCustomUrl={addCustomUrlPreset}
        onRemoveCustomUrl={removeCustomUrlPreset}
        apiPrefix={apiPrefix}
        onChangeApiPrefix={setApiPrefix}
        customPrefixPresets={customPrefixPresets}
        onAddCustomPrefix={addCustomPrefixPreset}
        onRemoveCustomPrefix={removeCustomPrefixPreset}
        tokens={tokens}
        customerEmail={customerProfile?.email}
        staffUsername={staffUsername}
        showRightRail={showRightRail}
        onToggleRightRail={() => setShowRightRail((v) => !v)}
      />

      {/* 3-Pane Minimalist Postman Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Searchable 34-Route Collection Sidebar */}
        <EndpointSidebar
          endpoints={POSTMAN_V1_ENDPOINTS}
          activeEndpointId={activeEndpointId}
          onSelectEndpoint={handleSelectEndpoint}
          requestLogs={requestLogs}
        />

        {/* Center: Request Builder + Response Inspector */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
          <RequestBar
            spec={activeSpec}
            resolvedUrl={resolvedUrl}
            isSending={isSending}
            onSend={() => void handleSend()}
            onCopyCurl={() =>
              void handleCopyText(
                buildCurlSnippet(
                  activeSpec.method,
                  resolvedUrl,
                  preparedHeaders,
                  activeSpec.method !== 'GET' ? preparedBodyText : undefined
                ),
                'cURL command'
              )
            }
          />

          <RequestConfigPanel
            spec={activeSpec}
            form={form}
            onChangeField={handleChangeField}
            matchedOrderStatus={matchedOrder?.status}
            generatedBodyText={generatedBodyText}
            customBodyMode={customBodyMode}
            onToggleCustomBodyMode={setCustomBodyMode}
            customBodyText={customBodyText}
            onChangeCustomBodyText={setCustomBodyText}
            onCopyBody={() => void handleCopyText(preparedBodyText || '{}', 'JSON body')}
            authActor={authActor}
            onChangeAuthActor={setAuthActor}
            includeAuth={includeAuth}
            onChangeIncludeAuth={setIncludeAuth}
            tokens={tokens}
            customHeaders={customHeaders}
            onAddHeader={handleAddHeader}
            onUpdateHeader={handleUpdateHeader}
            onRemoveHeader={handleRemoveHeader}
          />

          <ResponseInspector
            spec={activeSpec}
            activeLog={activeLog}
            endpointLogs={endpointLogs}
            allLogs={requestLogs}
            preparedMethod={activeSpec.method}
            preparedUrl={resolvedUrl}
            preparedHeaders={preparedHeaders}
            preparedBodyText={preparedBodyText}
            onSelectLog={handleSelectLog}
            onClearLogs={clearLogs}
            onCopyText={(text, label) => void handleCopyText(text, label)}
            onTargetOrder={applyTargetOrder}
          />
        </main>

        {/* Right: Collapsible Session & Target Order Rail */}
        {showRightRail && (
          <aside className="w-full lg:w-[290px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 bg-white flex flex-col min-h-0 max-h-[300px] lg:max-h-none">
            <div className="shrink-0 grid grid-cols-2 border-b border-zinc-200 bg-zinc-50">
              <button
                type="button"
                onClick={() => setRightRailTab('session')}
                className={`py-2 text-[11px] font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
                  rightRailTab === 'session'
                    ? 'border-zinc-900 text-zinc-900 bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Auth Vault
              </button>
              <button
                type="button"
                onClick={() => setRightRailTab('orders')}
                className={`py-2 text-[11px] font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
                  rightRailTab === 'orders'
                    ? 'border-zinc-900 text-zinc-900 bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Target Order
              </button>
            </div>

            {rightRailTab === 'session' ? (
              <AuthSessionPanel
                tokens={tokens}
                customerProfile={customerProfile}
                staffUsername={staffUsername}
                selectedSeedIdx={selectedSeedIdx}
                onSelectSeedAccount={handleSelectSeedAccount}
                onQuickCustomerLogin={handleQuickCustomerLogin}
                onQuickStaffLogin={handleQuickStaffLogin}
                onClearCustomer={clearCustomerAuth}
                onClearStaff={clearStaffAuth}
                onCopyText={(text, label) => void handleCopyText(text, label)}
                isCustomerLoggingIn={isCustomerLoggingIn}
                isStaffLoggingIn={isStaffLoggingIn}
              />
            ) : (
              <TargetOrderPanel
                scope={targetScope}
                onChangeScope={setTargetScope}
                isLiveData={isTargetLive}
                orders={visibleTargetOrders}
                selectedOrderId={form.orderId}
                useTicketCode={useTicketCode}
                onToggleUseTicketCode={handleToggleUseTicketCode}
                onSelectOrder={(ord) => applyTargetOrder(ord)}
                onSync={() => {
                  if (targetScope === 'staff') {
                    void syncStaffOrders();
                  } else {
                    void syncCustomerOrders();
                  }
                }}
                canSync={
                  targetScope === 'staff'
                    ? Boolean(tokens.staffAuthToken)
                    : Boolean(tokens.customerAuthToken)
                }
              />
            )}
          </aside>
        )}
      </div>

      {/* Minimalist Flat Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-3 right-3 z-50 px-3 py-2 rounded border text-xs font-mono ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-zinc-900 border-zinc-900 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PostmanWorkbench;
