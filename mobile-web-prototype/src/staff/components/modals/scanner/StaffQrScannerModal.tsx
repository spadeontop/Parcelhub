import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Order } from '../../../types';
import { StaffScannerViewfinder } from './StaffScannerViewfinder';
import { StaffScannerUploadTarget } from './StaffScannerUploadTarget';
import { StaffManualLookup } from './StaffManualLookup';

export interface StaffQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderMatched: (order: Order) => void;
  orders: Order[];
  showToast: (msg: string) => void;
}

export const StaffQrScannerModal: React.FC<StaffQrScannerModalProps> = React.memo(({
  isOpen,
  onClose,
  onOrderMatched,
  orders,
  showToast,
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Camera access is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
      showToast('Live camera viewfinder activated.');
    } catch {
      showToast('Camera access denied or unavailable. Using manual lookup fallback.');
      setIsWebcamActive(false);
    }
  }, [showToast]);

  const toggleWebcam = useCallback(() => {
    if (isWebcamActive) {
      stopWebcam();
      showToast('Camera viewfinder paused.');
    } else {
      startWebcam();
    }
  }, [isWebcamActive, startWebcam, stopWebcam, showToast]);

  const handleLookup = useCallback((code: string) => {
    if (!code || !code.trim()) {
      showToast('Please enter an internal Order ID to lookup.');
      return;
    }
    const clean = code.trim().toLowerCase();
    const cleanAlnum = clean.replace(/[^a-z0-9]/g, '');

    const matched = orders.find((o) => {
      const id = o.id.toLowerCase();
      const cleanId = id.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');

      return (
        cleanId === cleanAlnum ||
        id === clean ||
        (cleanAlnum.length >= 3 && cleanId.endsWith(cleanAlnum)) ||
        track === clean ||
        key === clean ||
        cleanKey === cleanAlnum ||
        track.includes(clean) ||
        clean.includes(track)
      );
    });

    if (matched) {
      stopWebcam();
      onClose();
      onOrderMatched(matched);
      showToast(`QR match: ${matched.id} (${matched.product})`);
    } else {
      showToast(`No order matched "${code}". Try again.`);
    }
  }, [orders, showToast, stopWebcam, onClose, onOrderMatched]);

  const handleManualInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (raw.length === 0) {
      setManualInput('');
    } else if (raw.length <= 3) {
      setManualInput(raw);
    } else {
      setManualInput(`${raw.slice(0, 3)} - ${raw.slice(3)}`);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      showToast('Image uploaded. Analyzing QR matrix...');
      setTimeout(() => {
        setIsProcessing(false);
        // Find matching demo order (default to ORD-408 or current)
        const target = orders.find((o) => o.id === 'ORD-408') || orders[0];
        if (target) {
          handleLookup(target.id);
        }
      }, 600);
    }
  }, [orders, showToast, handleLookup]);

  useEffect(() => {
    if (isOpen) {
      setManualInput('');
      setIsProcessing(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen, stopWebcam]);

  return (
    <div
      id="qr-scanner-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Staff QR Scanner"
      className={`${
        isOpen ? 'flex' : 'hidden'
      } absolute inset-0 z-50 bg-slate-900 flex-col animate-fade-in select-none transition-colors overflow-hidden`}
    >
      {/* Header */}
      <div className="qr-modal-header px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <h2 className="text-sm font-bold text-white tracking-wide">Staff QR Scanner</h2>
        </div>
        <button
          type="button"
          id="close-scanner-btn"
          onClick={() => {
            stopWebcam();
            onClose();
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Viewfinder Camera Area */}
        <StaffScannerViewfinder
          isWebcamActive={isWebcamActive}
          videoRef={videoRef}
          onToggleWebcam={toggleWebcam}
        />

        {/* Upload QR Photo */}
        <StaffScannerUploadTarget onFileUpload={handleFileUpload} isLoading={isProcessing} />

        {/* Internal Order ID Lookup */}
        <StaffManualLookup
          manualInput={manualInput}
          inputRef={inputRef}
          onInputChange={handleManualInputChange}
          onLookup={handleLookup}
          isLoading={isProcessing}
        />

        {/* Simulate QR Scan Action */}
        <div>
          <button
            type="button"
            id="sample-scan-btn"
            onClick={() => handleLookup('ORD-408')}
            className="btn-press w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm border border-slate-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Simulate QR Scan (ORD-408)</span>
          </button>
        </div>

        {/* Centered Return/Back link */}
        <div className="text-center pt-1">
          <button
            type="button"
            id="return-back-link-btn"
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4 transition-colors cursor-pointer"
          >
            Return to Terminal
          </button>
        </div>
      </div>
    </div>
  );
});

StaffQrScannerModal.displayName = 'StaffQrScannerModal';
