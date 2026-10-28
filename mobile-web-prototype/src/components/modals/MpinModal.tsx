import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const MpinModal: React.FC = () => {
  const { isMpinModalOpen, closeMpinModal, completeMpinClaim } = useApp();
  const [mpin, setMpin] = useState<string>('');

  useEffect(() => {
    if (isMpinModalOpen) {
      setMpin('');
    }
  }, [isMpinModalOpen]);

  const handleDigit = useCallback(
    (digit: string) => {
      setMpin((prev) => {
        if (prev.length < 6) {
          const next = prev + digit;
          if (next.length === 6) {
            setTimeout(() => {
              completeMpinClaim();
            }, 280);
          }
          return next;
        }
        return prev;
      });
    },
    [completeMpinClaim]
  );

  const handleDelete = useCallback(() => {
    setMpin((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  // Physical keyboard listeners
  useEffect(() => {
    if (!isMpinModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeMpinModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMpinModalOpen, handleDigit, handleDelete, closeMpinModal]);

  if (!isMpinModalOpen) return null;

  return (
    <div
      id="mpin-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mpin-title"
    >
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-gray-900 animate-slide-up">
        {/* Pill Handle for mobile */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="mpin-title" className="text-lg font-bold text-gray-900">
              Authorize Release
            </h2>
            <p className="text-xs text-gray-500">Enter your 6-digit MPIN to confirm handover</p>
          </div>
          <button
            type="button"
            onClick={closeMpinModal}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Close MPIN Modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 6 MPIN Indicators */}
        <div className="flex items-center justify-center gap-3.5 py-5">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                idx < mpin.length ? 'bg-[#215cd4] ring-4 ring-blue-100' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              {d}
            </button>
          ))}

          <button
            type="button"
            onClick={closeMpinModal}
            className="py-3 text-xs font-bold rounded-2xl text-gray-500 hover:bg-gray-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Backspace"
            className="py-3 text-base font-bold rounded-2xl text-gray-700 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
