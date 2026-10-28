# Buttons & Form Controls Reference

This document provides canonical, copy-pasteable recipes for interactive buttons, dropzones, switches, and inputs in **{{SKILL_NAME}}**, derived strictly from `web/` (`web/index.html`, `web/style.css`, `web/app.js`).

---

## 1. Button Variants

### Primary Brand CTA Button
```html
<button 
  type="button" 
  class="w-full py-3 px-4 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white font-semibold text-sm tracking-wide transition-all shadow-md btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
>
  Create Order
</button>
```

### Secondary Navy Action Button
```html
<button 
  type="button" 
  class="py-3 px-4 rounded-xl bg-[#163b86] hover:bg-[#102d6b] text-white font-semibold text-sm tracking-wide transition-all btn-press text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
>
  Transactions
</button>
```

### Notification Pill Toggle Button
```html
<button 
  type="button" 
  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#93eb99] text-gray-900 hover:bg-[#82e088] transition-all btn-press shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
  aria-label="Toggle notifications"
>
  <span>Turn on notifications</span>
  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </svg>
</button>
```

### MPIN Numeric Keypad Key
```html
<button 
  type="button" 
  class="py-3 text-xl font-bold rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
>
  1
</button>
```

---

## 2. Form Inputs & Controls

### Receipt Upload Dropzone
```html
<label 
  for="receipt-file-input"
  class="min-h-[360px] border-2 border-gray-300 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 bg-white hover:bg-gray-50 hover:border-[#215cd4] transition-all cursor-pointer relative group"
>
  <input 
    type="file" 
    id="receipt-file-input" 
    accept="image/*" 
    class="hidden" 
  />
  <div class="w-20 h-20 rounded-full bg-blue-50 text-[#215cd4] flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
    </svg>
  </div>
  <p class="text-base font-semibold text-gray-800">Tap to upload receipt image</p>
  <p class="text-xs text-gray-400 mt-1">Supports Shopee, Lazada, TikTok Shop screenshots</p>
</label>
```

### Confirmation Checkbox Gate
```html
<div class="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
  <input 
    type="checkbox" 
    id="claim-confirm-check" 
    class="mt-1 w-5 h-5 text-[#215cd4] rounded-md border-gray-300 focus:ring-blue-500 cursor-pointer"
  />
  <label for="claim-confirm-check" class="text-xs text-gray-700 leading-relaxed cursor-pointer">
    I confirm that I am at Lily's Catering Hub and ready to present my MPIN.
  </label>
</div>
```

---

## 3. Accessibility & Scope Checklist

- [ ] Strictly reference ONLY controls and states implemented in `web/`.
- [ ] All inputs MUST have an associated `<label for="id">` or explicit `aria-label`.
- [ ] Buttons must feature tactile active press classes (`.btn-press` or `active:scale-95`).
- [ ] Focus outlines (`focus-visible:ring-2`) must be present for keyboard navigability.

