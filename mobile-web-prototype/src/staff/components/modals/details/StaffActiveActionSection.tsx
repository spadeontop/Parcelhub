import React from 'react';
import { Order } from '../../../types';
import { StaffSpinner } from '../../common/StaffLoadingIndicator';

export interface StaffActiveActionSectionProps {
  order: Order;
  attachedPhoto: string | null;
  onPayCourier: (orderId: string) => void;
  onAttachPhoto: (orderId: string, imageUrl: string) => boolean | void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUseSamplePhoto: () => void;
  onRetakePhoto: () => void;
  isPaying?: boolean;
  isAttaching?: boolean;
}

export const StaffActiveActionSection: React.FC<StaffActiveActionSectionProps> = React.memo(({
  order,
  attachedPhoto,
  onPayCourier,
  onAttachPhoto,
  onPhotoUpload,
  onUseSamplePhoto,
  onRetakePhoto,
  isPaying = false,
  isAttaching = false,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          OPERATIONAL WORKFLOW: 2-STEP INTAKE
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Record courier COD payment first, then attach and verify pouch photo.
        </p>
      </div>

      {/* Step 1: Courier COD Payout */}
      <div
        className={`p-3 rounded-xl bg-slate-900/70 border ${
          order.courierPaid ? 'border-emerald-500/30' : 'border-blue-500/30'
        } space-y-2`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                order.courierPaid ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {order.courierPaid ? (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                '1'
              )}
            </span>
            <span className={`text-xs font-bold ${order.courierPaid ? 'text-emerald-300' : 'text-white'}`}>
              {order.courierPaid ? 'Step 1: Courier Payout Recorded' : 'Step 1: Pay Courier COD'}
            </span>
          </div>
          <span className={`text-xs font-mono font-bold ${order.courierPaid ? 'text-emerald-400' : 'text-blue-400'}`}>
            {order.courierPaid ? `✔ Courier Paid (${order.codAmount})` : order.codAmount}
          </span>
        </div>

        {!order.courierPaid ? (
          <>
            <p className="text-[11px] text-slate-400 leading-snug">
              Hand exact retail COD amount to the delivery rider upon counter handover.
            </p>
            <button
              type="button"
              id="detail-pay-courier-btn"
              disabled={isPaying}
              onClick={() => onPayCourier(order.id)}
              className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs shadow-md shadow-blue-900/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPaying ? (
                <>
                  <StaffSpinner size="xs" color="white" />
                  <span>Recording Payout...</span>
                </>
              ) : (
                `Pay Courier (${order.codAmount})`
              )}
            </button>
          </>
        ) : (
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Retail COD payout completed. Ready for parcel photograph.</span>
          </p>
        )}
      </div>

      {/* Step 2: Parcel Photo Intake & Verification */}
      <div
        className={`p-3 rounded-xl bg-slate-900/70 border ${
          !order.courierPaid
            ? 'border-slate-800 opacity-60'
            : attachedPhoto
            ? 'border-emerald-500/40'
            : 'border-slate-700'
        } space-y-2.5`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                attachedPhoto ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              2
            </span>
            <span className="text-xs font-bold text-white">
              Step 2: Attach &amp; Verify Parcel Photo
              <span className="sr-only">Step 2: Attach Parcel Photo</span>
            </span>
          </div>
          {attachedPhoto && (
            <span className="text-[10px] font-semibold text-emerald-400">Photo Attached</span>
          )}
        </div>

        {!order.courierPaid ? (
          <p className="text-[11px] text-slate-500">Locked until Step 1 (Courier Payout) is completed.</p>
        ) : attachedPhoto ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <img
                src={attachedPhoto}
                alt="Parcel Preview"
                className="w-14 h-14 object-cover rounded-lg border border-slate-600 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">Parcel Intake Proof</p>
                <p className="text-[10px] text-slate-400">Pouch label captured</p>
              </div>
              <button
                type="button"
                id="detail-retake-photo-btn"
                disabled={isAttaching}
                onClick={onRetakePhoto}
                className="btn-press px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold shrink-0 cursor-pointer disabled:opacity-60"
              >
                Retake
              </button>
            </div>
            <button
              type="button"
              id="detail-verify-photo-btn"
              aria-label="Verify Photo & Make Ready"
              disabled={isAttaching}
              onClick={() => onAttachPhoto(order.id, attachedPhoto)}
              className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAttaching ? (
                <>
                  <StaffSpinner size="xs" color="white" />
                  <span>Attaching Photo & Making Ready...</span>
                </>
              ) : (
                'Verify Photo & Make Ready to Claim'
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer text-center border border-slate-700 transition-colors">
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
            </label>
            <button
              type="button"
              id="detail-sample-photo-btn"
              aria-label="Sample Photo"
              onClick={onUseSamplePhoto}
              className="btn-press py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-xs border border-blue-500/40 shrink-0 cursor-pointer"
            >
              Use Sample Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

StaffActiveActionSection.displayName = 'StaffActiveActionSection';
