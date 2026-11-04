import React from 'react';

export interface StaffScannerViewfinderProps {
  isWebcamActive: boolean;
  videoRef?: React.Ref<HTMLVideoElement>;
  onToggleWebcam: () => void;
}

export const StaffScannerViewfinder: React.FC<StaffScannerViewfinderProps> = React.memo(({
  isWebcamActive,
  videoRef,
  onToggleWebcam,
}) => {
  return (
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
        onClick={onToggleWebcam}
        className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors z-20 cursor-pointer"
      >
        {isWebcamActive ? 'Stop Camera' : 'Use Camera'}
      </button>
    </div>
  );
});

StaffScannerViewfinder.displayName = 'StaffScannerViewfinder';
