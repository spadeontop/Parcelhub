import React from 'react';
import { StaffSpinner } from '../../common/StaffLoadingIndicator';

export interface StaffScannerUploadTargetProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

export const StaffScannerUploadTarget: React.FC<StaffScannerUploadTargetProps> = React.memo(({
  onFileUpload,
  isLoading = false,
}) => {
  return (
    <div>
      <label className="qr-upload-target btn-press group w-full py-3.5 px-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-dashed border-slate-700 hover:border-blue-500/50 flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors shrink-0">
          {isLoading ? (
            <StaffSpinner size="sm" color="#60a5fa" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <div className="text-left">
          <span className="block text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
            {isLoading ? 'Processing Image...' : 'Upload QR Photo'}
          </span>
          <span className="block text-[10px] text-slate-400">
            {isLoading ? 'Scanning barcode from photo' : 'Select image or screenshot from device'}
          </span>
        </div>
        <input
          type="file"
          id="qr-file-input"
          accept="image/*"
          disabled={isLoading}
          onChange={onFileUpload}
          className="hidden"
        />
      </label>
    </div>
  );
});

StaffScannerUploadTarget.displayName = 'StaffScannerUploadTarget';
