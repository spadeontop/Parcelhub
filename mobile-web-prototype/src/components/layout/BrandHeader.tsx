import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { BackArrowIcon } from '../common/Icons';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTarget?: ScreenId;
  onBack?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  title = 'Parcelhub',
  subtitle = "LILY'S CATERING HUB",
  showBack = false,
  backTarget = 'home',
  onBack,
}) => {
  const {
    hubOpen,
    notificationActive,
    notifications,
    toggleNotificationAlerts,
    openNotificationsModal,
    navigateTo,
  } = useApp();

  const hasUnreadNotifications = notifications.some((n) => n.unread);

  return (
    <header className="flex items-center justify-between py-2 select-none border-b border-gray-100/80 pb-3 mb-1">
      <div className="flex items-center gap-2.5">
        {showBack ? (
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigateTo(backTarget);
              }
            }}
            aria-label="Navigate back"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            <BackArrowIcon className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center p-1 border border-blue-100">
            <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">{title}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-[#ef4444]'}`} />
            <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* User Profile Avatar */}
        <button
          type="button"
          onClick={() => navigateTo('mpin_login')}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          aria-label="User Profile (Nyeowsz)"
        >
          NY
        </button>
      </div>
    </header>
  );
};
