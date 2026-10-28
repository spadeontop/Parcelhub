import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { BackArrowIcon } from '../common/Icons';

export const CreateOrderScreen: React.FC = () => {
  const { navigateTo, loadSampleReceipt, handleReceiptFile, showToast } = useApp();
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleReceiptFile(file);
      } else {
        showToast('Please drop a valid image file (PNG, JPG, WebP).');
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleReceiptFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      {/* Unified Header */}
      <BrandHeader showBack={true} backTarget="home" />

      <div className="flex items-center justify-between mt-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900">Create an Order</h2>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>Back</span>
          <BackArrowIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Dropzone Card */}
      <div className="mt-2 flex-1 flex flex-col">
        <label
          htmlFor="receipt-file-input"
          id="dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 min-h-[350px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer relative group ${
            isDragging
              ? 'border-[#215cd4] bg-blue-50/50'
              : 'border-gray-300 hover:border-[#215cd4] bg-[#f8f8f8] hover:bg-blue-50/40'
          }`}
        >
          <input
            type="file"
            id="receipt-file-input"
            aria-label="Upload Screenshot Receipt Image"
            accept="image/*"
            className="hidden"
            onChange={onFileInputChange}
          />

          <div className="w-18 h-18 rounded-2xl bg-white border border-gray-200 text-[#215cd4] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-3">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="text-base font-bold text-gray-900">Tap to upload receipt image</p>
          <p className="text-xs text-gray-400 mt-1 text-center">Supports Shopee, Lazada, TikTok Shop screenshots</p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadSampleReceipt();
            }}
            className="mt-5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-800 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            ⚡ Use Sample Shopee Receipt
          </button>
        </label>

        <p className="text-center text-xs font-medium text-gray-500 mt-3">Screenshot of Receipt</p>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => navigateTo('confirm_order')}
          className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Next
        </button>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </div>
  );
};
