import React, { useMemo, useState } from 'react';
import { MethodBadge } from './MethodBadge';
import type {
  EndpointDomain,
  EndpointGroup,
  PostmanEndpointId,
  PostmanEndpointSpec,
  RequestLogEntry,
} from '../types';

export interface EndpointSidebarProps {
  readonly endpoints: readonly PostmanEndpointSpec[];
  readonly activeEndpointId: PostmanEndpointId;
  readonly onSelectEndpoint: (id: PostmanEndpointId) => void;
  readonly requestLogs: readonly RequestLogEntry[];
}

type DomainFilter = 'all' | EndpointDomain;

const DOMAIN_TABS: ReadonlyArray<{ readonly id: DomainFilter; readonly label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'customer', label: 'Customer' },
  { id: 'staff', label: 'Staff' },
  { id: 'shared', label: 'Shared' },
];

export const EndpointSidebar: React.FC<EndpointSidebarProps> = ({
  endpoints,
  activeEndpointId,
  onSelectEndpoint,
  requestLogs,
}) => {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const latestStatusByEndpoint = useMemo(() => {
    const map = new Map<PostmanEndpointId, { ok: boolean; status: number }>();
    for (const log of requestLogs) {
      if (!map.has(log.endpointId)) {
        map.set(log.endpointId, { ok: log.response.ok, status: log.response.status });
      }
    }
    return map;
  }, [requestLogs]);

  const domainCounts = useMemo(() => {
    return {
      all: endpoints.length,
      customer: endpoints.filter((e) => e.domain === 'customer').length,
      staff: endpoints.filter((e) => e.domain === 'staff').length,
      shared: endpoints.filter((e) => e.domain === 'shared').length,
    };
  }, [endpoints]);

  const groupedEndpoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = endpoints.filter((ep) => {
      if (domainFilter !== 'all' && ep.domain !== domainFilter) return false;
      if (!q) return true;
      return (
        ep.title.toLowerCase().includes(q) ||
        ep.shortLabel.toLowerCase().includes(q) ||
        ep.pathTemplate.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.group.toLowerCase().includes(q)
      );
    });

    const groups: Array<{ group: EndpointGroup; items: PostmanEndpointSpec[] }> = [];
    for (const ep of filtered) {
      const existing = groups.find((g) => g.group === ep.group);
      if (existing) {
        existing.items.push(ep);
      } else {
        groups.push({ group: ep.group, items: [ep] });
      }
    }
    return groups;
  }, [endpoints, domainFilter, searchQuery]);

  return (
    <aside className="w-full lg:w-[272px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col min-h-0 max-h-[260px] lg:max-h-none">
      {/* Search + Domain Filter */}
      <div className="shrink-0 p-2.5 border-b border-zinc-200 dark:border-zinc-800 space-y-2 bg-white dark:bg-zinc-950">
        <input
          type="search"
          aria-label="Filter v1 endpoints"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter endpoints..."
          className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:bg-white dark:focus:bg-zinc-950"
        />
        <div role="tablist" aria-label="API Domain Filter" className="grid grid-cols-4 gap-1">
          {DOMAIN_TABS.map((tab) => {
            const active = domainFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setDomainFilter(tab.id)}
                className={`py-1 px-1 text-[10px] font-medium rounded border cursor-pointer transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-0.5 font-mono text-[9px] ${
                    active ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {domainCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Route List */}
      <nav aria-label="API v1 Endpoints" className="flex-1 min-h-0 overflow-y-auto py-2 px-1.5 space-y-3">
        {groupedEndpoints.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">No matching endpoints.</p>
        ) : (
          groupedEndpoints.map(({ group, items }) => (
            <div key={group}>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                <span>{group}</span>
                <span className="font-mono">{items.length}</span>
              </div>
              <ul className="space-y-0.5">
                {items.map((ep) => {
                  const selected = ep.id === activeEndpointId;
                  const lastRun = latestStatusByEndpoint.get(ep.id);
                  const compactPath = ep.pathTemplate.replace(/^\/api\/v1/, '');
                  return (
                    <li key={ep.id}>
                      <button
                        type="button"
                        aria-current={selected ? 'page' : undefined}
                        onClick={() => onSelectEndpoint(ep.id)}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                          selected
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        <MethodBadge
                          method={ep.method}
                          variant="text"
                          className={selected ? '!text-zinc-300 dark:!text-zinc-600' : ''}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium leading-tight truncate">
                            {ep.shortLabel}
                          </div>
                          <div
                            className={`font-mono text-[10px] leading-tight truncate ${
                              selected ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {compactPath}
                          </div>
                        </div>
                        {lastRun && (
                          <span
                            title={`Last status: ${lastRun.status || 'NET ERR'}`}
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              lastRun.ok ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
};
