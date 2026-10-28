# Cards & Containers Reference

This document provides canonical, copy-pasteable recipes for cards and activity containers in **{{SKILL_NAME}}**, derived strictly from `web/` (`web/app.js` and `web/index.html`).

---

## 1. Welcome Dark Card (Main Home Dashboard CTA)

Dark contrast card (`#1e1e1e`) featuring primary call-to-action buttons for order creation and ledger inspection.

```html
<section class="rounded-2xl bg-[#1e1e1e] p-6 text-white shadow-lg select-none">
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
```

---

## 2. Activities List Card (Consignment Order Item)

Card listing ongoing and claimed consignments, with dynamic tracking status color indicators.

```html
<div class="rounded-2xl bg-[#f8f8f8] border border-gray-100 p-5 divide-y divide-gray-200 select-none">
  <!-- Active Consignment Item -->
  <div 
    onclick="navigateTo('order_details', { orderId: 'ORD-402' })"
    class="py-4 first:pt-1 last:pb-1 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-all"
  >
    <div>
      <h4 class="text-base font-bold text-gray-900 group-hover:text-[#215cd4] transition-colors">VXE R1 Nearlink</h4>
      <p class="text-xs text-gray-500 mt-0.5">October 10, 2026 10:30</p>
    </div>
    <div class="text-right">
      <span class="text-sm font-bold text-[#10b780] flex items-center gap-1">
        Ready to Claim
        <svg class="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </span>
    </div>
  </div>
</div>
```

---

## 3. Zero-Orders Empty State Card

Displayed when the student or customer has zero pending activities.

```html
<div class="flex-1 min-h-[360px] rounded-2xl bg-[#f8f8f8] border border-gray-100 flex flex-col items-center justify-center p-6 text-center select-none">
  <p class="text-gray-700 text-sm font-medium">You don’t have any activites yet</p>
  <button 
    type="button" 
    onclick="navigateTo('create_order')" 
    class="text-sm font-semibold text-[#215cd4] hover:underline mt-1 cursor-pointer"
  >
    Create an order
  </button>
</div>
```

---

## 4. Anti-Patterns & Rules

1. **Strict Reference Scope**: Card components reference ONLY patterns found in `web/`.
2. **Tactile Radii**: Cards must use `rounded-2xl` matching `web/app.js`.
3. **Button Press Physics**: Always include `.btn-press` on interactive buttons within cards.

