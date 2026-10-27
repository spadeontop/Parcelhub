# Cards & Containers Reference

This document provides canonical, copy-pasteable recipes for card layouts and containers in **{{SKILL_NAME}}**.
Cards use the 30% secondary surface depth (`bg-surface` or `bg-surface-elevated`) with crisp borders (`border-border`).

---

## 1. Metric / Stat Card (KPI)

Used for dashboards, analytics, and overview panels.

```html
<div class="p-5 rounded-lg bg-surface border border-border shadow-xs space-y-3">
  <div class="flex items-center justify-between text-muted-foreground">
    <span class="text-xs font-medium tracking-wide uppercase">Active Requests</span>
    <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-success-subtle text-success">
      +14.2%
    </span>
  </div>
  <div class="space-y-1">
    <div class="text-2xl font-bold font-mono tracking-tight text-foreground">1,429,820</div>
    <p class="text-xs text-muted-foreground">Recorded over the past 24 hours.</p>
  </div>
</div>
```

---

## 2. Interactive Action Card

Clickable cards with subtle hover scale/border transitions.

```html
<div class="group relative p-5 rounded-lg bg-surface border border-border hover:border-border-subtle hover:bg-surface-elevated transition-all duration-150 cursor-pointer">
  <div class="flex items-start justify-between">
    <div class="space-y-1.5">
      <h3 class="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
        Database Replication
      </h3>
      <p class="text-xs text-muted-foreground line-clamp-2">
        Manage cross-region read replicas and automated point-in-time recovery intervals.
      </p>
    </div>
    <div class="text-muted-foreground group-hover:text-foreground transition-colors">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
  <div class="mt-4 flex items-center gap-2 pt-3 border-t border-border-subtle">
    <span class="inline-block w-2 h-2 rounded-full bg-success"></span>
    <span class="text-xs text-muted-foreground font-mono">Cluster: ap-southeast-1</span>
  </div>
</div>
```

---

## 3. Elevated Content Container with Header & Footer

```html
<div class="rounded-lg bg-surface border border-border overflow-hidden">
  <!-- Card Header -->
  <div class="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
    <div>
      <h3 class="text-sm font-semibold text-foreground">API Token Management</h3>
      <p class="text-xs text-muted-foreground">Tokens grant programmatic access to your deployment.</p>
    </div>
    <button class="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">
      Generate Token
    </button>
  </div>
  
  <!-- Card Body -->
  <div class="p-5 space-y-4">
    <div class="p-3 rounded-md bg-muted text-xs font-mono text-muted-foreground border border-border-subtle">
      ag_live_9f82d1c7400bc94...
    </div>
  </div>

  <!-- Card Footer -->
  <div class="px-5 py-3 bg-muted/30 border-t border-border-subtle flex items-center justify-between text-xs text-muted-foreground">
    <span>Last used 3 minutes ago</span>
    <a href="#docs" class="text-primary hover:underline">Read API Docs</a>
  </div>
</div>
```

---

## 4. Anti-Patterns & Guidelines

1. **NO Deep Shadows**: Avoid exaggerated `shadow-2xl`. Keep elevation defined by crisp `border-border` and subtle tone changes (`bg-surface-elevated`).
2. **Padding Consistency**: Standardize internal card padding to `p-5` (desktop) and `p-4` (mobile).
