/**
 * ParcelHub Mobile Application Frontend Controller (v2 - Minimalist & Harmonious)
 * Implements 1:1 design consistency based on 1. Home and 2. Home,
 * with full Tailwind CSS v4 design tokens, WCAG 2.1 compliance,
 * live countdown ticker, real-time staff search, 1-tap clipboard copying,
 * and complete flow articulation from the Figma specification.
 */

const state = {
  activeScreen: 'home', // 'home' | 'create_order' | 'confirm_order' | 'payment_verification' | 'qr_screen' | 'order_details' | 'transactions' | 'staff_ui'
  roleMode: 'user', // 'user' | 'staff'
  hasOrders: true,
  hubOpen: true,
  viewMode: 'device', // 'device' | 'fullscreen'
  notificationActive: true,
  mpinInput: '',
  selectedOrderId: 'ORD-402',
  transactionFilter: 'ALL', // 'ALL' | 'READY_TO_CLAIM' | 'AWAITING_PARCEL' | 'PAYMENT_REQUIRED' | 'CLAIMED'
  staffFilter: 'active', // 'active' | 'ready_to_claim' | 'claimed' | 'inactive'
  staffSearchQuery: '',
  pingCountdown: 298, // 04:58 initial countdown in seconds
  timerInterval: null,
  
  // New order form scratch state
  draftOrder: {
    product: 'VXE R1 Nearlink Wireless Mouse',
    recipient: 'John Doe',
    totalAmount: '₱480',
    trackingId: 'PH2696153366792H',
    receiptUri: './assets/receipt_screenshot.png'
  },

  // Active store orders
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
      alphanumericKey: 'PH-402-5544',
      envelopeNumber: 'ENV-402',
      status: 'READY_TO_CLAIM', // 'PAYMENT_REQUIRED' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'CLAIMED'
      orderPlacedTime: '17 Oct 16:32',
      awaitingParcelTime: '17 Oct 18:32',
      readyToClaimTime: '17 Oct 22:32',
      claimedTime: null,
      dateLabel: 'October 10, 2026 10:30',
      carrier: 'ShopeeXpress (SPX)',
      hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu"
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
      alphanumericKey: 'PH-408-8899',
      envelopeNumber: 'ENV-408',
      status: 'AWAITING_PARCEL',
      orderPlacedTime: '7 Oct 07:41',
      awaitingParcelTime: '7 Oct 12:15',
      readyToClaimTime: null,
      claimedTime: null,
      dateLabel: 'October 7, 2026 7:41',
      carrier: 'J&T Express',
      hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu"
    },
    {
      id: 'ORD-388',
      product: 'Keychron K2 Pro Mechanical Keyboard',
      recipient: 'John Doe',
      paidAmount: '₱4,200',
      codAmount: '₱4,200',
      change: '₱0',
      trackingNumber: 'PH44219902341L',
      refCode: '0001-1122-3344',
      alphanumericKey: 'PH-388-1122',
      envelopeNumber: 'ENV-388',
      status: 'CLAIMED',
      orderPlacedTime: '1 Oct 10:00',
      awaitingParcelTime: '2 Oct 14:00',
      readyToClaimTime: '3 Oct 11:30',
      claimedTime: '4 Oct 09:15',
      dateLabel: 'October 1, 2026 10:00',
      carrier: 'Flash Express',
      hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu"
    }
  ],

  notifications: [
    { id: 1, title: 'Parcel Ready for Claim', body: 'VXE R1 Nearlink has arrived at Lily’s Catering Hub.', time: '10m ago', unread: true },
    { id: 2, title: 'Deposit Verified', body: '₱500 deposit received for your order.', time: '2h ago', unread: true },
    { id: 3, title: 'Courier Payment Logged', body: 'Staff paid ₱480 to SPX Express courier.', time: '4h ago', unread: true },
    { id: 4, title: 'Welcome to ParcelHub', body: 'Lily’s Catering Hub station is active.', time: '1d ago', unread: true }
  ]
};

// DOM Initializer
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  initEventListeners();
});

// Master Screen Router
function navigateTo(screenId, params = {}) {
  // Handle timer lifecycle
  if (screenId === 'payment_verification') {
    startPingTimer();
  } else {
    stopPingTimer();
  }

  state.activeScreen = screenId;
  if (params.orderId) {
    state.selectedOrderId = params.orderId;
  }
  if (params.status) {
    const ord = getCurrentOrder();
    if (ord) ord.status = params.status;
  }
  if (params.filter) {
    state.transactionFilter = params.filter;
  }
  renderApp();
  const screenContent = document.getElementById('mobile-screen-content');
  if (screenContent) screenContent.scrollTo({ top: 0, behavior: 'smooth' });
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

function setRoleMode(role) {
  state.roleMode = role;
  const userBtn = document.getElementById('role-user-btn');
  const staffBtn = document.getElementById('role-staff-btn');

  if (role === 'staff') {
    state.activeScreen = 'staff_ui';
    if (userBtn) {
      userBtn.className = 'px-2.5 py-1 rounded-lg font-medium transition-all text-slate-300 hover:text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]';
    }
    if (staffBtn) {
      staffBtn.className = 'px-2.5 py-1 rounded-lg font-medium transition-all bg-[#215cd4] text-white hover:bg-[#194cb5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]';
    }
    showToast('Switched to Hub Staff Counter Terminal');
  } else {
    state.activeScreen = 'home';
    if (userBtn) {
      userBtn.className = 'px-2.5 py-1 rounded-lg font-medium transition-all bg-[#215cd4] text-white hover:bg-[#194cb5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]';
    }
    if (staffBtn) {
      staffBtn.className = 'px-2.5 py-1 rounded-lg font-medium transition-all text-slate-300 hover:text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]';
    }
    showToast('Switched to Customer Mobile App');
  }
  renderApp();
}

function setViewMode(mode) {
  state.viewMode = mode;
  const frameContainer = document.getElementById('phone-frame');
  const toggleBtn = document.getElementById('view-toggle-btn');
  
  if (mode === 'fullscreen') {
    frameContainer.classList.remove('phone-mockup', 'max-w-[420px]', 'my-4', 'rounded-[48px]', 'h-[844px]');
    frameContainer.classList.add('w-full', 'max-w-md', 'min-h-screen', 'rounded-none', 'shadow-none', 'my-0');
    document.getElementById('phone-bezel-header')?.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Device Frame Mode';
  } else {
    frameContainer.classList.add('phone-mockup', 'max-w-[420px]', 'my-4', 'rounded-[48px]', 'h-[844px]');
    frameContainer.classList.remove('w-full', 'rounded-none', 'shadow-none', 'my-0', 'min-h-screen');
    document.getElementById('phone-bezel-header')?.classList.remove('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Fullscreen Mode';
  }
}

// Preset Scenario Selector
function applyScenario(scenario) {
  const currentOrder = getCurrentOrder();
  state.roleMode = 'user';

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
      startPingTimer();
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
    case 'figma-staff': // Staff Counter Operations
      setRoleMode('staff');
      return;
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
    case 'transactions':
      contentHtml = renderTransactionsScreen();
      break;
    case 'staff_ui':
      contentHtml = renderStaffScreen();
      break;
    default:
      contentHtml = renderHomeScreen();
  }

  viewport.innerHTML = contentHtml;
  updateTopControls();
}

// -------------------------------------------------------------
// Component: Unified Brand Header (Design Anchor from 1. & 2. Home)
// -------------------------------------------------------------
function renderBrandHeader(options = {}) {
  const { title = "Parcelhub", subtitle = "LILY'S CATERING HUB", showBack = false, backTarget = 'home' } = options;
  const hubOpen = state.hubOpen;

  return `
    <header class="flex items-center justify-between py-2 select-none border-b border-gray-100/80 pb-3 mb-1">
      <div class="flex items-center gap-2.5">
        ${showBack ? `
          <button 
            type="button" 
            onclick="navigateTo('${backTarget}')"
            aria-label="Navigate back"
            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
        ` : `
          <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center p-1 border border-blue-100">
            <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-full h-full object-contain">
          </div>
        `}
        <div>
          <h1 class="text-xl font-bold tracking-tight text-gray-900 leading-none">${title}</h1>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full ${hubOpen ? 'bg-[#10b780]' : 'bg-[#ef4444]'}"></span>
            <p class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">${subtitle}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Notification Toggle Pill -->
        <button 
          type="button" 
          onclick="toggleNotificationPill()"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#93eb99] text-gray-900 hover:bg-[#82e088] transition-all btn-press shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>${state.notificationActive ? 'Alerts On' : 'Turn on'}</span>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </button>

        <!-- Bell Notification Button -->
        <button 
          type="button" 
          onclick="openNotificationsModal()"
          class="p-2 rounded-full hover:bg-gray-100 text-gray-900 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          aria-label="View notifications"
        >
          <img src="./assets/bell_icon.svg" alt="Bell Icon" class="w-6 h-6 object-contain">
          <span class="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ef4444] rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  `;
}

// -------------------------------------------------------------
// Screen 1 & 2: Home Screen (Zero Orders vs With Orders)
// -------------------------------------------------------------
function renderHomeScreen() {
  const hasOrders = state.hasOrders;

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      <!-- Consistent Brand Header -->
      ${renderBrandHeader()}

      <!-- Welcome Dark Card -->
      <section class="mt-4 rounded-3xl bg-[#1e1e1e] p-6 text-white shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <h2 class="text-2xl font-bold tracking-tight text-white">Welcome Nyeowsz!</h2>
          <p class="text-sm text-gray-400 mt-1">Create an order to get started</p>

          <div class="flex items-center gap-3 mt-6">
            <button 
              type="button"
              onclick="navigateTo('create_order')"
              class="flex-1 py-3 px-4 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-semibold text-xs tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              + Create Order
            </button>
            <button 
              type="button"
              onclick="navigateTo('transactions')"
              class="flex-1 py-3 px-4 rounded-xl bg-[#163b86] hover:bg-[#102d6b] text-white font-semibold text-xs tracking-wide transition-all btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Transactions
            </button>
          </div>
        </div>
      </section>

      <!-- Activities Section -->
      <section class="mt-6 flex-1 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-gray-900">Activities</h3>
          <button 
            type="button"
            onclick="setHasOrders(!state.hasOrders)"
            class="text-xs text-[#215cd4] hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Switch to ${hasOrders ? 'Zero' : 'Active'} orders view
          </button>
        </div>

        ${!hasOrders ? `
          <!-- Zero Orders Empty State Box -->
          <div class="flex-1 min-h-[360px] rounded-3xl bg-[#f8f8f8] border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-[#215cd4]">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <p class="text-gray-800 text-sm font-semibold">You don’t have any activities yet</p>
            <button 
              type="button" 
              onclick="navigateTo('create_order')" 
              class="mt-4 px-5 py-2.5 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shadow-sm transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Create an order
            </button>
          </div>
        ` : `
          <!-- With Orders List Container -->
          <div class="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 divide-y divide-gray-200/70">
            ${state.orders.map(order => `
              <div 
                onclick="navigateTo('order_details', { orderId: '${order.id}' })"
                class="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-all rounded-xl px-2 hover:bg-white"
              >
                <div>
                  <h4 class="text-sm font-bold text-gray-900 group-hover:text-[#215cd4] transition-colors">${order.product}</h4>
                  <p class="text-xs text-gray-500 mt-0.5">${order.dateLabel}</p>
                </div>
                <div class="text-right">
                  <span class="inline-flex items-center gap-1.5 text-xs font-bold ${getStatusTextColor(order.status)}">
                    <span class="w-2 h-2 rounded-full ${getStatusDotClass(order.status)}"></span>
                    ${getStatusLabel(order.status)}
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
// Harmonized with Home's clean minimalist aesthetic & Dark Hero Card
// -------------------------------------------------------------
function renderCreateOrderScreen() {
  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      <!-- Unified Header -->
      ${renderBrandHeader({ showBack: true, backTarget: 'home' })}

      <div class="flex items-center justify-between mt-3 mb-2">
        <h2 class="text-xl font-bold text-gray-900">Create an Order</h2>
        <button 
          type="button" 
          onclick="navigateTo('home')" 
          class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>Back</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
          </svg>
        </button>
      </div>

      <!-- Upload Dropzone Card -->
      <div class="mt-2 flex-1 flex flex-col">
        <label 
          for="receipt-file-input"
          id="dropzone"
          ondragover="handleDragOver(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleDropReceipt(event)"
          class="flex-1 min-h-[350px] border-2 border-dashed border-gray-300 hover:border-[#215cd4] rounded-3xl flex flex-col items-center justify-center p-6 bg-[#f8f8f8] hover:bg-blue-50/40 transition-all cursor-pointer relative group"
        >
          <input 
            type="file" 
            id="receipt-file-input" 
            aria-label="Upload Screenshot Receipt Image"
            accept="image/*" 
            class="hidden" 
            onchange="handleReceiptFile(event)"
          >
          
          <div class="w-18 h-18 rounded-2xl bg-white border border-gray-200 text-[#215cd4] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-3">
            <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>

          <p class="text-base font-bold text-gray-900">Tap to upload receipt image</p>
          <p class="text-xs text-gray-400 mt-1 text-center">Supports Shopee, Lazada, TikTok Shop screenshots</p>
          
          <button 
            type="button" 
            onclick="event.stopPropagation(); loadSampleReceipt();"
            class="mt-5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-800 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            ⚡ Use Sample Shopee Receipt
          </button>
        </label>

        <p class="text-center text-xs font-medium text-gray-500 mt-3">Screenshot of Receipt</p>

        <!-- Next Button -->
        <button 
          type="button"
          onclick="navigateTo('confirm_order')"
          class="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Next
        </button>
      </div>

      <!-- Bottom Nav -->
      ${renderBottomNav('home')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 4: Confirm Order Details
// Clean input architecture matching v1 minimalism
// -------------------------------------------------------------
function renderConfirmOrderScreen() {
  const draft = state.draftOrder;

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      <!-- Unified Header -->
      ${renderBrandHeader({ showBack: true, backTarget: 'create_order' })}

      <div class="flex items-center justify-between mt-3 mb-2">
        <h2 class="text-xl font-bold text-gray-900">Confirm Order Details</h2>
        <button 
          type="button" 
          onclick="navigateTo('create_order')" 
          class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <span>Back</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
          </svg>
        </button>
      </div>

      <!-- Details Inputs Cards Container -->
      <div class="mt-2 space-y-2.5">
        <!-- Product Field -->
        <div class="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label for="draft-product" class="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Product</label>
          <input 
            type="text" 
            id="draft-product" 
            aria-label="Product Name"
            value="${draft.product}" 
            oninput="state.draftOrder.product = this.value"
            class="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          >
        </div>

        <!-- Receiver's Name Field -->
        <div class="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label for="draft-recipient" class="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Receiver’s Name</label>
          <input 
            type="text" 
            id="draft-recipient" 
            aria-label="Receiver's Full Name"
            value="${draft.recipient}" 
            oninput="state.draftOrder.recipient = this.value"
            class="w-full text-base font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          >
        </div>

        <!-- Total COD Amount Field -->
        <div class="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label for="draft-amount" class="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Amount</label>
          <input 
            type="text" 
            id="draft-amount" 
            aria-label="Total COD Amount"
            value="${draft.totalAmount}" 
            oninput="state.draftOrder.totalAmount = this.value"
            class="w-full text-base font-bold text-gray-900 font-mono-numbers focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          >
        </div>

        <!-- Tracking ID Field -->
        <div class="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <label for="draft-tracking" class="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Tracking ID</label>
          <input 
            type="text" 
            id="draft-tracking" 
            aria-label="Tracking ID or Waybill Barcode"
            value="${draft.trackingId}" 
            oninput="state.draftOrder.trackingId = this.value"
            class="w-full text-base font-mono font-semibold text-gray-900 focus:outline-none bg-transparent mt-0.5 border-b border-transparent focus:border-[#215cd4] transition-colors"
          >
        </div>
      </div>

      <!-- Receipt Thumbnail Preview -->
      <div class="mt-4 flex flex-col items-center">
        <div class="w-28 h-36 rounded-xl border border-gray-200 shadow-2xs overflow-hidden bg-gray-50 flex items-center justify-center">
          <img src="${draft.receiptUri}" alt="Screenshot of Receipt" class="w-full h-full object-cover">
        </div>
        <p class="text-xs font-medium text-gray-500 mt-1.5">Screenshot of Receipt</p>
      </div>

      <!-- Confirmation Checkbox -->
      <div class="mt-3 flex items-center justify-center gap-2">
        <input 
          type="checkbox" 
          id="confirm-details-checkbox" 
          checked 
          class="w-4 h-4 rounded text-[#215cd4] focus:ring-[#215cd4] cursor-pointer"
        >
        <label for="confirm-details-checkbox" class="text-xs font-semibold text-gray-800 cursor-pointer">
          I confirm that these order details are correct
        </label>
      </div>

      <!-- Create Order Button -->
      <button 
        type="button"
        onclick="submitCreatedOrder()"
        class="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
      >
        Submit Order &amp; Proceed to Payment
      </button>

      <!-- Bottom Nav -->
      ${renderBottomNav('home')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 5: Payment Verification (Awaiting Payment)
// Minimalist, clean design matching v1
// -------------------------------------------------------------
function renderPaymentVerificationScreen() {
  const currentOrder = getCurrentOrder();

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 justify-between select-none">
      <!-- Unified Header -->
      ${renderBrandHeader({ showBack: true, backTarget: 'home' })}

      <!-- Center Card -->
      <div class="my-auto py-8">
        <div class="rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-xs">
          <h2 class="text-2xl font-bold text-gray-900">Awaiting Payment</h2>
          
          <p class="text-base font-bold text-[#10b780] mt-3">Order created successfully!</p>

          <p class="text-sm text-[#215cd4] font-medium leading-relaxed mt-4 max-w-xs mx-auto">
            <span class="font-bold">Next step:</span> Please head to Lily’s Catering Hub to complete the cash payment. We will begin tracking your parcel once the payment is verified.
          </p>

          <!-- Learn more toggle -->
          <div class="mt-6 flex justify-center">
            <button 
              type="button" 
              onclick="openEscrowPolicyModal()"
              class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span>Hub Policy &amp; Information</span>
            </button>
          </div>

          <!-- Generate QR Button -->
          <div class="mt-8">
            <button 
              type="button" 
              onclick="navigateTo('qr_screen')"
              class="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
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
            class="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Return to Home
          </button>
        </div>
      </div>

      <!-- Bottom Nav -->
      ${renderBottomNav('home')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 6: Counter Staff QR Scan
// Clean, minimalist QR card matching v1
// -------------------------------------------------------------
function renderQrScreen() {
  const order = getCurrentOrder();

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      <!-- Unified Header -->
      ${renderBrandHeader({ showBack: true, backTarget: 'home' })}

      <!-- Center QR Card -->
      <div class="mt-4 flex flex-col items-center">
        <div class="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col items-center">
          <div class="w-52 h-52 bg-white p-2 rounded-2xl flex items-center justify-center">
            <img src="./assets/sample_qr_code.png" alt="Parcelhub QR Code" class="w-full h-full object-contain">
          </div>
        </div>

        <!-- Details below QR -->
        <h3 class="text-xl font-bold text-gray-900 mt-5">${order.product}</h3>
        
        <div class="flex items-center justify-center gap-2 mt-1">
          <p class="text-base font-mono font-bold text-[#163b86] tracking-wider bg-blue-50 px-3 py-1 rounded-xl border border-blue-200/60">
            ${order.alphanumericKey}
          </p>
          <button 
            type="button" 
            onclick="copyToClipboard('${order.alphanumericKey}', 'Counter Key')" 
            class="p-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors shadow-2xs"
            title="Copy Key"
            aria-label="Copy Key"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>
        </div>

        <p class="text-xs text-gray-500 mt-2">Show this QR code at the hub counter to pay or claim</p>

        <!-- Save as Photo Button -->
        <button 
          type="button"
          onclick="saveQrPhoto()"
          class="w-full max-w-xs mt-6 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Save as Photo to Device</span>
        </button>

        <!-- Return to Home Link -->
        <div class="text-center mt-4">
          <button 
            type="button" 
            onclick="navigateTo('home')"
            class="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Return to Home
          </button>
        </div>
      </div>

      <!-- Bottom Navigation Bar -->
      ${renderBottomNav('home')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen 7-12: Order Details & Multi-Stage Tracking Stepper
// -------------------------------------------------------------
// Screen 7-12: Order Details & Multi-Stage Tracking Stepper
// Minimalist, polished layout matching Image 2 & original design
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
    bannerSubtitle = 'Awaiting Parcel';
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
      <div class="${bannerBg} py-5 px-6 text-center shadow-xs transition-colors duration-300">
        <h2 class="text-2xl font-bold tracking-tight">${bannerTitle}</h2>
        <p class="text-sm font-medium mt-0.5 ${status === 'CLAIMED' ? 'text-gray-500' : 'opacity-90'}">${bannerSubtitle}</p>
      </div>

      <div class="px-5 pt-5 space-y-6">
        <!-- Section: Order Overview -->
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">ORDER OVERVIEW</span>
            <button 
              type="button" 
              onclick="navigateTo('home')" 
              class="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <span>Back</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"/>
              </svg>
            </button>
          </div>

          <div class="mt-3">
            <span class="text-xs text-gray-500">Product</span>
            <h3 class="text-xl font-bold text-gray-900 leading-tight mt-0.5">${order.product}</h3>
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
              <div class="flex items-center gap-1.5 mt-0.5">
                <p class="text-sm font-mono font-semibold text-gray-900 truncate max-w-[130px]">${order.trackingNumber}</p>
                <button 
                  type="button" 
                  onclick="copyToClipboard('${order.trackingNumber}', 'Tracking Number')" 
                  class="p-0.5 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                  title="Copy Tracking Number"
                  aria-label="Copy Tracking Number"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
              </div>
            </div>
            <div>
              <span class="text-xs text-gray-500">Change</span>
              <p class="text-base font-bold text-gray-900 font-mono-numbers">${status === 'PAYMENT_REQUIRED' ? 'To Be Determined' : order.change}</p>
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

        <!-- Section: Tracking Progress Stepper -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">TRACKING PROGRESS</span>
            <button 
              type="button" 
              onclick="navigateTo('qr_screen')"
              class="p-1 rounded hover:bg-gray-100 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]" 
              title="View QR Code"
              aria-label="View QR Code"
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
                <div class="w-3.5 h-3.5 rounded-full ${status === 'PAYMENT_REQUIRED' ? 'bg-[#c58b12] pulse-gold' : 'bg-[#94a3b8]'} ring-4 ring-white"></div>
              </div>
              <div class="flex items-baseline justify-between">
                <h5 class="text-sm font-bold text-gray-900">Order Placed</h5>
                <span class="text-[11px] font-mono text-gray-500">${order.orderPlacedTime}</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">Order by the user from the app</p>
            </div>

            <!-- Step 2: Awaiting Parcel -->
            <div class="relative">
              <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div class="w-3.5 h-3.5 rounded-full ${status === 'AWAITING_PARCEL' ? 'bg-[#215cd4] pulse-blue' : (status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? 'bg-[#94a3b8]' : 'bg-gray-300')} ring-4 ring-white"></div>
              </div>
              <div class="flex items-baseline justify-between">
                <h5 class="text-sm font-bold ${status === 'PAYMENT_REQUIRED' ? 'text-gray-400' : 'text-gray-900'}">Awaiting Parcel</h5>
                ${status !== 'PAYMENT_REQUIRED' ? `<span class="text-[11px] font-mono text-gray-500">${order.awaitingParcelTime || '17 Oct 18:32'}</span>` : ''}
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
                ${status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? `<span class="text-[11px] font-mono text-gray-500">${order.readyToClaimTime || '17 Oct 22:32'}</span>` : ''}
              </div>
              <p class="text-xs text-gray-500 mt-0.5">The product already is in the hub, waiting for claim</p>
              ${status === 'READY_TO_CLAIM' || status === 'CLAIMED' ? `
                <button 
                  type="button" 
                  onclick="openProofOfDeliveryModal()" 
                  class="text-xs font-semibold text-[#215cd4] hover:underline mt-1 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
                >
                  View Proof of Delivery
                </button>
              ` : ''}
            </div>

            <!-- Step 4: Parcel Claimed -->
            <div class="relative">
              <div class="absolute -left-7 top-0.5 w-6 h-6 flex items-center justify-center">
                <div class="w-3.5 h-3.5 rounded-full ${status === 'CLAIMED' ? 'bg-[#10b780]' : 'bg-gray-300'} ring-4 ring-white"></div>
              </div>
              <div class="flex items-baseline justify-between">
                <h5 class="text-sm font-bold ${status === 'CLAIMED' ? 'text-gray-900' : 'text-gray-400'}">Parcel Claimed</h5>
                ${status === 'CLAIMED' ? `<span class="text-[11px] font-mono text-gray-500">${order.claimedTime || '18 Oct 08:11'}</span>` : ''}
              </div>
              ${status === 'CLAIMED' ? `<p class="text-xs text-gray-500 mt-0.5">Handover verified. Cash change returned.</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Dynamic Action Area by Status -->
        <div class="pt-2 space-y-3">
          ${status === 'PAYMENT_REQUIRED' ? `
            <button 
              type="button"
              onclick="navigateTo('qr_screen')"
              class="w-full py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#1a4bb0] text-white font-bold text-sm tracking-wide transition-all shadow-md btn-press flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              <span>Generate QR</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </button>
          ` : ''}



          ${status === 'READY_TO_CLAIM' ? (hubOpen ? `
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
                <p class="text-xs text-gray-500 mt-0.5">Only initiate claim when you’re physically claiming at the hub</p>
              </div>
            </div>

            <button 
              type="button"
              onclick="handleInitiateClaimClick()"
              class="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-base tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
            >
              Initiate Claim
            </button>
          ` : `
            <p class="text-xs text-gray-500 text-center">Only initiate claim when you’re physically claiming at the hub</p>
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
              class="text-sm font-semibold text-gray-700 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
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
// Screen: Transactions / Complete Ledger
// -------------------------------------------------------------
function renderTransactionsScreen() {
  const currentFilter = state.transactionFilter;
  let filtered = state.orders;
  if (currentFilter !== 'ALL') {
    filtered = state.orders.filter(o => o.status === currentFilter);
  }

  return `
    <div class="flex flex-col min-h-[780px] bg-white px-5 pt-3 pb-8 relative select-none">
      <!-- Unified Header -->
      ${renderBrandHeader({ title: "Transactions", subtitle: "ORDER HISTORY", showBack: true, backTarget: 'home' })}

      <!-- Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none mt-2">
        ${['ALL', 'READY_TO_CLAIM', 'AWAITING_PARCEL', 'PAYMENT_REQUIRED', 'CLAIMED'].map(f => `
          <button 
            type="button" 
            onclick="setTransactionFilter('${f}')"
            class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${currentFilter === f ? 'bg-[#215cd4] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            ${f === 'ALL' ? 'All Orders' : getStatusLabel(f)}
          </button>
        `).join('')}
      </div>

      <!-- Orders List Container -->
      <div class="mt-4 flex-1">
        <div class="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 divide-y divide-gray-200/70">
          ${filtered.length === 0 ? `
            <div class="py-12 text-center text-xs text-gray-400">
              No orders found matching this filter.
            </div>
          ` : filtered.map(order => `
            <div 
              onclick="navigateTo('order_details', { orderId: '${order.id}' })"
              class="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-all rounded-xl px-2 hover:bg-white"
            >
              <div>
                <h4 class="text-sm font-bold text-gray-900 group-hover:text-[#215cd4] transition-colors">${order.product}</h4>
                <p class="text-xs text-gray-500 mt-0.5">${order.dateLabel}</p>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold ${getStatusTextColor(order.status)}">
                  <span class="w-2 h-2 rounded-full ${getStatusDotClass(order.status)}"></span>
                  ${getStatusLabel(order.status)}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Bottom Nav -->
      ${renderBottomNav('transactions')}
    </div>
  `;
}

// -------------------------------------------------------------
// Screen: Staff Counter UI (Directly Articulating the Figma Flow Notes)
// "makita tanan active", "makita tanan ready to claim", "makita tanan claimed", "inactive"
// -------------------------------------------------------------
function renderStaffScreen() {
  const filter = state.staffFilter;
  return `
    <div class="flex flex-col min-h-[780px] bg-slate-900 text-slate-100 p-5 select-none font-sans">
      <!-- Staff Terminal Header -->
      <header class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1">
            <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-full h-full object-contain">
          </div>
          <div>
            <h1 class="text-sm font-bold text-white tracking-wide">Lily’s Hub Staff Terminal</h1>
            <p class="text-[10px] text-slate-400 font-mono">Counter Desk #01 • Operator: STAFF-0488</p>
          </div>
        </div>

        <button 
          type="button" 
          onclick="setRoleMode('user')"
          class="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        >
          Exit to App
        </button>
      </header>

      <!-- Real-Time Search Box (Figma Flow Requirement) -->
      <div class="mt-4">
        <label for="staff-search-input" class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Search Key or Waybill Barcode</label>
        <div class="flex items-center gap-2">
          <input 
            type="text" 
            id="staff-search-input" 
            aria-label="Staff Search Key or Waybill"
            value="${state.staffSearchQuery}"
            oninput="handleStaffSearch(this.value)"
            placeholder="Type key (e.g. PH-402-5544) or tracking ID..." 
            class="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#215cd4]"
          >
          <button 
            type="button" 
            onclick="simulateStaffBarcodeScan()"
            class="px-3 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-semibold shrink-0 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Scan Barcode
          </button>
          ${state.staffSearchQuery ? `
            <button 
              type="button" 
              onclick="clearStaffSearch()"
              class="px-2 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold shrink-0"
              title="Clear Search"
            >
              ✕
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Figma Navigation Tabs -->
      <div class="grid grid-cols-4 gap-1.5 mt-4 text-center">
        <button 
          type="button" 
          onclick="setStaffFilter('active')"
          class="py-2 px-1 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${filter === 'active' ? 'bg-[#215cd4] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
        >
          Active
        </button>
        <button 
          type="button" 
          onclick="setStaffFilter('ready_to_claim')"
          class="py-2 px-1 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${filter === 'ready_to_claim' ? 'bg-[#10b780] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
        >
          Ready
        </button>
        <button 
          type="button" 
          onclick="setStaffFilter('inactive')"
          class="py-2 px-1 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${filter === 'inactive' ? 'bg-[#c58b12] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
        >
          Unpaid
        </button>
        <button 
          type="button" 
          onclick="setStaffFilter('claimed')"
          class="py-2 px-1 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${filter === 'claimed' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}"
        >
          Claimed
        </button>
      </div>

      <!-- Tab Content List -->
      <div id="staff-orders-list" class="mt-4 flex-1 overflow-y-auto space-y-3">
        ${renderStaffOrderItems()}
      </div>

      <!-- Payout Rule Banner (from Figma Note) -->
      <div class="mt-4 p-3 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-400 leading-tight">
        <strong class="text-slate-200">Rider Payout Policy Invariant:</strong> Amount paid to rider must strictly match the exact retail COD price. Any customer deposit excess is strictly change and never used as buffer.
      </div>
    </div>
  `;
}

function renderStaffOrderItems() {
  const filter = state.staffFilter;
  const q = state.staffSearchQuery.toLowerCase();
  let list = [];

  if (filter === 'active') {
    list = state.orders.filter(o => o.status === 'AWAITING_PARCEL');
  } else if (filter === 'ready_to_claim') {
    list = state.orders.filter(o => o.status === 'READY_TO_CLAIM');
  } else if (filter === 'claimed') {
    list = state.orders.filter(o => o.status === 'CLAIMED');
  } else if (filter === 'inactive') {
    list = state.orders.filter(o => o.status === 'PAYMENT_REQUIRED');
  }

  if (q) {
    list = list.filter(o => 
      o.id.toLowerCase().includes(q) ||
      o.alphanumericKey.toLowerCase().includes(q) ||
      o.trackingNumber.toLowerCase().includes(q) ||
      o.product.toLowerCase().includes(q) ||
      o.recipient.toLowerCase().includes(q) ||
      o.envelopeNumber.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    return `
      <div class="py-12 text-center text-xs text-slate-500">
        ${q ? `No orders found matching "${state.staffSearchQuery}".` : 'No orders in this category.'}
      </div>
    `;
  }

  return list.map(order => `
    <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-mono font-bold text-blue-400">${order.id} • ${order.alphanumericKey}</span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">Env: ${order.envelopeNumber}</span>
      </div>

      <h3 class="text-sm font-bold text-white">${order.product}</h3>
      <p class="text-xs text-slate-400">Recipient: ${order.recipient} • COD: <span class="text-white font-mono font-bold">${order.codAmount}</span></p>

      <div class="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
        ${filter === 'inactive' ? `
          <button 
            type="button" 
            onclick="staffAcceptPayment('${order.id}')"
            class="flex-1 py-2 rounded-xl bg-[#c58b12] hover:bg-amber-600 text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Receive Cash &amp; Activate
          </button>
        ` : ''}

        ${filter === 'active' ? `
          <button 
            type="button" 
            onclick="staffReceiveCourier('${order.id}')"
            class="flex-1 py-2 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Log Courier Arrival (1:1 Payout)
          </button>
        ` : ''}

        ${filter === 'ready_to_claim' ? `
          <button 
            type="button" 
            onclick="staffReleaseParcel('${order.id}')"
            class="flex-1 py-2 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
          >
            Verify Key &amp; Handover
          </button>
        ` : ''}

        ${filter === 'claimed' ? `
          <span class="text-xs text-emerald-400 font-mono font-semibold">✔ Completed with Change ${order.change}</span>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Component: Bottom Floating Navigation Bar
// Uses inline currentColor SVGs with active tab indicators
// -------------------------------------------------------------
const navHomeSvg = `<svg width="22" height="22" viewBox="0 0 110 104" fill="none" class="w-5 h-5"><path d="M3 52.516L50.7547 4.756C53.1013 2.41467 56.8987 2.41467 59.24 4.756L107 52.516M15 40.516V94.516C15 97.828 17.688 100.516 21 100.516H43V74.516C43 71.204 45.688 68.516 49 68.516H61C64.312 68.516 67 71.204 67 74.516V100.516H89C92.312 100.516 95 97.828 95 94.516V40.516M35 100.516H79" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const navOrdersSvg = `<svg width="22" height="22" viewBox="0 0 94 110" fill="none" class="w-5 h-5"><path d="M31 55H51M31 71H51M31 87H51M67 91H79C82.1826 91 85.2348 89.7357 87.4853 87.4853C89.7357 85.2348 91 82.1826 91 79V23.576C91 17.5227 86.4933 12.3867 80.4613 11.8853C78.4666 11.7199 76.47 11.5777 74.472 11.4587M43.5333 11.4587C44.2908 9.00906 45.8127 6.86632 47.8761 5.34421C49.9394 3.8221 52.436 3.0006 55 3H63C68.3973 3 72.9627 6.56267 74.472 11.4587C74.8259 12.6058 75.0004 13.7995 75 15C75 16.0609 74.5786 17.0783 73.8284 17.8284C73.0783 18.5786 72.0609 19 71 19H47C44.792 19 43 17.208 43 15C43 13.768 43.1867 12.5787 43.5333 11.4587ZM43.5333 11.4587C41.528 11.5813 39.5333 11.7253 37.5387 11.8853C31.5067 12.3867 27 17.5227 27 23.576V35M27 35H9C5.688 35 3 37.688 3 41V101C3 104.312 5.688 107 9 107H61C64.312 107 67 104.312 67 101V41C67 37.688 64.312 35 61 35H27ZM19 55H19.0427V55.0427H19V55ZM19 71H19.0427V71.0427H19V71ZM19 87H19.0427V87.0427H19V87Z" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const navHelpSvg = `<svg width="22" height="22" viewBox="0 0 102 102" fill="none" class="w-5 h-5"><path d="M39.688 27.1013C45.9333 21.6347 56.0667 21.6347 62.312 27.1013C68.5627 32.568 68.5627 41.432 62.312 46.8987C61.2293 47.8533 60.0187 48.6373 58.7387 49.256C54.7653 51.1813 51.0053 54.584 51.0053 59V63M99 51C99 57.3035 97.7585 63.5452 95.3462 69.3688C92.934 75.1924 89.3983 80.4839 84.9411 84.9411C80.4839 89.3983 75.1924 92.934 69.3688 95.3462C63.5452 97.7585 57.3035 99 51 99C44.6966 99 38.4548 97.7585 32.6312 95.3462C26.8076 92.934 21.5161 89.3983 17.0589 84.9411C12.6017 80.4839 9.06601 75.1924 6.65378 69.3688C4.24156 63.5452 3 57.3035 3 51C3 38.2696 8.05713 26.0606 17.0589 17.0589C26.0606 8.05713 38.2696 3 51 3C63.7304 3 75.9394 8.05713 84.9411 17.0589C93.9429 26.0606 99 38.2696 99 51ZM51 79H51.0427V79.0427H51V79Z" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const navProfileSvg = `<svg width="22" height="22" viewBox="0 0 86 110" fill="none" class="w-5 h-5"><path d="M62.9947 23C62.9947 28.3043 60.8875 33.3914 57.1368 37.1421C53.3861 40.8929 48.299 43 42.9947 43C37.6903 43 32.6033 40.8929 28.8525 37.1421C25.1018 33.3914 22.9947 28.3043 22.9947 23C22.9947 17.6957 25.1018 12.6086 28.8525 8.85786C32.6033 5.10714 37.6903 3 42.9947 3C48.299 3 53.3861 5.10714 57.1368 8.85786C60.8875 12.6086 62.9947 17.6957 62.9947 23ZM3 98.296C3.17139 87.8019 7.46047 77.7955 14.9423 70.4349C22.4241 63.0743 32.4991 58.9492 42.9947 58.9492C53.4902 58.9492 63.5653 63.0743 71.0471 70.4349C78.5289 77.7955 82.818 87.8019 82.9893 98.296C70.4421 104.049 56.7981 107.019 42.9947 107C28.7227 107 15.176 103.885 3 98.296Z" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderBottomNav(activeTab = 'home') {
  return `
    <nav class="sticky bottom-4 left-4 right-4 mx-2 h-16 rounded-full bg-white/95 floating-nav flex items-center justify-around px-5 border border-gray-100 z-30 shadow-lg" aria-label="Bottom Navigation">
      <button 
        type="button" 
        onclick="navigateTo('home')" 
        class="relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${activeTab === 'home' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'}"
        aria-label="Home"
      >
        ${navHomeSvg}
        ${activeTab === 'home' ? '<span class="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5"></span>' : '<span class="w-1.5 h-1.5 mt-0.5 opacity-0"></span>'}
      </button>

      <button 
        type="button" 
        onclick="navigateTo('transactions')" 
        class="relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4] ${activeTab === 'transactions' ? 'text-[#215cd4]' : 'text-gray-400 hover:text-gray-600'}"
        aria-label="Transactions History"
      >
        ${navOrdersSvg}
        ${activeTab === 'transactions' ? '<span class="w-1.5 h-1.5 rounded-full bg-[#215cd4] mt-0.5"></span>' : '<span class="w-1.5 h-1.5 mt-0.5 opacity-0"></span>'}
      </button>

      <button 
        type="button" 
        onclick="openEscrowPolicyModal()" 
        class="relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        aria-label="Hub Information and Policy"
      >
        ${navHelpSvg}
        <span class="w-1.5 h-1.5 mt-0.5 opacity-0"></span>
      </button>

      <button 
        type="button" 
        onclick="showToast('Customer Account: Nyeowsz')" 
        class="relative flex flex-col items-center justify-center p-2 rounded-full transition-all hover:scale-110 active:scale-95 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#215cd4]"
        aria-label="Customer Profile"
      >
        ${navProfileSvg}
        <span class="w-1.5 h-1.5 mt-0.5 opacity-0"></span>
      </button>
    </nav>
  `;
}

// -------------------------------------------------------------
// Helper Status Formatters
// -------------------------------------------------------------
function getStatusLabel(status) {
  switch (status) {
    case 'READY_TO_CLAIM': return 'Ready to Claim';
    case 'AWAITING_PARCEL': return 'Awaiting Parcel';
    case 'PAYMENT_REQUIRED': return 'Payment Required';
    case 'CLAIMED': return 'Claimed';
    default: return status;
  }
}

function getStatusTextColor(status) {
  switch (status) {
    case 'READY_TO_CLAIM': return 'text-[#10b780]';
    case 'AWAITING_PARCEL': return 'text-[#215cd4]';
    case 'PAYMENT_REQUIRED': return 'text-[#c58b12]';
    case 'CLAIMED': return 'text-gray-500';
    default: return 'text-gray-900';
  }
}

function getStatusDotClass(status) {
  switch (status) {
    case 'READY_TO_CLAIM': return 'bg-[#10b780] pulse-green';
    case 'AWAITING_PARCEL': return 'bg-[#215cd4] pulse-blue';
    case 'PAYMENT_REQUIRED': return 'bg-[#c58b12] pulse-gold';
    case 'CLAIMED': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
}

function getStatusHeroBadgeClass(status) {
  switch (status) {
    case 'READY_TO_CLAIM': return 'bg-[#10b780]/20 text-[#10b780] border border-[#10b780]/30';
    case 'AWAITING_PARCEL': return 'bg-[#215cd4]/20 text-blue-400 border border-[#215cd4]/30';
    case 'PAYMENT_REQUIRED': return 'bg-[#c58b12]/20 text-amber-300 border border-[#c58b12]/30';
    case 'CLAIMED': return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  }
}

// -------------------------------------------------------------
// Interactive Event Handlers
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

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.add('border-[#215cd4]', 'bg-blue-50/50');
  }
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-[#215cd4]', 'bg-blue-50/50');
  }
}

function handleDropReceipt(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.classList.remove('border-[#215cd4]', 'bg-blue-50/50');
  }
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    const file = dt.files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        state.draftOrder.receiptUri = evt.target.result;
        showToast('Receipt image loaded via drag & drop!');
        navigateTo('confirm_order');
      };
      reader.readAsDataURL(file);
    } else {
      showToast('Please drop a valid image file (PNG, JPG, WebP).');
    }
  }
}

function loadSampleReceipt() {
  state.draftOrder.receiptUri = './assets/receipt_screenshot.png';
  showToast('Sample Shopee receipt attached & OCR parsed!');
  navigateTo('confirm_order');
}

function submitCreatedOrder() {
  const check = document.getElementById('confirm-details-checkbox');
  if (check && !check.checked) {
    showToast('Please check the confirmation box to proceed.');
    return;
  }

  // Read latest input values directly from DOM
  const prodInput = document.getElementById('draft-product')?.value || state.draftOrder.product;
  const recipInput = document.getElementById('draft-recipient')?.value || state.draftOrder.recipient;
  const amtInput = document.getElementById('draft-amount')?.value || state.draftOrder.totalAmount;
  const trackInput = document.getElementById('draft-tracking')?.value || state.draftOrder.trackingId;

  // Calculate change: assuming customer tenders nearest clean cash amount
  let numericAmt = parseInt(amtInput.replace(/[^\d]/g, ''), 10) || 480;
  let depositAmount = Math.ceil(numericAmt / 100) * 100;
  if (depositAmount === numericAmt) depositAmount += 100; // minimum bill change
  let changeAmount = depositAmount - numericAmt;

  const randomNum = Math.floor(100 + Math.random() * 900);
  const newOrder = {
    id: `ORD-${randomNum}`,
    product: prodInput || 'VXE R1 Nearlink Wireless Mouse',
    recipient: recipInput || 'John Doe',
    paidAmount: `₱${depositAmount.toLocaleString()}`,
    codAmount: amtInput.startsWith('₱') ? amtInput : `₱${numericAmt.toLocaleString()}`,
    change: `₱${changeAmount.toLocaleString()}`,
    trackingNumber: trackInput || 'PH2696153366792H',
    refCode: `0001-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    alphanumericKey: `PH-${randomNum}-${Math.floor(1000 + Math.random() * 9000)}`,
    envelopeNumber: `ENV-${randomNum}`,
    status: 'PAYMENT_REQUIRED',
    orderPlacedTime: 'Just now',
    awaitingParcelTime: null,
    readyToClaimTime: null,
    claimedTime: null,
    dateLabel: 'Today, Just now',
    carrier: 'ShopeeXpress (SPX)',
    hubLocation: "Lily's Catering Hub • Yati, Liloan, Cebu"
  };

  state.orders.unshift(newOrder);
  state.selectedOrderId = newOrder.id;
  state.hasOrders = true;

  navigateTo('payment_verification');
  showToast('Order registered! Complete counter deposit to activate.');
}

function handleInitiateClaimClick() {
  const check = document.getElementById('claim-confirm-check');
  if (check && !check.checked) {
    showToast('Please check the confirmation box before initiating claim.');
    return;
  }
  openMpinModal();
}

function saveQrPhoto() {
  showToast('Counter QR & Reference Key saved to device gallery!');
}

function toggleNotificationPill() {
  state.notificationActive = !state.notificationActive;
  showToast(state.notificationActive ? 'Push notifications enabled for ParcelHub!' : 'Notifications muted.');
  renderApp();
}

function setTransactionFilter(filter) {
  state.transactionFilter = filter;
  renderApp();
}

function setStaffFilter(filter) {
  state.staffFilter = filter;
  renderApp();
}

function handleStaffSearch(query) {
  state.staffSearchQuery = query;
  const staffListContainer = document.getElementById('staff-orders-list');
  if (staffListContainer) {
    staffListContainer.innerHTML = renderStaffOrderItems();
  }
}

function clearStaffSearch() {
  state.staffSearchQuery = '';
  const input = document.getElementById('staff-search-input');
  if (input) input.value = '';
  handleStaffSearch('');
}

function copyToClipboard(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard: ${text}`);
    }).catch(() => {
      fallbackCopy(text, label);
    });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(`${label} copied to clipboard: ${text}`);
  } catch (e) {
    showToast(`${label}: ${text}`);
  }
  document.body.removeChild(ta);
}

// Active Ping Timer Controller
function startPingTimer() {
  stopPingTimer();
  state.pingCountdown = 298; // 04:58
  updatePingTimerDisplay();
  state.timerInterval = setInterval(() => {
    if (state.pingCountdown > 0) {
      state.pingCountdown--;
      updatePingTimerDisplay();
    } else {
      stopPingTimer();
      updatePingTimerDisplay();
    }
  }, 1000);
}

function stopPingTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function resetPingTimer() {
  startPingTimer();
  showToast('Counter ping renewed! Active for next 5:00 minutes.');
}

function updatePingTimerDisplay() {
  const el = document.getElementById('ping-timer-display');
  if (!el) return;
  const m = Math.floor(state.pingCountdown / 60);
  const s = state.pingCountdown % 60;
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (state.pingCountdown === 0) {
    el.innerHTML = `<span class="text-[#ef4444] font-bold">00:00 (Expired)</span>`;
  } else {
    el.textContent = formatted;
  }
}

// Interactive Simulations for Evaluation
function simulateStaffFlow() {
  const order = getCurrentOrder();
  if (order.status === 'PAYMENT_REQUIRED') {
    order.status = 'AWAITING_PARCEL';
    order.awaitingParcelTime = 'Just now';
    showToast('Counter cash deposit confirmed! Order status: Awaiting Parcel');
  } else if (order.status === 'AWAITING_PARCEL') {
    order.status = 'READY_TO_CLAIM';
    order.readyToClaimTime = 'Just now';
    showToast('Courier package received! Order status: Ready to Claim');
  } else if (order.status === 'READY_TO_CLAIM') {
    openMpinModal();
  }
  renderApp();
}

function simulateStaffBarcodeScan() {
  const currentOrder = getCurrentOrder();
  state.staffSearchQuery = currentOrder.trackingNumber || 'PH2696153366792H';
  const input = document.getElementById('staff-search-input');
  if (input) input.value = state.staffSearchQuery;
  handleStaffSearch(state.staffSearchQuery);
  showToast(`Barcode Scanner matched: ${state.staffSearchQuery} (${currentOrder.product})`);
}

function staffAcceptPayment(orderId) {
  const ord = state.orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = 'AWAITING_PARCEL';
    ord.awaitingParcelTime = 'Just now';
    showToast(`Cash deposit received for ${ord.id}. Order is active and awaiting parcel delivery.`);
    renderApp();
  }
}

function staffReceiveCourier(orderId) {
  const ord = state.orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = 'READY_TO_CLAIM';
    ord.readyToClaimTime = 'Just now';
    showToast(`Courier payment verified (${ord.codAmount}). Parcel ready for pickup!`);
    renderApp();
  }
}

function staffReleaseParcel(orderId) {
  const ord = state.orders.find(o => o.id === orderId);
  if (ord) {
    ord.status = 'CLAIMED';
    ord.claimedTime = 'Just now';
    showToast(`Key verified! Handed parcel and change (${ord.change}) to customer.`);
    renderApp();
  }
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
  state.mpinInput = '';
  updateMpinDots();
  const modal = document.getElementById('mpin-modal');
  if (modal) modal.classList.add('hidden');
}

function enterMpin(digit) {
  if (state.mpinInput.length < 6) {
    state.mpinInput += digit;
    updateMpinDots();

    if (state.mpinInput.length === 6) {
      setTimeout(verifyAndCommitClaim, 280);
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
    order.claimedTime = 'Today, Just now';
    // Preserve actual calculated change instead of hardcoding ₱20
    if (!order.change || order.change === 'To Be Determined') {
      order.change = '₱20';
    }
  }
  state.mpinInput = '';
  updateMpinDots();
  renderApp();
  showToast(`MPIN Authorized! Parcel claimed & change (${order?.change || '₱0'}) returned.`);
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
// Counter Policy & Information Modal
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
    if (state.activeScreen === 'staff_ui') {
      screenSelect.value = 'figma-staff';
    } else if (state.activeScreen === 'home') {
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
  // Listen for keyboard input on MPIN when modal is open
  window.addEventListener('keydown', (e) => {
    const mpinModal = document.getElementById('mpin-modal');
    if (mpinModal && !mpinModal.classList.contains('hidden')) {
      if (e.key >= '0' && e.key <= '9') {
        enterMpin(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteMpin();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeMpinModal();
      }
    }
  });
}
