# SYSTEM_RULES & DEVELOPMENT LOG: ParcelHub

> **Purpose**: Living architectural log and authoritative rules engine for ParcelHub development across Mobile, Web, and Database tiers.
> **Last Updated**: October 10, 2026

---

## 1. Authentication & Security Hierarchy

1. **Mobile Client (Student)**:
   - **Account Credential Tier**: Email + Password + School ID (e.g. `CTU-2024-8841`).
   - **Session Security Tier (MPIN Gate)**: Every app session / launch requires entering the user's 6-digit MPIN before granting access to dashboard, orders, or active data.
   - **Action Signing Tier**: Releasing consignments requires re-validating the 6-digit MPIN to sign the dynamic claim token.

2. **Web Terminal (Desk Operator / Staff)**:
   - **Role-Based Access Control (RBAC)**: Only accounts with `role IN ('STAFF', 'ADMIN')` may access desk operations.
   - **Session Validation**: Desk terminal requires active Staff Login (`staff_id`, `email`, session token). Anonymous desk access is strictly prohibited.
   - **Audit Attribution**: All cash transactions and parcel releases are stamped with the active operator's account credentials (`payment_staff_id`, `verified_by_staff_id`).

---

## 2. Updated End-to-End Operational Lifecycle

### Phase 1: Onboarding & Logon
```
[ App Launch ] ──► [ Login / Register ] ──► [ Enter 6-Digit MPIN ] ──► [ Main Dashboard ]
```
- Student cannot view dashboard or create orders without clearing the account MPIN gate.

### Phase 2: Consignment Creation (Receipt OCR Pipeline)
```
[ Create Order ] 
       │
       ▼
[ Step 1: Receipt Screenshot Upload ]
       │
       ├──► Check System Config (ai_user_receipt_ocr)
       │       ├── Disabled: Skip directly to manual input form
       │       └── Enabled: Upload image, create consignment ID record in DB, run Gemini OCR
       │
       ▼
[ Step 2: Autofilled Confirmation Page ]
       │
       └── Recipient reviews / edits extracted Waybill, Carrier, Declared COD Amount
       │
       ▼
[ Commit: Status = STAGED ]
```

### Phase 3: Physical Cash-In & Desk Funding (Station Invariant Gate)
```
[ Student at Counter ] ──► [ Scans Station QR or Enters Station ID ]
                                    │
                                    ▼
                         [ Transmits Payment Ping ] (payment_pinged_at)
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
[ Mobile App ]                                            [ Staff Counter Desk ]
Shows "Counter Ping Active: Hand Cash"                   UNLOCKED for this parcel!
                                                         (Staff CANNOT interact without ping)
                                                                    │
                                                         [ Staff Inputs Cash Deposited ]
                                                         Check: cash_deposited >= cod_amount
                                                                    │
                                                         [ Commit: Status = FUNDED ]
                                                         Records: payment_staff_id, station
                                                                    │
                                                                    ▼
                                                         [ Student View Updated ]
                                                         Displays: Hub, Staff ID, Cash, Change
```

### Phase 4: Courier Arrival & Visual Intake (Independent Staff AI Precheck)
```
[ Courier Arrives with Waybill ]
       │
       ├── Check System Config (ai_staff_intake_precheck)
       │       ├── Enabled: Staff scans package with counter camera; Gemini validates OCR
       │       └── Disabled: Manual optical inspection
       │
       ▼
[ Staff Disburses Exact COD Cash to Courier (Zero-Knowledge) ]
       │
       ▼
[ Commit: Status = RECEIVED_LOGGED ] ──► Direct Expo Push to Student
```

### Phase 5: Multi-Parcel Claiming & Atomic Handshake
```
[ Student in Mobile App ]
       │
       ├── Selects 1 or Multiple Parcels with status = RECEIVED_LOGGED
       │
       ├── Taps "Claim Selected (N)"
       │
       └── Prompts 6-Digit MPIN
               │
               ▼
       [ MPIN Validated ] ──► [ Transmits Claim Ping for all selected parcels ]
                                       │
                                       ▼
                             [ Staff Counter Desk ]
                             UNLOCKED: Surfaces at top of queue!
                             (Staff CANNOT prompt release unless client pinged!)
                                       │
                             [ Staff Confirms Handover ]
                             - Verifies physical ID & envelope change
                             - Commits atomic update: status = CLAIMED
```

---

## 3. Server Configuration Keys (`system_config`)

| Config Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ai_user_receipt_ocr` | `BOOLEAN` | `true` | Governs whether student order creation requires receipt screenshot OCR. |
| `ai_staff_intake_precheck` | `BOOLEAN` | `true` | Governs whether staff courier intake requires multimodal camera OCR. |
| `station_code` | `VARCHAR` | `'CTU-DANAO-MAIN-HUB'` | Stationary physical hub QR code. |

---

## 4. Invariants Enforcement Checklist

- [x] **Solvency Invariant**: `cash_deposited >= cod_amount` enforced at DB and form level.
- [x] **Monotonic FSM Invariant**: `STAGED -> FUNDED -> RECEIVED_LOGGED -> CLAIMED` strictly one-way.
- [x] **Payment Ping Invariant**: Staff cannot accept cash or update to `FUNDED` unless client pinged at station (`payment_pinged_at != NULL`).
- [x] **Release Prompt Invariant**: Staff can NEVER prompt or execute release unless client prompted claim (`claim_pinged_at != NULL`).
- [x] **Identity Decoupling**: Couriers only see Waybill Tracking ID + exact cash. Student identity is zero-knowledge.
