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
        {/* Notification Toggle Pill */}
        <button
          type="button"
          onClick={toggleNotificationAlerts}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#93eb99] text-gray-900 hover:bg-[#82e088] transition-all btn-press shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>{notificationActive ? 'Alerts On' : 'Turn on'}</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        </button>

        {/* Bell Notification Button */}
        <button
          type="button"
          onClick={openNotificationsModal}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-900 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          aria-label="View notifications"
        >
          <img src="./assets/bell_icon.svg" alt="Bell Icon" className="w-6 h-6 object-contain" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ef4444] rounded-full ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
};
