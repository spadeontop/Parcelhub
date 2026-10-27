# Navigation & Headers Reference (Mobile Fintech)

This document provides canonical, copy-pasteable recipes for mobile headers, status badges, and bottom dock navigation in **modern-mobile-fintech-design-skill**.

---

## 1. Mobile Floating Bottom Navigation Dock

Floating pill dock centered at the bottom of the mobile viewport with home, activities/orders, help, and profile icons.

```html
<nav 
  aria-label="Mobile Navigation Dock"
  class="fixed bottom-6 inset-x-6 max-w-sm mx-auto h-16 bg-surface/95 backdrop-blur-md border border-border rounded-full shadow-lg flex items-center justify-around px-4 z-50"
>
  <!-- Home Tab (Active) -->
  <button 
    type="button" 
    aria-label="Home"
    class="flex items-center justify-center w-11 h-11 rounded-full text-primary hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
  >
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  </button>

  <!-- Activities / Orders Tab -->
  <button 
    type="button" 
    aria-label="Activities"
    class="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
  >
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  </button>

  <!-- Help / Support Tab -->
  <button 
    type="button" 
    aria-label="Help and Support"
    class="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
  >
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>

  <!-- Profile Tab -->
  <button 
    type="button" 
    aria-label="User Profile"
    class="flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
  >
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </button>
</nav>
```

---

## 2. Mobile Top Header with Tenant & Status Pill

Top mobile application header with brand logo, tenant/hub subtitle, notification toggle pill, and notification bell.

```html
<header class="w-full py-4 px-4 flex items-center justify-between">
  <!-- Brand / Tenant Hub -->
  <div class="flex items-center gap-3">
    <!-- Brand Logo Icon -->
    <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
    <div>
      <h1 class="text-base font-bold tracking-tight text-foreground leading-tight">
        ApexPay
      </h1>
      <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        LILY'S CATERING HUB
      </p>
    </div>
  </div>

  <!-- Header Right Actions -->
  <div class="flex items-center gap-2">
    <!-- Notification Enable Pill Button -->
    <button 
      type="button"
      class="px-2.5 py-1 rounded-full bg-success-subtle text-success border border-success/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-success-subtle/80 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    >
      <span>Turn on notifications</span>
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>

    <!-- Notification Bell Button -->
    <button 
      type="button" 
      aria-label="View notifications" 
      class="p-2 rounded-full text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring transition-colors relative"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    </button>
  </div>
</header>
```

---

## 3. Anti-Patterns & Guidelines

1. **Floating Dock Z-Index**: Always give the floating bottom dock `z-50` and ensure the main container padding accounts for the bottom dock with `pb-28`.
2. **Accessible Labels**: All icon-only navigation buttons must feature an explicit `aria-label`.
