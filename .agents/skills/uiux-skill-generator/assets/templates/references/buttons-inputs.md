# Buttons & Form Controls Reference

This document provides canonical, copy-pasteable recipes for interactive controls in **{{SKILL_NAME}}**.
Every interactive element MUST include visible `:hover`, `:active`, and `:focus-visible` ring states.

---

## 1. Button Variants

### Primary Action Button
```html
<button type="button" class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none">
  <span>Save Changes</span>
</button>
```

### Secondary / Outline Button
```html
<button type="button" class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-surface text-foreground border border-border hover:bg-muted hover:border-border-subtle active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none">
  <span>Cancel</span>
</button>
```

### Ghost / Subdued Button
```html
<button type="button" class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  <span>View Logs</span>
</button>
```

### Destructive Button
```html
<button type="button" class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive">
  <span>Delete Service</span>
</button>
```

### Accessible Icon Button
```html
<button type="button" aria-label="Settings" class="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
</button>
```

---

## 2. Form Inputs & Controls

### Standard Text Input with Label & Helper
```html
<div class="space-y-1.5">
  <label for="project-name" class="block text-xs font-medium text-foreground">Project Name</label>
  <input 
    type="text" 
    id="project-name" 
    name="project_name" 
    placeholder="e.g. Acme Web Platform" 
    class="w-full px-3 py-2 text-sm rounded-md bg-surface text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
  />
  <p class="text-xs text-muted-foreground">Used to identify your project across deployment environments.</p>
</div>
```

### Invalid / Error Input State
```html
<div class="space-y-1.5">
  <label for="user-email" class="block text-xs font-medium text-foreground">Email Address</label>
  <input 
    type="email" 
    id="user-email" 
    name="user_email" 
    value="invalid-email" 
    aria-invalid="true" 
    aria-describedby="email-error"
    class="w-full px-3 py-2 text-sm rounded-md bg-surface text-foreground border border-destructive focus:outline-none focus:ring-2 focus:ring-destructive transition-colors"
  />
  <p id="email-error" class="text-xs text-destructive">Please enter a valid email address.</p>
</div>
```

### Select Dropdown
```html
<div class="space-y-1.5">
  <label for="environment-select" class="block text-xs font-medium text-foreground">Environment</label>
  <select 
    id="environment-select" 
    name="environment" 
    class="w-full px-3 py-2 text-sm rounded-md bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
  >
    <option value="production">Production</option>
    <option value="staging">Staging</option>
    <option value="development">Development</option>
  </select>
</div>
```

---

## 3. Accessibility Checklist

- [ ] All inputs MUST have an associated `<label for="id">` or explicit `aria-label`.
- [ ] Icon-only buttons MUST have a non-empty `aria-label`.
- [ ] Interactive elements must have a minimum touch target size of 36px–44px.
- [ ] Focus outlines (`focus-visible:ring-2`) must never be suppressed with `outline: none` without a ring replacement.
