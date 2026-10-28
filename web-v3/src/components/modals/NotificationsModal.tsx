import React from 'react';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsModalOpen,
    closeNotificationsModal,
    notifications,
    markAllNotificationsAsRead,
  } = useApp();

  if (!isNotificationsModalOpen) return null;

  const handleDismiss = () => {
    markAllNotificationsAsRead();
    closeNotificationsModal();
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div
      id="notifications-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-title"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 id="notif-title" className="text-base font-bold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                {unreadCount} New
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeNotificationsModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Close Notifications Modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-colors ${
                item.unread
                  ? 'bg-blue-50/70 border-blue-100'
                  : 'bg-[#f8f8f8] border-gray-100'
              }`}
            >
              <div className="flex justify-between items-baseline">
                <h3 className={`text-xs font-bold ${item.unread ? 'text-[#163b86]' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                <span className={`text-[10px] font-mono ${item.unread ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.time}
                </span>
              </div>
              <p className={`text-xs mt-1 ${item.unread ? 'text-blue-800' : 'text-gray-600'}`}>{item.body}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
