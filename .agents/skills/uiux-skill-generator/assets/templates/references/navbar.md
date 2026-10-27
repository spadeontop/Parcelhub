# Navigation & Headers Reference

This document provides canonical, copy-pasteable recipes for navigation bars, application headers, and breadcrumbs in **{{SKILL_NAME}}**.
Navigation must be semantically enclosed in `<nav>` elements with unambiguous `aria-label` tags.

---

## 1. Desktop Application Header

Sticky top header with brand identity, nav items, theme toggle, and user profile pill.

```html
<header class="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-6">
      <a href="/" class="flex items-center gap-2 text-foreground font-semibold tracking-tight text-sm focus-visible:ring-2 focus-visible:ring-ring rounded-md">
        <span class="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-mono text-xs font-bold">
          Δ
        </span>
        <span>{{SKILL_NAME}}</span>
      </a>

      <!-- Primary Navigation Links -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-1">
        <a href="#dashboard" class="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground transition-colors">
          Dashboard
        </a>
        <a href="#deployments" class="px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          Deployments
        </a>
        <a href="#analytics" class="px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          Analytics
        </a>
        <a href="#settings" class="px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          Settings
        </a>
      </nav>
    </div>

    <!-- Actions & Profile -->
    <div class="flex items-center gap-3">
      <!-- Dark/Light Mode Switcher Button -->
      <button 
        type="button" 
        id="theme-toggle" 
        aria-label="Toggle dark mode" 
        class="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg class="w-4 h-4 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg class="w-4 h-4 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Profile Avatar -->
      <div class="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-medium text-foreground">
        US
      </div>
    </div>
  </div>
</header>
```

---

## 2. Breadcrumbs Bar

```html
<nav aria-label="Breadcrumb" class="flex items-center text-xs text-muted-foreground py-2">
  <ol class="flex items-center gap-1.5">
    <li>
      <a href="#home" class="hover:text-foreground transition-colors">Home</a>
    </li>
    <li class="text-border">/</li>
    <li>
      <a href="#services" class="hover:text-foreground transition-colors">Services</a>
    </li>
    <li class="text-border">/</li>
    <li class="font-medium text-foreground" aria-current="page">API Gateway</li>
  </ol>
</nav>
```

---

## 3. Anti-Patterns & Rules

1. **NO Missing Landmarks**: Navigation links must always be contained within `<nav aria-label="...">`.
2. **NO Hardcoded Heights**: Keep header standard at `h-14` (56px) with items vertically centered.
3. **Always Include Theme Switcher Accessibility**: Theme toggle buttons must carry explicit `aria-label="Toggle dark mode"`.
