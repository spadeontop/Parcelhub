# ParcelHub Web v3 (React + TSX + Vite)

A fully modular, strictly typed React 18 + Vite refactor of ParcelHub (`web-v2`), preserving 100% of the customer flows, staff terminal operations, and Figma scenario review controls with modern component architecture, Tailwind CSS v4, and comprehensive automated test coverage.

---

## 🚀 Quick Start

### 1. Installation

```bash
cd mobile-web-prototype
npm install
```

### 2. Development Server

```bash
npm run dev
```

Runs the Vite development server with Hot Module Replacement (HMR) at `http://localhost:3000`.

### 3. Production Build

```bash
npm run build
```

Executes TypeScript type check (`tsc`) and bundles optimized production assets into `dist/`.

### 4. Run Automated Tests

```bash
npm test
```

Runs the Vitest test suite with JSDOM and React Testing Library (18 automated tests covering all critical user flows, edge cases, keyboard interactions, and state sync).

---

## 📁 Architecture & Directory Structure

```
web-v3/
├── public/                     # Static assets (logos, icons, sample receipts, QR codes)
│   └── assets/
├── src/
│   ├── components/
│   │   ├── common/             # Reusable UI primitives
│   │   │   ├── Icons.tsx       # SVG vector icons
│   │   │   └── Toast.tsx       # Notification toast pill
│   │   ├── layout/             # Application shell & review controls
│   │   │   ├── BottomNav.tsx   # Mobile persistent tab navigation
│   │   │   ├── BrandHeader.tsx # Header with status beacon & alerts toggle
│   │   │   ├── DeviceFrame.tsx # Mobile viewport bezel / Fullscreen wrapper
│   │   │   └── StudioControlBar.tsx # 12 Figma scenario switcher & role toggle
│   │   ├── modals/             # Global dialogs & drawers
│   │   │   ├── EscrowPolicyModal.tsx
│   │   │   ├── MpinModal.tsx   # 6-digit MPIN numpad & keyboard handler
│   │   │   ├── NotificationsModal.tsx
│   │   │   └── ProofOfDeliveryModal.tsx
│   │   └── screens/            # Distinct application views
│   │       ├── ConfirmOrderScreen.tsx
│   │       ├── CreateOrderScreen.tsx
│   │       ├── HomeScreen.tsx
│   │       ├── OrderDetailsScreen.tsx
│   │       ├── PaymentVerificationScreen.tsx
│   │       ├── QrScreen.tsx    # QR screen with canvas pickup pass export
│   │       ├── StaffTerminalScreen.tsx # Counter operations & barcode scanner
│   │       └── TransactionsScreen.tsx
│   ├── context/
│   │   └── AppContext.tsx      # Global state management & action dispatchers
│   ├── test/                   # Comprehensive Vitest & RTL test suites
│   │   ├── app.test.tsx
│   │   ├── edge-cases.test.tsx
│   │   └── setup.ts
│   ├── types/
│   │   └── index.ts            # Domain TypeScript types & interfaces
│   ├── utils/
│   │   └── statusHelpers.ts    # Badge color mappings & formatter utilities
│   ├── App.tsx                 # Root application composition
│   ├── index.css               # Tailwind CSS v4 directives & custom utilities
│   └── main.tsx                # React DOM mount point
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 🎯 Figma Scenarios & Review Controls

Use the top **Studio Control Bar** to review any specific scenario or toggle roles:

| Scenario                                 | View / State           | Key Verification                                                 |
| ---------------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| **1. Zero Active Orders**                | `home`                 | Empty state artwork, quick start guide, create button            |
| **2. Home With Active Orders**           | `home`                 | Current active order card with status badge                      |
| **3. Create Order**                      | `create_order`         | Form fields with instant Shopee receipt OCR loader               |
| **4. Confirm Order Details**             | `confirm_order`        | Parcel and recipient summary before lock-in                      |
| **5. Payment Verification**              | `payment_verification` | Live 5-minute countdown ping counter & renew button              |
| **6. Tracking Stage 1: Order Placed**    | `qr_screen`            | QR code display, pass canvas photo exporter, clipboard copy      |
| **7. Order Details (Payment Required)**  | `order_details`        | Red alert banner with direct resolve payment action              |
| **8. Tracking Stage 2: Awaiting Parcel** | `order_details`        | Amber status indicator & timeline                                |
| **9. Tracking Stage 3: Ready to Claim**  | `order_details`        | Green ready banner, confirmation checkbox unchecked              |
| **10. Claim Request Confirmation**       | `order_details`        | Claim checkbox checked; enables claim release action             |
| **11. Ready to Claim (Hub Closed)**      | `order_details`        | Hub closed warning banner, operating hours notice                |
| **12. Order Claimed (History)**          | `order_details`        | Final purple status with Proof of Delivery button                |
| **Staff Counter Terminal**               | `staff_ui`             | Real-time barcode scan match, status filter tabs, parcel release |
