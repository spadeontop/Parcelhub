import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';

export const HomeScreen: React.FC = () => {
  const { hasOrders, setHasOrders, orders, navigateTo } = useApp();

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Consistent Brand Header */}
      <BrandHeader />

      {/* Welcome Dark Card */}
      <section className="mt-4 rounded-3xl bg-[#1e1e1e] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Nyeowsz!</h2>
          <p className="text-sm text-gray-400 mt-1">Create an order to get started</p>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigateTo('create_order')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-semibold text-xs tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              + Create Order
            </button>
            <button
              type="button"
              onClick={() => navigateTo('transactions')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#163b86] hover:bg-[#102d6b] text-white font-semibold text-xs tracking-wide transition-all btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Transactions
            </button>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="mt-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Activities</h3>
          <button
            type="button"
            onClick={() => setHasOrders(!hasOrders)}
            className="text-xs text-[#215cd4] hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Switch to {hasOrders ? 'Zero' : 'Active'} orders view
          </button>
        </div>

        {!hasOrders ? (
          /* Zero Orders Empty State Box */
          <div className="flex-1 min-h-[360px] rounded-3xl bg-[#f8f8f8] border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-[#215cd4]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-800 text-sm font-semibold">You don’t have any activities yet</p>
            <button
              type="button"
              onClick={() => navigateTo('create_order')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shadow-sm transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Create an order
            </button>
          </div>
        ) : (
          /* With Orders List Container */
          <div className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 divide-y divide-gray-200/70">
            {orders.map((order) => (
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
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </div>
  );
};
