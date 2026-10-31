import React, { useState, useEffect } from 'react';
import { Order } from '../../../types';

export interface StaffOrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPayCourier: (orderId: string) => void;
  onAttachPhoto: (orderId: string, imageUrl: string) => boolean | void;
  onActivateOrder: (orderId: string, amount: number) => boolean | void;
  onReleaseOrder: (orderId: string) => boolean | void;
  onUpdateNotes?: (orderId: string, notes: string) => void;
  onSimulatePrompt?: (orderId: string) => void;
  isOrderClaimUnlocked?: (order: Order) => boolean;
  getOrderClaimRemainingSeconds?: (order: Order) => number;
  showToast: (msg: string) => void;
}

export const formatOrderId = (id: string): string => {
  if (!id) return '';
  const clean = id.trim();
  if (/\s+-\s+/.test(clean)) return clean;
  if (clean.includes('-')) {
    return clean.replace(/\s*-\s*/, ' - ');
  }
  if (clean.length === 6 && /^[a-zA-Z0-9]+$/.test(clean)) {
    return `${clean.slice(0, 3)} - ${clean.slice(3)}`;
  }
  return clean;
};

export const StaffOrderDetailsModal: React.FC<StaffOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onPayCourier,
  onAttachPhoto,
  onActivateOrder,
  onReleaseOrder,
  onUpdateNotes,
  onSimulatePrompt,
  isOrderClaimUnlocked,
  getOrderClaimRemainingSeconds,
  showToast,
}) => {
  const [notesText, setNotesText] = useState<string>('');
  const [isNoteSaved, setIsNoteSaved] = useState<boolean>(false);
  const [cashInput, setCashInput] = useState<string>('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setNotesText(order.notes || '');
      setIsNoteSaved(!!(order.notes && order.notes.trim()));
      setCashInput('');
      setAttachedPhoto(order.parcelImageUrl || null);
    }
  }, [order?.id, order?.notes, order?.parcelImageUrl]);

  if (!order) return null;

  const formattedOrderId = formatOrderId(order.id);

  // Status Styling & Labels
  let statusLabel = 'Active';
  let statusBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  let statusDotClass = 'bg-blue-400 animate-pulse';

  if (order.status === 'READY_TO_CLAIM') {
    statusLabel = 'Ready';
    statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    statusDotClass = 'bg-emerald-400';
  } else if (order.status === 'PAYMENT_REQUIRED') {
    statusLabel = 'Unpaid';
    statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    statusDotClass = 'bg-amber-400';
  } else if (order.status === 'CLAIMED') {
    statusLabel = 'Claimed';
    statusBadgeClass = 'bg-slate-700/60 text-slate-300 border-slate-600/50';
    statusDotClass = 'bg-slate-400';
  }

  // Stated Fee for Unpaid Cash Activation
  const fee =
    order.statedFee ||
    parseInt((order.paidAmount || '').replace(/[^\d]/g, ''), 10) ||
    parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) ||
    500;

  const numericCash = parseInt(cashInput, 10);
  const isCashValid = !isNaN(numericCash) && numericCash >= fee;
  const codNum = parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) || 0;
  const previewChange = isCashValid ? Math.max(0, numericCash - codNum) : 0;

  // Claim Unlock status
  const unlocked = isOrderClaimUnlocked ? isOrderClaimUnlocked(order) : Boolean(order.claimInitiatedAt);
  const remainingSeconds = getOrderClaimRemainingSeconds ? getOrderClaimRemainingSeconds(order) : 600;
  const mm = Math.floor(remainingSeconds / 60);
  const ss = remainingSeconds % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  const handleCopyId = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(order.id);
    }
    showToast(`Internal Order ID copied: ${formattedOrderId}`);
  };

  const handleCopyTracking = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(order.trackingNumber);
    }
    showToast(`Tracking ID copied: ${order.trackingNumber}`);
  };

  const handleSaveNote = () => {
    const trimmed = notesText.trim();
    if (onUpdateNotes) {
      onUpdateNotes(order.id, trimmed);
    }
    order.notes = trimmed;
    setIsNoteSaved(!!trimmed);
    showToast(trimmed ? `Staff note saved for ${order.id}.` : `Note cleared for ${order.id}.`);
  };

  const handleClearNote = () => {
    setNotesText('');
    setIsNoteSaved(false);
    if (onUpdateNotes) {
      onUpdateNotes(order.id, '');
    }
    order.notes = '';
    showToast(`Note cleared for ${order.id}.`);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setAttachedPhoto(result);
        showToast('Parcel pouch photo uploaded.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      id="order-details-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Order Details and Operational Actions"
      className={`${
        isOpen ? 'flex' : 'hidden'
      } absolute inset-0 z-45 bg-slate-900 flex-col animate-fade-in select-none transition-colors overflow-hidden`}
    >
      {/* Inner View Header */}
      <div className="inner-modal-header px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide leading-tight">Complete Parcel Information</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Inner View Scrollable Content */}
      <div id="order-details-content" className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visible yet Giving Internal Order ID Hero Banner (XXX - XXX) */}
        <div
          id="hero-order-id-card"
          className="inner-detail-card p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/40 shadow-lg shadow-blue-950/30 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="hero-card-label text-[10px] font-bold tracking-widest text-blue-400 uppercase font-mono flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusDotClass}`}></span>
              INTERNAL PARCEL ID
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="hero-card-id text-2xl font-black font-mono tracking-widest text-white font-mono-numbers drop-shadow-sm">
                {formattedOrderId}
              </span>
            </div>
            <button
              type="button"
              id="copy-order-id-btn"
              onClick={handleCopyId}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Copy Internal Order ID"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy ID</span>
            </button>
          </div>
        </div>

        {/* Product Information Card */}
        <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block mb-1">
              PARCEL INFORMATION
            </span>
            {isOpen && (
              <h2 className="text-base font-bold text-white tracking-wide leading-snug">
                {order.product}
              </h2>
            )}
          </div>

          {/* Tracking Number & Pickup Key */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Tracking Number:</span>
              <button
                type="button"
                id="copy-tracking-btn"
                onClick={handleCopyTracking}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 text-[11px] font-mono font-mono-numbers transition-colors"
                title="Copy Tracking Number"
              >
                <span>{order.trackingNumber}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">Pickup Key:</span>
              <span className="font-mono font-semibold text-slate-200 font-mono-numbers bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80">
                {order.alphanumericKey}
              </span>
            </div>
          </div>

          {/* Recipient */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-slate-400">Recipient:</span>
              <strong className="text-slate-200 font-medium">{order.recipient}</strong>
            </div>
          </div>
        </div>

        {/* Staff Notes Card */}
        <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">STAFF NOTES</h4>
            </div>
            <span id="order-notes-status" className="text-[10px] font-mono text-slate-400">
              {isNoteSaved ? 'Note saved' : 'No notes added'}
            </span>
          </div>

          <div className="space-y-2.5">
            <textarea
              id="order-notes-textarea"
              rows={3}
              value={notesText}
              onChange={(e) => {
                setNotesText(e.target.value);
                setIsNoteSaved(false);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveNote();
                }
              }}
              placeholder="Add operational notes (e.g., customer called for hold, fragile packaging, authorized rep pickup)..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#215cd4] focus:border-[#215cd4] resize-none font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">Visible to counter staff only (Ctrl+Enter to save)</span>
              <div className="flex items-center gap-2">
                {notesText ? (
                  <button
                    type="button"
                    id="clear-order-notes-btn"
                    onClick={handleClearNote}
                    className="btn-press px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  id="save-order-notes-btn"
                  onClick={handleSaveNote}
                  className="btn-press px-3.5 py-1.5 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Ledger Card */}
        <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            FINANCIAL LEDGER
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Retail COD</span>
              <span className="text-xs font-mono font-bold text-white font-mono-numbers">{order.codAmount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Paid / Deposit</span>
              <span className="text-xs font-mono font-bold text-blue-400 font-mono-numbers">
                {order.paidAmount || 'Pending'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-0.5">Change Due</span>
              <span className="text-xs font-mono font-bold text-emerald-400 font-mono-numbers">
                {order.change || (order.status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : '₱0')}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Actions */}
        {order.status === 'PAYMENT_REQUIRED' && (
          <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  STAFF ACTION: RECEIVE CASH &amp; ACTIVATE
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Collect the stated counter fee from the customer to activate package handling.
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Stated Fee: <strong className="text-amber-400 font-mono">₱{fee.toLocaleString()}</strong>
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                Min ₱{fee.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <label htmlFor="detail-cash-input" className="text-[11px] font-medium text-slate-300 block">
                Amount Received (PHP):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">₱</span>
                <input
                  type="number"
                  id="detail-cash-input"
                  aria-label={`Amount Received for ${order.id}`}
                  placeholder={`Enter amount (min ${fee})`}
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isCashValid) {
                      onActivateOrder(order.id, numericCash);
                      setCashInput('');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Preset Amount Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setCashInput(String(fee))}
                  className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors"
                >
                  Exact ₱{fee}
                </button>
                <button
                  type="button"
                  onClick={() => setCashInput(String(fee + 100))}
                  className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors"
                >
                  ₱{(fee + 100).toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setCashInput('1000')}
                  className="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors"
                >
                  ₱1,000
                </button>
              </div>

              {isCashValid ? (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Customer Change Due:</span>
                  <span className="font-mono font-bold text-emerald-400">₱{previewChange.toLocaleString()}</span>
                </div>
              ) : cashInput !== '' ? (
                <p className="text-[11px] text-red-400 font-medium">
                  Amount received must be ≥ ₱{fee.toLocaleString()}
                </p>
              ) : null}

              <button
                type="button"
                id="detail-activate-btn"
                aria-label="Receive Cash & Activate"
                disabled={!isCashValid}
                onClick={() => {
                  if (isCashValid) {
                    onActivateOrder(order.id, numericCash);
                    setCashInput('');
                  }
                }}
                className={`btn-press w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all mt-1 ${
                  isCashValid
                    ? 'bg-[#c58b12] hover:bg-amber-600 text-white cursor-pointer shadow-lg shadow-amber-900/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
                }`}
              >
                Receive Cash &amp; Activate Order
              </button>
            </div>
          </div>
        )}

        {order.status === 'AWAITING_PARCEL' && (
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
                    onClick={() => onPayCourier(order.id)}
                    className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs shadow-md shadow-blue-900/30"
                  >
                    Pay Courier ({order.codAmount})
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
                      onClick={() => setAttachedPhoto(null)}
                      className="btn-press px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold shrink-0"
                    >
                      Retake
                    </button>
                  </div>
                  <button
                    type="button"
                    id="detail-verify-photo-btn"
                    aria-label="Verify Photo & Make Ready"
                    onClick={() => onAttachPhoto(order.id, attachedPhoto)}
                    className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/30"
                  >
                    Verify Photo &amp; Make Ready to Claim
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer text-center border border-slate-700 transition-colors">
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    id="detail-sample-photo-btn"
                    aria-label="Sample Photo"
                    onClick={() => {
                      setAttachedPhoto('./assets/receipt_thumbnail.png');
                      showToast('Sample parcel pouch photo attached.');
                    }}
                    className="btn-press py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-xs border border-blue-500/40 shrink-0"
                  >
                    Use Sample Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {order.status === 'READY_TO_CLAIM' && (
          <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                STAFF ACTION: CUSTOMER CLAIM &amp; RELEASE
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Release parcel when customer initiates pickup at the counter desk.
              </p>
            </div>

            {!unlocked ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-slate-300 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-white">Terminal Counter Locked</p>
                      <p className="text-[11px] text-slate-400">
                        Awaiting customer to press &ldquo;Initiate Claim&rdquo; in customer mobile app.
                        <span className="sr-only">🔒 Locked (Awaiting Customer Prompt)</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      id="detail-simulate-prompt-btn"
                      onClick={() => {
                        if (onSimulatePrompt) {
                          onSimulatePrompt(order.id);
                        } else {
                          order.claimInitiatedAt = Date.now();
                          showToast(`Customer prompted claim for ${order.id}! Counter unlocked.`);
                        }
                      }}
                      className="btn-press flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Simulate Customer Claim Prompt</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  aria-label="Release"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700 cursor-not-allowed opacity-60"
                >
                  Release Parcel (Locked)
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-bold text-emerald-300">Customer Present at Counter</span>
                    </div>
                    <span
                      id="detail-claim-timer"
                      className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono-numbers"
                    >
                      Active ({timeFormatted})
                      <span className="sr-only">Claim Active</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Customer claim verified. Hand over parcel and change of{' '}
                    <strong className="text-emerald-300 font-mono">{order.change || '₱0'}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  id="detail-release-order-btn"
                  aria-label="Release"
                  onClick={() => onReleaseOrder(order.id)}
                  className="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/40"
                >
                  Release Parcel &amp; Hand Over Change ({order.change || '₱0'})
                </button>
              </div>
            )}
          </div>
        )}

        {order.status === 'CLAIMED' && (
          <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/30 shadow-md space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Parcel Handover Completed</h4>
                <p className="text-[11px] text-slate-400">Customer claimed parcel and received change.</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Change Handed Over:</span>
                <strong className="font-mono text-emerald-400 font-mono-numbers">{order.change || '₱0'}</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Verification Desk:</span>
                <span className="font-mono">Counter Desk #01</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inner View Footer: Back / Return Below and Centered */}
      <div className="inner-modal-footer px-4 py-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-center shrink-0">
        <button
          type="button"
          id="close-order-details-btn"
          onClick={onClose}
          className="btn-press flex items-center justify-center gap-2 w-full max-w-xs py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Terminal</span>
        </button>
      </div>
    </div>
  );
};
