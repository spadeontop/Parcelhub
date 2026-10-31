import React, { useState, useEffect } from 'react';
import { Order } from '../../../types';
import { StaffBadge } from '../../common/StaffBadge';
import { StaffOrderHeroBanner } from './StaffOrderHeroBanner';
import { StaffParcelInfoSection } from './StaffParcelInfoSection';
import { StaffNotesSection } from './StaffNotesSection';
import { StaffFinancialLedgerSection } from './StaffFinancialLedgerSection';
import { StaffUnpaidActionSection } from './StaffUnpaidActionSection';
import { StaffActiveActionSection } from './StaffActiveActionSection';
import { StaffReadyActionSection } from './StaffReadyActionSection';
import { StaffClaimedSummarySection } from './StaffClaimedSummarySection';

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
  if (/^[a-zA-Z]{3}\s+[0-9]{3}$/.test(clean)) {
    return clean.replace(/\s+/, ' - ');
  }
  if (clean.length === 6 && /^[a-zA-Z0-9]+$/.test(clean)) {
    return `${clean.slice(0, 3)} - ${clean.slice(3)}`;
  }
  return clean;
};

export const StaffOrderDetailsModal: React.FC<StaffOrderDetailsModalProps> = React.memo(({
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
  const [, setTimerTick] = useState<number>(0);

  // Claim Unlock status
  const unlocked = order
    ? isOrderClaimUnlocked
      ? isOrderClaimUnlocked(order)
      : Boolean(order.claimInitiatedAt)
    : false;

  useEffect(() => {
    if (!isOpen || !unlocked) return;
    const timer = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, unlocked]);

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

  // Stated Fee for Unpaid Cash Activation
  const fee =
    order.statedFee ||
    parseInt((order.paidAmount || '').replace(/[^\d]/g, ''), 10) ||
    parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) ||
    500;

  // Claim Unlock status
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

  const handleUseSamplePhoto = () => {
    setAttachedPhoto('./assets/receipt_thumbnail.png');
    showToast('Sample parcel pouch photo attached.');
  };

  const handleSimulatePromptAction = () => {
    if (onSimulatePrompt) {
      onSimulatePrompt(order.id);
    } else {
      order.claimInitiatedAt = Date.now();
      showToast(`Customer prompted claim for ${order.id}! Counter unlocked.`);
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide leading-tight">Complete Parcel Information</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StaffBadge status={order.status} variant="modal" showDot={false} />
        </div>
      </div>

      {/* Inner View Scrollable Content */}
      <div id="order-details-content" className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visible yet Giving Internal Order ID Hero Banner (XXX - XXX) */}
        <StaffOrderHeroBanner
          order={order}
          formattedOrderId={formattedOrderId}
          onCopyId={handleCopyId}
        />

        {/* Product Information Card */}
        <StaffParcelInfoSection
          order={order}
          isOpen={isOpen}
          onCopyTracking={handleCopyTracking}
        />

        {/* Staff Notes Card */}
        <StaffNotesSection
          notesText={notesText}
          isNoteSaved={isNoteSaved}
          onNotesChange={(text) => {
            setNotesText(text);
            setIsNoteSaved(false);
          }}
          onSaveNote={handleSaveNote}
          onClearNote={handleClearNote}
        />

        {/* Financial Ledger Card */}
        <StaffFinancialLedgerSection order={order} />

        {/* Operational Actions */}
        {order.status === 'PAYMENT_REQUIRED' && (
          <StaffUnpaidActionSection
            order={order}
            fee={fee}
            cashInput={cashInput}
            onCashInputChange={setCashInput}
            onActivateOrder={onActivateOrder}
          />
        )}

        {order.status === 'AWAITING_PARCEL' && (
          <StaffActiveActionSection
            order={order}
            attachedPhoto={attachedPhoto}
            onPayCourier={onPayCourier}
            onAttachPhoto={onAttachPhoto}
            onPhotoUpload={handlePhotoUpload}
            onUseSamplePhoto={handleUseSamplePhoto}
            onRetakePhoto={() => setAttachedPhoto(null)}
          />
        )}

        {order.status === 'READY_TO_CLAIM' && (
          <StaffReadyActionSection
            order={order}
            unlocked={unlocked}
            timeFormatted={timeFormatted}
            onSimulatePrompt={handleSimulatePromptAction}
            onReleaseOrder={onReleaseOrder}
          />
        )}

        {order.status === 'CLAIMED' && (
          <StaffClaimedSummarySection order={order} />
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
});

StaffOrderDetailsModal.displayName = 'StaffOrderDetailsModal';

