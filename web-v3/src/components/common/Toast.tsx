import React from 'react';

interface ToastProps {
  message: string;
  isOpen: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 z-50 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 transition-all duration-300 pointer-events-none ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-[#10b780]" />
      <span className="text-xs font-medium tracking-wide">{message}</span>
    </div>
  );
};
