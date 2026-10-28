import React from 'react';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const ProofOfDeliveryModal: React.FC = () => {
  const { isPodModalOpen, closePodModal, getCurrentOrder } = useApp();
  const order = getCurrentOrder();

  if (!isPodModalOpen) return null;

  return (
    <div
      id="pod-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pod-title"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 id="pod-title" className="text-base font-bold text-gray-900">
              Proof of Delivery
            </h2>
            <p className="text-xs text-gray-500">Delivery Verification Photo</p>
          </div>
          <button
            type="button"
            onClick={closePodModal}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            aria-label="Close Proof of Delivery Modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Photo */}
        <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 relative">
          {order.parcelImageUrl ? (
            <div className="relative">
              <img
                src={order.parcelImageUrl}
                alt={`Proof of Delivery for ${order.trackingNumber}`}
                className="h-44 w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center justify-between text-[11px] text-white font-mono">
                <span>{order.trackingNumber}</span>
                <span className="text-[#10b780] font-bold">✔ Verified</span>
              </div>
            </div>
          ) : (
            <div className="h-44 bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-20 h-16 rounded-lg bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-inner mb-2">
                <span className="text-[10px] font-mono font-bold text-amber-900">📦 POUCH</span>
              </div>
              <p className="text-xs font-mono text-[#10b780] font-bold">MATCH: {order.trackingNumber}</p>
              <span className="text-[10px] text-gray-400">Hub Counter Camera • Verified Intact</span>
            </div>
          )}
        </div>

        {/* Details Summary */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Waybill Barcode:</span>
            <span className="font-mono font-bold text-gray-900">{order.trackingNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Carrier:</span>
            <span className="font-semibold text-gray-900">{order.carrier}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Arrival Time:</span>
            <span className="font-mono text-gray-900">17 Oct 2026 22:32:04</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Condition Verified:</span>
            <span className="font-bold text-[#10b780]">SEALED &amp; INTACT (100%)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Verified By:</span>
            <span className="font-semibold text-gray-900">Lily's Hub Staff</span>
          </div>
        </div>

        <button
          type="button"
          onClick={closePodModal}
          className="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
};
