import React from 'react';
import { useApp } from '../../context/AppContext';
import { HomeIcon, OrdersIcon, HelpIcon, ProfileIcon } from '../common/Icons';

interface BottomNavProps {
  activeTab?: 'home' | 'transactions' | 'help' | 'faq' | 'profile';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'home' }) => {
  const { navigateTo, showToast } = useApp();
  const isHelpActive = activeTab === 'help' || activeTab === 'faq';

  return (
    <nav
      className="sticky bottom-4 left-4 right-4 mx-2 h-16 rounded-full bg-white/95 floating-nav flex items-center justify-around px-5 border border-gray-100 z-30 shadow-lg mt-auto"
      aria-label="Bottom Navigation"
    >
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

      <button
        type="button"
        onClick={() => showToast('Customer Account: Nyeowsz')}
        className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${
          activeTab === 'profile' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label="Customer Profile"
      >
        <ProfileIcon className="w-5 h-5" />
        {activeTab === 'profile' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>
    </nav>
  );
};
