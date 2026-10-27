# ParcelHub Fintech Domain Invariants & Component Recipes

This reference specifies the authoritative finite state machine, zero-credit escrow invariants, and canonical mobile UI recipes for **ParcelHub** under **modern-mobile-fintech-design-skill**.

---

## 1. Domain Invariants & Finite State Machine

```
[ STAGED ] ──► [ FUNDED ] ──► [ RECEIVED_LOGGED ] ──► [ CLAIMED ]
(Pre-registered  (Cash deposited   (Courier paid from    (Handover done
 at counter)      in envelope)      envelope; Ready)      + change returned)
```

1. **Solvency Invariant (Zero-Credit Escrow)**:
   - Hub never fronts cash. Payout to couriers is blocked unless cash is physically deposited: `cash_deposited >= cod_amount`.
   - Each consignment has an isolated physical cash envelope (`envelope_number`).
2. **State Progression Invariant (Monotonic Flow)**:
   - State strictly moves forward: `STAGED -> FUNDED -> RECEIVED_LOGGED -> CLAIMED`. No skipping or reversals.
3. **Station Payment Ping Invariant (Counter Check-in)**:
   - Staff desk terminal is locked for cash acceptance until the student physically pings the Hub station (`payment_pinged_at != null`) via Station QR (`CTU-DANAO-MAIN-HUB`) or the mobile notification/check-in toggle.
4. **Inverted Handshake & Atomic Release Gate**:
   - Staff cannot release parcels until the student dispatches a dynamic claim ping signed with their **6-digit MPIN** (`claim_pinged_at != null`).
5. **Identity Decoupling**:
   - Couriers only see Waybill Number and exact COD cash. Student identity is zero-knowledge to external delivery drivers.

---

## 2. Canonical UI Component Recipes

### 2.1 6-Digit MPIN Security Gate / Signing Modal
Used for app launch security and atomic consignment release confirmation.

```html
<div class="modal-overlay open" id="mpin-modal" role="dialog" aria-modal="true">
  <div class="modal-drawer">
    <div class="drawer-pill-handle"></div>
    <div class="drawer-header">
      <div class="space-y-0.5">
        <h3 class="text-base font-bold text-foreground">Authorize Release</h3>
        <p class="text-xs text-muted-foreground">Enter your 6-digit MPIN to sign the claim ping</p>
      </div>
      <button type="button" class="drawer-close-btn hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close MPIN modal">✕</button>
    </div>

    <!-- 6-Digit MPIN Input Indicator -->
    <div class="flex items-center justify-center gap-3 py-4">
      <div class="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-border"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-border"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-border"></div>
    </div>

    <!-- Numeric Keypad Grid -->
    <div class="grid grid-cols-3 gap-2.5 pt-2">
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">1</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">2</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">3</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">4</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">5</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">6</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">7</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">8</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">9</button>
      <button type="button" class="py-3 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted" aria-label="Cancel">Cancel</button>
      <button type="button" class="py-3 text-lg font-bold rounded-xl bg-surface border border-border text-foreground hover:bg-surface-elevated active:scale-95 transition-all">0</button>
      <button type="button" class="py-3 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted" aria-label="Backspace">⌫</button>
    </div>
  </div>
</div>
```

---

### 2.2 Consignment Item with State-Driven Badges
Displays package title, waybill/timestamp, COD status, and dynamic state indicator.

```html
<!-- Ready to Claim Item (RECEIVED_LOGGED) -->
<div class="flex items-center justify-between py-3 border-b border-border-subtle last:border-none">
  <div class="space-y-0.5">
    <div class="flex items-center gap-2">
      <h4 class="text-sm font-bold text-foreground">VXE R1 Nearlink</h4>
      <span class="text-[10px] font-mono text-muted-foreground">#ENV-402</span>
    </div>
    <p class="text-xs text-muted-foreground">October 10, 2026 10:30 • COD: ₱1,420.00</p>
  </div>
  <div class="flex flex-col items-end gap-1">
    <span class="inline-flex items-center text-xs font-semibold text-success">
      Ready to Claim
    </span>
  </div>
</div>

<!-- Staged Item (Awaiting Counter Cash-In) -->
<div class="flex items-center justify-between py-3 border-b border-border-subtle last:border-none">
  <div class="space-y-0.5">
    <div class="flex items-center gap-2">
      <h4 class="text-sm font-bold text-foreground">Keychron Q1 Pro</h4>
      <span class="text-[10px] font-mono text-muted-foreground">#ENV-408</span>
    </div>
    <p class="text-xs text-muted-foreground">October 11, 2026 14:00 • COD: ₱4,850.00</p>
  </div>
  <div class="flex flex-col items-end gap-1">
    <span class="inline-flex items-center text-xs font-semibold text-warning">
      Pending Deposit
    </span>
  </div>
</div>
```

---

### 2.3 Physical Escrow Envelope Breakdown Card
Displays the zero-credit solvency balance inside the isolated physical envelope.

```html
<div class="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
  <div class="flex items-center justify-between text-xs text-muted-foreground">
    <span class="font-medium">Escrow Envelope #ENV-402</span>
    <span class="font-semibold text-primary">Solvent & Verified</span>
  </div>
  <div class="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-center">
    <div>
      <p class="text-[10px] text-muted-foreground uppercase font-semibold">COD Due</p>
      <p class="text-xs font-bold text-foreground">₱1,420.00</p>
    </div>
    <div>
      <p class="text-[10px] text-muted-foreground uppercase font-semibold">Deposited</p>
      <p class="text-xs font-bold text-success">₱1,500.00</p>
    </div>
    <div>
      <p class="text-[10px] text-muted-foreground uppercase font-semibold">Change Due</p>
      <p class="text-xs font-bold text-foreground">₱80.00</p>
    </div>
  </div>
</div>
```

---

### 2.4 Multi-Parcel Batch Claim Action Bar
Appears when recipient selects one or more parcels in `RECEIVED_LOGGED` state.

```html
<div class="p-3 rounded-2xl bg-surface border border-border shadow-md flex items-center justify-between gap-3">
  <div class="flex items-center gap-2">
    <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
      2
    </div>
    <span class="text-xs font-semibold text-foreground">Parcels Selected</span>
  </div>
  <button 
    type="button" 
    class="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring transition-all"
  >
    Claim Selected (2)
  </button>
</div>
```
