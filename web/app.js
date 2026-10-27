/**
 * ParcelHub Mobile Application Frontend Controller
 * Implements Figma prototype screens, state transitions, domain invariants, and MPIN claim gate.
 */

const state = {
  activeScreen: 'home', // 'home', 'create_order', 'confirm_order', 'payment_verification', 'qr_screen', 'order_details'
  hasOrders: true,
  hubOpen: true,
  viewMode: 'device', // 'device' | 'fullscreen'
  notificationActive: false,
  mpinInput: '',
  selectedOrderId: 'ORD-402',
  
  // New order form scratch state
  draftOrder: {
    product: 'VXE R1 Real Estate (Not shared)',
    recipient: 'John Doe',
    totalAmount: '₱480',
    trackingId: 'PH2696153366792H',
    receiptUri: './assets/receipt_screenshot.png'
  },

  orders: [
    {
      id: 'ORD-402',
      product: 'VXE R1 Nearlink',
      recipient: 'John Doe',
      paidAmount: '₱500',
      codAmount: '₱480',
      change: '₱20',
      trackingNumber: 'PH2696153366792H',
      refCode: '0001-5544-5555',
      envelopeNumber: 'ENV-402',
      status: 'READY_TO_CLAIM', // 'PAYMENT_REQUIRED', 'AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED'
      orderPlacedTime: '17 Oct 16:32',
      awaitingParcelTime: '17 Oct 18:32',
      readyToClaimTime: '17 Oct 22:32',
      claimedTime: '18 Oct 08:11',
      dateLabel: 'October 10, 2026 10:30'
    },
    {
      id: 'ORD-408',
      product: 'Poco X6 Pro',
      recipient: 'John Doe',
      paidAmount: '₱12,500',
      codAmount: '₱12,450',
      change: '₱50',
      trackingNumber: 'PH90823411293K',
      refCode: '0001-8899-2211',
      envelopeNumber: 'ENV-408',
      status: 'READY_TO_CLAIM',
      orderPlacedTime: '7 Oct 07:41',
      awaitingParcelTime: '7 Oct 12:15',
      readyToClaimTime: '8 Oct 10:00',
      claimedTime: null,
      dateLabel: 'October 7, 2026 7:41'
    }
  ],

  notifications: [
    { id: 1, title: 'Parcel Ready for Claim', body: 'VXE R1 Nearlink has arrived at Lily’s Catering Hub.', time: '10m ago', unread: true },
    { id: 2, title: 'Deposit Verified', body: '₱500 deposit secured in Escrow Envelope #ENV-402.', time: '2h ago', unread: true },
    { id: 3, title: 'Courier Payout Logged', body: 'Staff disbursed ₱480 to SPX Express courier.', time: '4h ago', unread: true },
    { id: 4, title: 'Welcome to ParcelHub', body: 'Lily’s Catering Hub station is active.', time: '1d ago', unread: true }
  ]
};

// DOM Initializer
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  initEventListeners();
});

// Main Screen Router
function navigateTo(screenId, params = {}) {
  state.activeScreen = screenId;
  if (params.orderId) {
    state.selectedOrderId = params.orderId;
  }
  if (params.status) {
    const ord = getCurrentOrder();
    if (ord) ord.status = params.status;
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getCurrentOrder() {
  return state.orders.find(o => o.id === state.selectedOrderId) || state.orders[0];
}

// Global state mutators
function setHasOrders(val) {
  state.hasOrders = val;
  renderApp();
  showToast(val ? 'Showing home with active orders' : 'Showing home with zero orders');
}

function setHubOpen(val) {
  state.hubOpen = val;
  renderApp();
  showToast(val ? 'Lily’s Catering Hub set to: OPEN' : 'Lily’s Catering Hub set to: CLOSED');
}

function setViewMode(mode) {
  state.viewMode = mode;
  const container = document.getElementById('device-wrapper');
  const frameContainer = document.getElementById('phone-frame');
  const toggleBtn = document.getElementById('view-toggle-btn');
  
  if (mode === 'fullscreen') {
    frameContainer.classList.remove('phone-mockup', 'max-w-[420px]', 'my-8', 'rounded-[48px]');
    frameContainer.classList.add('w-full', 'max-w-md', 'min-h-screen', 'rounded-none', 'shadow-none');
    document.getElementById('phone-bezel-header')?.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Device Frame Mode';
  } else {
    frameContainer.classList.add('phone-mockup', 'max-w-[420px]', 'my-8', 'rounded-[48px]');
    frameContainer.classList.remove('w-full', 'rounded-none', 'shadow-none');
    document.getElementById('phone-bezel-header')?.classList.remove('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Fullscreen Mode';
  }
}

// Preset Scenario Selector
function applyScenario(scenario) {
  const currentOrder = getCurrentOrder();
  switch(scenario) {
    case 'figma-1': // Home Zero Orders
      state.hasOrders = false;
      state.activeScreen = 'home';
      break;
    case 'figma-2': // Home With Orders
      state.hasOrders = true;
      state.activeScreen = 'home';
      break;
    case 'figma-3': // Create Order (Receipt upload)
      state.activeScreen = 'create_order';
      break;
    case 'figma-4': // Confirm Order Details
      state.activeScreen = 'confirm_order';
      break;
    case 'figma-5': // Payment Verification (Awaiting Payment)
      state.activeScreen = 'payment_verification';
      break;
    case 'figma-6': // Staff QR Scan Screen
      state.activeScreen = 'qr_screen';
      break;
    case 'figma-7': // Order Created / Payment Required (Gold Banner)
      state.activeScreen = 'order_details';
      currentOrder.status = 'PAYMENT_REQUIRED';
      break;
    case 'figma-8': // Awaiting Parcel (Blue Banner)
      state.activeScreen = 'order_details';
      currentOrder.status = 'AWAITING_PARCEL';
      break;
    case 'figma-9': // Ready to Claim (Green Banner - Open Hub)
      state.activeScreen = 'order_details';
      currentOrder.status = 'READY_TO_CLAIM';
      state.hubOpen = true;
      break;
    case 'figma-10': // Claim Confirmation Checkbox Step
      state.activeScreen = 'order_details';
      currentOrder.status = 'READY_TO_CLAIM';
      state.hubOpen = true;
      break;
    case 'figma-11': // If Hub Closed (Disabled state)
      state.activeScreen = 'order_details';
      currentOrder.status = 'READY_TO_CLAIM';
      state.hubOpen = false;
      break;
    case 'figma-12': // Completed Details (Claimed - White Banner)
      state.activeScreen = 'order_details';
      currentOrder.status = 'CLAIMED';
      break;
  }
  renderApp();
}

// Master Render Function
function renderApp() {
  const viewport = document.getElementById('mobile-screen-content');
  if (!viewport) return;

  let contentHtml = '';

  switch (state.activeScreen) {
    case 'home':
      contentHtml = renderHomeScreen();
      break;
    case 'create_order':
      contentHtml = renderCreateOrderScreen();
      break;
    case 'confirm_order':
      contentHtml = renderConfirmOrderScreen();
      break;
    case 'payment_verification':
      contentHtml = renderPaymentVerificationScreen();
      break;
    case 'qr_screen':
      contentHtml = renderQrScreen();
      break;
    case 'order_details':
      contentHtml = renderOrderDetailsScreen();
      break;
    default:
      contentHtml = renderHomeScreen();
  }

  viewport.innerHTML = contentHtml;
  updateTopControls();
}

// -------------------------------------------------------------
// Screen 1 & 2: Home Screens (Zero Orders vs With Orders)
// -------------------------------------------------------------
function renderHomeScreen() {
  const hasOrders = state.hasOrders;

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-4 pb-24 relative select-none">
      <!-- Top Brand Header -->
      <header class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2.5">
          <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-8 h-8 object-contain">
          <div>
            <h1 class="text-xl font-bold tracking-tight text-gray-900 leading-none">Parcelhub</h1>
            <p class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mt-0.5">LILY'S CATERING HUB</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Notification Toggle Pill -->
          <button 
            type="button" 
            onclick="toggleNotificationPill()"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#93eb99] text-gray-900 hover:bg-[#82e088] transition-all btn-press shadow-sm"
          >
            <span>Turn on notifications</span>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </button>

          <!-- Bell Button -->
          <button 
            type="button" 
            onclick="openNotificationsModal()"
            class="p-2 rounded-full hover:bg-gray-100 text-gray-900 transition-colors relative"
            aria-label="View notifications"
          >
            <img src="./assets/bell_icon.svg" alt="Bell Icon" class="w-6 h-6 object-contain">
            <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </header>

      <!-- Welcome Dark Card -->
      <section class="mt-6 rounded-2xl bg-[#1e1e1e] p-6 text-white shadow-lg">
        <h2 class="text-2xl font-bold tracking-tight text-white">Welcome Nyeowsz!</h2>
        <p class="text-sm text-gray-400 mt-1">Create an order to get started</p>

        <div class="flex items-center gap-3 mt-6">
          <button 
            type="button"
            onclick="navigateTo('create_order')"
            class="flex-1 py-3 px-4 rounded-xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-semibold text-sm tracking-wide transition-all shadow-md btn-press text-center"
          >
            Create Order
          </button>
          <button 
            type="button"
            onclick="showToast('Transactions history: 2 completed consignments in ledger.')"
            class="flex-1 py-3 px-4 rounded-xl bg-[#163b86] hover:bg-[#102d6b] text-white font-semibold text-sm tracking-wide transition-all btn-press text-center"
          >
            Transactions
          </button>
        </div>
      </section>

      <!-- Activities Section -->
      <section class="mt-6 flex-1 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-gray-900">Activities</h3>
          <button 
            type="button"
            onclick="setHasOrders(!state.hasOrders)"
            class="text-xs text-[#215cd4] hover:underline font-medium"
          >
            Switch to ${hasOrders ? 'Zero' : 'Active'} orders view
          </button>
        </div>

        ${!hasOrders ? `
          <!-- Zero Orders Empty State Box -->
          <div class="flex-1 min-h-[360px] rounded-2xl bg-[#f8f8f8] border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <p class="text-gray-700 text-sm font-medium">You don’t have any activites yet</p>
            <button 
              type="button" 
              onclick="navigateTo('create_order')" 
              class="text-sm font-semibold text-[#215cd4] hover:underline mt-1 cursor-pointer"
            >
              Create an order
            </button>
          </div>
        ` : `
          <!-- With Orders List Container -->
          <div class="rounded-2xl bg-[#f8f8f8] border border-gray-100 p-5 divide-y divide-gray-200">
            ${state.orders.map(order => `
              <div 
                onclick="navigateTo('order_details', { orderId: '${order.id}' })"
                class="py-4 first:pt-1 last:pb-1 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-all"
              >
                <div>
                  <h4 class="text-base font-bold text-gray-900 group-hover:text-[#215cd4] transition-colors">${order.product}</h4>
                  <p class="text-xs text-gray-500 mt-0.5">${order.dateLabel}</p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold ${order.status === 'CLAIMED' ? 'text-gray-500' : 'text-[#10b780]'} flex items-center gap-1">
                    ${order.status === 'READY_TO_CLAIM' ? 'Ready to Claim' : (order.status === 'CLAIMED' ? 'Claimed' : (order.status === 'AWAITING_PARCEL' ? 'Awaiting Parcel' : 'Payment Required'))}
                    <svg class="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>

      <!-- Bottom Navigation Bar -->
      ${renderBottomNav('home')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 3: Create Order (Receipt Upload Screen)
// -------------------------------------------------------------
function renderCreateOrderScreen() {
  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-4 pb-8 select-none">
      <!-- Header -->
      <header class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2">
          <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-7 h-7 object-contain">
          <span class="text-lg font-bold tracking-tight text-gray-900">Parcel<span class="text-[#215cd4]">Hub</span></span>
        </div>
      </header>

      <div class="flex items-center justify-between mt-4">
        <h2 class="text-2xl font-bold text-gray-900">Create an Order</h2>
        <button 
          type="button" 
          onclick="navigateTo('home')" 
          class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer"
        >
          <span>Back</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
          </svg>
        </button>
      </div>

      <!-- Upload Dropzone Card -->
      <div class="mt-6 flex-1 flex flex-col">
        <label 
          for="receipt-file-input"
          id="dropzone"
          class="flex-1 min-h-[380px] border-2 border-gray-300 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 bg-white hover:bg-gray-50 hover:border-[#215cd4] transition-all cursor-pointer relative group"
        >
          <input 
            type="file" 
            id="receipt-file-input" 
            accept="image/*" 
            class="hidden" 
            onchange="handleReceiptFile(event)"
          >
          
          <div class="w-20 h-20 rounded-full bg-blue-50 text-[#215cd4] flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
            </svg>
          </div>

          <p class="text-base font-semibold text-gray-800">Tap to upload receipt image</p>
          <p class="text-xs text-gray-400 mt-1">Supports Shopee, Lazada, TikTok Shop screenshots</p>
          
          <button 
            type="button" 
            onclick="event.stopPropagation(); loadSampleReceipt();"
            class="mt-6 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
          >
            Use Sample Shopee Receipt
          </button>
        </label>

        <p class="text-center text-sm font-medium text-gray-600 mt-4">Screenshot of Receipt</p>

        <!-- Next Button -->
        <button 
          type="button"
          onclick="navigateTo('confirm_order')"
          class="w-full mt-8 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-base tracking-wide transition-all shadow-md btn-press text-center"
        >
          Next
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 4: Confirm Order Details
// -------------------------------------------------------------
function renderConfirmOrderScreen() {
  const draft = state.draftOrder;

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-4 pb-8 select-none">
      <!-- Header -->
      <header class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2">
          <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-7 h-7 object-contain">
          <span class="text-lg font-bold tracking-tight text-gray-900">Parcel<span class="text-[#215cd4]">Hub</span></span>
        </div>
      </header>

      <div class="flex items-center justify-between mt-4">
        <h2 class="text-2xl font-bold text-gray-900">Confirm Order Details</h2>
        <button 
          type="button" 
          onclick="navigateTo('create_order')" 
          class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer"
        >
          <span>Back</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
          </svg>
        </button>
      </div>

      <!-- Details Cards Container -->
      <div class="mt-6 space-y-3">
        <!-- Product Field -->
        <div class="p-3.5 rounded-xl border border-gray-200 bg-white">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Product</label>
          <input 
            type="text" 
            id="draft-product" 
            value="${draft.product}" 
            oninput="state.draftOrder.product = this.value"
            class="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5"
          >
        </div>

        <!-- Receiver's Name Field -->
        <div class="p-3.5 rounded-xl border border-gray-200 bg-white">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Receiver’s Name</label>
          <input 
            type="text" 
            id="draft-recipient" 
            value="${draft.recipient}" 
            oninput="state.draftOrder.recipient = this.value"
            class="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5"
          >
        </div>

        <!-- Total Amount Field -->
        <div class="p-3.5 rounded-xl border border-gray-200 bg-white">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Amount</label>
          <input 
            type="text" 
            id="draft-amount" 
            value="${draft.totalAmount}" 
            oninput="state.draftOrder.totalAmount = this.value"
            class="w-full text-base font-bold text-gray-900 focus:outline-none bg-transparent mt-0.5"
          >
        </div>

        <!-- Tracking ID Field -->
        <div class="p-3.5 rounded-xl border border-gray-200 bg-white">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tracking ID</label>
          <input 
            type="text" 
            id="draft-tracking" 
            value="${draft.trackingId}" 
            oninput="state.draftOrder.trackingId = this.value"
            class="w-full text-base font-mono font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5"
          >
        </div>
      </div>

      <!-- Receipt Thumbnail Preview -->
      <div class="mt-6 flex flex-col items-center">
        <div class="w-28 h-36 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
          <img src="${draft.receiptUri}" alt="Screenshot of Receipt" class="w-full h-full object-cover">
        </div>
        <p class="text-xs font-medium text-gray-500 mt-2">Screenshot of Receipt</p>
      </div>

      <!-- Confirmation Checkbox -->
      <div class="mt-6 flex items-center justify-center gap-2">
        <input 
          type="checkbox" 
          id="confirm-details-checkbox" 
          checked 
          class="w-4 h-4 rounded text-[#215cd4] focus:ring-[#215cd4] cursor-pointer"
        >
        <label for="confirm-details-checkbox" class="text-sm font-medium text-gray-800 cursor-pointer">
          I confirm that these details are correct
        </label>
      </div>

      <!-- Create Order Button -->
      <button 
        type="button"
        onclick="submitCreatedOrder()"
        class="w-full mt-6 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-base tracking-wide transition-all shadow-md btn-press text-center"
      >
        Create Order
      </button>
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 5: Payment Verification (Awaiting Payment)
// -------------------------------------------------------------
function renderPaymentVerificationScreen() {
  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-4 pb-8 justify-between select-none">
      <!-- Header -->
      <header class="flex items-center justify-between py-2">
        <div class="flex items-center gap-2">
          <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-7 h-7 object-contain">
          <span class="text-lg font-bold tracking-tight text-gray-900">Parcel<span class="text-[#215cd4]">Hub</span></span>
        </div>
      </header>

      <!-- Center Modal Card -->
      <div class="my-auto py-8">
        <div class="rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-sm">
          <h2 class="text-2xl font-bold text-gray-900">Awaiting Payment</h2>
          
          <p class="text-lg font-bold text-[#10b780] mt-3">Order created successfully!</p>

          <p class="text-sm text-[#215cd4] font-medium leading-relaxed mt-4 max-w-xs mx-auto">
            <span class="font-bold">Next step:</span> Please head to the hub to hand over the payment. We will begin tracking your parcel once the deposit is secured.
          </p>

          <!-- Learn more toggle -->
          <button 
            type="button" 
            onclick="openEscrowPolicyModal()"
            class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold mt-6 cursor-pointer"
          >
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <span>Learn More</span>
          </button>

          <!-- Generate QR Button -->
          <div class="mt-8">
            <button 
              type="button"
              onclick="navigateTo('qr_screen')"
              class="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2"
            >
              <span>Generate QR</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Return to Home Link -->
        <div class="text-center mt-6">
          <button 
            type="button" 
            onclick="navigateTo('home')"
            class="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>

      <div></div>
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 6: After Order Creation QR to be staff scanned
// -------------------------------------------------------------
function renderQrScreen() {
  const order = getCurrentOrder();

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-24 relative select-none">
      <!-- Phone Status Bar Mockup -->
      <div class="flex items-center justify-between text-xs font-semibold text-gray-900 pb-2 border-b border-gray-100">
        <span>3:44</span>
        <div class="dynamic-island mx-auto"></div>
        <div class="flex items-center gap-1.5 text-gray-800">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/></svg>
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.64-.64C7.93 20.26 9.88 21 12 21s4.07-.74 5.61-1.97l.64.64c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.64-.64C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
          <div class="w-5 h-2.5 border border-gray-800 rounded-sm p-0.5 flex items-center">
            <div class="w-3 h-full bg-gray-800 rounded-2xs"></div>
          </div>
        </div>
      </div>

      <!-- App Header -->
      <header class="flex items-center gap-2 py-3 mt-1">
        <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-7 h-7 object-contain">
        <span class="text-lg font-bold tracking-tight text-gray-900">Parcel<span class="text-[#215cd4]">Hub</span></span>
      </header>

      <!-- Center QR Code Card -->
      <div class="mt-4 flex flex-col items-center">
        <div class="p-6 rounded-3xl bg-white border border-gray-100 shadow-md flex flex-col items-center">
          <div class="w-52 h-52 bg-white p-2 rounded-2xl flex items-center justify-center">
            <img src="./assets/sample_qr_code.png" alt="QR Code" class="w-full h-full object-contain">
          </div>
        </div>

        <!-- Details below QR -->
        <h3 class="text-xl font-bold text-gray-900 mt-5">${order.product}</h3>
        <p class="text-base font-mono font-semibold text-gray-800 mt-1">${order.refCode}</p>
        <p class="text-sm text-gray-500 mt-1">Let staff scan the QR to pay</p>

        <!-- Save as Photo Button -->
        <button 
          type="button"
          onclick="saveQrPhoto()"
          class="w-full max-w-xs mt-6 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Save as Photo to Device</span>
        </button>

        <!-- Return to Home Link -->
        <button 
          type="button" 
          onclick="navigateTo('home')"
          class="text-sm font-semibold text-gray-700 hover:text-black mt-4 cursor-pointer"
        >
          Return to Home
        </button>
      </div>

      <!-- Bottom Navigation Bar with Labels -->
      ${renderBottomNav('transactions', true)}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 7-12: Order Details & Finite State Machine Tracking
// -------------------------------------------------------------
function renderOrderDetailsScreen() {
  const order = getCurrentOrder();
  const hubOpen = state.hubOpen;
  const status = order.status;

  // Banner styles depending on status
  let bannerBg = 'bg-[#c58b12] text-white'; // Default Gold for Payment Required
  let bannerTitle = 'Complete Details';
  let bannerSubtitle = 'Payment Required';

  if (status === 'AWAITING_PARCEL') {
    bannerBg = 'bg-[#215cd4] text-white';
    bannerSubtitle = 'Awaiting Order';
  } else if (status === 'READY_TO_CLAIM') {
    bannerBg = 'bg-[#10b780] text-white';
    bannerSubtitle = 'Ready To Claim';
  } else if (status === 'CLAIMED') {
    bannerBg = 'bg-white border-b border-gray-200 text-gray-900';
    bannerSubtitle = 'Claimed';
  }

  return `
    <div class="flex flex-col min-h-[780px] bg-white pb-8 select-none">
      <!-- Top Colored Status Banner -->
      <div class="${bannerBg} py-5 px-6 text-center shadow-sm transition-colors duration-300">
        <h2 class="text-2xl font-bold tracking-tight">${bannerTitle}</h2>
        <p class="text-sm font-medium mt-0.5 opacity-90">${bannerSubtitle}</p>
      </div>

      <div class="px-5 pt-5 space-y-6">
        <!-- Section: Order Overview -->
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">ORDER OVERVIEW</span>
            <button 
              type="button" 
              onclick="navigateTo('home')" 
              class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer"
            >
              <span>Back</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
              </svg>
            </button>
          </div>

          <div class="mt-3">
            <span class="text-xs text-gray-500">Product</span>
            <h3 class="text-xl font-bold text-gray-900 leading-tight">${order.product}</h3>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <span class="text-xs text-gray-500">Recipient</span>
              <p class="text-base font-bold text-gray-900">${order.recipient}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Paid Amount</span>
              <p class="text-base font-bold text-gray-900 font-mono-numbers">${order.paidAmount}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Tracking Number</span>
              <p class="text-sm font-mono font-semibold text-gray-900">${order.trackingNumber}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Change</span>
              <p class="text-base font-bold text-gray-900 font-mono-numbers">${status === 'PAYMENT_REQUIRED' || status === 'AWAITING_PARCEL' ? 'To Be Determined' : order.change}</p>
            </div>
          </div>
        </div>

        <hr class="border-gray-200">

        <!-- Section: Pick-up Hub Location -->
        <div>
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">PICK-UP HUB LOCATION</span>
          <div class="flex items-center gap-2 mt-1">
            <h4 class="text-lg font-bold text-gray-900">Lily’s Catering Hub</h4>
            <span class="inline-flex items-center gap-1 text-xs font-semibold ${hubOpen ? 'text-[#10b780]' : 'text-red-500'}">
              <span class="w-2 h-2 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}"></span>
              ${hubOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">Yati, Liloan, Cebu, 6002</p>

          ${status === 'READY_TO_CLAIM' ? `
            <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold ${hubOpen ? 'text-gray-800' : 'text-gray-500'}">
              <span class="w-2.5 h-2.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-red-500'}"></span>
              <span>Lily’s Catering Hub is currently ${hubOpen ? 'open' : 'closed'}</span>
            </div>
          ` : ''}
        </div>

        <hr class="border-gray-200">

        <!-- Section: Tracking Progress Stepper (Screens 7, 8, 9, 12) -->
        ${status !== 'READY_TO_CLAIM' || !hubOpen ? `
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">TRACKING PROGRESS</span>
              <button 
                type="button" 
                onclick="navigateTo('qr_screen')"
                class="p-1 rounded hover:bg-gray-100 text-gray-700" 
                title="View QR Code"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
              </button>
            </div>

            <!-- Vertical Timeline Stepper -->
            <div class="relative pl-7 space-y-6">
              <div class="stepper-line"></div>

              <!-- Step 1: Order Placed -->
              <div class="relative">
                <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full ${status === 'PAYMENT_REQUIRED' ? 'bg-[#10b780] pulse-green' : 'bg-[#94a3b8]'} ring-4 ring-white"></div>
                </div>
                <div class="flex items-baseline justify-between">
                  <h5 class="text-sm font-bold text-gray-900">Order Placed</h5>
                  <span class="text-[11px] font-mono text-gray-500">17 Oct 16:32</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">Order by the user from the app</p>
              </div>

              <!-- Step 2: Awaiting Parcel -->
              <div class="relative">
                <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full ${status === 'AWAITING_PARCEL' ? 'bg-[#10b780] pulse-green' : (status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? 'bg-[#94a3b8]' : 'bg-gray-300')} ring-4 ring-white"></div>
                </div>
                <div class="flex items-baseline justify-between">
                  <h5 class="text-sm font-bold ${status === 'PAYMENT_REQUIRED' ? 'text-gray-400' : 'text-gray-900'}">Awaiting Parcel</h5>
                  ${status !== 'PAYMENT_REQUIRED' ? `<span class="text-[11px] font-mono text-gray-500">17 Oct 18:32</span>` : ''}
                </div>
                <p class="text-xs text-gray-500 mt-0.5">The hub is actively waiting for the product</p>
              </div>

              <!-- Step 3: Ready to Claim -->
              <div class="relative">
                <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full ${status === 'READY_TO_CLAIM' ? 'bg-[#10b780] pulse-green' : (status === 'CLAIMED' ? 'bg-[#94a3b8]' : 'bg-gray-300')} ring-4 ring-white"></div>
                </div>
                <div class="flex items-baseline justify-between">
                  <h5 class="text-sm font-bold ${status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? 'text-gray-900' : 'text-gray-400'}">Ready to Claim</h5>
                  ${status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? `<span class="text-[11px] font-mono text-gray-500">17 Oct 22:32</span>` : ''}
                </div>
                <p class="text-xs text-gray-500 mt-0.5">The product already is in the hub, waiting for claim</p>
                ${status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? `
                  <button 
                    type="button"
                    onclick="openProofOfDeliveryModal()" 
                    class="text-xs font-semibold text-[#215cd4] hover:underline mt-1 block cursor-pointer"
                  >
                    View Proof of Delivery
                  </button>
                ` : ''}
              </div>

              <!-- Step 4: Parcel Claimed -->
              <div class="relative">
                <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                  <div class="w-3.5 h-3.5 rounded-full ${status === 'CLAIMED' ? 'bg-[#10b780] pulse-green' : 'bg-gray-300'} ring-4 ring-white"></div>
                </div>
                <div class="flex items-baseline justify-between">
                  <h5 class="text-sm font-bold ${status === 'CLAIMED' ? 'text-gray-900' : 'text-gray-400'}">Parcel Claimed</h5>
                  ${status === 'CLAIMED' ? `<span class="text-[11px] font-mono text-gray-500">18 Oct 08:11</span>` : ''}
                </div>
                ${status === 'CLAIMED' ? `<p class="text-xs text-gray-500 mt-0.5">Handover verified. Cash change disbursed.</p>` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Dynamic Action Area by Status -->
        <div class="pt-4 space-y-3">
          ${status === 'PAYMENT_REQUIRED' ? `
            <!-- Generate QR Button -->
            <button 
              type="button"
              onclick="navigateTo('qr_screen')"
              class="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2"
            >
              <span>Generate QR</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </button>
          ` : ''}

          ${status === 'READY_TO_CLAIM' ? (hubOpen ? `
            <!-- Open Hub: Checkbox confirmation + Initiate Claim -->
            <div class="flex items-start gap-2.5 pt-2">
              <input 
                type="checkbox" 
                id="claim-confirm-check" 
                class="w-4 h-4 mt-0.5 rounded text-[#215cd4] focus:ring-[#215cd4] cursor-pointer"
              >
              <div>
                <label for="claim-confirm-check" class="text-sm font-bold text-gray-900 cursor-pointer block">
                  I confirm that I want to claim the order
                </label>
                <p class="text-xs text-gray-500 mt-0.5">Only intiate claim when you’re physically claiming on the hub</p>
              </div>
            </div>

            <button 
              type="button"
              onclick="handleInitiateClaimClick()"
              class="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-base tracking-wide transition-all shadow-md btn-press text-center"
            >
              Initiate Claim
            </button>
          ` : `
            <!-- Closed Hub (Screen 11) -->
            <p class="text-xs text-gray-500 text-center">Only intiate claim when you’re physically claiming on the hub</p>
            <button 
              type="button"
              disabled
              class="w-full py-3.5 px-6 rounded-2xl bg-[#647b92] text-white font-semibold text-sm tracking-wide opacity-80 cursor-not-allowed text-center"
            >
              Cannot initiate claim when the hub is closed
            </button>
          `) : ''}

          <!-- Return to Home link -->
          <div class="text-center pt-2">
            <button 
              type="button" 
              onclick="navigateTo('home')"
              class="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Component: Bottom Navigation Bar
// -------------------------------------------------------------
function renderBottomNav(activeTab = 'home', withLabels = false) {
  if (!withLabels) {
    return `
      <nav class="absolute bottom-5 left-5 right-5 h-16 rounded-full bg-white floating-nav flex items-center justify-around px-6 border border-gray-100 z-10">
        <button 
          type="button" 
          onclick="navigateTo('home')" 
          class="p-2 transition-transform hover:scale-110 active:scale-95 ${activeTab === 'home' ? 'text-[#215cd4]' : 'text-gray-800'}"
          aria-label="Home"
        >
          <img src="./assets/home_icon.svg" alt="Home" class="w-6 h-6 object-contain">
        </button>

        <button 
          type="button" 
          onclick="showToast('Transactions: Viewing complete ledger')" 
          class="p-2 transition-transform hover:scale-110 active:scale-95 text-gray-800"
          aria-label="Transactions"
        >
          <img src="./assets/orders_icon.svg" alt="Orders" class="w-6 h-6 object-contain">
        </button>

        <button 
          type="button" 
          onclick="openEscrowPolicyModal()" 
          class="p-2 transition-transform hover:scale-110 active:scale-95 text-gray-800"
          aria-label="Help"
        >
          <img src="./assets/help_icon.svg" alt="Help" class="w-6 h-6 object-contain">
        </button>

        <button 
          type="button" 
          onclick="showToast('Student Profile: Nyeowsz (CTU-2026-0488)')" 
          class="p-2 transition-transform hover:scale-110 active:scale-95 text-gray-800"
          aria-label="Profile"
        >
          <img src="./assets/profile_icon.svg" alt="Profile" class="w-6 h-6 object-contain">
        </button>
      </nav>
    `;
  }

  // Screen 6 labeled bottom nav
  return `
    <nav class="absolute bottom-3 left-4 right-4 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-10">
      <button onclick="navigateTo('home')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="text-[10px] font-medium">Home</span>
      </button>

      <button onclick="showToast('Transactions ledger view')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        <span class="text-[10px] font-medium">Transactions</span>
      </button>

      <button onclick="openNotificationsModal()" class="flex flex-col items-center gap-1 text-[#215cd4] relative">
        <div class="relative">
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">4</span>
        </div>
        <span class="text-[10px] font-semibold text-gray-700">Notifications</span>
      </button>

      <button onclick="showToast('Account details')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span class="text-[10px] font-medium">Account</span>
      </button>
    </nav>
  `;
}

// -------------------------------------------------------------
// Interactive Handlers
// -------------------------------------------------------------
function handleReceiptFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      state.draftOrder.receiptUri = e.target.result;
      showToast('Receipt image loaded successfully!');
      navigateTo('confirm_order');
    };
    reader.readAsDataURL(file);
  }
}

function loadSampleReceipt() {
  state.draftOrder.receiptUri = './assets/receipt_screenshot.png';
  showToast('Sample Shopee receipt attached!');
  navigateTo('confirm_order');
}

function submitCreatedOrder() {
  const check = document.getElementById('confirm-details-checkbox');
  if (check && !check.checked) {
    showToast('Please check the confirmation box to proceed.');
    return;
  }

  // Create new order entry
  const newOrder = {
    id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
    product: state.draftOrder.product || 'VXE R1 Nearlink',
    recipient: state.draftOrder.recipient || 'John Doe',
    paidAmount: '₱500',
    codAmount: state.draftOrder.totalAmount || '₱480',
    change: 'To Be Determined',
    trackingNumber: state.draftOrder.trackingId || 'PH2696153366792H',
    refCode: `0001-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    envelopeNumber: `ENV-${Math.floor(400 + Math.random() * 99)}`,
    status: 'PAYMENT_REQUIRED',
    orderPlacedTime: 'Just now',
    awaitingParcelTime: null,
    readyToClaimTime: null,
    claimedTime: null,
    dateLabel: 'Today, Just now'
  };

  state.orders.unshift(newOrder);
  state.selectedOrderId = newOrder.id;
  state.hasOrders = true;

  navigateTo('payment_verification');
  showToast('Order registered! Please complete counter cash-in.');
}

function handleInitiateClaimClick() {
  const check = document.getElementById('claim-confirm-check');
  if (check && !check.checked) {
    showToast('Please check the confirmation box before initiating claim.');
    return;
  }

  // Open 6-digit MPIN authorization modal (Fintech domain invariant)
  openMpinModal();
}

function saveQrPhoto() {
  showToast('QR Code saved to photo gallery!');
}

function toggleNotificationPill() {
  state.notificationActive = !state.notificationActive;
  showToast(state.notificationActive ? 'Push notifications enabled for ParcelHub!' : 'Notifications muted.');
}

// -------------------------------------------------------------
// MPIN Security Gate (Procedural Invariant Component)
// -------------------------------------------------------------
function openMpinModal() {
  state.mpinInput = '';
  updateMpinDots();
  const modal = document.getElementById('mpin-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeMpinModal() {
  const modal = document.getElementById('mpin-modal');
  if (modal) modal.classList.add('hidden');
}

function enterMpin(digit) {
  if (state.mpinInput.length < 6) {
    state.mpinInput += digit;
    updateMpinDots();

    if (state.mpinInput.length === 6) {
      setTimeout(verifyAndCommitClaim, 300);
    }
  }
}

function deleteMpin() {
  if (state.mpinInput.length > 0) {
    state.mpinInput = state.mpinInput.slice(0, -1);
    updateMpinDots();
  }
}

function updateMpinDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById(`mpin-dot-${i}`);
    if (dot) {
      if (i < state.mpinInput.length) {
        dot.className = 'w-4 h-4 rounded-full bg-[#215cd4] ring-4 ring-blue-100 transition-all';
      } else {
        dot.className = 'w-4 h-4 rounded-full bg-gray-200 transition-all';
      }
    }
  }
}

function verifyAndCommitClaim() {
  closeMpinModal();
  const order = getCurrentOrder();
  if (order) {
    order.status = 'CLAIMED';
    order.claimedTime = 'Today 08:11';
    order.change = '₱20';
  }
  renderApp();
  showToast('MPIN Authorized! Parcel claimed successfully.');
}

// -------------------------------------------------------------
// Proof of Delivery Modal
// -------------------------------------------------------------
function openProofOfDeliveryModal() {
  const modal = document.getElementById('pod-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeProofOfDeliveryModal() {
  const modal = document.getElementById('pod-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// Escrow Policy / Learn More Modal
// -------------------------------------------------------------
function openEscrowPolicyModal() {
  const modal = document.getElementById('escrow-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeEscrowPolicyModal() {
  const modal = document.getElementById('escrow-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// Notifications Drawer Modal
// -------------------------------------------------------------
function openNotificationsModal() {
  const modal = document.getElementById('notifications-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeNotificationsModal() {
  const modal = document.getElementById('notifications-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 3200);
}

// -------------------------------------------------------------
// Top Controls Bar Synchronizer
// -------------------------------------------------------------
function updateTopControls() {
  const screenSelect = document.getElementById('screen-select');
  if (screenSelect) {
    const curOrder = getCurrentOrder();
    if (state.activeScreen === 'home') {
      screenSelect.value = state.hasOrders ? 'figma-2' : 'figma-1';
    } else if (state.activeScreen === 'create_order') {
      screenSelect.value = 'figma-3';
    } else if (state.activeScreen === 'confirm_order') {
      screenSelect.value = 'figma-4';
    } else if (state.activeScreen === 'payment_verification') {
      screenSelect.value = 'figma-5';
    } else if (state.activeScreen === 'qr_screen') {
      screenSelect.value = 'figma-6';
    } else if (state.activeScreen === 'order_details') {
      if (curOrder.status === 'PAYMENT_REQUIRED') screenSelect.value = 'figma-7';
      else if (curOrder.status === 'AWAITING_PARCEL') screenSelect.value = 'figma-8';
      else if (curOrder.status === 'READY_TO_CLAIM') screenSelect.value = state.hubOpen ? 'figma-9' : 'figma-11';
      else if (curOrder.status === 'CLAIMED') screenSelect.value = 'figma-12';
    }
  }

  const hubToggle = document.getElementById('hub-status-toggle');
  if (hubToggle) {
    hubToggle.checked = state.hubOpen;
  }
}

function initEventListeners() {
  // Listen for keyboard input on MPIN if modal open
  window.addEventListener('keydown', (e) => {
    const mpinModal = document.getElementById('mpin-modal');
    if (mpinModal && !mpinModal.classList.contains('hidden')) {
      if (e.key >= '0' && e.key <= '9') {
        enterMpin(e.key);
      } else if (e.key === 'Backspace') {
        deleteMpin();
      } else if (e.key === 'Escape') {
        closeMpinModal();
      }
    }
  });
}
