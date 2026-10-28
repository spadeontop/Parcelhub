# Layouts & Viewport Structure Reference

This document provides canonical, copy-pasteable recipes for mobile frames, viewport wrappers, studio control headers, and vertical stepper timelines in **{{SKILL_NAME}}**, derived strictly from `web/` (`web/index.html`, `web/style.css`, `web/app.js`).

---

## 1. Studio Review Header Bar (Scenario & Status Controls)

Sticky top control bar for review, screen jumping, and hub status simulation.

```html
<header class="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md select-none">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
    <!-- Brand Info -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1">
        <img src="./assets/parcelhub_logo.png" alt="ParcelHub Logo" class="w-full h-full object-contain">
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold text-white tracking-wide">ParcelHub MCP</h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Figma 1:1 Implementation</span>
        </div>
        <p class="text-[11px] text-slate-400">Interactive Prototype • HTML + TailwindCSS + JS</p>
      </div>
    </div>

    <!-- Quick Scenario Toggles -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
        <span class="text-xs font-medium text-slate-300">Hub Status:</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="hub-status-toggle" checked onchange="setHubOpen(this.checked)" class="sr-only peer" aria-label="Toggle Hub Open/Closed">
          <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      <button 
        type="button" 
        id="view-toggle-btn"
        onclick="setViewMode(state.viewMode === 'device' ? 'fullscreen' : 'device')"
        class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
      >
        Fullscreen Mode
      </button>
    </div>
  </div>
</header>
```

---

## 2. Phone Frame Mockup Bezel & Dynamic Island

Enclosing frame with tactile hardware bezel (`.phone-mockup`), dynamic island (`.dynamic-island`), and status bar.

```html
<main class="flex-1 flex items-center justify-center p-2 sm:p-6" id="device-wrapper">
  <div 
    id="phone-frame" 
    class="phone-mockup w-full max-w-[420px] bg-white text-gray-900 rounded-[48px] overflow-hidden my-6 transition-all duration-300 relative border-4 border-slate-800 shadow-2xl"
  >
    <!-- Top Bezel / Dynamic Island / Status Bar -->
    <div id="phone-bezel-header" class="bg-white px-7 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-gray-900 select-none">
      <span>9:41</span>
      <div class="dynamic-island"></div>
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.64-.64C7.93 20.26 9.88 21 12 21s4.07-.74 5.61-1.97l.64.64c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.64-.64C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
        <div class="w-5 h-2.5 border border-gray-900 rounded-xs p-0.5 flex items-center">
          <div class="w-3 h-full bg-gray-900 rounded-3xs"></div>
        </div>
      </div>
    </div>

    <!-- Dynamic Active Screen Viewport -->
    <div id="mobile-screen-content" class="min-h-[780px] overflow-y-auto">
      <!-- Active screen content rendered dynamically -->
    </div>

    <!-- Bottom Home Indicator Bar -->
    <div class="bg-white py-2 flex justify-center select-none">
      <div class="w-32 h-1 bg-gray-300 rounded-full"></div>
    </div>
  </div>
</main>
```

---

## 3. Vertical Stepper Timeline (Tracking Order Stages)

Order lifecycle progression with vertical stepper line and pulsating indicator.

```html
<div class="relative pl-7 space-y-6">
  <!-- Stepper Vertical Connecting Line -->
  <div class="stepper-line"></div>

  <!-- Step 1: Completed -->
  <div class="relative flex items-start gap-3">
    <div class="absolute -left-7 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
    </div>
    <div>
      <h5 class="text-xs font-bold text-gray-900">Order Placed</h5>
      <p class="text-[10px] text-gray-500 font-mono">17 Oct 16:32</p>
    </div>
  </div>

  <!-- Step 2: Active Pulse -->
  <div class="relative flex items-start gap-3">
    <div class="absolute -left-7 w-6 h-6 rounded-full bg-[#10b780] pulse-green text-white flex items-center justify-center z-10">
      <div class="w-2 h-2 rounded-full bg-white"></div>
    </div>
    <div>
      <h5 class="text-xs font-bold text-gray-900">Ready to Claim</h5>
      <p class="text-[10px] text-gray-500 font-mono">17 Oct 22:32</p>
    </div>
  </div>
</div>
```

---

## 4. Anti-Patterns & Rules

1. **Strict Reference Scope**: All layout structures reference ONLY `web/`. Never introduce desktop `<aside>` navigation sidebars.
2. **Device Width Bounds**: Phone viewport is constrained to `max-w-[420px]` in device mode, expandable to `max-w-md` in fullscreen mode.
3. **Bezel Radii**: Phone frame must maintain `rounded-[48px]`, with dynamic island `rounded-[20px]`.

