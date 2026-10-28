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
    openMpinModal,
    showToast,
  } = useApp();

  const order = getCurrentOrder();
  const status = order.status;

  // Banner styles depending on status
  let bannerBg = 'bg-[#c58b12] text-white'; // Default Gold for Payment Required
  let bannerTitle = 'Complete Details';
  let bannerSubtitle = 'Payment Required';

  if (status === 'AWAITING_PARCEL') {
    bannerBg = 'bg-[#215cd4] text-white';
    bannerSubtitle = 'Awaiting Parcel';
  } else if (status === 'READY_TO_CLAIM') {
    bannerBg = 'bg-[#10b780] text-white';
    bannerSubtitle = 'Ready To Claim';
  } else if (status === 'CLAIMED') {
    bannerBg = 'bg-white border-b border-gray-200 text-gray-900';
    bannerSubtitle = 'Claimed';
  }

  const handleInitiateClaim = () => {
    if (!claimConfirmed) {
      showToast('Please check the confirmation box before initiating claim.');
      return;
    }
    openMpinModal();
  };

  return (
    <div className="flex flex-col min-h-[780px] bg-white pb-8 select-none">
      {/* Top Colored Status Banner */}
      <div className={`${bannerBg} py-5 px-6 text-center shadow-xs transition-colors duration-300`}>
        <h2 className="text-2xl font-bold tracking-tight">{bannerTitle}</h2>
        <p className={`text-sm font-medium mt-0.5 ${status === 'CLAIMED' ? 'text-gray-500' : 'opacity-90'}`}>
          {bannerSubtitle}
        </p>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Section: Order Overview */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ORDER OVERVIEW</span>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <span>Back</span>
              <BackArrowIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3">
            <span className="text-xs text-gray-500">Product</span>
            <h3 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{order.product}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <span className="text-xs text-gray-500">Recipient</span>
              <p className="text-base font-bold text-gray-900">{order.recipient}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Paid Amount</span>
              <p className="text-base font-bold text-gray-900 font-mono-numbers">{order.paidAmount}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tracking Number</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm font-mono font-semibold text-gray-900 truncate max-w-[130px]">
                  {order.trackingNumber}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.trackingNumber, 'Tracking Number')}
                  className="p-0.5 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                  title="Copy Tracking Number"
                  aria-label="Copy Tracking Number"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Change</span>
              <p className="text-base font-bold text-gray-900 font-mono-numbers">
                {status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : order.change}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Section: Pick-up Hub Location */}
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">PICK-UP HUB LOCATION</span>
          <div className="flex items-center gap-2 mt-1">
            <h4 className="text-lg font-bold text-gray-900">Lily’s Catering Hub</h4>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${hubOpen ? 'text-[#10b780]' : 'text-red-500'}`}>
              <span className={`w-2 h-2 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}`} />
              {hubOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Yati, Liloan, Cebu, 6002</p>

          {status === 'READY_TO_CLAIM' && (
            <div
              className={`mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold ${
                hubOpen ? 'text-gray-800' : 'text-gray-500'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}`} />
              <span>Lily’s Catering Hub is currently {hubOpen ? 'open' : 'closed'}</span>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Section: Tracking Progress Stepper */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TRACKING PROGRESS</span>
            <button
              type="button"
              onClick={() => navigateTo('qr_screen')}
              className="p-1 rounded hover:bg-gray-100 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
              title="View QR Code"
              aria-label="View QR Code"
            >
              <QrCodeIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Vertical Timeline Stepper */}
          <div className="relative pl-7 space-y-6">
            <div className="stepper-line" />

            {/* Step 1: Order Placed */}
            <div className="relative">
              <div className="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                    status === 'PAYMENT_REQUIRED' ? 'bg-[#c58b12] pulse-gold' : 'bg-[#94a3b8]'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <h5 className="text-sm font-bold text-gray-900">Order Placed</h5>
                <span className="text-[11px] font-mono text-gray-500">{order.orderPlacedTime}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Order by the user from the app</p>
            </div>

            {/* Step 2: Awaiting Parcel */}
            <div className="relative">
              <div className="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                    status === 'AWAITING_PARCEL'
                      ? 'bg-[#215cd4] pulse-blue'
                      : status === 'READY_TO_CLAIM' || status === 'CLAIMED'
                      ? 'bg-[#94a3b8]'
                      : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <h5 className={`text-sm font-bold ${status === 'PAYMENT_REQUIRED' ? 'text-gray-400' : 'text-gray-900'}`}>
                  Awaiting Parcel
                </h5>
                {status !== 'PAYMENT_REQUIRED' && (
                  <span className="text-[11px] font-mono text-gray-500">{order.awaitingParcelTime || '17 Oct 18:32'}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">The hub is actively waiting for the product</p>
            </div>

            {/* Step 3: Ready to Claim */}
            <div className="relative">
              <div className="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                    status === 'READY_TO_CLAIM'
                      ? 'bg-[#10b780] pulse-green'
                      : status === 'CLAIMED'
                      ? 'bg-[#94a3b8]'
                      : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <h5
                  className={`text-sm font-bold ${
                    status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  Ready to Claim
                </h5>
                {(status === 'READY_TO_CLAIM' || status === 'CLAIMED') && (
                  <span className="text-[11px] font-mono text-gray-500">{order.readyToClaimTime || '17 Oct 22:32'}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">The product already is in the hub, waiting for claim</p>
              {(status === 'READY_TO_CLAIM' || status === 'CLAIMED') && (
                <button
                  type="button"
                  onClick={openProofOfDeliveryModal}
                  className="text-xs font-semibold text-[#215cd4] hover:underline mt-1 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                >
                  View Proof of Delivery
                </button>
              )}
            </div>

            {/* Step 4: Parcel Claimed */}
            <div className="relative">
              <div className="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                    status === 'CLAIMED' ? 'bg-[#10b780]' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <h5 className={`text-sm font-bold ${status === 'CLAIMED' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Parcel Claimed
                </h5>
                {status === 'CLAIMED' && (
                  <span className="text-[11px] font-mono text-gray-500">{order.claimedTime || '18 Oct 08:11'}</span>
                )}
              </div>
              {status === 'CLAIMED' && (
                <p className="text-xs text-gray-500 mt-0.5">Handover verified. Cash change returned.</p>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Action Area by Status */}
        <div className="pt-2 space-y-3">
          {status === 'PAYMENT_REQUIRED' && (
            <button
              type="button"
              onClick={() => navigateTo('qr_screen')}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <span>Generate QR</span>
              <QrCodeIcon className="w-5 h-5" />
            </button>
          )}

          {status === 'READY_TO_CLAIM' &&
            (hubOpen ? (
              <>
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="claim-confirm-check"
                    checked={claimConfirmed}
                    onChange={(e) => setClaimConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#215cd4] focus:ring-[#215cd4] cursor-pointer"
                  />
                  <div>
                    <label htmlFor="claim-confirm-check" className="text-sm font-bold text-gray-900 cursor-pointer block">
                      I confirm that I want to claim the order
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">Only initiate claim when you’re physically claiming at the hub</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateClaim}
                  className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-base tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                >
                  Initiate Claim
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 text-center">Only initiate claim when you’re physically claiming at the hub</p>
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#647b92] text-white font-semibold text-sm tracking-wide opacity-80 cursor-not-allowed text-center"
                >
                  Cannot initiate claim when the hub is closed
                </button>
              </>
            ))}

          {/* Return to Home link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
