# Navigation & Headers Reference

This document provides canonical, copy-pasteable recipes for mobile brand headers and bottom navigation bars in **{{SKILL_NAME}}**, derived strictly from `web/` (`web/app.js` and `web/index.html`).

Navigation must be semantically enclosed in `<header>` or `<nav>` elements with unambiguous `aria-label` tags.

---

## 1. Top Mobile Brand Header

Displays the ParcelHub brand logo, station name, interactive notification toggle pill, and notification drawer trigger.

```html
<header class="flex items-center justify-between py-2 select-none">
  <!-- Brand Identity -->
  <div class="flex items-center gap-2.5">
    <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-8 h-8 object-contain">
    <div>
      <h1 class="text-xl font-bold tracking-tight text-gray-900 leading-none">Parcelhub</h1>
      <p class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mt-0.5">LILY'S CATERING HUB</p>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2">
    <!-- Notification Toggle Pill -->
    <button 
      type="button" 
      onclick="toggleNotificationPill()"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#93eb99] text-gray-900 hover:bg-[#82e088] transition-all btn-press shadow-sm"
      aria-label="Toggle notifications"
    >
      <span>Turn on notifications</span>
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
    </button>

    <!-- Bell Icon Button with Unread Indicator -->
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
```

---

## 2. Floating Bottom Navigation Bar (Canonical Mobile Nav)

A floating pill bar with 4 icon triggers (`home_icon.svg`, `orders_icon.svg`, `help_icon.svg`, `profile_icon.svg`).

```html
<nav 
  aria-label="Bottom Navigation" 
  class="absolute bottom-5 left-5 right-5 h-16 rounded-full bg-white floating-nav flex items-center justify-around px-6 border border-gray-100 z-10 select-none"
>
  <button 
    type="button" 
    onclick="navigateTo('home')" 
    class="p-2 transition-transform hover:scale-110 active:scale-95 text-[#215cd4]"
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
    aria-label="Help and Escrow Policy"
  >
    <img src="./assets/help_icon.svg" alt="Help" class="w-6 h-6 object-contain">
  </button>

  <button 
    type="button" 
    onclick="showToast('Student Profile')" 
    class="p-2 transition-transform hover:scale-110 active:scale-95 text-gray-800"
    aria-label="Profile"
  >
    <img src="./assets/profile_icon.svg" alt="Profile" class="w-6 h-6 object-contain">
  </button>
</nav>
```

---

## 3. Labeled Bottom Navigation Bar (Alternative Screen Variant)

```html
<nav 
  aria-label="Labeled Navigation" 
  class="absolute bottom-3 left-4 right-4 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-10"
>
  <button type="button" onclick="navigateTo('home')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    <span class="text-[10px] font-medium">Home</span>
  </button>

  <button type="button" onclick="showToast('Transactions ledger view')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
    <span class="text-[10px] font-medium">Transactions</span>
  </button>

  <button type="button" onclick="openNotificationsModal()" class="flex flex-col items-center gap-1 text-[#215cd4] relative">
    <div class="relative">
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
      <span class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">4</span>
    </div>
    <span class="text-[10px] font-semibold text-gray-700">Notifications</span>
  </button>

  <button type="button" onclick="showToast('Account details')" class="flex flex-col items-center gap-1 text-gray-500 hover:text-[#215cd4]">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
    <span class="text-[10px] font-medium">Account</span>
  </button>
</nav>
```

---

## 4. Anti-Patterns & Rules

1. **Strict Reference Scope**: Navigation components reference ONLY the implementations in `web/`.
2. **Accessible Landmarks**: All navigation wrappers must use `<nav aria-label="...">` and every button must have an accessible name or `aria-label`.
3. **Floating Bar Elevation**: Always use `.floating-nav` class to ensure subtle glassmorphic drop shadow.

