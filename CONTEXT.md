# ParcelHub: On-The-Go Runtime Context & Architecture Log (`context.md`)

> **Authoritative Runtime & Architectural Log**
> Updated continuously during development to track operational invariants, auth flows, server configurations, skills, and rules.

---

## 1. Core Operating Rules & Invariants

### Invariant 1: Mandatory Authentication Gates
1. **Mobile (Student Tier)**:
   - **Account Credential Gate**: Must register/login with School ID (`CTU-YYYY-XXXX`), Email (`@ctu.edu.ph`), and Password.
   - **Session MPIN Gate**: On every app launch/logon, the user is gated by a 6-digit MPIN before gaining access to the dashboard, orders, or active data.
   - **Action Authorization Gate**: Releasing consignments requires re-validating the 6-digit MPIN.
2. **Web (Counter Operator Tier)**:
   - **Staff Credential Gate**: Desk terminal operations are strictly protected. Staff must log in with Staff ID/Email (`staff.danao@ctu.edu.ph` / `STAFF-0488`) and Staff PIN.
   - Anonymous counter operations are strictly prohibited.
   - All financial handshakes stamp `payment_staff_id` and `verified_by_staff_id`.

### Invariant 2: Independent AI Server Controls (`system_config`)
- **`ai_user_receipt_ocr`**:
  - Gating student order creation receipt OCR.
  - If **Disabled**: App skips screenshot upload/analysis and falls back directly to manual input fields.
  - If **Enabled**: App prompts for order receipt screenshot (containing Waybill, Recipient Name, Amount). Consignment record is anchored in DB first to lock its ID, Gemini OCR validates and extracts the fields, and proceeds to an editable confirmation screen.
- **`ai_staff_intake_precheck`**:
  - Gating counter parcel intake verification.
  - Independent of `ai_user_receipt_ocr`.
  - If **Enabled**: Staff scans physical parcel with counter camera, Gemini verifies waybill match and intact condition.
  - If **Disabled**: Staff conducts manual optical check without blocking AI requirement.

### Invariant 3: Station Payment Ping Invariant (Counter Cash-In Gate)
- **Rule**: Staff **CAN NEVER** interact with, accept cash for, or fund an unpaid consignment (`STAGED`) unless the student has physically checked in at the desk and transmitted a payment ping (`payment_pinged_at != null`).
- **Trigger**: Student scans Station QR or types Station ID (`CTU-DANAO-MAIN-HUB`) on their mobile device.
- **Staff Handshake**:
  - Staff manually enters cash received from student.
  - **Solvency Invariant**: `cash_deposited >= cod_amount` (Zero-credit escrow: hub never fronts money).
  - Terminal commits status to `FUNDED`, recording `payment_staff_id`, `payment_station_code`, and timestamp.
  - Student app updates in real-time showing posted payment details (Hub, Staff Account, Amount Deposited, Change Due).

### Invariant 4: Courier Payout & Visual Intake
- Staff selects funded envelope, verifies courier waybill (AI OCR or manual depending on `ai_staff_intake_precheck`).
- Staff inputs exact cash amount paid/disbursed to courier from envelope.
- Status advances to `RECEIVED_LOGGED` and dispatches push notification to recipient.

### Invariant 5: Multi-Parcel Claiming & Atomic Release Gate
- **Mobile Batch Selection**: Recipient can select **one or multiple** parcels in `RECEIVED_LOGGED` state for pickup.
- **Handshake Dispatch**: Student enters 6-digit MPIN. Upon validation, claim ping is dispatched across all selected consignments (`claim_pinged_at != null`).
- **Desk Release Gate**: Staff handover button is **strictly locked** until the student's claim ping is active. Staff cannot release unpinged consignments.
- Staff hands over parcels + envelope change, committing status to `CLAIMED`.

---

## 2. Active Development Log

| Timestamp | Phase | Change Description | Status |
|-----------|-------|--------------------|--------|
| 2026-10-10 | Auth & Invariants | Created living rulebook `SYSTEM_RULES.md` and runtime log `context.md`. | Verified |
| 2026-10-10 | Schema Update | Added independent AI configs, `receipt_image_uri`, `payment_pinged_at`, `payment_staff_id`, and `payment_station_code` in `web/schema.sql`. | Verified |
| 2026-10-10 | Web Auth | Implemented `StaffAuthModal` and session store gating desk terminal operations. | Verified |
| 2026-10-10 | Mobile Auth | Implemented `AuthScreen` (Register/Login) and `MpinLockScreen` gating app launch. | Verified |
| 2026-10-10 | Mobile Order | Implemented 2-step screenshot upload + Gemini OCR with server AI toggle check and DB anchoring. | Verified |
| 2026-10-10 | Payment Ping | Implemented station QR scan / Station ID ping for `STAGED` orders; locked unpinged orders on desk terminal. | Verified |
| 2026-10-10 | Multi-Claim | Implemented multi-select for `RECEIVED_LOGGED` parcels and batch claim ping dispatch. | Verified |
| 2026-10-10 | Build Verification | Verified Next.js 16 production build (`npm run build`) and Expo TypeScript (`npx tsc --noEmit`). | Verified |
| 2026-10-10 | Google SMTP | Configured Gmail App Password SMTP in `web/.env.local`, added `nodemailer` utility (`email.ts`), and created `/api/send-email`. | Verified |

---

## 3. Skills & Engineering Guidelines
- **Expo / React Native**: SDK 52, New Architecture enabled, modular components with strict TypeScript types.
- **Next.js 16 App Router**: Turbopack, Tailwind CSS / Vanilla CSS design tokens adhering to `DESIGN_CONTEXT.md` 60-30-10 palette (`#F8FAFC`, `#FFFFFF`, `#0F172A`, `#2563EB`).
- **Google GenAI**: `@google/genai` SDK using `gemini-2.5-flash` with structured JSON schema outputs.
- **Zero-Credit Escrow**: Invariant verification on both client and database triggers.
