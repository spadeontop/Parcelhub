# Cards & Containers Reference (Mobile Fintech)

This document provides canonical, copy-pasteable recipes for card layouts and containers in **modern-mobile-fintech-design-skill**.
Cards use high-contrast surface hierarchy: a dark elevated hero card for primary accounts and balances, paired with soft rounded containers for activity streams.

---

## 1. Mobile Fintech Dark Hero Balance & Actions Card

The signature hero card: deep dark charcoal elevated canvas, clean greeting or balance metrics, and side-by-side primary and secondary action buttons.

```html
<div class="p-6 rounded-2xl bg-surface-elevated border border-border shadow-md space-y-5">
  <!-- Greeting & Balance Details -->
  <div class="space-y-1">
    <h2 class="text-xl font-bold tracking-tight text-foreground">
      Welcome Nyeowsz!
    </h2>
    <p class="text-sm text-muted-foreground font-medium">
      Create an order to get started
    </p>
  </div>

  <!-- Primary & Secondary Quick Actions -->
  <div class="flex items-center gap-3">
    <!-- Primary CTA Button -->
    <button 
      type="button"
      class="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 shadow-sm text-center"
    >
      Create Order
    </button>

    <!-- Secondary Translucent Button -->
    <button 
      type="button"
      class="flex-1 py-2.5 px-4 rounded-xl bg-surface text-foreground font-semibold text-sm border border-border hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 text-center"
    >
      Transactions
    </button>
  </div>
</div>
```

---

## 2. Mobile Activities Container (Populated List State)

Soft rounded container (`bg-surface`) grouping active transactions or orders with status badges.

```html
<div class="p-5 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
  <!-- Activity Item 1 -->
  <div class="flex items-center justify-between py-2 border-b border-border-subtle last:border-none">
    <div class="space-y-0.5">
      <h3 class="text-sm font-bold text-foreground">VXE R1 Nearlink</h3>
      <p class="text-xs text-muted-foreground">October 10, 2026 10:30</p>
    </div>
    <span class="inline-flex items-center text-xs font-semibold text-success">
      Ready to Claim
    </span>
  </div>

  <!-- Activity Item 2 -->
  <div class="flex items-center justify-between py-2 border-b border-border-subtle last:border-none">
    <div class="space-y-0.5">
      <h3 class="text-sm font-bold text-foreground">Poco X6 Pro</h3>
      <p class="text-xs text-muted-foreground">October 7, 2026 7:41</p>
    </div>
    <span class="inline-flex items-center text-xs font-semibold text-success">
      Ready to Claim
    </span>
  </div>
</div>
```

---

## 3. Mobile Activities Container (Empty State)

Minimalist empty state displayed within the soft container when no records exist.

```html
<div class="p-10 rounded-3xl bg-surface border border-border shadow-xs flex flex-col items-center justify-center text-center space-y-2 min-h-[220px]">
  <p class="text-sm text-muted-foreground font-medium">
    You don't have any activities yet
  </p>
  <button 
    type="button" 
    class="text-sm font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded-md"
  >
    Create an order
  </button>
</div>
```

---

## 4. Anti-Patterns & Guidelines

1. **NO Arbitrary Radius**: Always use `rounded-2xl` for the hero card and `rounded-3xl` for the activity container to preserve the sleek modern mobile aesthetic.
2. **High-Contrast CTAs**: Primary action buttons must always meet 4.5:1 WCAG contrast against their background.
