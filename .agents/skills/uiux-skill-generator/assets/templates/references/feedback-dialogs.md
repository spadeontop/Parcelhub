# Feedback, Modals & Dialogs Reference

This document provides canonical, copy-pasteable recipes for modal dialogs, security gates, drawers, and toasts in **{{SKILL_NAME}}**, derived strictly from `web/` (`web/index.html` and `web/app.js`).

---

## 1. 6-Digit MPIN Authorization Modal (Fintech Security Gate)

Modal requiring 6-digit PIN entry before staff handover can be authorized. Features 6 status dots and a tactile numeric keypad grid.

```html
<div id="mpin-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
  <div class="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-gray-900 animate-slide-up">
    <!-- Top Pill Handle (Mobile Drawer) -->
    <div class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Authorize Release</h3>
        <p class="text-xs text-gray-500">Enter your 6-digit MPIN to confirm handover</p>
      </div>
      <button 
        type="button" 
        onclick="closeMpinModal()" 
        class="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
        aria-label="Close MPIN Modal"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- 6 MPIN Status Indicator Dots -->
    <div class="flex items-center justify-center gap-3.5 py-5">
      <div id="mpin-dot-0" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
      <div id="mpin-dot-1" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
      <div id="mpin-dot-2" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
      <div id="mpin-dot-3" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
      <div id="mpin-dot-4" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
      <div id="mpin-dot-5" class="w-4 h-4 rounded-full bg-gray-200 transition-all"></div>
    </div>

    <!-- Numeric Keypad Grid -->
    <div class="grid grid-cols-3 gap-2.5 pt-2">
      <button type="button" onclick="enterMpin('1')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">1</button>
      <button type="button" onclick="enterMpin('2')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">2</button>
      <button type="button" onclick="enterMpin('3')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">3</button>
      
      <button type="button" onclick="enterMpin('4')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">4</button>
      <button type="button" onclick="enterMpin('5')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">5</button>
      <button type="button" onclick="enterMpin('6')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">6</button>
      
      <button type="button" onclick="enterMpin('7')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">7</button>
      <button type="button" onclick="enterMpin('8')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">8</button>
      <button type="button" onclick="enterMpin('9')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">9</button>
      
      <button type="button" onclick="closeMpinModal()" class="py-3 text-xs font-bold rounded-2xl text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">Cancel</button>
      <button type="button" onclick="enterMpin('0')" class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900">0</button>
      <button type="button" onclick="deleteMpin()" class="py-3 text-base font-bold rounded-2xl text-gray-700 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center" aria-label="Delete digit">⌫</button>
    </div>
  </div>
</div>
```

---

## 2. Proof of Delivery Inspection Modal

```html
<div id="pod-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900">
    <div class="flex items-center justify-between pb-3 border-b border-gray-100">
      <div>
        <h3 class="text-base font-bold text-gray-900">Proof of Delivery</h3>
        <p class="text-xs text-gray-500">Staff Intake Visual Verification Log</p>
      </div>
      <button type="button" onclick="closeProofOfDeliveryModal()" class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700" aria-label="Close POD modal">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Intake Photo Simulation -->
    <div class="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 relative">
      <div class="h-48 bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
        <div class="w-20 h-16 rounded-lg bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-inner mb-2">
          <span class="text-[10px] font-mono font-bold text-amber-900">📦 SPX POUCH</span>
        </div>
        <p class="text-xs font-mono text-emerald-400 font-bold">MATCH: PH2696153366792H</p>
        <span class="text-[10px] text-gray-400">Intake Camera #01 • Sealed & Intact</span>
      </div>
    </div>

    <!-- Details Summary -->
    <div class="mt-4 space-y-2 text-xs">
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span class="text-gray-500">Waybill Barcode:</span>
        <span class="font-mono font-bold text-gray-900">PH2696153366792H</span>
      </div>
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span class="text-gray-500">Carrier:</span>
        <span class="font-semibold text-gray-900">ShopeeXpress (SPX)</span>
      </div>
      <div class="flex justify-between py-1 border-b border-gray-100">
        <span class="text-gray-500">Intake Timestamp:</span>
        <span class="font-mono text-gray-900">17 Oct 2026 22:32:04</span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-gray-500">Condition Verified:</span>
        <span class="font-bold text-emerald-600">SEALED & INTACT (100%)</span>
      </div>
    </div>

    <button 
      type="button" 
      onclick="closeProofOfDeliveryModal()" 
      class="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs"
    >
      Close Preview
    </button>
  </div>
</div>
```

---

## 3. Escrow Policy & Zero-Credit Modal

```html
<div id="escrow-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900">
    <div class="flex items-center justify-between pb-3 border-b border-gray-100">
      <h3 class="text-base font-bold text-gray-900">ParcelHub Escrow Policy</h3>
      <button type="button" onclick="closeEscrowPolicyModal()" class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700" aria-label="Close Escrow modal">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="mt-4 space-y-3 text-xs text-gray-600 leading-relaxed">
      <div class="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
        <h4 class="font-bold text-blue-900 mb-1">Zero-Credit Escrow Invariant</h4>
        <p class="text-blue-800">ParcelHub never fronts cash for orders. Payout to couriers is only authorized after exact cash is secured at Lily’s Catering Hub desk.</p>
      </div>

      <div class="p-3 bg-gray-50 rounded-2xl border border-gray-200">
        <h4 class="font-bold text-gray-900 mb-1">Physical Envelope Isolation</h4>
        <p>Every consignment has an isolated envelope (<span class="font-mono font-bold text-gray-800">#ENV-402</span>). Your change is placed directly in the envelope upon deposit.</p>
      </div>
    </div>

    <button 
      type="button" 
      onclick="closeEscrowPolicyModal()" 
      class="w-full mt-6 py-3 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-bold text-xs"
    >
      Understood
    </button>
  </div>
</div>
```

---

## 4. Toast Notification Pill

```html
<div 
  id="toast-notification" 
  class="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 transition-all duration-300 translate-y-0 opacity-100"
  role="status"
  aria-live="polite"
>
  <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
  <span id="toast-message" class="text-xs font-medium tracking-wide">Notice message</span>
</div>
```

---

## 5. Notifications Drawer Modal

Slide-over or centered modal displaying real-time consignment updates and escrow alerts.

```html
<div id="notifications-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900">
    <div class="flex items-center justify-between pb-3 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <h3 class="text-base font-bold text-gray-900">Notifications</h3>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">4 New</span>
      </div>
      <button type="button" onclick="closeNotificationsModal()" class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700" aria-label="Close Notifications modal">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
      <div class="p-3 rounded-2xl bg-blue-50 border border-blue-100">
        <div class="flex justify-between items-baseline">
          <h4 class="text-xs font-bold text-blue-900">Parcel Ready for Claim</h4>
          <span class="text-[10px] text-blue-500 font-mono">10m ago</span>
        </div>
        <p class="text-xs text-blue-700 mt-1">VXE R1 Nearlink has arrived at Lily’s Catering Hub.</p>
      </div>

      <div class="p-3 rounded-2xl bg-gray-50 border border-gray-100">
        <div class="flex justify-between items-baseline">
          <h4 class="text-xs font-bold text-gray-900">Deposit Verified</h4>
          <span class="text-[10px] text-gray-400 font-mono">2h ago</span>
        </div>
        <p class="text-xs text-gray-600 mt-1">₱500 deposit secured in Escrow Envelope #ENV-402.</p>
      </div>
    </div>

    <button 
      type="button" 
      onclick="closeNotificationsModal()" 
      class="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs"
    >
      Dismiss
    </button>
  </div>
</div>
```

---

## 6. Progressive Disclosure Protocol (PoLP in `web/`)

To protect transaction security and minimize visual clutter:
1. **Primary Screen**: Confined to order status cards and activity feeds.
2. **Atomic 6-Digit MPIN Gate**: Staff release or claim confirmation must NEVER be a single toggle; it MUST trigger `#mpin-modal`.
3. **Audit Modals**: Escrow terms (`#escrow-modal`) and Proof of Delivery (`#pod-modal`) open in dedicated modals without leaving the active flow.
4. **Strict Scope Constraint**: All modal and drawer blueprints derive exclusively from `web/`. Never import components from outside `web/`.

