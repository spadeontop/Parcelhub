```markdown
# ParcelHub System Architecture & Technical Specifications

## 1. System Overview & Core Directives

ParcelHub is a state-driven, zero-credit micro-logistics escrow system designed to eliminate synchronous last-mile delivery friction on higher education campuses (CTU Danao Campus). The system decouples parcel handovers into an asynchronous lifecycle backed by AI visual audit logging, stationary hub QR handshakes, physical envelope escrow isolation, and immutable database state guarantees.

### Non-Negotiable Core Invariants

1. **Solvency Invariant (Zero-Credit Escrow):**
   - The hub never fronts money under any circumstance.
   - Payout to couriers is blocked at the database and application levels unless physical cash has been verified and deposited (`cash_deposited >= courier_cod_amount`).
   - For non-COD/prepaid packages (`cod_amount == 0.00`), in-person desk check-in is still strictly required to preserve process uniformity and support future operational fee additions.
2. **State Progression Invariant (Monotonic FSM):**
   - State strictly transitions forward: `STAGED` -> `FUNDED` -> `RECEIVED_LOGGED` -> `CLAIMED`.
   - Reversals and state-skipping are rejected by database triggers.
3. **Release Invariant (Inverted Handshake):**
   - A parcel can transition to `CLAIMED` only when:
     - Recipient physically scans the Hub Station QR and confirms with their 6-digit MPIN.
     - The dispatch ping surfaces on the active Staff Terminal.
     - Staff executes the atomic release, which verifies visual log existence and closes the physical cash envelope.
4. **Physical Envelope Isolation Invariant:**
   - Cash is never pooled into a shared float. Each parcel maps to an isolated physical envelope holding the exact deposited money and any pre-calculated change.
   - Change is disbursed alongside the package at pickup. The hub holds zero balance once a parcel reaches `CLAIMED`.
5. **Identity Decoupling Invariant (Zero-Knowledge Perimeter):**
   - Couriers only interface with: `Waybill Tracking Number` and `Exact COD Amount`.
   - Recipient personal identity, student ID, contact details, and MPIN are zero-knowledge to external delivery couriers.

---

## 2. Technology Stack & Infrastructure
```

[ Student Mobile Client ] [ Staff Desk Terminal ]
React Native (Expo SDK) Next.js (App Router, Vercel)

- Google OAuth / Supabase Auth - Desktop / Counter Web Portal
- Pre-Registration Workflow - WebRTC / Camera Feed Ingestion
- Camera: Scans Hub Printable QR - Real-Time Claim Ping Listener
- Input: 6-Digit MPIN Auth - Cash-In & Envelope Ledger Ops
- Expo Push Notification Handler - Gemini AI Verification Pipeline
  │ │
  │ HTTPS / Supabase SDK │ HTTPS / Next.js Server Actions
  ▼ ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ Application Layer │
  │ │
  │ Next.js Server Actions / API Routes (Node.js Runtime) │
  │ - Staff & Admin Session Validation (PoLP RBAC) │
  │ - Global System Config Enforcement (AI Verification Toggle) │
  │ - Dispatches Image Buffers to Google Gemini 3.5 Flash-Lite │
  │ - Direct HTTPS POST to Expo Push API (`/api/v2/push/send`) │
  │ - Commits Atomic State Transitions to Database │
  └───────────────────┬────────────────────────────────┬───────────────────┘
  │ │
  ▼ ▼
  ┌───────────────────────────┐ ┌───────────────────────────┐
  │ Google GenAI API Engine │ │ Supabase Platform │
  │ - gemini-3.5-flash-lite │ │ - PostgreSQL 15+ Engine │
  │ - Strict Schema Lock │ │ - Supabase Auth (OAuth) │
  │ - Automated OCR & Audit │ │ - Supabase Storage (S3) │
  └───────────────────────────┘ │ - Realtime Channel Pub/Sub│
  └───────────────────────────┘

````

| Layer | Technology | Operational Function |
| :--- | :--- | :--- |
| **Student Client** | React Native (Expo) | Pre-registers packages, scans physical Hub QR to trigger claim pings, validates releases via MPIN, receives push alerts. |
| **Staff Counter Terminal** | Next.js (App Router) on Vercel | Desk portal for envelope ledger check-ins, parcel camera capture, AI verification review, and real-time claim fulfillment. |
| **Data Engine & Auth** | Supabase (PostgreSQL 15+) | Primary relational store enforcing transactional invariants, triggers, RLS policies, and real-time subscription channels. |
| **Object Storage** | Supabase Storage | S3-compatible private bucket storing parcel intake verification images. |
| **AI Inference** | Google Gemini 3.5 Flash-Lite | Multimodal model running OCR waybill extraction, box detection, and condition scoring with strict JSON schema enforcement. |
| **Push Notifications** | Direct Expo Push API | Server actions POST notifications directly to `https://exp.host/--/api/v2/push/send` when parcels shift to `RECEIVED_LOGGED`. |

---

## 3. Database Schema & State Enforcements

### 3.1 DDL Schema (`schema.sql`)

```sql
CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'STAFF', 'ADMIN');
CREATE TYPE parcel_status AS ENUM ('STAGED', 'FUNDED', 'RECEIVED_LOGGED', 'CLAIMED');
CREATE TYPE package_condition AS ENUM ('INTACT', 'DAMAGED', 'TAMPERED', 'UNKNOWN');

-- System Configuration (Admin Controlled)
CREATE TABLE system_config (
    config_key VARCHAR(64) PRIMARY KEY,
    config_value JSONB NOT NULL,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Config: AI Enforced by default
INSERT INTO system_config (config_key, config_value)
VALUES ('ai_intake_rules', '{"ai_required": true}'::jsonb);

-- Users & Profiles
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL, -- references auth.users(id)
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    school_id VARCHAR(64) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    mpin_hash VARCHAR(255) NOT NULL,
    push_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub Stations (Physical Counter Points)
CREATE TABLE hub_stations (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name VARCHAR(128) NOT NULL,
    station_code VARCHAR(32) UNIQUE NOT NULL, -- embedded in printable static QR
    secret_key VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parcels & Envelope Ledger
CREATE TABLE parcels (
    parcel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    station_id UUID NOT NULL REFERENCES hub_stations(station_id),
    waybill_number VARCHAR(128) NOT NULL,
    carrier VARCHAR(64),
    cod_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_deposited DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    change_due DECIMAL(10,2) GENERATED ALWAYS AS (cash_deposited - cod_amount) STORED,
    current_status parcel_status NOT NULL DEFAULT 'STAGED',
    claim_pinged_at TIMESTAMPTZ, -- populates when student scans hub QR
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_solvency CHECK (
        (current_status = 'STAGED') OR
        (cash_deposited >= cod_amount)
    )
);

CREATE INDEX idx_parcels_waybill ON parcels(waybill_number);
CREATE INDEX idx_parcels_status ON parcels(current_status);
CREATE INDEX idx_parcels_pings ON parcels(station_id, claim_pinged_at) WHERE current_status = 'RECEIVED_LOGGED';

-- Visual Logs (AI Verification Records)
CREATE TABLE visual_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID UNIQUE NOT NULL REFERENCES parcels(parcel_id) ON DELETE RESTRICT,
    image_storage_uri TEXT NOT NULL,
    image_hash_sha256 VARCHAR(64) NOT NULL,
    detected_waybill VARCHAR(128),
    ai_bypassed BOOLEAN NOT NULL DEFAULT FALSE,
    package_condition package_condition NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    verified_by_staff_id UUID NOT NULL REFERENCES users(user_id),
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

````

### 3.2 Monotonic Finite State Machine Trigger

```sql
CREATE OR REPLACE FUNCTION enforce_monotonic_fsm()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_status = 'STAGED' AND NEW.current_status != 'FUNDED' THEN
        RAISE EXCEPTION 'FSM Violation: Cannot transition from STAGED directly to %', NEW.current_status;
    ELSIF OLD.current_status = 'FUNDED' AND NEW.current_status != 'RECEIVED_LOGGED' THEN
        RAISE EXCEPTION 'FSM Violation: Cannot transition from FUNDED directly to %', NEW.current_status;
    ELSIF OLD.current_status = 'RECEIVED_LOGGED' AND NEW.current_status != 'CLAIMED' THEN
        RAISE EXCEPTION 'FSM Violation: Cannot transition from RECEIVED_LOGGED directly to %', NEW.current_status;
    ELSIF OLD.current_status = 'CLAIMED' THEN
        RAISE EXCEPTION 'FSM Violation: Terminal state CLAIMED is immutable';
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parcel_fsm
BEFORE UPDATE OF current_status ON parcels
FOR EACH ROW
EXECUTE FUNCTION enforce_monotonic_fsm();

```

### 3.3 Atomic Handshake Execution Procedure

```sql
CREATE OR REPLACE FUNCTION atomic_claim_handshake(
    p_parcel_id UUID,
    p_staff_user_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    change_to_disburse DECIMAL(10,2)
) AS $$
DECLARE
    v_has_visual_log BOOLEAN;
    v_change DECIMAL(10,2);
BEGIN
    -- 1. Verify existence of immutable visual logging record
    SELECT EXISTS (
        SELECT 1 FROM visual_logs WHERE parcel_id = p_parcel_id
    ) INTO v_has_visual_log;

    IF NOT v_has_visual_log THEN
        RAISE EXCEPTION 'Security Invariant Failed: Missing visual log for parcel %', p_parcel_id;
    END IF;

    -- 2. Fetch change due from envelope and commit status transition
    UPDATE parcels
    SET current_status = 'CLAIMED',
        updated_at = NOW()
    WHERE parcel_id = p_parcel_id
      AND current_status = 'RECEIVED_LOGGED'
    RETURNING change_due INTO v_change;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid State Transition: Parcel is not in RECEIVED_LOGGED status';
    END IF;

    RETURN QUERY SELECT TRUE, v_change;
END;
$$ LANGUAGE plpgsql;

```

---

## 4. Operational Lifecycle Workflows

```
  [ Student Mobile Client ]          [ Staff Counter Terminal ]           [ Courier ]
              │                                   │                           │
  1. STAGE:   │                                   │                           │
     Pre-registers waybill                        │                           │
     & declared COD                               │                           │
              │                                   │                           │
  2. FUND:    │  Hands cash/slip at desk          │                           │
              ├──────────────────────────────────►│                           │
              │                                   │ Envelopes cash + change   │
              │                                   │ Updates status -> FUNDED  │
              │                                   │                           │
  3. RECEIVE: │                                   │                           │
              │                                   │◄── Drops parcel ──────────┤
              │                                   │ Disburses envelope cash ──►
              │                                   │ Camera captures intake    │
              │                                   │ Gemini AI / Admin Gate    │
              │                                   │ Status -> RECEIVED_LOGGED │
              │                                   │                           │
              │◄── Push Notification Delivered ───┤                           │
              │                                   │                           │
  4. CLAIM:   │                                   │                           │
     Walks up to counter                          │                           │
     Scans Printable Hub QR                       │                           │
     Enters MPIN to dispatch                      │                           │
              │                                   │                           │
              │────── Ping surfaces in UI ───────►│                           │
              │                                   │ Hands parcel + change     │
              │                                   │ Commits Atomic Claim      │
              │                                   │ Status -> CLAIMED         │

```

### Workflow Details

1. **Pre-Registration (`STAGED`):**

- Recipient enters waybill number and declared COD amount via the React Native app.
- If non-COD, amount is `0.00`. Parcel initializes as `STAGED`.

2. **In-Person Desk Staging & Funding (`FUNDED`):**

- Recipient visits the counter. Staff verifies declared amount.
- For COD orders: Recipient hands physical cash (e.g., ₱500 for a ₱340 order). Staff prepares an envelope labeled with the waybill containing the payable amount (₱340) and change due (₱160).
- For prepaid orders: Recipient completes check-in to clear the staging ledger (preserving uniform audit logs and accommodating potential handling fees).
- Staff updates status to `FUNDED`.

3. **Courier Arrival & Visual Logging (`RECEIVED_LOGGED`):**

- Courier presents waybill. Staff pulls the matching parcel envelope and hands the exact COD payment to the courier.
- Staff places the package in front of the counter camera and captures an image.
- **Admin AI Policy Gate:**
- System checks `system_config.ai_intake_rules -> ai_required`.
- If `ai_required === true`: Gemini 3.5 Flash-Lite runs OCR extraction. If `detected_waybill !== expected_waybill`, the transition hard-aborts.
- If `ai_required === false`: Staff can visually confirm the waybill manually, saving the snapshot with `ai_bypassed = true`.

- Record commits to `visual_logs`; status transitions to `RECEIVED_LOGGED`.
- Next.js server action triggers a direct POST to the Expo Push API, pinging the student's mobile device immediately.

4. **Inverted Claim Handshake (`CLAIMED`):**

- Recipient walks to the hub station.
- Recipient scans the hub's stationary, printable QR code using the mobile app and enters their 6-digit MPIN to authorize pickup.
- App transmits a dispatch ping updating `claim_pinged_at = NOW()`.
- Staff terminal listens via Supabase Realtime; the student's record and envelope metadata pop to the top of the queue.
- Staff retrieves the package and envelope, hands the package and any change due (`change_due`) to the recipient, and taps **Confirm Handover**.
- System executes `atomic_claim_handshake`, permanently marking the parcel `CLAIMED`.

---

## 5. AI Visual Logging Pipeline Specification

### 5.1 Model & Runtime Parameters

- **Model:** `gemini-3.5-flash-lite`
- **Temperature:** `0.0` (strictly deterministic extraction)
- **Response Type:** `application/json` locked via `responseSchema`

### 5.2 Structured Extraction Schema

```typescript
import { Type } from "@google/genai";

export const ParcelVerificationSchema = {
  type: Type.OBJECT,
  properties: {
    waybill_number: {
      type: Type.STRING,
      description:
        "Clean alphanumeric tracking or waybill string extracted from the parcel label barcode or print.",
      nullable: true,
    },
    courier_name: {
      type: Type.STRING,
      description:
        "Carrier identified (e.g., J&T, ShopeeXpress, SPX, Flash Express, LEX, NinjaVan).",
      nullable: true,
    },
    is_parcel_detected: {
      type: Type.BOOLEAN,
      description:
        "True if a physical shipping parcel, box, pouch, or bubble envelope is clearly visible.",
    },
    package_condition: {
      type: Type.STRING,
      enum: ["INTACT", "DAMAGED", "TAMPERED", "UNKNOWN"],
      description:
        "Visual assessment of the package exterior condition and seals.",
    },
    confidence_score: {
      type: Type.NUMBER,
      description:
        "Confidence rating of the visual extraction between 0.00 and 1.00.",
    },
  },
  required: ["is_parcel_detected", "package_condition", "confidence_score"],
};
```

---

## 6. Implementation Conventions for AI Code Generators

- **Direct Push Execution:** Do not introduce Kafka, Redis, or auxiliary workers for notifications. Fire HTTPS POST requests directly to `https://exp.host/--/api/v2/push/send` within the transition server action.
- **Database-Driven FSM:** Never rely solely on application middleware to guard state transitions. Always route state changes through PostgreSQL triggers and `CHECK` constraints.
- **Principle of Least Privilege (PoLP):** Apply Row-Level Security (RLS) on all Supabase tables:
- Students read only their own rows (`auth.uid() = user_id`).
- Staff read and transition desk-level operational records.
- Admins retain access to system toggles and master audit logs.

- **Zero Courier-Facing PII:** Courier-facing interfaces or printouts must expose only the waybill tracking string and payable cash figures.

```

```
