# ParcelHub Staff Terminal UI Showcase

A standalone, high-fidelity implementation of the **ParcelHub Staff Terminal UI** conforming to the suggested Figma specification (`temp/suggested/`) and preserving 100% of the underlying business rules and invariants without modifying or regressing the client applications.

---

## UI/UX Specifications & Figma Mapping

| Figma Frame / Section | Figma Suggested File | Implementation in `temp/staff-ui/` | Key UI/UX Implementations |
| :--- | :--- | :--- | :--- |
| **Canvas & Frame 108** | `staff-ui-figma-css.txt` | Responsive container with **720px Figma Tablet Viewport**, **412px Mobile Viewport**, and **Fluid Viewport** | Reviewer toolbar enables live testing of both terminal tablet (720px) and handheld device modes. |
| **Theme System** | `staff-ui-figma-css.txt` | **Dark Console Theme** vs **Figma Spec Theme** | Live theme toggle allows evaluating both the modern production dark palette and the Figma steel-slate palette. |
| **Frame 109: Header** | `staff-ui-figma-css.txt` | Terminal Branding, Desk #01, Live status indicator | Compact header with intuitive search placeholder and manual "Search" button. |
| **Frame 114: Cards Area** | `staff-ui-figma-css.txt` | `#staff-orders-list` with active, ready, unpaid, claimed order cards | Clean cards with tracking numbers, staff notes snippet indicators, and contextual action affordances. |
| **Frame 112: Scan QR Button** | `staff-ui-figma-css.txt` | Floating Action Button (FAB) + Bottom Nav | Prominent thumb-accessible gradient FAB docked above bottom navigation with high visual affordance. |
| **Frame 111: Filter Area** | `staff-ui-figma-css.txt` | 4 Tabs: Active, Ready, Unpaid, Claimed | **Docked at Bottom above Frame 113** directly matching `staff-ui-home.png` (with live toggle to Top Header dock). Dynamic count badges per category (`Active (1)`, `Ready (1)`, `Unpaid (1)`, `Claimed (1)`). |
| **Frame 113: Navigation Area** | `staff-ui-figma-css.txt` | Bottom Bar: Counter Desk, Scan QR, Activity, Desk Info | Fast switching between desk terminal view, scanner modal, and completed activity. |
| **Frame 115: Camera Area for QR** | `staff-ui-qr-css.txt` | `#qr-scanner-modal` Auto Scan viewfinder | 60-30-10 compliant viewfinder card, laser scanning animation, optional live webcam feed, corner reticle brackets. |
| **Frame 117 & 118: Upload & Auto Scan** | `staff-ui-qr-css.txt` | Secondary upload target + Simulation trigger | Elegant secondary dashed upload target with photo icon and one-click sample QR scan simulation. |
| **Frame 116: Manual Order ID Lookup** | `staff-ui-qr-css.txt` | Manual Order ID with `XXX - XXX` Auto-formatting | Formats input strictly as `XXX - XXX` (e.g. typing `ORD408` automatically formats to `ORD - 408`) to locate internal orders. |

---

## Preserved Underlying Workflow & Invariants

1. **Rider Payout Policy Invariant**:
   - Payout to courier must strictly match retail COD. Customer deposit excess is returned as change and never used as buffer.
2. **Unpaid Cash Order Activation**:
   - Input requires `Amount Received >= Stated Fee`.
   - "Receive Cash & Activate" button remains disabled until valid.
   - Calculates change = `Amount Received - COD` and transitions order to `AWAITING_PARCEL`.
3. **Active Order 2-Step Courier Receipt Flow**:
   - **Step 1**: "Pay Courier (₱COD)" logs courier payout.
   - **Step 2**: "Attach Parcel Photo" verifies parcel image and transitions order to `READY_TO_CLAIM`.
4. **Ready to Claim Lock & Release**:
   - Locked state (`Locked (Awaiting Customer Prompt)`) prevents release until customer initiates claim.
   - Simulation button (`Simulate Prompt`) triggers the 10-minute countdown window.
   - Unlocked state enables staff "Release" button, transitioning order to `CLAIMED`.
5. **Real-time QR / Key Search & Cross-tab Suggestions**:
   - Searching a key/order that belongs to another status suggests a quick chip: `View ORD-xxx in [Status] tab →`.
   - Matcher handles alphanumeric keys and Order IDs (e.g. `ORD-408`, `ORD - 408`, and `PH-402-5544`).

---

## How to Run & View

1. **Open directly in browser**:
   Open `temp/staff-ui/index.html` directly in your browser of choice.
2. **Or run via local HTTP server**:
   ```bash
   npx serve temp/staff-ui
   ```
