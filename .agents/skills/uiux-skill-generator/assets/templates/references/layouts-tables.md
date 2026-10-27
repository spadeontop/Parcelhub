# Layouts & Data Tables Reference

This document provides canonical, copy-pasteable recipes for structural application layouts, sidebars, and responsive data tables in **{{SKILL_NAME}}**.

---

## 1. Application Shell (Sidebar + Main Content)

```html
<div class="min-h-screen bg-background text-foreground flex">
  <!-- Desktop Sidebar -->
  <aside aria-label="Sidebar Navigation" class="hidden md:flex flex-col w-64 border-r border-border bg-surface shrink-0">
    <!-- Workspace Brand -->
    <div class="h-14 px-4 flex items-center border-b border-border gap-2 font-semibold text-sm">
      <span class="w-2 h-2 rounded-full bg-primary"></span>
      <span>{{SKILL_NAME}}</span>
    </div>

    <!-- Sidebar Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      <a href="#overview" class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md bg-muted text-foreground">
        <span>Overview</span>
      </a>
      <a href="#activity" class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
        <span>Activity Log</span>
      </a>
      <a href="#integrations" class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
        <span>Integrations</span>
      </a>
    </nav>

    <!-- Sidebar Footer -->
    <div class="p-3 border-t border-border">
      <div class="px-3 py-2 rounded-md bg-muted/40 text-xs text-muted-foreground">
        Plan: <strong class="text-foreground">Enterprise Tier</strong>
      </div>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="flex-1 flex flex-col min-w-0">
    <div class="max-w-6xl w-full mx-auto p-6 space-y-6">
      <!-- Injected Page Content -->
    </div>
  </main>
</div>
```

---

## 2. Responsive Data Table

Dense, accessible table with status badges and action triggers.

```html
<div class="rounded-lg bg-surface border border-border overflow-hidden">
  <!-- Table Header Actions -->
  <div class="p-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div class="relative max-w-xs w-full">
      <input 
        type="search" 
        placeholder="Filter instances..." 
        aria-label="Filter instances"
        class="w-full px-3 py-1.5 text-xs rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
    <div class="flex items-center gap-2">
      <button class="px-3 py-1.5 text-xs font-medium rounded-md bg-surface text-foreground border border-border hover:bg-muted">
        Export CSV
      </button>
    </div>
  </div>

  <!-- Table Body -->
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs text-muted-foreground">
      <thead class="bg-muted/40 text-foreground font-medium border-b border-border-subtle uppercase tracking-wider text-[11px]">
        <tr>
          <th scope="col" class="px-4 py-3">Service Name</th>
          <th scope="col" class="px-4 py-3">Region</th>
          <th scope="col" class="px-4 py-3">Status</th>
          <th scope="col" class="px-4 py-3 text-right">Latency</th>
          <th scope="col" class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border-subtle">
        <tr class="hover:bg-muted/30 transition-colors">
          <td class="px-4 py-3 font-medium text-foreground">auth-service-v2</td>
          <td class="px-4 py-3 font-mono">us-east-1</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-subtle text-success">
              <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
              Operational
            </span>
          </td>
          <td class="px-4 py-3 text-right font-mono text-foreground">24ms</td>
          <td class="px-4 py-3 text-right">
            <button class="text-primary hover:underline font-medium">Configure</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Table Pagination -->
  <div class="px-4 py-3 border-t border-border-subtle flex items-center justify-between text-xs text-muted-foreground">
    <span>Showing 1 to 10 of 42 results</span>
    <div class="flex items-center gap-1">
      <button class="px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-muted disabled:opacity-40" disabled>
        Previous
      </button>
      <button class="px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-muted">
        Next
      </button>
    </div>
  </div>
</div>
```

---

## 3. Anti-Patterns & Rules

1. **NO Missing Table Semantics**: Always declare `<th scope="col">` on table headers for screen-reader navigability.
2. **Numeric Alignment**: Numeric values (latencies, counts, financial currencies) must be aligned to the right (`text-right font-mono`).
3. **NO Marketing Heroes in Dashboards**: Never render marketing slogans, giant splash headlines, or promotional callouts inside an application shell. Application shells are workspace environments focused on operational density.
4. **App Shell Routing vs Single-Page Landing**: Application views must be organized into distinct functional routes/views (e.g. Overview, Services, Settings, Logs). Do not flatten multi-feature tools into a single continuous marketing landing page scroll.
