import React, { useState } from 'react';
import { RequestFormFields } from './RequestFormFields';
import type {
  AuthActor,
  CustomHeaderRow,
  OrderStatus,
  PostmanEndpointSpec,
  PostmanFormKey,
  PostmanFormState,
  PostmanTokenVault,
} from '../types';

type ConfigTab = 'params' | 'body' | 'auth' | 'contract';

export interface RequestConfigPanelProps {
  readonly spec: PostmanEndpointSpec;
  readonly form: PostmanFormState;
  readonly onChangeField: (key: PostmanFormKey, value: string) => void;
  readonly matchedOrderStatus?: OrderStatus;
  readonly generatedBodyText: string;
  readonly customBodyMode: boolean;
  readonly onToggleCustomBodyMode: (next: boolean) => void;
  readonly customBodyText: string;
  readonly onChangeCustomBodyText: (text: string) => void;
  readonly onCopyBody: () => void;
  readonly authActor: AuthActor;
  readonly onChangeAuthActor: (actor: AuthActor) => void;
  readonly includeAuth: boolean;
  readonly onChangeIncludeAuth: (next: boolean) => void;
  readonly tokens: PostmanTokenVault;
  readonly customHeaders: readonly CustomHeaderRow[];
  readonly onAddHeader: () => void;
  readonly onUpdateHeader: (id: string, patch: Partial<CustomHeaderRow>) => void;
  readonly onRemoveHeader: (id: string) => void;
}

export const RequestConfigPanel: React.FC<RequestConfigPanelProps> = ({
  spec,
  form,
  onChangeField,
  matchedOrderStatus,
  generatedBodyText,
  customBodyMode,
  onToggleCustomBodyMode,
  customBodyText,
  onChangeCustomBodyText,
  onCopyBody,
  authActor,
  onChangeAuthActor,
  includeAuth,
  onChangeIncludeAuth,
  tokens,
  customHeaders,
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
}) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('params');

  const activeBearerToken =
    authActor === 'customer'
      ? tokens.customerAuthToken
      : authActor === 'staff'
        ? tokens.staffAuthToken
        : '';

  const formatRawJson = () => {
    try {
      const parsed = JSON.parse(customBodyText);
      onChangeCustomBodyText(JSON.stringify(parsed, null, 2));
    } catch {
      // Leave text as-is if invalid JSON
    }
  };

  return (
    <section className="shrink-0 border-b border-zinc-200 bg-white flex flex-col">
      {/* Flat Tab Strip */}
      <div className="px-4 border-b border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50">
        <div role="tablist" aria-label="Request Configuration Tabs" className="flex items-center gap-4">
          {(
            [
              { id: 'params', label: 'Params & Form' },
              {
                id: 'body',
                label: customBodyMode ? 'Body (Raw)' : 'Body (JSON)',
              },
              { id: 'auth', label: 'Auth & Headers' },
              { id: 'contract', label: 'Contract' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 text-[11px] font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
                  active
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Compact Auth Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <span>
            Auth:{' '}
            <strong className="text-zinc-800">
              {!includeAuth || authActor === 'none'
                ? 'None'
                : `${authActor} (${activeBearerToken ? 'ready' : 'missing'})`}
            </strong>
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-3 max-h-[250px] overflow-y-auto bg-white">
        {activeTab === 'params' && (
          <RequestFormFields
            spec={spec}
            form={form}
            onChangeField={onChangeField}
            matchedOrderStatus={matchedOrderStatus}
          />
        )}

        {activeTab === 'body' && (
          <div className="space-y-2">
            {spec.method === 'GET' ? (
              <p className="text-xs font-mono text-zinc-400 py-3">
                GET requests do not include a request body.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {customBodyMode ? 'Raw JSON Override' : 'Auto-Synced From Form'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {customBodyMode && (
                      <button
                        type="button"
                        onClick={formatRawJson}
                        className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 cursor-pointer"
                      >
                        Format
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleCustomBodyMode(!customBodyMode)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                        customBodyMode
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {customBodyMode ? 'Reset to Form' : 'Edit Raw JSON'}
                    </button>
                    <button
                      type="button"
                      onClick={onCopyBody}
                      className="px-2 py-0.5 text-[10px] font-mono rounded border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {customBodyMode ? (
                  <textarea
                    rows={7}
                    aria-label="Raw Request JSON Body"
                    value={customBodyText}
                    onChange={(e) => onChangeCustomBodyText(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white"
                  />
                ) : (
                  <pre className="p-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-800 overflow-x-auto leading-relaxed">
                    {generatedBodyText || '{}'}
                  </pre>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-3">
            {/* Bearer Actor Control */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-700">Bearer Token:</span>
                <div className="inline-flex border border-zinc-200 rounded overflow-hidden">
                  {(['none', 'customer', 'staff'] as const).map((actor) => {
                    const active = authActor === actor;
                    return (
                      <button
                        key={actor}
                        type="button"
                        onClick={() => {
                          onChangeAuthActor(actor);
                          onChangeIncludeAuth(actor !== 'none');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-mono capitalize cursor-pointer ${
                          active
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {actor}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAuth}
                  onChange={(e) => onChangeIncludeAuth(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                <span>Attach Authorization header</span>
              </label>
            </div>

            {/* Custom Headers Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Custom Headers
                </span>
                <button
                  type="button"
                  onClick={onAddHeader}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 hover:border-zinc-400 text-zinc-700 cursor-pointer"
                >
                  + Add Header
                </button>
              </div>

              {customHeaders.length === 0 ? (
                <p className="text-[11px] font-mono text-zinc-400">
                  Default headers (Content-Type, Authorization) are managed automatically.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {customHeaders.map((row) => (
                    <div key={row.id} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        aria-label="Enable custom header"
                        checked={row.enabled}
                        onChange={(e) => onUpdateHeader(row.id, { enabled: e.target.checked })}
                      />
                      <input
                        type="text"
                        placeholder="Header-Name"
                        value={row.key}
                        onChange={(e) => onUpdateHeader(row.id, { key: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs font-mono border border-zinc-200 rounded focus:outline-none focus:border-zinc-900"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => onUpdateHeader(row.id, { value: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs font-mono border border-zinc-200 rounded focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        aria-label="Remove header"
                        onClick={() => onRemoveHeader(row.id)}
                        className="px-1.5 py-1 text-xs text-zinc-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded space-y-1">
              <div className="text-[10px] uppercase text-zinc-400">Route Tuple (ApiRoutes)</div>
              <div className="text-zinc-900">
                [{JSON.stringify(spec.method)}, {JSON.stringify(spec.pathTemplate)}]
              </div>
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded space-y-1">
              <div className="text-[10px] uppercase text-zinc-400">Auth Policy</div>
              <div className="text-zinc-900">{spec.authPolicy}</div>
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded space-y-1">
              <div className="text-[10px] uppercase text-zinc-400">Request / Query Contract</div>
              <div className="text-zinc-900">
                Body: {spec.contractSummary.reqType}
                {spec.contractSummary.queryType ? ` · Query: ${spec.contractSummary.queryType}` : ''}
              </div>
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded space-y-1">
              <div className="text-[10px] uppercase text-zinc-400">Response Contract</div>
              <div className="text-zinc-900">{spec.contractSummary.resType}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
