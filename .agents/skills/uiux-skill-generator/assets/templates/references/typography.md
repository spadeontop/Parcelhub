# Typography Scales & Hierarchy

This document defines the strict typographic contract for **{{SKILL_NAME}}**.
Adhere strictly to these font pairings, hierarchy rules, and line-height combinations.

---

## 1. Font Family Stacks (from `web/style.css` and `web/index.html`)

- **Primary Sans (Body & UI)**:
  `font-sans`: `'Google Sans Flex', 'Google Sans', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace (Currency, Barcodes, Order IDs & Timestamps)**:
  `font-mono` / `.font-mono-numbers`: `'JetBrains Mono', monospace`

---

## 2. Type Hierarchy Scale

| Semantic Role | Tailwind Recipe | Tracking & Leading | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Title (`h1`)** | `text-xl font-bold tracking-tight text-gray-900` | `tracking-tight leading-none` | Top brand header ("Parcelhub") |
| **Subtitle / Station** | `text-[10px] font-semibold tracking-wider text-gray-500 uppercase` | `tracking-wider` | Hub station label ("LILY'S CATERING HUB") |
| **Screen Title (`h2`)** | `text-2xl font-bold text-gray-900` | `tracking-tight` | Screen headers ("Create an Order", "Welcome Nyeowsz!") |
| **Section Header (`h3`)**| `text-lg font-bold text-gray-900` | `leading-normal` | Section titles ("Activities", "Authorize Release") |
| **Item Header (`h4`)** | `text-base font-bold text-gray-900` | `leading-tight` | Product names ("VXE R1 Nearlink") |
| **Body (Default)** | `text-sm font-medium text-gray-700` | `leading-relaxed` | General descriptions, helper texts |
| **Body (Muted)** | `text-xs text-gray-500` | `leading-relaxed` | Date stamps, secondary meta |
| **Monospace Values** | `font-mono font-bold text-gray-900` | `tabular-nums` | Waybills (`PH2696153366792H`), Currencies (`₱480`) |

---

## 3. Typographic Recipes

### Home Brand & Subtitle
```html
<div class="flex items-center gap-2.5">
  <img src="./assets/parcelhub_logo.png" alt="Parcelhub Logo" class="w-8 h-8 object-contain">
  <div>
    <h1 class="text-xl font-bold tracking-tight text-gray-900 leading-none">Parcelhub</h1>
    <p class="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mt-0.5">LILY'S CATERING HUB</p>
  </div>
</div>
```

### Monetary Line Item & Waybill Barcode
```html
<div class="flex justify-between items-baseline py-2 border-b border-gray-100">
  <span class="text-xs text-gray-500">COD Payout:</span>
  <span class="font-mono font-bold text-gray-900 text-sm">₱480.00</span>
</div>
```

---

## 4. Anti-Patterns & Rules

1. **Strict Reference Scope**: Typography rules reference ONLY `web/`.
2. **Numeric Alignment**: Always apply `font-mono` to financial amounts, waybills, and countdowns.
3. **Hierarchy Integrity**: Do not skip heading levels in the DOM tree. Maintain clean semantic outlines.
