import React, { useMemo, useState } from 'react';
import { HttpStatusBadge, MethodBadge } from './MethodBadge';
import type {
  CustomerListOrdersRes,
  OrderStatus,
  PostmanEndpointSpec,
  RequestLogEntry,
  StaffListOrdersRes,
} from '../types';

type InspectorTab = 'response' | 'request' | 'headers' | 'history';

export interface ResponseInspectorProps {
  readonly spec: PostmanEndpointSpec;
  readonly activeLog: RequestLogEntry | null;
  readonly endpointLogs: readonly RequestLogEntry[];
  readonly allLogs: readonly RequestLogEntry[];
  readonly preparedMethod: string;
  readonly preparedUrl: string;
  readonly preparedHeaders: Record<string, string>;
  readonly preparedBodyText: string;
  readonly onSelectLog: (entry: RequestLogEntry) => void;
  readonly onClearLogs: () => void;
  readonly onCopyText: (text: string, label: string) => void;
  readonly onTargetOrder: (payload: {
    id: string;
    ticketCode?: string | null;
    trackingId?: string | null;
    productName?: string;
    price?: number;
  }) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const ResponseInspector: React.FC<ResponseInspectorProps> = ({
  spec,
  activeLog,
  endpointLogs,
  allLogs,
  preparedMethod,
  preparedUrl,
  preparedHeaders,
  preparedBodyText,
  onSelectLog,
  onClearLogs,
  onCopyText,
  onTargetOrder,
}) => {
  const [tab, setTab] = useState<InspectorTab>('response');
  const [historyScope, setHistoryScope] = useState<'endpoint' | 'all'>('endpoint');

  // Extract clickable orders from list responses (both customer and staff shapes)
  const responseOrders = useMemo(() => {
    const body = activeLog?.response.body;
    if (!body || typeof body !== 'object' || !('orders' in body)) return [];
    const list = (body as Partial<CustomerListOrdersRes | StaffListOrdersRes>).orders;
    if (!Array.isArray(list)) return [];
    return list.slice(0, 12).map((item) => ({
      id: item.id,
      ticketCode: item.ticketCode ?? null,
      trackingId: item.trackingId ?? null,
      status: item.status as OrderStatus,
      productName: 'productName' in item ? item.productName : undefined,
      price: 'amountToPay' in item ? item.amountToPay : undefined,
    }));
  }, [activeLog]);

  // Extract single orderId/ticketCode (e.g. initialize order or get order)
  const responseSingleOrder = useMemo(() => {
    const body = activeLog?.response.body;
    if (!body || typeof body !== 'object') return null;
    const rec = body as Record<string, unknown>;
    if (typeof rec.orderId === 'string') {
      return {
        id: rec.orderId,
        ticketCode: typeof rec.ticketCode === 'string' ? rec.ticketCode : null,
      };
    }
    if (rec.order && typeof rec.order === 'object') {
      const ord = rec.order as Record<string, unknown>;
      if (typeof ord.id === 'string') {
        return {
          id: ord.id,
          ticketCode: typeof ord.ticketCode === 'string' ? ord.ticketCode : null,
        };
      }
    }
    return null;
  }, [activeLog]);

  // Extract photos if /photo returned imageUrl or proofImageUrl
  const responsePhotos = useMemo(() => {
    const body = activeLog?.response.body;
    if (!body || typeof body !== 'object') return [];
    const rec = body as Record<string, unknown>;
    const photos: Array<{ label: string; url: string }> = [];
    if (typeof rec.imageUrl === 'string' && rec.imageUrl) {
      photos.push({ label: 'Screenshot (imageUrl)', url: rec.imageUrl });
    }
    if (typeof rec.proofImageUrl === 'string' && rec.proofImageUrl) {
      photos.push({ label: 'Proof (proofImageUrl)', url: rec.proofImageUrl });
    }
    return photos;
  }, [activeLog]);

  const visibleHistory = historyScope === 'endpoint' ? endpointLogs : allLogs;

  const formattedResponseText = useMemo(() => {
    if (!activeLog) return '';
    return typeof activeLog.response.body === 'string'
      ? activeLog.response.body
      : JSON.stringify(activeLog.response.body, null, 2);
  }, [activeLog]);

  return (
    <section className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
      {/* Inspector Header */}
      <div className="shrink-0 px-4 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Response Inspector Tabs" className="flex items-center gap-4">
          {(
            [
              { id: 'response', label: 'Response' },
              { id: 'request', label: 'Request' },
              { id: 'headers', label: 'Headers' },
              { id: 'history', label: `History (${endpointLogs.length})` },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-2 text-[11px] font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
                  active
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Status Metrics */}
        <div className="flex items-center gap-2 py-1">
          {activeLog ? (
            <>
              <HttpStatusBadge
                status={activeLog.response.status}
                statusText={activeLog.response.statusText}
                ok={activeLog.response.ok}
              />
              <span className="font-mono text-[11px] text-zinc-500">
                {activeLog.response.durationMs}ms
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                {formatBytes(activeLog.response.sizeBytes)}
              </span>
              {tab === 'response' && (
                <button
                  type="button"
                  onClick={() => onCopyText(formattedResponseText, 'Response JSON')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 cursor-pointer"
                >
                  Copy
                </button>
              )}
            </>
          ) : (
            <span className="font-mono text-[11px] text-zinc-400">Idle · {spec.shortLabel}</span>
          )}
        </div>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
        {tab === 'response' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {activeLog ? (
              <>
                {/* Clickable Single Order Target Strip */}
                {responseSingleOrder && (
                  <div className="shrink-0 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border border-zinc-200 bg-zinc-50">
                    <span className="text-[11px] text-zinc-500">Order returned in response:</span>
                    <button
                      type="button"
                      onClick={() =>
                        onTargetOrder({
                          id: responseSingleOrder.id,
                          ticketCode: responseSingleOrder.ticketCode,
                        })
                      }
                      className="font-mono text-[11px] px-2 py-0.5 rounded border border-zinc-300 bg-white hover:border-zinc-900 text-zinc-900 cursor-pointer"
                    >
                      Use {responseSingleOrder.id}
                      {responseSingleOrder.ticketCode ? ` (${responseSingleOrder.ticketCode})` : ''}
                    </button>
                  </div>
                )}

                {/* Clickable Order List Pills */}
                {responseOrders.length > 0 && (
                  <div className="shrink-0 px-2.5 py-2 rounded border border-zinc-200 bg-zinc-50 space-y-1.5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                      Click to target &#123;id&#125;
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {responseOrders.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() =>
                            onTargetOrder({
                              id: ord.id,
                              ticketCode: ord.ticketCode,
                              trackingId: ord.trackingId,
                              productName: ord.productName,
                              price: ord.price,
                            })
                          }
                          className="font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-200 bg-white hover:border-zinc-900 text-zinc-700 hover:text-zinc-900 cursor-pointer"
                        >
                          {ord.ticketCode || ord.id} · {ord.status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Photo Previews when returned */}
                {responsePhotos.length > 0 && (
                  <div className="shrink-0 flex flex-wrap gap-2">
                    {responsePhotos.map((photo) => (
                      <a
                        key={photo.label}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-zinc-200 bg-zinc-50 hover:border-zinc-400 text-[11px] font-mono text-zinc-700"
                      >
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-7 h-7 object-cover rounded border border-zinc-200 bg-white"
                        />
                        <span>{photo.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Response JSON Payload */}
                <pre className="flex-1 min-h-0 overflow-auto p-3 rounded border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-900 whitespace-pre-wrap break-words leading-relaxed">
                  {formattedResponseText || '(empty response body)'}
                </pre>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 rounded p-6">
                <p className="text-xs font-medium text-zinc-700">
                  No response captured for {spec.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                  Configure parameters above and click <strong className="text-zinc-700">Send</strong> to inspect live HTTP status, headers, and payload.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'request' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-2 pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2 min-w-0 font-mono text-xs text-zinc-800">
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 shrink-0">
                  {activeLog ? 'Sent' : 'Prepared'}
                </span>
                <span className="truncate">
                  {activeLog
                    ? `${activeLog.request.method} ${activeLog.request.url}`
                    : `${preparedMethod} ${preparedUrl}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCopyText(
                    JSON.stringify(
                      activeLog
                        ? {
                            method: activeLog.request.method,
                            url: activeLog.request.url,
                            headers: activeLog.request.headers,
                            body: activeLog.request.body,
                          }
                        : {
                            method: preparedMethod,
                            url: preparedUrl,
                            headers: preparedHeaders,
                            body: preparedBodyText || null,
                          },
                      null,
                      2
                    ),
                    'Request snapshot'
                  )
                }
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 text-zinc-600 hover:border-zinc-400 cursor-pointer shrink-0"
              >
                Copy
              </button>
            </div>

            <pre className="flex-1 min-h-0 overflow-auto p-3 rounded border border-zinc-200 bg-zinc-50 font-mono text-xs text-zinc-800 whitespace-pre-wrap break-words leading-relaxed">
              {activeLog
                ? activeLog.request.body !== null && activeLog.request.body !== undefined
                  ? JSON.stringify(activeLog.request.body, null, 2)
                  : '(no request body sent)'
                : preparedMethod !== 'GET'
                  ? preparedBodyText || '{}'
                  : '(GET requests have no body)'}
            </pre>
          </div>
        )}

        {tab === 'headers' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
            <div className="min-h-0 flex flex-col gap-1.5 overflow-hidden">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Request Headers ({activeLog ? 'Sent' : 'Prepared'})
              </span>
              <pre className="flex-1 min-h-0 overflow-auto p-2.5 rounded border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-800 whitespace-pre-wrap break-all">
                {JSON.stringify(activeLog ? activeLog.request.headers : preparedHeaders, null, 2)}
              </pre>
            </div>
            <div className="min-h-0 flex flex-col gap-1.5 overflow-hidden">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Response Headers
              </span>
              <pre className="flex-1 min-h-0 overflow-auto p-2.5 rounded border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-800 whitespace-pre-wrap break-all">
                {activeLog
                  ? JSON.stringify(activeLog.response.headers, null, 2)
                  : '(awaiting response)'}
              </pre>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-2">
              <div className="inline-flex border border-zinc-200 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHistoryScope('endpoint')}
                  className={`px-2.5 py-1 text-[10px] font-medium cursor-pointer ${
                    historyScope === 'endpoint'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  This Endpoint ({endpointLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryScope('all')}
                  className={`px-2.5 py-1 text-[10px] font-medium cursor-pointer ${
                    historyScope === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  All ({allLogs.length})
                </button>
              </div>
              {allLogs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-[10px] font-mono text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded">
              {visibleHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No request history recorded yet.
                </div>
              ) : (
                visibleHistory.map((item) => {
                  const selected = activeLog?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectLog(item);
                        setTab('response');
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        selected ? 'bg-zinc-100' : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MethodBadge method={item.method} variant="text" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-900 truncate">
                            {item.endpointTitle}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-400 truncate">
                            {item.request.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <HttpStatusBadge status={item.response.status} ok={item.response.ok} />
                        <span className="font-mono text-[10px] text-zinc-400">
                          {item.response.durationMs}ms
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
