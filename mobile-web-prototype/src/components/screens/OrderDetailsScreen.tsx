import React from 'react';
import { useApp } from '../../context/AppContext';
import { BackArrowIcon, CopyIcon, QrCodeIcon } from '../common/Icons';

export const OrderDetailsScreen: React.FC = () => {
  const {
    getCurrentOrder,
    hubOpen,
    claimConfirmed,
    setClaimConfirmed,
    navigateTo,
    copyToClipboard,
    openProofOfDeliveryModal,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    showToast,
  } = useApp();

  const order = getCurrentOrder();
  const status = order.status;

  const isClaimActive = isOrderClaimUnlocked(order);
  const remainingSecs = getOrderClaimRemainingSeconds(order);
  const mm = Math.floor(remainingSecs / 60);
  const ss = remainingSecs % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  // Banner styles depending on status
  let bannerBg = 'bg-[#c58b12] text-white'; // Default Gold for Payment Required
  let bannerTitle = 'Complete Details';
  let bannerSubtitle = 'Payment Required';

  if (status === 'AWAITING_PARCEL') {
    bannerBg = 'bg-[#1b65e8] text-white';
    bannerSubtitle = 'Awaiting Parcel';
  } else if (status === 'READY_TO_CLAIM') {
    bannerBg = 'bg-[#10b780] text-white';
    bannerSubtitle = 'Ready To Claim';
  } else if (status === 'CLAIMED') {
    bannerBg = 'bg-white text-gray-900 border-b border-gray-100';
    bannerSubtitle = 'Claimed';
  }

  const handleInitiateClaim = () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    customerInitiateClaim(order.id);
  };

  // Stepper completion checks
  const isStep1Done = status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep1Active = status === 'PAYMENT_REQUIRED';

  const isStep2Done = status === 'READY_TO_CLAIM' || status === 'CLAIMED';
  const isStep2Active = status === 'AWAITING_PARCEL';

  const isStep3Done = status === 'CLAIMED';
  const isStep3Active = status === 'READY_TO_CLAIM';

  const isStep4Done = status === 'CLAIMED';

  // Helper for tracking node (hollow green check for completed)
  const renderStepNode = (isDone: boolean, isActive: boolean, activeColor: string, activeRing: string) => {
    if (isDone) {
      return (
        <div className="w-5 h-5 rounded-full bg-white border-2 border-[#10b780] flex items-center justify-center text-[#10b780] text-[11px] font-bold leading-none">
          ✓
        </div>
      );
    }
    if (isActive) {
      return (
        <div
          className="w-5 h-5 rounded-full border-3"
          style={{ backgroundColor: activeColor, borderColor: activeRing }}
        />
      );
    }
    return (
      <div className="w-4.5 h-4.5 rounded-full bg-white border-2 border-gray-300" />
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-white pb-6 select-none">
      {isClaimActive ? (
        /* Full-screen Focused Claim Pass (Prototype State 1: Ready Active) */
        <div className="flex flex-col flex-1 animate-fade-in bg-white">
          {/* Header Bar */}
          <div className="py-4 px-5 flex items-center justify-between relative border-b border-gray-100/60">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3063ca]"
              title="Return to Home"
              aria-label="Back to Home"
            >
              <BackArrowIcon className="w-3.5 h-3.5" />
            </button>

            <h1 className="text-xl font-bold text-[#1e1e1e] tracking-tight text-center">
              Ready for Release
            </h1>

            <div className="w-8 h-8" />
          </div>

          {/* Body Content */}
          <div className="px-6 pt-5 flex-1 flex flex-col items-center">
            {/* Ticket Label & Value aligned with QR card */}
            <div className="w-full max-w-[280px] mb-2">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
                TICKET
              </span>
              <span className="text-base font-bold font-mono text-[#1e1e1e] mt-0.5 block">
                {order.alphanumericKey}
              </span>
            </div>

            {/* QR Code Panel */}
            <div className="w-full max-w-[280px] aspect-square rounded-2xl bg-white border border-[#f0f1f3] shadow-sm p-4 flex items-center justify-center">
              <img
                src="./assets/sample_qr_code.png"
                alt="Release QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Validity Box: Proceed to Hub + Live Countdown Timer */}
            <div className="text-center mt-5 mb-3">
              <span className="text-xs font-semibold text-[#3063ca] tracking-wide block">
                Proceed to Hub
              </span>
              <span className="text-3xl font-extrabold font-mono text-[#3063ca] mt-0.5 block">
                {timeFormatted}
              </span>
            </div>

            {/* Instructions */}
            <p className="text-xs text-gray-500 text-center leading-relaxed max-w-[290px] mb-6">
              You have initiated claiming process.<br />
              Please wait by the counter. Show this screen only if requested by staff.
            </p>

            {/* Order Summary Card */}
            <div className="w-full max-w-[320px] rounded-2xl bg-[#f9fafb] border border-[#f0f1f3] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-normal">Item</span>
                <span className="text-sm font-bold text-[#0f172a]">{order.product}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500 font-normal">Cash Change</span>
                <span className="text-sm font-bold text-[#3063ca] font-mono">
                  {order.change || '₱0.00'}
                </span>
              </div>
            </div>

            {/* Return to Home Action Button */}
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="w-full max-w-[320px] py-3.5 mt-4 flex items-center justify-center rounded-xl text-sm font-normal text-gray-600 hover:text-[#0f172a] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      ) : (
        /* Normal Progress Stepper & Action Area when not claim active */
        <>
          {/* Top Colored Status Banner with Circular Back Button */}
          <div className={`${bannerBg} py-5 px-6 text-center shadow-xs relative transition-colors duration-300`}>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`absolute left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                status === 'CLAIMED'
                  ? 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-900 focus-visible:ring-gray-300'
                  : 'bg-white/20 hover:bg-white/30 border border-white/30 text-white focus-visible:ring-white'
              }`}
              title="Return to Home"
              aria-label="Back to Home"
            >
              <BackArrowIcon className="w-4 h-4" />
            </button>

            <h2 className="text-2xl font-bold tracking-tight">{bannerTitle}</h2>
            <p className={`text-sm font-medium mt-0.5 ${status === 'CLAIMED' ? 'text-gray-500' : 'opacity-90'}`}>
              {bannerSubtitle}
            </p>
          </div>

          <div className="px-4 pt-4 pb-8 space-y-3.5">
            {/* Card 1: Order Overview */}
            <div className="bg-[#fafbfd] rounded-2xl border border-[#f1f5f9] p-4 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                ORDER OVERVIEW
              </span>

              {/* 1. Product */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Product</span>
                <span className="text-sm font-bold text-gray-900">{order.product}</span>
              </div>

              {/* 2. Price */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Price</span>
                <span className="text-xs font-bold font-mono text-gray-900">{order.codAmount || '—'}</span>
              </div>

              {/* 3. Recipient */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Recipient</span>
                <span className="text-xs font-semibold text-gray-800">{order.recipient}</span>
              </div>

              {/* 4. Tracking Number */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Tracking Number</span>
                <div className="flex items-center gap-1.5 bg-gray-200 px-2 py-0.5 rounded-md">
                  <span className="text-xs font-mono font-semibold text-gray-900">{order.trackingNumber}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                    className="p-0.5 text-gray-600 hover:text-black cursor-pointer"
                    title="Copy Tracking Number"
                    aria-label="Copy Tracking Number"
                  >
                    <CopyIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 5. Paid Amount */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Paid Amount</span>
                <span className="text-xs font-bold font-mono text-gray-900">{order.paidAmount || '—'}</span>
              </div>

              {/* 6. Change */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-500 font-medium">Change</span>
                <span className="text-xs font-bold font-mono text-gray-900">
                  {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : order.change}
                </span>
              </div>
            </div>

            {/* Card 2: Pick-up Hub Location */}
            <div className="bg-[#fafbfd] rounded-2xl border border-[#f1f5f9] p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900">Lily’s Catering Hub</h4>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}`} />
                  <span className={`text-[11px] font-bold ${hubOpen ? 'text-emerald-700' : 'text-red-600'}`}>
                    {hubOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Yati, Liloan, Cebu, 6002</p>
            </div>

            {/* Card 3: Tracking Progress Stepper */}
            <div className="bg-[#fafbfd] rounded-2xl border border-[#f1f5f9] p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TRACKING PROGRESS</span>
                <button
                  type="button"
                  onClick={() => navigateTo('qr_screen')}
                  className="p-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8]"
                  title="View QR Code"
                  aria-label="View QR Code"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Vertical Timeline Stepper */}
              <div className="relative pl-7 space-y-5">
                <div
                  className="absolute left-[9px] top-1.5 bottom-3 w-[2px] bg-gray-200"
                />

                {/* Step 1: Order Placed */}
                <div className="relative">
                  <div className="absolute -left-7 top-0.5 w-5 h-5 flex items-center justify-center">
                    {renderStepNode(isStep1Done, isStep1Active, '#c58b12', '#fef08a')}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h5 className={`text-sm font-bold ${isStep1Active ? 'text-[#c58b12]' : 'text-gray-900'}`}>
                      Order Placed
                    </h5>
                    <span className={`text-[11px] font-mono ${isStep1Active ? 'text-[#c58b12] font-bold' : 'text-gray-500'}`}>
                      {order.orderPlacedTime}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Order by the user from the app</p>
                </div>

                {/* Step 2: Awaiting Parcel */}
                <div className="relative">
                  <div className="absolute -left-7 top-0.5 w-5 h-5 flex items-center justify-center">
                    {renderStepNode(isStep2Done, isStep2Active, '#1b65e8', '#bfdbfe')}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h5
                      className={`text-sm font-bold ${
                        isStep2Active ? 'text-[#1b65e8]' : isStep2Done ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      Awaiting Parcel
                    </h5>
                    {(isStep2Done || isStep2Active) && (
                      <span className={`text-[11px] font-mono ${isStep2Active ? 'text-[#1b65e8] font-bold' : 'text-gray-500'}`}>
                        {order.awaitingParcelTime || '17 Oct 18:32'}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isStep2Active || isStep2Done ? 'text-gray-500' : 'text-gray-400'}`}>
                    The hub is actively waiting for the product
                  </p>
                </div>

                {/* Step 3: Ready to Claim */}
                <div className="relative">
                  <div className="absolute -left-7 top-0.5 w-5 h-5 flex items-center justify-center">
                    {renderStepNode(isStep3Done, isStep3Active, '#10b780', '#bbf7d0')}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h5
                      className={`text-sm font-bold ${
                        isStep3Active ? 'text-[#10b780]' : isStep3Done ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      Ready to Claim
                    </h5>
                    {(isStep3Done || isStep3Active) && (
                      <span className={`text-[11px] font-mono ${isStep3Active ? 'text-[#10b780] font-bold' : 'text-gray-500'}`}>
                        {order.readyToClaimTime || '17 Oct 22:32'}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isStep3Active || isStep3Done ? 'text-gray-500' : 'text-gray-400'}`}>
                    The product already is in the hub, waiting for claim
                  </p>
                  {(status === 'READY_TO_CLAIM' || status === 'CLAIMED') && (
                    <button
                      type="button"
                      onClick={openProofOfDeliveryModal}
                      className="text-xs font-semibold text-[#1b65e8] hover:underline mt-1 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8]"
                    >
                      View Proof of Delivery
                    </button>
                  )}
                </div>

                {/* Step 4: Parcel Claimed */}
                <div className="relative">
                  <div className="absolute -left-7 top-0.5 w-5 h-5 flex items-center justify-center">
                    {renderStepNode(isStep4Done, false, '#10b780', '#bbf7d0')}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h5 className={`text-sm font-bold ${isStep4Done ? 'text-gray-900' : 'text-gray-400'}`}>
                      Parcel Claimed
                    </h5>
                    {isStep4Done && (
                      <span className="text-[11px] font-mono text-gray-500">{order.claimedTime || '18 Oct 08:11'}</span>
                    )}
                  </div>
                  {isStep4Done && (
                    <p className="text-xs text-gray-500 mt-0.5">Handover verified. Cash change returned.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Action Area by Status */}
            <div className="pt-1 space-y-3">
              {status === 'PAYMENT_REQUIRED' && (
                <button
                  type="button"
                  onClick={() => navigateTo('qr_screen')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#1b65e8] hover:bg-[#1652be] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8]"
                >
                  <span>Generate QR</span>
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              )}

              {status === 'READY_TO_CLAIM' &&
                (hubOpen ? (
                  <div className="space-y-4">
                    <div
                      onClick={() => setClaimConfirmed(!claimConfirmed)}
                      className="flex items-start gap-2.5 pt-1 cursor-pointer select-none"
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          claimConfirmed ? 'bg-[#1b65e8] border-[#1b65e8]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {claimConfirmed && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          I confirm that I want to claim the order
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Only initiate claim when you’re physically claiming at the hub
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      {order.claimInitiatedAt && (
                        <div className="bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-200 text-center">
                          <p className="text-xs text-amber-600 font-semibold">
                            Previous claim window elapsed. Press Initiate Claim to unlock counter.
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleInitiateClaim}
                        disabled={!claimConfirmed}
                        className={`w-full py-3.5 px-6 rounded-2xl shadow-md text-center transition-all ${
                          claimConfirmed
                            ? 'bg-[#1b65e8] hover:bg-[#1652be] text-white font-bold text-sm tracking-wide cursor-pointer btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8]'
                            : 'bg-gray-300 opacity-80 text-white font-bold text-sm tracking-wide cursor-not-allowed'
                        }`}
                      >
                        Initiate Claim
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 text-center">
                      Only initiate claim when you’re physically claiming at the hub
                    </p>
                    <div className="w-full py-3.5 px-6 rounded-2xl bg-[#647b92] opacity-80 text-white font-semibold text-sm tracking-wide text-center">
                      Cannot initiate claim when the hub is closed
                    </div>
                  </div>
                ))}

              {/* Return to Home link */}
              <div className="text-center pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b65e8]"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderDetailsScreen;
