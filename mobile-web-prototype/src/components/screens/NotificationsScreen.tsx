import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';

export const NotificationsScreen: React.FC = () => {
  const { notifications, markAllNotificationsAsRead, navigateTo } = useApp();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Brand Header with Back to Home */}
      <BrandHeader
        title="Notifications"
        subtitle="ACTIVITY UPDATES"
        showBack={false}
        showLogo={false}
        showProfile={false}
      />

      {/* Screen Title & Quick Actions */}
      <div className="flex items-center justify-between mt-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Inbox
          </h2>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-[11px] font-bold text-red-600">
              {unreadCount} unread
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              All caught up
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#215cd4] transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List or Empty State */}
      <div className="flex-1 flex flex-col">
        {notifications.length === 0 ? (
          <div className="flex-1 min-h-[360px] rounded-3xl bg-[#f8f8f8] border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-[#215cd4]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                />
              </svg>
            </div>
            <p className="text-gray-900 font-bold text-base">No notifications yet</p>
            <p className="text-gray-500 text-xs mt-1 max-w-xs leading-relaxed">
              When your parcel status updates or requires pickup action, you’ll see the notifications here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.unread
                    ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                    : 'bg-[#fafafa] border-gray-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#215cd4]" />
                      )}
                      <h4
                        className={`text-sm font-bold ${
                          item.unread ? 'text-[#163b86]' : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav with Notifications active */}
      <BottomNav activeTab="notifications" />
    </div>
  );
};