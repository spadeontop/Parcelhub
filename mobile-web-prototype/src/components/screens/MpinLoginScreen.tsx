import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const MpinLoginScreen: React.FC = () => {
  const { authCustomer, verifyCustomerMpin, navigateTo, showToast, isMpinModalOpen } = useApp();
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoSubmitTimer = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAutoSubmitTimer();
  }, [clearAutoSubmitTimer]);

  const handleKeyPress = useCallback((num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        clearAutoSubmitTimer();
        setIsVerifying(true);
        autoSubmitTimerRef.current = setTimeout(() => {
          verifyCustomerMpin(nextPin)
            .catch(() => {})
            .finally(() => {
              setIsVerifying(false);
            });
        }, 220);
      }
    }
  }, [pin, verifyCustomerMpin, clearAutoSubmitTimer]);

  const handleBackspace = useCallback(() => {
    clearAutoSubmitTimer();
    setIsVerifying(false);
    setPin((prev) => prev.slice(0, -1));
  }, [clearAutoSubmitTimer]);

  // Keyboard navigation (isolated when modal is closed)
  useEffect(() => {
    if (isMpinModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress, handleBackspace, isMpinModalOpen]);

  const displayName = authCustomer.firstname
    ? `${authCustomer.firstname} ${authCustomer.lastname}`
    : 'John Vince Dumaguit';

  return (
    <div className="flex flex-col min-h-[720px] bg-white px-6 py-8 relative select-none animate-fadeIn justify-between">
      <div>
        {/* Compact Horizontal Logo */}
        <div className="flex items-center justify-center gap-2 mb-5 mt-1">
          <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10L86 31V73L50 94L14 73V31L50 10Z" fill="#215CD4" />
            <path d="M50 10L86 31L50 52L14 31L50 10Z" fill="#3B82F6" />
            <path d="M14 31L50 52V94L14 73V31Z" fill="#1D4ED8" />
            <path d="M86 31L50 52V94L86 73V31Z" fill="#1E40AF" />
            <path
              d="M50 20L75 34.5V64.5L50 79L25 64.5V34.5L50 20Z"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 20V79M25 34.5L50 49L75 34.5"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-[19px] font-extrabold tracking-tight leading-none">
            <span className="text-[#215cd4]">Parcel</span>
            <span className="text-[#111827]">Hub</span>
          </div>
        </div>

        {/* User Identity Box */}
        <div className="border border-gray-200 rounded-lg p-2.5 px-3.5 flex items-center justify-between mb-6 bg-white shadow-2xs">
          <span className="text-[13.5px] font-medium text-gray-900">{displayName}</span>
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="text-[12.5px] text-[#215cd4] hover:underline font-semibold cursor-pointer bg-transparent border-none"
          >
            Not You?
          </button>
        </div>

        {/* MPIN Section Header */}
        <div className="text-[15px] font-semibold text-gray-800 text-center mb-4">Enter MPIN</div>

        {/* 4 MPIN Circles */}
        <div className="flex items-center justify-center gap-4 mb-7" id="login-mpin-dots">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-all duration-150 ${
                  isFilled ? 'bg-[#215cd4] border-[#215cd4] scale-110' : 'border-gray-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Circular Numeric Keypad Grid (7 8 9 / 4 5 6 / 1 2 3 / Reset 0 Backspace) */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 max-w-[260px] mx-auto mb-6 justify-items-center">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-[58px] h-[58px] rounded-full border border-gray-200 bg-white text-gray-900 text-lg font-semibold flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              clearAutoSubmitTimer();
              setIsVerifying(false);
              setPin('');
            }}
            className="w-[58px] h-[58px] rounded-full border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Reset digits"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-[58px] h-[58px] rounded-full border border-gray-200 bg-white text-gray-900 text-lg font-semibold flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-[58px] h-[58px] rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Backspace"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        {/* Verifying Indicator */}
        {isVerifying && (
          <div className="text-center mb-3">
            <span className="text-[13px] font-semibold text-[#215cd4] animate-pulse">
              Verifying MPIN...
            </span>
          </div>
        )}

        {/* Forgot MPIN Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              showToast('Enter your account credentials to reset your MPIN.');
              navigateTo('login');
            }}
            className="text-[12.5px] text-gray-500 hover:text-[#215cd4] hover:underline font-medium transition-colors bg-transparent border-none cursor-pointer"
          >
            Forgot MPIN?
          </button>
        </div>
      </div>
    </div>
  );
};
export default MpinLoginScreen;
