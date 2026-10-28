import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const MpinCreateScreen: React.FC = () => {
  const { authCustomer, createCustomerMpin, showToast, isMpinModalOpen } = useApp();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [pin1, setPin1] = useState<string>('');
  const [pin2, setPin2] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mismatch, setMismatch] = useState<boolean>(false);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearStepTimer();
  }, [clearStepTimer]);

  const handleKeyPress = useCallback((digit: string) => {
    if (activeStep === 1) {
      setMismatch(false);
      if (pin1.length < 4) {
        const nextPin = pin1 + digit;
        setPin1(nextPin);
        if (nextPin.length === 4) {
          clearStepTimer();
          stepTimerRef.current = setTimeout(() => {
            setActiveStep(2);
            setMismatch(false);
          }, 200);
        }
      }
    } else {
      // If previous entry was mismatched, typing starts fresh immediately without freezing
      if (mismatch) {
        setMismatch(false);
        setPin2(digit);
        return;
      }

      if (pin2.length < 4) {
        const nextPin = pin2 + digit;
        setPin2(nextPin);
        if (nextPin.length === 4) {
          if (nextPin === pin1) {
            setMismatch(false);
          } else {
            setMismatch(true);
            showToast('MPIN does not match. Please re-enter.');
          }
        }
      }
    }
  }, [activeStep, pin1, pin2, mismatch, showToast, clearStepTimer]);

  const handleBackspace = useCallback(() => {
    clearStepTimer();
    setMismatch(false);
    if (activeStep === 1) {
      if (pin1.length > 0) {
        setPin1((prev) => prev.slice(0, -1));
      }
    } else {
      if (pin2.length > 0) {
        setPin2((prev) => prev.slice(0, -1));
      } else {
        // Return to Step 1 if backspace on empty Step 2
        setActiveStep(1);
      }
    }
  }, [activeStep, pin1.length, pin2.length, clearStepTimer]);

  // Support physical keyboard
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

  const handleSubmit = async () => {
    clearStepTimer();
    if (pin1.length < 4) {
      showToast('Please enter a 4-digit MPIN first.');
      setActiveStep(1);
      return;
    }
    if (pin2.length < 4) {
      showToast('Please re-enter your 4-digit MPIN to confirm.');
      setActiveStep(2);
      return;
    }
    if (pin1 !== pin2) {
      setMismatch(true);
      showToast('MPIN confirmation does not match. Please re-enter.');
      setPin2('');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomerMpin(pin1);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create MPIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatched = pin1.length === 4 && pin2.length === 4 && pin1 === pin2;
  const displayName = authCustomer.firstname
    ? `${authCustomer.firstname} ${authCustomer.lastname}`
    : 'John Vince Dumaguit';

  return (
    <div className="flex flex-col min-h-[720px] bg-white px-6 py-6 relative select-none animate-fadeIn justify-between">
      <div>
        {/* Compact Horizontal Logo */}
        <div className="flex items-center justify-center gap-2 mb-4 mt-1">
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
        <div className="border border-gray-200 rounded-lg p-2.5 px-3.5 flex items-center justify-between mb-4 bg-white shadow-2xs">
          <span className="text-[13.5px] font-medium text-gray-900">{displayName}</span>
        </div>

        {/* Dual MPIN Creation & Confirmation Container */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Step 1: Create 4-digit MPIN */}
          <div
            onClick={() => {
              clearStepTimer();
              setActiveStep(1);
              setMismatch(false);
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
              activeStep === 1
                ? 'bg-blue-50/50 border-[#215cd4]/40 shadow-xs'
                : 'bg-gray-50/80 border-gray-200/80'
            }`}
          >
            <div className="text-[12.5px] font-semibold text-gray-700 flex items-center justify-center gap-1.5 mb-2">
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  pin1.length === 4
                    ? 'bg-[#10b780] text-white'
                    : activeStep === 1
                    ? 'bg-[#215cd4] text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {pin1.length === 4 ? '✓' : '1'}
              </span>
              <span>1. Enter MPIN</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin1.length;
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
          </div>

          {/* Step 2: Re-enter MPIN to Confirm */}
          <div
            onClick={() => {
              if (pin1.length === 4) {
                setActiveStep(2);
                setMismatch(false);
              } else {
                showToast('Please finish entering your 4-digit MPIN first.');
              }
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer text-center ${
              activeStep === 2
                ? 'bg-blue-50/50 border-[#215cd4]/40 shadow-xs'
                : 'bg-gray-50/80 border-gray-200/80'
            }`}
          >
            <div className="text-[12.5px] font-semibold text-gray-700 flex items-center justify-center gap-1.5 mb-2">
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isMatched
                    ? 'bg-[#10b780] text-white'
                    : activeStep === 2
                    ? 'bg-[#215cd4] text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {isMatched ? '✓' : '2'}
              </span>
              <span>2. Confirm MPIN</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin2.length;
                let dotStyle = 'border-gray-300 bg-transparent';
                if (activeStep === 2 && mismatch) {
                  dotStyle = 'border-red-500 bg-red-500 scale-110';
                } else if (isMatched) {
                  dotStyle = 'border-[#10b780] bg-[#10b780] scale-110';
                } else if (isFilled) {
                  dotStyle = 'bg-[#215cd4] border-[#215cd4] scale-110';
                }
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-all duration-150 ${dotStyle}`}
                  />
                );
              })}
            </div>
            {activeStep === 2 && (
              <div className="text-[11px] mt-1.5 font-medium">
                {mismatch ? (
                  <span className="text-[#ef4444] font-semibold">Digits do not match</span>
                ) : isMatched ? (
                  <span className="text-[#10b780] font-semibold">MPIN verified &amp; ready!</span>
                ) : (
                  <span className="text-gray-400">Re-enter MPIN to Confirm</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Circular Keypad Grid (7 8 9 / 4 5 6 / 1 2 3 / Reset 0 Backspace) */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-3 max-w-[260px] mx-auto mb-4 justify-items-center">
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
              clearStepTimer();
              if (activeStep === 2) {
                setPin2('');
                setMismatch(false);
              } else {
                setPin1('');
              }
            }}
            className="w-[58px] h-[58px] rounded-full border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Clear"
          >
            Clear
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
        {/* Primary Action Button */}
        <button
          type="button"
          disabled={isSubmitting || (activeStep === 2 && pin2.length < 4)}
          onClick={activeStep === 1 && pin1.length === 4 ? () => setActiveStep(2) : handleSubmit}
          className="w-full h-11 bg-[#215cd4] hover:bg-[#194cb5] text-white rounded-lg font-semibold text-[14.5px] shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting
            ? 'Activating MPIN...'
            : activeStep === 1
            ? pin1.length === 4
              ? 'Next: Confirm MPIN &rarr;'
              : 'Enter 4 Digits'
            : 'Create MPIN'}
        </button>

        {activeStep === 2 && (
          <div className="text-center mt-2.5">
            <button
              type="button"
              onClick={() => {
                clearStepTimer();
                setActiveStep(1);
                setPin2('');
                setMismatch(false);
              }}
              className="text-[12px] text-[#215cd4] hover:underline font-semibold cursor-pointer bg-transparent border-none"
            >
              &larr; Change Step 1 MPIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default MpinCreateScreen;
