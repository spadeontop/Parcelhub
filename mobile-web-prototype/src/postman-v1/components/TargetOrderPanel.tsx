import React from 'react';
import { OrderStatusBadge } from './MethodBadge';
import type { TargetOrderItem } from '../types';

export interface TargetOrderPanelProps {
  readonly scope: 'customer' | 'staff';
  readonly onChangeScope: (scope: 'customer' | 'staff') => void;
  readonly isLiveData: boolean;
  readonly orders: readonly TargetOrderItem[];
  readonly selectedOrderId: string;
  readonly useTicketCode: boolean;
  readonly onToggleUseTicketCode: () => void;
  readonly onSelectOrder: (item: TargetOrderItem) => void;
  readonly onSync: () => void;
  readonly canSync: boolean;
}

export const TargetOrderPanel: React.FC<TargetOrderPanelProps> = ({
  scope,
  onChangeScope,
  isLiveData,
  orders,
  selectedOrderId,
  useTicketCode,
  onToggleUseTicketCode,
  onSelectOrder,
  onSync,
  canSync,
}) => {
  return (
    <div className="p-3 flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* Scope & Format Bar */}
      <div className="shrink-0 flex items-center justify-between gap-1.5">
        <div className="inline-flex border border-zinc-200 rounded overflow-hidden">
          {(['customer', 'staff'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeScope(s)}
              className={`px-2 py-1 text-[10px] font-medium capitalize cursor-pointer ${
                scope === s ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleUseTicketCode}
            title="Switch between UUID orderId and human ticketCode"
            className="px-2 py-1 text-[10px] font-mono rounded border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 cursor-pointer"
          >
            {useTicketCode ? 'Ticket' : 'Order ID'}
          </button>
          <button
            type="button"
            disabled={!canSync}
            onClick={onSync}
            className="px-2 py-1 text-[10px] font-mono rounded border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900 disabled:opacity-40 cursor-pointer"
          >
            Sync
          </button>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span>Source: {isLiveData ? 'Live DB' : 'Seed Presets'}</span>
        <span>Active: {selectedOrderId || 'none'}</span>
      </div>

      {/* Order List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
        {orders.map((ord) => {
          const targetVal = useTicketCode && ord.ticketCode ? ord.ticketCode : ord.id;
          const isSelected =
            selectedOrderId.trim() === ord.id ||
            (Boolean(ord.ticketCode) && selectedOrderId.trim() === ord.ticketCode);
          return (
            <button
              key={ord.id}
              type="button"
              aria-label={`Target order ${targetVal}`}
              onClick={() => onSelectOrder(ord)}
              className={`w-full text-left p-2 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-zinc-900 bg-zinc-100'
                  : 'border-zinc-200 bg-white hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-zinc-900 truncate">
                  {targetVal}
                </span>
                <OrderStatusBadge status={ord.status} />
              </div>
              <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-zinc-500">
                <span className="truncate">{ord.label}</span>
                {typeof ord.price === 'number' && ord.price > 0 && (
                  <span className="font-mono text-zinc-700 shrink-0">₱{ord.price}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
