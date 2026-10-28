import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { viewMode, activeScreen } = useApp();
  const screenContentRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever screen changes
  useEffect(() => {
    if (screenContentRef.current) {
      screenContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeScreen]);

  const isStaff = activeScreen === 'staff_ui';

  return (
    <main className="flex-1 flex items-center justify-center p-2 sm:p-6" id="device-wrapper">
      <div
        id="phone-frame"
        className={`overflow-hidden transition-all duration-300 relative flex flex-col ${
          isStaff ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'
        } ${
          viewMode === 'device'
            ? 'phone-mockup w-full max-w-[420px] rounded-[48px] my-4 border-4 border-slate-800 shadow-2xl h-[844px]'
            : 'w-full max-w-md min-h-screen rounded-none shadow-none my-0'
        }`}
      >
        {/* Top Bezel / Dynamic Island / Status Bar (visible only in device frame mode) */}
        {viewMode === 'device' && (
          <div
            id="phone-bezel-header"
            className={`px-7 pt-3.5 pb-1 flex items-center justify-between text-xs font-semibold select-none shrink-0 transition-colors ${
              isStaff ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-900'
            }`}
          >
            <span className="tracking-tight">9:41</span>
            <div className="dynamic-island" />
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.64-.64C7.93 20.26 9.88 21 12 21s4.07-.74 5.61-1.97l.64.64c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.64-.64C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" />
              </svg>
              <div className={`w-5 h-2.5 border rounded-xs p-0.5 flex items-center ${isStaff ? 'border-slate-400' : 'border-gray-900'}`}>
                <div className={`w-3.5 h-full rounded-3xs ${isStaff ? 'bg-slate-400' : 'bg-gray-900'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Screen Content */}
        <div ref={screenContentRef} id="mobile-screen-content" className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className={`py-2 flex justify-center select-none shrink-0 transition-colors ${isStaff ? 'bg-slate-900' : 'bg-white'}`}>
          <div className={`w-32 h-1 rounded-full ${isStaff ? 'bg-slate-700' : 'bg-gray-300'}`} />
        </div>
      </div>
    </main>
  );
};
