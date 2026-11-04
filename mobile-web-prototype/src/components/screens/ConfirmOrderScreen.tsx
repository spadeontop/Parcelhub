import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { BackArrowIcon } from '../common/Icons';

export const ConfirmOrderScreen: React.FC = () => {
  const { draftOrder, updateDraftOrder, submitDraftOrder, navigateTo, showToast } = useApp();
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!isConfirmed) {
      showToast('Please check the confirmation box to proceed.');
      return;
    }
    submitDraftOrder();
  };

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Unified Header */}
      <BrandHeader showBack={true} backTarget="create_order" />

      <div className="flex items-center justify-between mt-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900">Confirm Order Details</h2>
        <button
          type="button"
          onClick={() => navigateTo('create_order')}
          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>Back</span>
          <BackArrowIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Details Inputs Cards Container */}
      <div className="mt-2 space-y-2.5">
        {/* Product Field */}
        <div className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label htmlFor="draft-product" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Product
          </label>
          <input
            type="text"
            id="draft-product"
            aria-label="Product Name"
            value={draftOrder.product}
            onChange={(e) => updateDraftOrder({ product: e.target.value })}
            className="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          />
        </div>

        {/* Receiver's Name Field */}
        <div className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label htmlFor="draft-recipient" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Receiver’s Name
          </label>
          <input
            type="text"
            id="draft-recipient"
            aria-label="Receiver's Full Name"
            value={draftOrder.recipient}
            onChange={(e) => updateDraftOrder({ recipient: e.target.value })}
            className="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          />
        </div>

        {/* Total COD Amount Field */}
        <div className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label htmlFor="draft-amount" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Total Amount
          </label>
          <input
            type="text"
            id="draft-amount"
            aria-label="Total COD Amount"
            value={draftOrder.totalAmount}
            onChange={(e) => updateDraftOrder({ totalAmount: e.target.value })}
            className="w-full text-base font-bold text-gray-900 font-mono-numbers focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          />
        </div>

        {/* Tracking ID Field */}
        <div className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label htmlFor="draft-tracking" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Tracking ID
          </label>
          <input
            type="text"
            id="draft-tracking"
            aria-label="Tracking ID or Waybill Barcode"
            value={draftOrder.trackingId}
            onChange={(e) => updateDraftOrder({ trackingId: e.target.value })}
            className="w-full text-base font-mono font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          />
        </div>
      </div>

      {/* Receipt Thumbnail Preview */}
      <div className="mt-4 flex flex-col items-center">
        <div className="w-28 h-36 rounded-xl border border-gray-200 shadow-2xs overflow-hidden bg-gray-50 flex items-center justify-center">
          <img src={draftOrder.receiptUri} alt="Screenshot of Receipt" className="w-full h-full object-cover" />
        </div>
        <p className="text-xs font-medium text-gray-500 mt-1.5">Screenshot of Receipt</p>
      </div>

      {/* Confirmation Checkbox */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <input
          type="checkbox"
          id="confirm-details-checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          className="w-4 h-4 rounded text-[#215cd4] focus:ring-[#215cd4] cursor-pointer"
        />
        <label htmlFor="confirm-details-checkbox" className="text-xs font-semibold text-gray-800 cursor-pointer">
          I confirm that these order details are correct
        </label>
      </div>

      {/* Create Order Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isConfirmed}
        className={`w-full mt-3 py-3.5 px-6 rounded-2xl text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${isConfirmed ? 'bg-[#215cd4] hover:bg-[#194cb5] cursor-pointer' : 'bg-gray-300 opacity-80 cursor-not-allowed'}`}
      >
        Submit Order &amp; Proceed to Payment
      </button>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </div>
  );
};
