import React from 'react';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const EscrowPolicyModal: React.FC = () => {
  const { isEscrowModalOpen, closeEscrowModal } = useApp();

  if (!isEscrowModalOpen) return null;

  return (
    <div
      id="escrow-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="escrow-title"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 id="escrow-title" className="text-base font-bold text-gray-900">
            ParcelHub Counter Policy
          </h2>
          <button
            type="button"
            onClick={closeEscrowModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Close Counter Policy Modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs text-gray-600 leading-relaxed max-h-80 overflow-y-auto">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
            <h3 className="font-bold text-[#163b86] mb-1">Exact Payment Rule</h3>
            <p className="text-blue-900">
              The amount paid to the courier matches the exact price on your order receipt. Any excess cash deposit is
              safely kept and returned to you as change when you pick up your parcel.
            </p>
          </div>

          <div className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-1">Cash On Delivery Ready</h3>
            <p>
              Cash is deposited at Lily’s Catering Hub counter so our staff can receive and pay for your delivery as
              soon as the courier arrives.
            </p>
          </div>

          <div className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-1">Safe Cash Handling</h3>
            <p>Your exact cash deposit is safely kept at the counter and any change is returned to you upon pickup.</p>
          </div>

          <div className="p-3 bg-[#f8f8f8] rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-1">6-Digit MPIN Verification</h3>
            <p>
              Parcels are only released at the counter when verified with your personal 6-digit MPIN for full
              security.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeEscrowModal}
          className="w-full mt-5 py-3 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Understood
        </button>
      </div>
    </div>
  );
};
