import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { QrCodeIcon } from '../common/Icons';

export const PaymentVerificationScreen: React.FC = () => {
  const { navigateTo, openEscrowModal } = useApp();

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 justify-between select-none">
      {/* Unified Header */}
      <BrandHeader showBack={true} backTarget="home" />

      {/* Center Card */}
      <div className="my-auto py-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-xs">
          <h2 className="text-2xl font-bold text-gray-900">Awaiting Payment</h2>

          <p className="text-base font-bold text-[#10b780] mt-3">Order created successfully!</p>

          <p className="text-sm text-[#215cd4] font-medium leading-relaxed mt-4 max-w-xs mx-auto">
            <span className="font-bold">Next step:</span> Please head to Lily’s Catering Hub to complete the cash
            payment. We will begin tracking your parcel once the payment is verified.
          </p>

          {/* Learn more toggle */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={openEscrowModal}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Hub Policy &amp; Information</span>
            </button>
          </div>

          {/* Generate QR Button */}
          <div className="mt-7">
            <button
              type="button"
              onClick={() => navigateTo('qr_screen')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <span>Generate QR</span>
              <QrCodeIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Return to Home Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Return to Home
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </div>
  );
};
