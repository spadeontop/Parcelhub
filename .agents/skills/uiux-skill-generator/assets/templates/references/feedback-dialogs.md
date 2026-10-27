# Feedback, Modals & Dialogs Reference

This document provides canonical, copy-pasteable recipes for modal dialogs, status banners, toast alerts, and empty states in **{{SKILL_NAME}}**.

---

## 1. Accessible Modal Dialog

Includes dark backdrop overlay, surface elevation, and clear action boundaries.

```html
<div 
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-headline"
>
  <div class="relative w-full max-w-md rounded-xl bg-surface border border-border shadow-lg p-6 space-y-4">
    <!-- Header -->
    <div class="space-y-1">
      <h3 id="modal-headline" class="text-base font-semibold text-foreground">
        Revoke API Key
      </h3>
      <p class="text-xs text-muted-foreground">
        Are you sure you want to deactivate this API key? Applications using this token will fail immediately.
      </p>
    </div>

    <!-- Alert Note -->
    <div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
      <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>This action cannot be undone.</span>
    </div>

    <!-- Modal Actions -->
    <div class="flex items-center justify-end gap-2 pt-2">
      <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-surface text-foreground border border-border hover:bg-muted">
        Cancel
      </button>
      <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Revoke Key
      </button>
    </div>
  </div>
</div>
```

---

## 2. Functional Entity / Form Creation Modal

Used for entity creation and configuration mutations without navigating away from the dashboard canvas.

```html
<div 
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-labelledby="form-modal-title"
>
  <div class="relative w-full max-w-lg rounded-xl bg-surface border border-border shadow-2xl p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border pb-3">
      <h3 id="form-modal-title" class="text-base font-semibold text-foreground">
        Create New Webhook
      </h3>
      <button type="button" aria-label="Close dialog" class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Form Body -->
    <form class="space-y-4">
      <div class="space-y-1.5">
        <label for="webhook-name" class="block text-xs font-medium text-foreground">Endpoint Name</label>
        <input 
          type="text" 
          id="webhook-name" 
          name="name" 
          placeholder="e.g. Production Slack Alerts"
          class="w-full px-3 py-2 text-xs rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div class="space-y-1.5">
        <label for="webhook-url" class="block text-xs font-medium text-foreground">Destination URL</label>
        <input 
          type="url" 
          id="webhook-url" 
          name="url" 
          placeholder="https://api.example.com/webhooks"
          class="w-full px-3 py-2 text-xs rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div class="space-y-1.5">
        <label for="webhook-event" class="block text-xs font-medium text-foreground">Trigger Event</label>
        <select 
          id="webhook-event" 
          name="event"
          class="w-full px-3 py-2 text-xs rounded-md bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="deploy.success">deploy.success</option>
          <option value="deploy.failure">deploy.failure</option>
          <option value="auth.incident">auth.incident</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
        <button type="button" class="px-3.5 py-2 text-xs font-medium rounded-md bg-surface text-foreground border border-border hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" class="px-3.5 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Save Webhook
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 3. Slide-Over Detail Drawer Sheet

Anchored right panel for deep entity inspection, logs, and sub-settings while preserving dashboard canvas context.

```html
<div 
  class="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-labelledby="drawer-title"
>
  <div class="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col">
    <!-- Drawer Header -->
    <div class="h-14 px-5 flex items-center justify-between border-b border-border shrink-0">
      <div>
        <h3 id="drawer-title" class="text-sm font-semibold text-foreground">
          Service Details
        </h3>
        <p class="text-[11px] text-muted-foreground">ID: srv-8921-prod</p>
      </div>
      <button type="button" aria-label="Close drawer" class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Drawer Content -->
    <div class="flex-1 overflow-y-auto p-5 space-y-6">
      <!-- Status Summary -->
      <div class="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
        <div class="text-[11px] text-muted-foreground">Health Status</div>
        <div class="flex items-center gap-2 text-xs font-semibold text-foreground">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          <span>Healthy (99.98% uptime)</span>
        </div>
      </div>

      <!-- Detail Meta List -->
      <div class="space-y-3">
        <h4 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</h4>
        <dl class="divide-y border-y border-border-subtle text-xs">
          <div class="py-2.5 flex justify-between">
            <dt class="text-muted-foreground">Cluster</dt>
            <dd class="font-mono text-foreground">aws-us-east-1</dd>
          </div>
          <div class="py-2.5 flex justify-between">
            <dt class="text-muted-foreground">Memory Allocated</dt>
            <dd class="font-mono text-foreground">2048 MB</dd>
          </div>
          <div class="py-2.5 flex justify-between">
            <dt class="text-muted-foreground">Instances</dt>
            <dd class="font-mono text-foreground">4 Active</dd>
          </div>
          <div class="py-2.5 flex justify-between">
            <dt class="text-muted-foreground">Auto-scale</dt>
            <dd class="text-foreground">Enabled</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Drawer Footer Actions -->
    <div class="p-4 border-t border-border bg-surface shrink-0 flex items-center justify-between">
      <button type="button" class="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
        Restart Service
      </button>
      <button type="button" class="px-3.5 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Save Changes
      </button>
    </div>
  </div>
</div>
```

---

## 4. Status Banners (Alerts)

### Success Notification
```html
<div role="status" class="p-3.5 rounded-lg bg-success-subtle border border-success/30 text-success text-xs flex items-start gap-2.5">
  <span class="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0"></span>
  <div class="space-y-0.5">
    <strong class="font-medium text-foreground">Deployment Successful</strong>
    <p class="text-muted-foreground">Version 2.4.1 has rolled out to 100% of global edge nodes.</p>
  </div>
</div>
```

### Warning Notice
```html
<div role="alert" class="p-3.5 rounded-lg bg-warning-subtle border border-warning/30 text-warning text-xs flex items-start gap-2.5">
  <span class="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0"></span>
  <div class="space-y-0.5">
    <strong class="font-medium text-foreground">Approaching Rate Limit</strong>
    <p class="text-muted-foreground">You have consumed 88% of your monthly API request quota.</p>
  </div>
</div>
```

---

## 5. Empty State

```html
<div class="p-12 text-center rounded-lg border border-dashed border-border bg-surface/50 space-y-3">
  <div class="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  </div>
  <div class="space-y-1">
    <h4 class="text-sm font-semibold text-foreground">No Webhooks Configured</h4>
    <p class="text-xs text-muted-foreground max-w-sm mx-auto">
      Connect external endpoints to receive real-time notifications about deployment lifecycle changes.
    </p>
  </div>
  <button class="mt-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
    Add Webhook
  </button>
</div>
```

---

## 6. Progressive Disclosure Protocol (PoLP)

To prevent visual clutter and cognitive overload:
1. **Primary Canvas (60%)**: Keep focused on high-level operational metrics and primary entity tables.
2. **Modals (Dialogs)**: Use for discrete, high-focus transactions (entity creation, credential generation, irreversible destructive confirmations).
3. **Slide-Over Drawers (Sheets)**: Use for inspecting entity details, audit history, and configuration tabs without navigating away from the table.
4. **Accessibility**: Every overlay MUST declare `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and provide an accessible close button (`aria-label="Close dialog"`).
