import React, { useState, useRef, useEffect } from 'react';
import { Order } from '../../../types';

export interface StaffQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderMatched: (order: Order) => void;
  orders: Order[];
  showToast: (msg: string) => void;
}

export const StaffQrScannerModal: React.FC<StaffQrScannerModalProps> = ({
  isOpen,
  onClose,
  onOrderMatched,
  orders,
  showToast,
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const startWebcam = async () => {
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
        videoRef.current.play().catch(() => {});
      }
      setIsWebcamActive(true);
    } catch {
      showToast('Camera access unavailable or denied. Use manual Order ID lookup.');
      setIsWebcamActive(false);
    }
  };

  const toggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const handleLookup = (code: string) => {
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
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (raw.length === 0) {
      setManualInput('');
    } else if (raw.length <= 3) {
      setManualInput(raw);
    } else {
      setManualInput(`${raw.slice(0, 3)} - ${raw.slice(3)}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('Image uploaded. Analyzing QR matrix...');
      setTimeout(() => {
        // Find matching demo order (default to ORD-408 or current)
        const target = orders.find((o) => o.id === 'ORD-408') || orders[0];
        if (target) {
          handleLookup(target.id);
        }
      }, 600);
    }
  };

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
        {/* Viewfinder Camera Area (30% secondary container, 10% blue accent laser/corners) */}
        <div className="qr-frame-box relative w-full aspect-square max-h-[290px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
          {/* Video preview element for webcam if active */}
          <video
            ref={videoRef}
            id="camera-video"
            className={`${isWebcamActive ? 'block' : 'hidden'} absolute inset-0 w-full h-full object-cover`}
            autoPlay
            playsInline
            muted
          />

          {/* Viewfinder corner brackets */}
          <div className="viewfinder-corner corner-tl"></div>
          <div className="viewfinder-corner corner-tr"></div>
          <div className="viewfinder-corner corner-bl"></div>
          <div className="viewfinder-corner corner-br"></div>

          {/* Animated laser scan line */}
          <div className="scanner-laser"></div>

          {/* Center Target QR icon simulation */}
          <div className="flex flex-col items-center text-center p-4 z-10">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/90 border border-slate-700/80 p-2.5 flex items-center justify-center shadow-lg mb-3">
              <img
                src="./assets/sample_qr_code.png"
                alt="Sample QR"
                className="w-full h-full object-contain filter invert opacity-90"
              />
            </div>
            <p className="text-sm font-bold text-white tracking-wide">Camera Viewfinder</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Align QR code within frame</p>
          </div>

          {/* Camera Toggle Overlay */}
          <button
            type="button"
            id="toggle-webcam-btn"
            onClick={toggleWebcam}
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors z-20 cursor-pointer"
          >
            {isWebcamActive ? 'Stop Camera' : 'Use Camera'}
          </button>
        </div>

        {/* Upload QR Photo (Secondary Upload Target) */}
        <div>
          <label className="qr-upload-target btn-press group w-full py-3.5 px-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-dashed border-slate-700 hover:border-blue-500/50 flex items-center justify-center gap-3 cursor-pointer transition-all duration-150 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                Upload QR Photo
              </span>
              <span className="block text-[10px] text-slate-400">Select image or screenshot from device</span>
            </div>
            <input type="file" id="qr-file-input" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Internal Order ID Lookup (Auto-formats to XXX - XXX) */}
        <div className="qr-frame-box p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 shadow-md">
          <div>
            <label htmlFor="manual-scan-input" className="text-xs font-bold text-white block">
              Internal Order ID Lookup
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enter internal Order ID to locate parcel (e.g. ORD - 408):
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              id="manual-scan-input"
              maxLength={12}
              placeholder="ORD - 408"
              autoComplete="off"
              value={manualInput}
              onChange={handleManualInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLookup(manualInput);
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#215cd4] focus:border-[#215cd4]"
            />
            <button
              type="button"
              id="manual-scan-btn"
              onClick={() => handleLookup(manualInput)}
              className="btn-press px-4 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-bold shrink-0 shadow-md border border-blue-500/40 cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </div>

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
};
