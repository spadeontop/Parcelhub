import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';

export const HomeScreen: React.FC = () => {
  const { hasOrders, orders, navigateTo } = useApp();

  const isOrderListEmpty = !hasOrders || orders.length === 0;
  const recentOrders = orders.slice(0, 5);

  const readyCount = orders.filter((o) => o.status === 'READY_TO_CLAIM').length;
  const inTransitCount = orders.filter((o) => o.status === 'AWAITING_PARCEL').length;
  const unpaidCount = orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length;

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Consistent Brand Header */} 
      <BrandHeader />

      {/* Welcome Dark Card */}
      <section className="mt-4 rounded-3xl bg-[#181b20] p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          {/* Status Pills inside Card (above Welcome) */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {/* Ready */}
            <button
              type="button"
              onClick={() => navigateTo('transactions')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-medium text-gray-300 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b780]" />
              <span>{readyCount} Ready</span>
            </button>

            {/* In Transit */}
            <button
              type="button"
              onClick={() => navigateTo('transactions')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-medium text-gray-300 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b65e8]" />
              <span>{inTransitCount} In Transit</span>
            </button>

            {/* Unpaid */}
            <button
              type="button"
              onClick={() => navigateTo('transactions')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-medium text-gray-300 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span>{unpaidCount} Unpaid</span>
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Nyeowsz!</h2>
          <p className="text-sm text-gray-400 mt-1">Create an order or track existing deliveries</p>

          <div className="mt-4 flex">
            <button
              type="button"
              onClick={() => navigateTo('create_order')}
              style={{
                flex: 1,
                background: '#1b65e8',
                color: 'white',
                border: 'none',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              className="hover:brightness-105 active:scale-[0.99] transition-all"
            >
              + Create Order
            </button>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="mt-6 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">Activities</h3>
        </div>

        {isOrderListEmpty ? (
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
          /* With Orders List Container (Limited to 5) */
          <div className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 divide-y divide-gray-200/70">
            {recentOrders.map((order) => (
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

            {/* View All link below the list */}
            <div className="pt-3.5 border-t border-gray-200/70 text-center">
              <button
                type="button"
                onClick={() => navigateTo('transactions')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b65e8] hover:underline cursor-pointer focus-visible:outline-none"
              >
                <span>View all activities</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </div>
  );
};
