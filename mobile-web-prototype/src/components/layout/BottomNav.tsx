import React from 'react';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, HelpIcon, BellIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'notifications' | 'help' | 'faq' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, notifications } = useApp();
  const isHelpActive = activeTab === 'help' || activeTab === 'faq';
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <nav
      className="sticky bottom-4 left-4 right-4 mx-2 h-16 rounded-full bg-white/95 floating-nav flex items-center justify-around px-5 border border-gray-100 z-30 shadow-lg mt-auto"
      aria-label="Bottom Navigation"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
          activeTab === 'home' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Home"
      >
        <HomeIcon className="w-5 h-5" />
        {activeTab === 'home' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 2. Transactions */}
      <button
        type="button"
        onClick={() => navigateTo('transactions')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
          activeTab === 'transactions' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Transactions History"
      >
        <OrdersIcon className="w-5 h-5" />
        {activeTab === 'transactions' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 3. Notifications */}
      <button
        type="button"
        onClick={() => navigateTo('notifications')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
          activeTab === 'notifications' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 border border-white text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {activeTab === 'notifications' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 4. Help and FAQ */}
      <button
        type="button"
        onClick={() => navigateTo('faq')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
          isHelpActive ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Help and FAQ"
      >
        <HelpIcon className="w-5 h-5" />
        {isHelpActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>
    </nav>
  );
};
