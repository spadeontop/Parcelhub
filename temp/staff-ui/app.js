/**
 * ParcelHub Staff Terminal UI - Standalone Prototype Controller
 * Modernized with Plus Jakarta Sans typography, thumb-accessible Scan QR FAB,
 * simplified showcase card list, and dedicated Inner Order Details & Actions modal.
 */

(function () {
  'use strict';

  // Initial Seed Orders
  const INITIAL_ORDERS = [
    {
      id: 'ORD-408',
      alphanumericKey: 'PH-408-8899',
      notes: 'Fragile electronics. Priority intake requested.',
      product: 'Poco X6 Pro',
      recipient: 'John Doe',
      paidAmount: '₱12,500',
      codAmount: '₱12,450',
      change: '₱50',
      trackingNumber: 'PH2696153366792H',
      status: 'AWAITING_PARCEL', // Active
      courierPaid: false,
      parcelImageUrl: null,
      claimInitiatedAt: null,
    },
    {
      id: 'ORD-402',
      alphanumericKey: 'PH-402-5544',
      notes: 'Customer notified via SMS. Ready for counter pickup.',
      product: 'VXE R1 Nearlink',
      recipient: 'John Doe',
      paidAmount: '₱500',
      codAmount: '₱480',
      change: '₱20',
      trackingNumber: 'PH992817263544R',
      status: 'READY_TO_CLAIM', // Ready
      courierPaid: true,
      parcelImageUrl: './assets/receipt_thumbnail.png',
      claimInitiatedAt: null, // Locked until customer prompts
    },
    {
      id: 'ORD-883',
      alphanumericKey: 'PH-883-9044',
      notes: 'Counter deposit pending.',
      product: 'VXE R1 Nearlink Wireless Mouse',
      recipient: 'John Doe',
      paidAmount: '',
      codAmount: '₱480',
      statedFee: 500,
      change: 'To Be Determined',
      trackingNumber: 'PH883904421101N',
      status: 'PAYMENT_REQUIRED', // Unpaid
      courierPaid: false,
      parcelImageUrl: null,
      claimInitiatedAt: null,
    },
    {
      id: 'ORD-388',
      alphanumericKey: 'PH-388-1122',
      notes: 'Handover complete. Validated with government ID.',
      product: 'Keychron K2 Pro Mechanical Keyboard',
      recipient: 'John Doe',
      paidAmount: '₱4,200',
      codAmount: '₱4,200',
      change: '₱0',
      trackingNumber: 'PH388112299000K',
      status: 'CLAIMED', // Claimed
      courierPaid: true,
      parcelImageUrl: './assets/receipt_thumbnail.png',
      claimInitiatedAt: null,
    },
    {
      id: 'ORD-719',
      alphanumericKey: 'PH-719-4455',
      notes: '',
      product: 'Sony WH-1000XM5 Headphones',
      recipient: 'Maria Santos',
      paidAmount: '₱16,000',
      codAmount: '₱15,800',
      change: '₱200',
      trackingNumber: 'PH719445588312S',
      status: 'AWAITING_PARCEL', // Active - already courier paid demo
      courierPaid: true,
      parcelImageUrl: './assets/receipt_thumbnail.png',
      claimInitiatedAt: null,
    }
  ];

  // App State
  let orders = INITIAL_ORDERS;
  try {
    const saved = localStorage.getItem('parcelhub_staff_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        orders = parsed.map(o => {
          if (typeof o.notes !== 'string') {
            o.notes = '';
          }
          delete o.envelopeNumber;
          return o;
        });
      }
    }
  } catch (e) {
    orders = INITIAL_ORDERS;
  }

  let currentFilter = 'active'; // 'active' | 'ready_to_claim' | 'inactive' | 'claimed'
  let searchQuery = '';
  let attachedPhotos = {};
  let cashInputs = {};
  let selectedOrderId = null;
  let countdownTimer = null;
  let cameraStream = null;
  let currentTheme = 'dark';
  let currentDock = 'bottom';

  // DOM Elements
  const appBody = document.getElementById('app-body');
  const deviceContainerEl = document.getElementById('device-container');
  const ordersListEl = document.getElementById('staff-orders-list');
  const searchInputEl = document.getElementById('staff-search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const headerSearchBtn = document.getElementById('header-search-btn');
  const floatingScanQrBtn = document.getElementById('floating-scan-qr-btn');
  const qrScannerModalEl = document.getElementById('qr-scanner-modal');
  const closeScannerBtn = document.getElementById('close-scanner-btn');
  const returnBackLinkBtn = document.getElementById('return-back-link-btn');
  const toastContainerEl = document.getElementById('toast-container');
  const toastMsgEl = document.getElementById('toast-message');

  // Dedicated Inner Order Details Modal Elements
  const orderDetailsModalEl = document.getElementById('order-details-modal');
  const orderDetailsContentEl = document.getElementById('order-details-content');
  const closeOrderDetailsBtn = document.getElementById('close-order-details-btn');
  const detailHeaderOrderId = document.getElementById('detail-header-order-id');
  const detailHeaderBadge = document.getElementById('detail-header-badge');

  const bottomFilterBar = document.getElementById('bottom-filter-bar');
  const topFilterBar = document.getElementById('top-filter-bar');

  // Camera elements in scanner modal
  const cameraVideoEl = document.getElementById('camera-video');
  const manualScanInputEl = document.getElementById('manual-scan-input');
  const manualScanBtn = document.getElementById('manual-scan-btn');
  const qrFileInputEl = document.getElementById('qr-file-input');
  const sampleScanBtn = document.getElementById('sample-scan-btn');
  const toggleWebcamBtn = document.getElementById('toggle-webcam-btn');

  // Reviewer Viewport & Mode togglers
  const viewToggleButtons = document.querySelectorAll('[data-view-mode]');
  const themeToggleButtons = document.querySelectorAll('[data-theme-btn]');
  const dockToggleButtons = document.querySelectorAll('[data-dock-btn]');

  // Helpers
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatOrderId(id) {
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
  }

  function saveOrders() {
    try {
      localStorage.setItem('parcelhub_staff_orders', JSON.stringify(orders));
    } catch (e) {}
  }

  function getStatedFee(order) {
    if (!order) return 500;
    if (order.statedFee) return order.statedFee;
    const paid = parseInt((order.paidAmount || '').replace(/[^\d]/g, ''), 10);
    if (!isNaN(paid) && paid > 0) return paid;
    const cod = parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10);
    return !isNaN(cod) && cod > 0 ? cod : 500;
  }

  function showToast(message) {
    if (!toastContainerEl || !toastMsgEl) return;
    toastMsgEl.textContent = message;
    toastContainerEl.classList.remove('hidden', 'translate-y-4', 'opacity-0');
    toastContainerEl.classList.add('translate-y-0', 'opacity-100');

    clearTimeout(toastContainerEl._timer);
    toastContainerEl._timer = setTimeout(() => {
      toastContainerEl.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toastContainerEl.classList.add('hidden'), 250);
    }, 3200);
  }

  function getBadgeCounts() {
    return {
      active: orders.filter(o => o.status === 'AWAITING_PARCEL').length,
      ready_to_claim: orders.filter(o => o.status === 'READY_TO_CLAIM').length,
      inactive: orders.filter(o => o.status === 'PAYMENT_REQUIRED').length,
      claimed: orders.filter(o => o.status === 'CLAIMED').length,
    };
  }

  function updateBadgeCounts() {
    const counts = getBadgeCounts();
    document.querySelectorAll('[data-badge="active"], #badge-active').forEach(el => el.textContent = counts.active);
    document.querySelectorAll('[data-badge="ready_to_claim"], #badge-ready').forEach(el => el.textContent = counts.ready_to_claim);
    document.querySelectorAll('[data-badge="inactive"], #badge-unpaid').forEach(el => el.textContent = counts.inactive);
    document.querySelectorAll('[data-badge="claimed"], #badge-claimed').forEach(el => el.textContent = counts.claimed);
  }

  function getStatusInfo(status) {
    switch (status) {
      case 'AWAITING_PARCEL':
        return {
          label: 'Active',
          badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          dotClass: 'bg-blue-400 animate-pulse',
          actionHint: 'Details'
        };
      case 'READY_TO_CLAIM':
        return {
          label: 'Ready',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
          actionHint: 'Details'
        };
      case 'PAYMENT_REQUIRED':
        return {
          label: 'Unpaid',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dotClass: 'bg-amber-400',
          actionHint: 'Details'
        };
      case 'CLAIMED':
        return {
          label: 'Claimed',
          badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/50',
          dotClass: 'bg-slate-400',
          actionHint: 'Details'
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          dotClass: 'bg-slate-400',
          actionHint: 'Details'
        };
    }
  }

  // Filter Tabs
  function setFilter(filterId) {
    currentFilter = filterId;
    document.querySelectorAll('[data-filter-tab]').forEach(btn => {
      const id = btn.getAttribute('data-filter-tab');
      if (id === currentFilter) {
        btn.classList.add('bg-[#215cd4]', 'text-white', 'shadow-md');
        btn.classList.remove('bg-slate-800', 'text-slate-400', 'hover:bg-slate-700');
        if (id === 'ready_to_claim') {
          btn.classList.add('bg-[#10b780]');
          btn.classList.remove('bg-[#215cd4]');
        } else if (id === 'inactive') {
          btn.classList.add('bg-[#c58b12]');
          btn.classList.remove('bg-[#215cd4]');
        } else if (id === 'claimed') {
          btn.classList.add('bg-slate-700');
          btn.classList.remove('bg-[#215cd4]');
        }
      } else {
        btn.classList.remove('bg-[#215cd4]', 'bg-[#10b780]', 'bg-[#c58b12]', 'bg-slate-700', 'text-white', 'shadow-md');
        btn.classList.add('bg-slate-800', 'text-slate-400', 'hover:bg-slate-700');
      }
    });
    renderOrders();
  }

  // Render Orders List (Simplified Showcase Cards)
  function renderOrders() {
    updateBadgeCounts();

    let list = [];
    if (currentFilter === 'active') {
      list = orders.filter(o => o.status === 'AWAITING_PARCEL');
    } else if (currentFilter === 'ready_to_claim') {
      list = orders.filter(o => o.status === 'READY_TO_CLAIM');
    } else if (currentFilter === 'claimed') {
      list = orders.filter(o => o.status === 'CLAIMED');
    } else if (currentFilter === 'inactive') {
      list = orders.filter(o => o.status === 'PAYMENT_REQUIRED');
    }

    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');
    if (q) {
      list = list.filter(o => {
        const id = o.id.toLowerCase();
        const key = o.alphanumericKey.toLowerCase();
        const cleanKey = key.replace(/[^a-z0-9]/g, '');
        const track = o.trackingNumber.toLowerCase();
        const prod = o.product.toLowerCase();
        const rec = o.recipient.toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        return (
          id.includes(q) ||
          key.includes(q) ||
          cleanKey.includes(cleanQ) ||
          track.includes(q) ||
          prod.includes(q) ||
          rec.includes(q) ||
          notes.includes(q)
        );
      });
    }

    if (list.length === 0) {
      // Find cross-tab matches
      const crossTabMatches = q
        ? orders.filter(o => {
            const id = o.id.toLowerCase();
            const key = o.alphanumericKey.toLowerCase();
            const cleanKey = key.replace(/[^a-z0-9]/g, '');
            const track = o.trackingNumber.toLowerCase();
            const prod = o.product.toLowerCase();
            const rec = o.recipient.toLowerCase();
            const notes = (o.notes || '').toLowerCase();
            return (
              id.includes(q) ||
              key.includes(q) ||
              cleanKey.includes(cleanQ) ||
              track.includes(q) ||
              prod.includes(q) ||
              rec.includes(q) ||
              notes.includes(q)
            );
          })
        : [];

      let crossTabHtml = '';
      if (crossTabMatches.length > 0) {
        crossTabHtml = `
          <div class="mt-4 pt-3 border-t border-slate-700/60 text-center">
            <p class="text-xs font-semibold text-slate-300">Found in another category:</p>
            <div class="flex flex-wrap justify-center gap-2 mt-2.5">
              ${crossTabMatches.map(m => {
                const targetFilter =
                  m.status === 'PAYMENT_REQUIRED' ? 'inactive' :
                  m.status === 'AWAITING_PARCEL' ? 'active' :
                  m.status === 'READY_TO_CLAIM' ? 'ready_to_claim' : 'claimed';
                const label =
                  m.status === 'PAYMENT_REQUIRED' ? 'Unpaid' :
                  m.status === 'AWAITING_PARCEL' ? 'Active' :
                  m.status === 'READY_TO_CLAIM' ? 'Ready' : 'Claimed';
                return `
                  <button type="button" class="view-crosstab-btn px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm" data-target-filter="${targetFilter}">
                    View <strong>${m.id}</strong> in ${label} tab &rarr;
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      ordersListEl.innerHTML = `
        <div class="py-12 px-4 text-center rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
          <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p class="text-sm font-semibold text-slate-300">
            ${searchQuery ? `No parcels found matching "${escapeHtml(searchQuery)}"` : 'No parcels in this tab.'}
          </p>
          <p class="text-xs text-slate-500">
            ${searchQuery ? 'Try searching a different order ID or customer name.' : 'Use the Scan QR button or search bar above to look up orders.'}
          </p>
          ${crossTabHtml}
        </div>
      `;

      ordersListEl.querySelectorAll('.view-crosstab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget.getAttribute('data-target-filter');
          setFilter(target);
        });
      });
      return;
    }

    // Render Clean Showcase Cards (Simplified overview only, no cluttered inline action buttons)
    ordersListEl.innerHTML = list.map(order => {
      const statusInfo = getStatusInfo(order.status);
      const isUnpaid = order.status === 'PAYMENT_REQUIRED';
      const fee = getStatedFee(order);
      const displayAmount = isUnpaid ? `Fee: ₱${fee.toLocaleString()}` : `COD: ${order.codAmount}`;

      return `
        <div
          class="terminal-card group p-3.5 rounded-2xl bg-slate-800/85 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-150 space-y-2.5 active:scale-[0.99] select-none"
          data-open-order="${order.id}"
          id="card-${order.id}"
          tabindex="0"
          role="button"
          aria-label="View complete details and actions for ${order.id}"
        >
          <!-- Top Row: Status Badge, Order ID, and Display Amount -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}"></span>
                ${statusInfo.label}
              </span>
              <span class="text-xs font-mono font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                ${order.id}
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-white font-mono-numbers">${displayAmount}</span>
            </div>
          </div>

          <!-- Middle Row: Product Title & Tracking Number -->
          <div>
            <h3 class="text-sm font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-1 leading-snug">
              ${escapeHtml(order.product)}
            </h3>
            <div class="flex items-center justify-between gap-2 mt-1">
              <span class="text-[11px] font-mono text-blue-400 font-mono-numbers flex items-center gap-1">
                <svg class="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                ${escapeHtml(order.trackingNumber)}
              </span>
              ${order.notes ? `
                <span class="text-[10px] text-amber-300 font-medium flex items-center gap-1 truncate max-w-[150px]" title="Staff Note: ${escapeHtml(order.notes)}">
                  <svg class="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                    <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
                  </svg>
                  <span class="truncate">${escapeHtml(order.notes)}</span>
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Bottom Row: Recipient & Action Prompt Affordance -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
            <div class="flex items-center gap-1.5 text-slate-300">
              <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-[11px] font-medium text-slate-300">${order.recipient}</span>
            </div>
            <div class="flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
              <span>${statusInfo.actionHint}</span>
              <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind Tap / Click to open Inner Order Details & Actions
    ordersListEl.querySelectorAll('[data-open-order]').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-open-order');
        openOrderDetails(id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = card.getAttribute('data-open-order');
          openOrderDetails(id);
        }
      });
    });
  }

  // Open & Close Dedicated Inner Order Details & Actions Modal
  function openOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    selectedOrderId = orderId;

    if (orderDetailsModalEl) {
      orderDetailsModalEl.classList.remove('hidden');
    }
    if (orderDetailsContentEl) {
      orderDetailsContentEl.scrollTop = 0;
    }
    renderOrderDetailsContent(order);
  }

  function closeOrderDetails() {
    selectedOrderId = null;
    if (orderDetailsModalEl) {
      orderDetailsModalEl.classList.add('hidden');
    }
    renderOrders();
  }

  // Render Inner Details & Actions View Content
  function renderOrderDetailsContent(order) {
    if (!orderDetailsContentEl || !order) return;

    const statusInfo = getStatusInfo(order.status);
    const fee = getStatedFee(order);

    // Format Order ID as XXX - XXX (e.g. ORD - 408)
    const formattedOrderId = formatOrderId(order.id);

    if (detailHeaderOrderId) detailHeaderOrderId.textContent = formattedOrderId;
    if (detailHeaderBadge) {
      detailHeaderBadge.textContent = statusInfo.label;
      detailHeaderBadge.className = `px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`;
    }

    // Build Operational Action Box based on Status
    let actionsHtml = '';

    if (order.status === 'PAYMENT_REQUIRED') {
      const entered = cashInputs[order.id] ?? '';
      const numEntered = parseInt(entered, 10);
      const isValid = !isNaN(numEntered) && numEntered >= fee;
      const codNum = parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) || 0;
      const previewChange = isValid ? Math.max(0, numEntered - codNum) : 0;

      actionsHtml = `
        <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                Staff Action: Receive Cash & Activate
              </h4>
              <p class="text-[11px] text-slate-400 mt-0.5">Collect the stated counter fee from the customer to activate package handling.</p>
            </div>
            <span class="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              Min ₱${fee.toLocaleString()}
            </span>
          </div>

          <div class="space-y-2 pt-1">
            <label for="detail-cash-input" class="text-[11px] font-medium text-slate-300 block">
              Amount Received (PHP):
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">₱</span>
              <input
                type="number"
                id="detail-cash-input"
                aria-label="Amount Received for ${order.id}"
                placeholder="Enter amount (min ${fee})"
                value="${entered}"
                class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <!-- Quick Preset Amount Buttons -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[10px] text-slate-400">Quick Fill:</span>
              <button type="button" class="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors" data-amount="${fee}">
                Exact ₱${fee}
              </button>
              <button type="button" class="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors" data-amount="${fee + 100}">
                ₱${(fee + 100).toLocaleString()}
              </button>
              <button type="button" class="preset-cash-btn px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-200 transition-colors" data-amount="1000">
                ₱1,000
              </button>
            </div>

            ${isValid ? `
              <div class="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                <span class="text-slate-300">Customer Change Due:</span>
                <span class="font-mono font-bold text-emerald-400">₱${previewChange.toLocaleString()}</span>
              </div>
            ` : entered !== '' ? `
              <p class="text-[11px] text-red-400 font-medium">Amount received must be at least ₱${fee.toLocaleString()}</p>
            ` : ''}

            <button
              type="button"
              id="detail-activate-btn"
              ${isValid ? '' : 'disabled'}
              class="btn-press w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all mt-1 ${
                isValid
                  ? 'bg-[#c58b12] hover:bg-amber-600 text-white cursor-pointer shadow-lg shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed'
              }"
            >
              Receive Cash &amp; Activate Order
            </button>
          </div>
        </div>
      `;
    } else if (order.status === 'AWAITING_PARCEL') {
      const isPaid = order.courierPaid;
      const photo = attachedPhotos[order.id] || order.parcelImageUrl;

      actionsHtml = `
        <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-4">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Operational Workflow: 2-Step Intake
            </h4>
            <p class="text-[11px] text-slate-400 mt-0.5">Record courier COD payment first, then attach and verify pouch photo.</p>
          </div>

          <!-- Step 1: Courier COD Payout -->
          <div class="p-3 rounded-xl bg-slate-900/70 border ${isPaid ? 'border-emerald-500/30' : 'border-blue-500/30'} space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isPaid ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}">
                  ${isPaid ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>' : '1'}
                </span>
                <span class="text-xs font-bold ${isPaid ? 'text-emerald-300' : 'text-white'}">
                  ${isPaid ? 'Step 1: Courier Payout Recorded' : 'Step 1: Pay Courier COD'}
                </span>
              </div>
              <span class="text-xs font-mono font-bold ${isPaid ? 'text-emerald-400' : 'text-blue-400'}">${order.codAmount}</span>
            </div>

            ${!isPaid ? `
              <p class="text-[11px] text-slate-400 leading-snug">Hand exact retail COD amount to the delivery rider upon counter handover.</p>
              <button
                type="button"
                id="detail-pay-courier-btn"
                class="btn-press w-full py-2.5 px-3 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs shadow-md shadow-blue-900/30"
              >
                Pay Courier (${order.codAmount})
              </button>
            ` : `
              <p class="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Retail COD payout completed. Ready for parcel photograph.</span>
              </p>
            `}
          </div>

          <!-- Step 2: Parcel Photo Intake & Verification -->
          <div class="p-3 rounded-xl bg-slate-900/70 border ${!isPaid ? 'border-slate-800 opacity-60' : photo ? 'border-emerald-500/40' : 'border-slate-700'} space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${photo ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}">
                  2
                </span>
                <span class="text-xs font-bold text-white">Step 2: Attach &amp; Verify Parcel Photo</span>
              </div>
              ${photo ? '<span class="text-[10px] font-semibold text-emerald-400">Photo Attached</span>' : ''}
            </div>

            ${!isPaid ? `
              <p class="text-[11px] text-slate-500">Locked until Step 1 (Courier Payout) is completed.</p>
            ` : photo ? `
              <div class="space-y-2">
                <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <img src="${photo}" alt="Parcel Preview" class="w-14 h-14 object-cover rounded-lg border border-slate-600 shadow-sm shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-white truncate">Parcel Intake Proof</p>
                    <p class="text-[10px] text-slate-400">Pouch label captured</p>
                  </div>
                  <button
                    type="button"
                    id="detail-retake-photo-btn"
                    class="btn-press px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold shrink-0"
                  >
                    Retake
                  </button>
                </div>
                <button
                  type="button"
                  id="detail-verify-photo-btn"
                  class="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/30"
                >
                  Verify Photo &amp; Make Ready to Claim
                </button>
              </div>
            ` : `
              <div class="flex items-center gap-2">
                <label class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer text-center border border-slate-700 transition-colors">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" id="detail-photo-file-input" class="hidden" />
                </label>
                <button
                  type="button"
                  id="detail-sample-photo-btn"
                  class="btn-press py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-xs border border-blue-500/40 shrink-0"
                >
                  Use Sample Photo
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    } else if (order.status === 'READY_TO_CLAIM') {
      const isUnlocked = order.claimInitiatedAt && (Date.now() - order.claimInitiatedAt <= 10 * 60 * 1000);
      let remainingSec = 0;
      if (isUnlocked) {
        remainingSec = Math.max(0, Math.floor((10 * 60 * 1000 - (Date.now() - order.claimInitiatedAt)) / 1000));
      }
      const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
      const ss = String(remainingSec % 60).padStart(2, '0');

      actionsHtml = `
        <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Staff Action: Customer Claim &amp; Release
            </h4>
            <p class="text-[11px] text-slate-400 mt-0.5">Release parcel when customer initiates pickup at the counter desk.</p>
          </div>

          ${!isUnlocked ? `
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2.5">
              <div class="flex items-center gap-2.5 text-slate-300 text-xs">
                <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-white">Terminal Counter Locked</p>
                  <p class="text-[11px] text-slate-400">Awaiting customer to press "Initiate Claim" in customer mobile app.</p>
                </div>
              </div>

              <div class="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  id="detail-simulate-prompt-btn"
                  class="btn-press flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Simulate Customer Claim Prompt</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled
              class="w-full py-2.5 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700 cursor-not-allowed opacity-60"
            >
              Release Parcel (Locked)
            </button>
          ` : `
            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span class="text-xs font-bold text-emerald-300">Customer Present at Counter</span>
                </div>
                <span id="detail-claim-timer" class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono-numbers">
                  Active (${mm}:${ss})
                </span>
              </div>
              <p class="text-[11px] text-slate-300">Customer claim verified. Hand over parcel and change of <strong class="text-emerald-300 font-mono">${order.change || '₱0'}</strong>.</p>
            </div>

            <button
              type="button"
              id="detail-release-order-btn"
              class="btn-press w-full py-2.5 px-3 rounded-xl bg-[#10b780] hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-900/40"
            >
              Release Parcel &amp; Hand Over Change (${order.change || '₱0'})
            </button>
          `}
        </div>
      `;
    } else if (order.status === 'CLAIMED') {
      actionsHtml = `
        <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/30 shadow-md space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 class="text-xs font-bold text-emerald-300">Parcel Handover Completed</h4>
              <p class="text-[11px] text-slate-400">Customer claimed parcel and received change.</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>Change Handed Over:</span>
              <strong class="font-mono text-emerald-400 font-mono-numbers">${order.change || '₱0'}</strong>
            </div>
            <div class="flex justify-between text-slate-400 text-[11px]">
              <span>Verification Desk:</span>
              <span class="font-mono">Counter Desk #01</span>
            </div>
          </div>
        </div>
      `;
    }

    orderDetailsContentEl.innerHTML = `
      <!-- Visible yet Giving Internal Order ID Hero Banner (XXX - XXX) -->
      <div id="hero-order-id-card" class="inner-detail-card p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/40 shadow-lg shadow-blue-950/30 space-y-2">
        <div class="flex items-center justify-between">
          <span class="hero-card-label text-[10px] font-bold tracking-widest text-blue-400 uppercase font-mono flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Internal Parcel ID
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}">
            ${statusInfo.label}
          </span>
        </div>
        <div class="flex items-center justify-between pt-0.5">
          <div class="flex items-baseline gap-2">
            <span class="hero-card-id text-2xl font-black font-mono tracking-widest text-white font-mono-numbers drop-shadow-sm">
              ${escapeHtml(formattedOrderId)}
            </span>
          </div>
          <button
            type="button"
            id="copy-order-id-btn"
            class="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Copy Internal Order ID"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy ID</span>
          </button>
        </div>
      </div>

      <!-- Product Information Card -->
      <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 block mb-1">
            Parcel Information
          </span>
          <h2 class="text-base font-bold text-white tracking-wide leading-snug">
            ${escapeHtml(order.product)}
          </h2>
        </div>

        <!-- Tracking Number & Pickup Key -->
        <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-slate-400 font-medium">Tracking Number:</span>
            <button
              type="button"
              id="copy-tracking-btn"
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 text-[11px] font-mono font-mono-numbers transition-colors"
              title="Copy Tracking Number"
            >
              <span>${escapeHtml(order.trackingNumber)}</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          <div class="pt-1.5 border-t border-slate-800 text-[11px] flex items-center justify-between">
            <span class="text-slate-400">Pickup Key:</span>
            <span class="font-mono font-semibold text-slate-200 font-mono-numbers bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700/80">${escapeHtml(order.alphanumericKey)}</span>
          </div>
        </div>

        <!-- Recipient -->
        <div class="flex items-center justify-between text-xs pt-1">
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-slate-400">Recipient:</span>
            <strong class="text-slate-200 font-medium">${escapeHtml(order.recipient)}</strong>
          </div>
        </div>
      </div>

      <!-- Staff Notes Card (Replaces envelope box feature) -->
      <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Staff Notes</h4>
          </div>
          <span id="order-notes-status" class="text-[10px] font-mono text-slate-400">
            ${order.notes ? 'Note saved' : 'No notes added'}
          </span>
        </div>

        <div class="space-y-2.5">
          <textarea
            id="order-notes-textarea"
            rows="3"
            placeholder="Add operational notes (e.g., customer called for hold, fragile packaging, authorized rep pickup)..."
            class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#215cd4] focus:border-[#215cd4] resize-none font-sans leading-relaxed"
          >${escapeHtml(order.notes || '')}</textarea>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[10px] text-slate-500">Visible to counter staff only (Ctrl+Enter to save)</span>
            <div class="flex items-center gap-2">
              ${order.notes ? `
                <button
                  type="button"
                  id="clear-order-notes-btn"
                  class="btn-press px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              ` : ''}
              <button
                type="button"
                id="save-order-notes-btn"
                class="btn-press px-3.5 py-1.5 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Ledger Card -->
      <div class="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Financial Ledger
        </h4>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
            <span class="text-[10px] text-slate-400 block mb-0.5">Retail COD</span>
            <span class="text-xs font-mono font-bold text-white font-mono-numbers">${order.codAmount}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
            <span class="text-[10px] text-slate-400 block mb-0.5">Paid / Deposit</span>
            <span class="text-xs font-mono font-bold text-blue-400 font-mono-numbers">${order.paidAmount || 'Pending'}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
            <span class="text-[10px] text-slate-400 block mb-0.5">Change Due</span>
            <span class="text-xs font-mono font-bold text-emerald-400 font-mono-numbers">${order.change || '₱0'}</span>
          </div>
        </div>
      </div>

      <!-- Operational Actions -->
      ${actionsHtml}
    `;

    bindInnerActionEvents(order, formattedOrderId);
  }

  // Bind Event Listeners for Actions inside the Inner Modal
  function bindInnerActionEvents(order, formattedOrderId) {
    // Copy Internal Order ID (XXX - XXX) button
    const copyOrderIdBtn = document.getElementById('copy-order-id-btn');
    if (copyOrderIdBtn) {
      copyOrderIdBtn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(order.id);
        }
        showToast(`Internal Order ID copied: ${formattedOrderId || order.id}`);
      });
    }

    // Staff Notes Actions
    const notesTextarea = document.getElementById('order-notes-textarea');
    const saveNotesBtn = document.getElementById('save-order-notes-btn');
    const clearNotesBtn = document.getElementById('clear-order-notes-btn');
    const notesStatus = document.getElementById('order-notes-status');

    if (saveNotesBtn && notesTextarea) {
      saveNotesBtn.addEventListener('click', () => {
        const val = notesTextarea.value.trim();
        order.notes = val;
        saveOrders();
        showToast(val ? `Staff note saved for ${order.id}.` : `Note cleared for ${order.id}.`);
        if (notesStatus) notesStatus.textContent = val ? 'Note saved' : 'No notes added';
        renderOrders();
        renderOrderDetailsContent(order);
      });
    }

    if (clearNotesBtn && notesTextarea) {
      clearNotesBtn.addEventListener('click', () => {
        notesTextarea.value = '';
        order.notes = '';
        saveOrders();
        showToast(`Note cleared for ${order.id}.`);
        renderOrders();
        renderOrderDetailsContent(order);
      });
    }

    // Ctrl+Enter or Cmd+Enter to quickly save note
    if (notesTextarea && saveNotesBtn) {
      notesTextarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          saveNotesBtn.click();
        }
      });
    }

    // Copy Tracking Number button
    const copyBtn = document.getElementById('copy-tracking-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(order.trackingNumber);
        }
        showToast(`Tracking ID copied: ${order.trackingNumber}`);
      });
    }

    // Cash Input in Unpaid
    const cashInput = document.getElementById('detail-cash-input');
    const activateBtn = document.getElementById('detail-activate-btn');
    if (cashInput && activateBtn) {
      cashInput.addEventListener('input', (e) => {
        cashInputs[order.id] = e.target.value;
        const fee = getStatedFee(order);
        const num = parseInt(e.target.value, 10);
        if (!isNaN(num) && num >= fee) {
          activateBtn.removeAttribute('disabled');
          activateBtn.className = 'btn-press w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all mt-1 bg-[#c58b12] hover:bg-amber-600 text-white cursor-pointer shadow-lg shadow-amber-900/30';
        } else {
          activateBtn.setAttribute('disabled', 'true');
          activateBtn.className = 'btn-press w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all mt-1 bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed';
        }
      });

      // Quick preset amount buttons
      document.querySelectorAll('.preset-cash-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const amt = e.currentTarget.getAttribute('data-amount');
          cashInput.value = amt;
          cashInput.dispatchEvent(new Event('input'));
        });
      });

      activateBtn.addEventListener('click', () => {
        const entered = cashInputs[order.id];
        const numEntered = parseInt(entered, 10);
        const fee = getStatedFee(order);

        if (isNaN(numEntered) || numEntered < fee) {
          showToast(`Amount received must be ≥ ₱${fee}`);
          return;
        }

        const codNum = parseInt((order.codAmount || '').replace(/[^\d]/g, ''), 10) || 0;
        const change = Math.max(0, numEntered - codNum);

        order.status = 'AWAITING_PARCEL';
        order.paidAmount = `₱${numEntered.toLocaleString()}`;
        order.change = `₱${change.toLocaleString()}`;
        delete cashInputs[order.id];

        saveOrders();
        showToast(`Cash deposit received: ₱${numEntered.toLocaleString()}. Order moved to Active.`);
        setFilter('active');
        renderOrderDetailsContent(order);
      });
    }

    // Pay Courier in Active
    const payCourierBtn = document.getElementById('detail-pay-courier-btn');
    if (payCourierBtn) {
      payCourierBtn.addEventListener('click', () => {
        order.courierPaid = true;
        saveOrders();
        showToast(`Courier payout recorded (${order.codAmount}). Please attach parcel photo.`);
        renderOrderDetailsContent(order);
        renderOrders();
      });
    }

    // Sample Photo in Active
    const samplePhotoBtn = document.getElementById('detail-sample-photo-btn');
    if (samplePhotoBtn) {
      samplePhotoBtn.addEventListener('click', () => {
        attachedPhotos[order.id] = './assets/receipt_thumbnail.png';
        showToast('Sample parcel pouch photo attached.');
        renderOrderDetailsContent(order);
      });
    }

    // Upload Photo File in Active
    const photoFileInput = document.getElementById('detail-photo-file-input');
    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            attachedPhotos[order.id] = ev.target.result;
            showToast('Parcel pouch photo uploaded.');
            renderOrderDetailsContent(order);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Retake Photo in Active
    const retakePhotoBtn = document.getElementById('detail-retake-photo-btn');
    if (retakePhotoBtn) {
      retakePhotoBtn.addEventListener('click', () => {
        delete attachedPhotos[order.id];
        order.parcelImageUrl = null;
        renderOrderDetailsContent(order);
      });
    }

    // Verify Photo & Make Ready in Active
    const verifyPhotoBtn = document.getElementById('detail-verify-photo-btn');
    if (verifyPhotoBtn) {
      verifyPhotoBtn.addEventListener('click', () => {
        order.parcelImageUrl = attachedPhotos[order.id] || order.parcelImageUrl || './assets/receipt_thumbnail.png';
        order.status = 'READY_TO_CLAIM';
        delete attachedPhotos[order.id];
        saveOrders();
        showToast(`Parcel photo verified! Order ${order.id} is now Ready to Claim.`);
        setFilter('ready_to_claim');
        renderOrderDetailsContent(order);
      });
    }

    // Simulate Customer Prompt in Ready
    const simulatePromptBtn = document.getElementById('detail-simulate-prompt-btn');
    if (simulatePromptBtn) {
      simulatePromptBtn.addEventListener('click', () => {
        order.claimInitiatedAt = Date.now();
        saveOrders();
        showToast(`Customer prompted claim for ${order.id}! Counter unlocked for 10 minutes.`);
        renderOrderDetailsContent(order);
        renderOrders();
      });
    }

    // Release Order in Ready
    const releaseOrderBtn = document.getElementById('detail-release-order-btn');
    if (releaseOrderBtn) {
      releaseOrderBtn.addEventListener('click', () => {
        order.status = 'CLAIMED';
        order.claimInitiatedAt = null;
        saveOrders();
        showToast(`Parcel released to customer! Cash change (${order.change || '₱0'}) handed over.`);
        setFilter('claimed');
        renderOrderDetailsContent(order);
      });
    }
  }

  // Update claim countdown ticker dynamically inside details modal
  function updateClaimCountdownInModal(order) {
    const timerEl = document.getElementById('detail-claim-timer');
    if (!timerEl) return;
    const isUnlocked = order.claimInitiatedAt && (Date.now() - order.claimInitiatedAt <= 10 * 60 * 1000);
    if (!isUnlocked) {
      renderOrderDetailsContent(order);
      return;
    }
    const remainingSec = Math.max(0, Math.floor((10 * 60 * 1000 - (Date.now() - order.claimInitiatedAt)) / 1000));
    const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
    const ss = String(remainingSec % 60).padStart(2, '0');
    timerEl.textContent = `Active (${mm}:${ss})`;
  }

  // QR & Order Matcher Handler
  function matchQrOrOrderId(code) {
    if (!code) return;
    const clean = code.trim().toLowerCase();
    const cleanAlnum = clean.replace(/[^a-z0-9]/g, '');

    const matched = orders.find(o => {
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
      // Auto switch to matched tab
      const targetFilter =
        matched.status === 'PAYMENT_REQUIRED' ? 'inactive' :
        matched.status === 'AWAITING_PARCEL' ? 'active' :
        matched.status === 'READY_TO_CLAIM' ? 'ready_to_claim' : 'claimed';

      setFilter(targetFilter);
      searchQuery = matched.id;
      if (searchInputEl) searchInputEl.value = matched.id;
      if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');

      closeQrModal();
      showToast(`QR match: ${matched.id} (${matched.product})`);

      // Automatically open the inner details & actions view for the scanned order!
      openOrderDetails(matched.id);
    } else {
      showToast(`No order matched "${code}". Try again.`, 'error');
    }
  }

  // Backward compatible alias
  const matchBarcodeOrKey = matchQrOrOrderId;

  // QR Modal Handlers
  function openQrModal() {
    if (!qrScannerModalEl) return;
    qrScannerModalEl.classList.remove('hidden');
    if (manualScanInputEl) {
      manualScanInputEl.focus();
      manualScanInputEl.select();
    }
  }

  function closeQrModal() {
    if (!qrScannerModalEl) return;
    qrScannerModalEl.classList.add('hidden');
    stopWebcam();
  }

  function toggleWebcam() {
    if (cameraStream) {
      stopWebcam();
    } else {
      startWebcam();
    }
  }

  async function startWebcam() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (cameraVideoEl) {
        cameraVideoEl.srcObject = cameraStream;
        cameraVideoEl.classList.remove('hidden');
        if (toggleWebcamBtn) toggleWebcamBtn.textContent = 'Stop Camera';
      }
    } catch (err) {
      showToast('Camera access unavailable or denied. Use manual Order ID lookup.');
    }
  }

  function stopWebcam() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    if (cameraVideoEl) {
      cameraVideoEl.classList.add('hidden');
      cameraVideoEl.srcObject = null;
    }
    if (toggleWebcamBtn) toggleWebcamBtn.textContent = 'Use Camera';
  }

  // Search Input Listeners
  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        if (searchQuery) clearSearchBtn.classList.remove('hidden');
        else clearSearchBtn.classList.add('hidden');
      }
      renderOrders();
    });

    searchInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (headerSearchBtn) headerSearchBtn.click();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInputEl) searchInputEl.value = '';
      clearSearchBtn.classList.add('hidden');
      renderOrders();
    });
  }

  // Header Manual Search Button Handler
  if (headerSearchBtn) {
    headerSearchBtn.addEventListener('click', () => {
      const q = searchInputEl ? searchInputEl.value.trim() : '';
      if (!q) {
        showToast('Please enter an Order ID or customer name to search.');
        if (searchInputEl) searchInputEl.focus();
        return;
      }
      searchQuery = q;
      renderOrders();

      const cleanQ = q.toLowerCase();
      const cleanAlnum = cleanQ.replace(/[^a-z0-9]/g, '');

      // Check for targeted match (ID, pickup key, or tracking number)
      const matched = orders.find(o => {
        const id = o.id.toLowerCase();
        const cleanId = id.replace(/[^a-z0-9]/g, '');
        const track = o.trackingNumber.toLowerCase();
        const key = o.alphanumericKey.toLowerCase();
        const cleanKey = key.replace(/[^a-z0-9]/g, '');

        return (
          cleanId === cleanAlnum ||
          id === cleanQ ||
          (cleanAlnum.length >= 3 && cleanId.endsWith(cleanAlnum)) ||
          track === cleanQ ||
          key === cleanQ ||
          cleanKey === cleanAlnum ||
          track.includes(cleanQ) ||
          cleanQ.includes(track)
        );
      });

      if (matched) {
        const targetFilter =
          matched.status === 'PAYMENT_REQUIRED' ? 'inactive' :
          matched.status === 'AWAITING_PARCEL' ? 'active' :
          matched.status === 'READY_TO_CLAIM' ? 'ready_to_claim' : 'claimed';

        setFilter(targetFilter);
        openOrderDetails(matched.id);
        showToast(`Found match: ${matched.id} (${matched.product})`);
      } else {
        showToast(`Showing results for "${q}".`);
      }
    });
  }

  // Scan & Modal Triggers
  if (floatingScanQrBtn) {
    floatingScanQrBtn.addEventListener('click', openQrModal);
  }
  if (closeScannerBtn) {
    closeScannerBtn.addEventListener('click', closeQrModal);
  }
  if (returnBackLinkBtn) {
    returnBackLinkBtn.addEventListener('click', closeQrModal);
  }

  // Inner Order Details Close Button
  if (closeOrderDetailsBtn) {
    closeOrderDetailsBtn.addEventListener('click', closeOrderDetails);
  }

  // Manual Order ID Input with auto-formatting strictly as XXX - XXX
  if (manualScanInputEl) {
    let isDeleting = false;

    manualScanInputEl.addEventListener('keydown', (e) => {
      isDeleting = (e.key === 'Backspace' || e.key === 'Delete');
      if (e.key === 'Enter') {
        e.preventDefault();
        matchQrOrOrderId(manualScanInputEl.value);
      }
    });

    manualScanInputEl.addEventListener('input', (e) => {
      // Handle both physical keyboard and mobile virtual keyboard backspaces
      const isDeletingNow = isDeleting || (e.inputType && e.inputType.startsWith('delete'));

      // Strip everything except alphanumeric, capitalize, max 6 characters
      const raw = manualScanInputEl.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

      if (isDeletingNow) {
        if (raw.length <= 3) {
          manualScanInputEl.value = raw;
        } else {
          manualScanInputEl.value = `${raw.slice(0, 3)} - ${raw.slice(3)}`;
        }
        return;
      }

      if (raw.length === 0) {
        manualScanInputEl.value = '';
      } else if (raw.length < 3) {
        manualScanInputEl.value = raw;
      } else if (raw.length === 3) {
        manualScanInputEl.value = `${raw} - `;
      } else {
        manualScanInputEl.value = `${raw.slice(0, 3)} - ${raw.slice(3)}`;
      }
    });
  }

  if (manualScanBtn && manualScanInputEl) {
    manualScanBtn.addEventListener('click', () => {
      matchQrOrOrderId(manualScanInputEl.value);
    });
  }

  // Simulate Scan Button in Modal
  if (sampleScanBtn) {
    sampleScanBtn.addEventListener('click', () => {
      matchQrOrOrderId('ORD-408');
    });
  }

  // Toggle Webcam in Modal
  if (toggleWebcamBtn) {
    toggleWebcamBtn.addEventListener('click', toggleWebcam);
  }

  // QR File Input
  if (qrFileInputEl) {
    qrFileInputEl.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        showToast('Image uploaded. Analyzing QR matrix...');
        setTimeout(() => {
          matchQrOrOrderId('PH992817263544R');
        }, 600);
      }
    });
  }

  // Filter Buttons
  function bindFilterButtons() {
    document.querySelectorAll('[data-filter-tab]').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-filter-tab');
        setFilter(id);
      };
    });
  }

  // Bottom Navigation Tabs
  document.querySelectorAll('[data-nav-item]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nav = e.currentTarget.getAttribute('data-nav-item');
      if (nav === 'scanner') {
        openQrModal();
      } else if (nav === 'activity') {
        setFilter('claimed');
        showToast('Viewing completed activity log.');
      } else if (nav === 'terminal') {
        setFilter('active');
      } else if (nav === 'settings') {
        showToast('Counter Desk #01 • Connected to Lily’s Hub Backend.');
      }
    });
  });

  // Device Frame Viewport Toggle
  viewToggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.getAttribute('data-view-mode');
      viewToggleButtons.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
      btn.classList.add('bg-blue-600', 'text-white');

      deviceContainerEl.className = 'flex flex-col relative select-none shadow-2xl transition-all duration-200 ';
      if (currentDock === 'top') {
        deviceContainerEl.classList.add('dock-top-active');
      }
      if (mode === 'mobile') {
        deviceContainerEl.classList.add('device-frame-mobile', 'bg-slate-900', 'border', 'border-slate-800');
      } else if (mode === 'tablet') {
        deviceContainerEl.classList.add('device-frame-tablet', 'bg-slate-900', 'border', 'border-slate-800');
      } else {
        deviceContainerEl.classList.add('device-frame-fluid', 'bg-slate-900');
      }
    });
  });

  // Theme Toggler: Dark vs Figma (#647B92)
  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = e.currentTarget.getAttribute('data-theme-btn');
      currentTheme = theme;
      themeToggleButtons.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
      btn.classList.add('bg-blue-600', 'text-white');

      if (theme === 'figma') {
        appBody.classList.add('theme-figma');
        showToast('Figma Spec Theme applied.');
      } else {
        appBody.classList.remove('theme-figma');
        showToast('Dark Theme applied.');
      }
      setFilter(currentFilter);
      if (selectedOrderId) {
        const ord = orders.find(o => o.id === selectedOrderId);
        if (ord) renderOrderDetailsContent(ord);
      }
    });
  });

  // Tab Dock Toggler: Bottom vs Top
  dockToggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dock = e.currentTarget.getAttribute('data-dock-btn');
      currentDock = dock;
      dockToggleButtons.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
      btn.classList.add('bg-blue-600', 'text-white');

      if (dock === 'top') {
        deviceContainerEl.classList.add('dock-top-active');
        bottomFilterBar.classList.add('hidden');
        topFilterBar.classList.remove('hidden');
        topFilterBar.innerHTML = `
          <button type="button" data-filter-tab="active" aria-label="Active" class="py-2 px-1 rounded-xl text-xs font-bold transition-all bg-[#215cd4] text-white shadow-md flex items-center justify-center gap-1">
            <span>Active</span>
            <span data-badge="active" class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-mono-numbers">1</span>
          </button>
          <button type="button" data-filter-tab="ready_to_claim" aria-label="Ready" class="py-2 px-1 rounded-xl text-xs font-bold transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center gap-1">
            <span>Ready</span>
            <span data-badge="ready_to_claim" class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono font-mono-numbers">1</span>
          </button>
          <button type="button" data-filter-tab="inactive" aria-label="Unpaid" class="py-2 px-1 rounded-xl text-xs font-bold transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center gap-1">
            <span>Unpaid</span>
            <span data-badge="inactive" class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono font-mono-numbers">1</span>
          </button>
          <button type="button" data-filter-tab="claimed" aria-label="Claimed" class="py-2 px-1 rounded-xl text-xs font-bold transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center gap-1">
            <span>Claimed</span>
            <span data-badge="claimed" class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono font-mono-numbers">1</span>
          </button>
        `;
        bindFilterButtons();
        setFilter(currentFilter);
        showToast('Filter tabs positioned at Top Header.');
      } else {
        deviceContainerEl.classList.remove('dock-top-active');
        topFilterBar.classList.add('hidden');
        topFilterBar.innerHTML = '';
        bottomFilterBar.classList.remove('hidden');
        bindFilterButtons();
        setFilter(currentFilter);
        showToast('Filter tabs docked at Bottom.');
      }
    });
  });

  // Reset Demo Orders button
  const resetDemoBtn = document.getElementById('reset-demo-orders-btn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
      attachedPhotos = {};
      cashInputs = {};
      searchQuery = '';
      if (searchInputEl) searchInputEl.value = '';
      saveOrders();
      closeOrderDetails();
      setFilter('active');
      showToast('Staff terminal reset to initial demo state.');
    });
  }

  // Periodic Timer for countdowns on Ready to Claim orders
  countdownTimer = setInterval(() => {
    if (selectedOrderId) {
      const selOrder = orders.find(o => o.id === selectedOrderId);
      if (selOrder && selOrder.status === 'READY_TO_CLAIM' && selOrder.claimInitiatedAt) {
        updateClaimCountdownInModal(selOrder);
      }
    }
  }, 1000);

  // Global Keyboard Navigation (Esc to close modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (orderDetailsModalEl && !orderDetailsModalEl.classList.contains('hidden')) {
        closeOrderDetails();
      } else if (qrScannerModalEl && !qrScannerModalEl.classList.contains('hidden')) {
        closeQrModal();
      }
    }
  });

  // Initialize
  bindFilterButtons();
  setFilter('active');

  const urlParams = new URLSearchParams(window.location.search);
  const targetOrder = urlParams.get('order') || (window.location.hash ? window.location.hash.replace('#', '') : null);
  if (targetOrder) {
    setTimeout(() => {
      openOrderDetails(targetOrder);
    }, 100);
  }

  console.log('ParcelHub Staff UI loaded successfully.');
})();
