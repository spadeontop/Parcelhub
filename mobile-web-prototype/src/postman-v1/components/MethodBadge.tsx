import React from 'react';
import type { HttpMethod, OrderStatus } from '../types';

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'text-blue-700 bg-blue-50 border-blue-200',
  POST: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  PUT: 'text-amber-700 bg-amber-50 border-amber-200',
  PATCH: 'text-violet-700 bg-violet-50 border-violet-200',
  DELETE: 'text-rose-700 bg-rose-50 border-rose-200',
};

const METHOD_TEXT_ONLY: Record<HttpMethod, string> = {
  GET: 'text-blue-600',
  POST: 'text-emerald-600',
  PUT: 'text-amber-600',
  PATCH: 'text-violet-600',
  DELETE: 'text-rose-600',
};

export const MethodBadge: React.FC<{
  method: HttpMethod;
  variant?: 'pill' | 'text';
  className?: string;
}> = ({ method, variant = 'pill', className = '' }) => {
  const shortLabel = method === 'DELETE' ? 'DEL' : method;
  if (variant === 'text') {
    return (
      <span
        className={`inline-block w-9 shrink-0 font-mono text-[10px] font-semibold tracking-tight ${METHOD_TEXT_ONLY[method]} ${className}`}
      >
        {shortLabel}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-tight border rounded ${METHOD_STYLES[method]} ${className}`}
    >
      {method}
    </span>
  );
};

export const HttpStatusBadge: React.FC<{
  status: number;
  statusText?: string;
  ok: boolean;
}> = ({ status, statusText, ok }) => {
  const classes =
    status === 0
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : ok
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : status === 401 || status === 403
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[11px] font-semibold border rounded ${classes}`}
    >
      {status === 0 ? 'NET ERR' : statusText ? `${status} ${statusText}` : String(status)}
    </span>
  );
};

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_INITIALIZATION: 'text-violet-700 bg-violet-50 border-violet-200',
  PAYMENT_REQUIRED: 'text-amber-700 bg-amber-50 border-amber-200',
  AWAITING_PARCEL: 'text-blue-700 bg-blue-50 border-blue-200',
  READY_TO_CLAIM: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CLAIMED: 'text-zinc-600 bg-zinc-100 border-zinc-200',
  CANCELLED: 'text-rose-700 bg-rose-50 border-rose-200',
  REFUNDED: 'text-teal-700 bg-teal-50 border-teal-200',
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[9px] font-medium border rounded ${ORDER_STATUS_STYLES[status]}`}
  >
    {status}
  </span>
);
