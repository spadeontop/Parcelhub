import React from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionFilter } from '../../types';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';

const FILTERS: TransactionFilter[] = ['ALL', 'READY_TO_CLAIM', 'AWAITING_PARCEL', 'PAYMENT_REQUIRED', 'CLAIMED'];

export const TransactionsScreen: React.FC = () => {
  const { orders, transactionFilter, setTransactionFilter, navigateTo } = useApp();

  const filteredOrders =
    transactionFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === transactionFilter);

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Unified Header */}
      <BrandHeader title="Transactions" subtitle="ORDER HISTORY" showBack={false} showLogo={false} showProfile={false} />

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none mt-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTransactionFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8] ${
              transactionFilter === f
                ? 'bg-[#1b65e8] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'ALL' ? 'All Orders' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Orders List Container */}
      <div className="mt-4 flex-1">
        <div className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 divide-y divide-gray-200/70">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No orders found matching this filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigateTo('order_details', { orderId: order.id })}
                className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-all rounded-xl px-2 hover:bg-white"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#215cd4] transition-colors">
                    {order.product}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">{order.dateLabel}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${getStatusTextColor(order.status)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDotClass(order.status)}`} />
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab="transactions" />
    </div>
  );
};
