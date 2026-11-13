# 🗄️ ParcelHub Database Architecture

This database runs on **PostgreSQL** managed through **Drizzle ORM**.
* **Local Development:** Runs embedded in-process via **PGlite** (persisting to `./pgdata`). No Docker, XAMPP, or external service required.
* **Production / Staging:** Connects to **Supabase PostgreSQL** (or any standard Postgres instance) using `DATABASE_URL`.

---

## 📋 Entity Schemas & Field Reference

### 1. `customers` Table
Stores registered customer accounts and authentication/security states.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | UUIDv7 (`$defaultFn: () => uuidv7()`). Time-ordered and collision-safe. |
| `email` | `TEXT` | `NOT NULL`, `UNIQUE` | Customer login email (lowercase). |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt password hash. |
| `first_name` | `TEXT` | `NOT NULL` | Customer first name. |
| `last_name` | `TEXT` | `NOT NULL` | Customer last name. |
| `middle_initial` | `TEXT` | `NULLABLE` | Customer middle initial. |
| `phone_number` | `TEXT` | `NOT NULL` | Customer phone number. |
| `mpin` | `TEXT` | `NULLABLE` | Bcrypt-hashed 4-digit security PIN for parcel claim and session unlocking. |
| `blacklisted` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Suspension flag; prevents creating or initializing new orders. |
| `blacklist_reason`| `TEXT` | `NULLABLE` | Staff or admin reason for suspension. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Account creation timestamp. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Last account update timestamp. |

---

### 2. `staff` Table
Stores staff member credentials for warehouse, POS, and counter fulfillment operations.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | UUIDv7 (`$defaultFn: () => uuidv7()`). Time-ordered and collision-safe. |
| `username` | `TEXT` | `NOT NULL`, `UNIQUE` | Staff login username (lowercase). |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt password hash. |
| `first_name` | `TEXT` | `NOT NULL` | Staff member first name. |
| `last_name` | `TEXT` | `NOT NULL` | Staff member last name. |
| `middle_initial` | `TEXT` | `NULLABLE` | Staff member middle initial. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Creation timestamp. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Last update timestamp. |

---

### 3. `orders` Table
Tracks parcel lifecycle, pricing, COD payment, claim passes, and audit trails.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Internal UUIDv7 (`$defaultFn: () => uuidv7()`). |
| `ticket_code` | `TEXT` | `NULLABLE` | Short human-facing code for counter handoff (e.g. `4B2-9X7`). |
| `tracking_id` | `TEXT` | `NULLABLE` | Courier/waybill tracking number (e.g. `PH-123456789`). |
| `product_name` | `TEXT` | `NOT NULL`, `DEFAULT ''` | Item description or parcel summary. |
| `recipient_name` | `TEXT` | `NOT NULL`, `DEFAULT ''` | Name of the recipient on the waybill. |
| `price` | `DOUBLE PRECISION`| `NOT NULL`, `DEFAULT 0` | Total parcel cost / COD amount to collect. |
| `change` | `DOUBLE PRECISION`| `NOT NULL`, `DEFAULT 0` | Change given to customer (`amount_received - price`). |
| `amount_received` | `DOUBLE PRECISION`| `NULLABLE` | Cash received from customer at registration counter. |
| `status` | `TEXT` | `NOT NULL` | Lifecycle state (see Order Statuses below). |
| `status_timeline` | `JSONB` | `NOT NULL` | Array of timeline entries: `[{ status, timestamp }]`. |
| `image_url` | `TEXT` | `NULLABLE` | URL of customer screenshot or photo taken during initialization. |
| `proof_image_url` | `TEXT` | `NULLABLE` | URL of proof photo attached when order is made ready to claim. |
| `customer_id` | `TEXT` | `NOT NULL`, `REFERENCES customers(id)` | Foreign key to owner customer (`ON DELETE cascade`). |
| `modified_by` | `TEXT` | `NOT NULL` | User/Staff ID or `SYSTEM` that triggered the latest modification. |
| `claim_requested` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Set to `true` when customer initiates the claim timer. |
| `claim_initiated_at`| `TIMESTAMPTZ`| `NULLABLE` | Timestamp when customer triggered the claim pass countdown. |
| `claim_expires_at`| `TIMESTAMPTZ`| `NULLABLE` | Expiration timestamp of the active claim pass countdown. |
| `courier_paid` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Flag set when staff pays the inbound courier driver. |
| `courier_paid_by` | `TEXT` | `NULLABLE` | Staff ID who recorded the courier payment. |
| `courier_paid_at` | `TIMESTAMPTZ`| `NULLABLE` | Timestamp when the courier payment was recorded. |
| `is_refunded` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Refund status flag. |
| `timestamp` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Main updated/activity timestamp. |

#### Partial Unique Index on `orders`:
* **`orders_paid_tracking_id_unique`**:
  Enforces uniqueness on `tracking_id` only when `tracking_id IS NOT NULL` and `status IN ('AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED')`. Allows non-conflicting draft or cancelled orders while protecting against duplicate paid parcels.

#### Order Lifecycle Statuses:
* `PENDING_INITIALIZATION` — Customer initialized parcel draft with screenshot; awaits OCR/manual confirmation.
* `PAYMENT_REQUIRED` — Details confirmed; awaiting customer cash deposit at counter.
* `AWAITING_PARCEL` — Cash received, order activated; awaiting delivery driver arrival at hub.
* `READY_TO_CLAIM` — Courier paid and proof photo attached; ready for customer pickup.
* `CLAIMED` — Customer activated claim pass and staff handed over the parcel.
* `CANCELLED` — Order cancelled by customer or staff.

---

### 4. `order_screenshots` Table
Maintains AI OCR verification records and metadata extracted from customer-uploaded screenshots.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | UUIDv7 (`$defaultFn: () => uuidv7()`). |
| `order_id` | `TEXT` | `NOT NULL`, `UNIQUE`, `REFERENCES orders(id)` | 1-to-1 foreign key to parent order (`ON DELETE cascade`). |
| `image_url` | `TEXT` | `NOT NULL` | URL of the screenshot uploaded by the customer. |
| `is_verified` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Verification result flag from AI/OCR validation. |
| `checks` | `JSONB` | `NULLABLE` | Detailed check results (strict tracking ID, similarity, parcel metadata). |
| `model` | `TEXT` | `NULLABLE` | AI/OCR vision model identifier used for inference. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Record creation timestamp. |

---

### 5. `fcm_tokens` Table
Maintains device push notification tokens for Firebase Cloud Messaging.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `token` | `TEXT` | `PRIMARY KEY` | Device registration token string from Firebase. |
| `user_id` | `TEXT` | `NULLABLE` | Associated customer or staff identifier. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Token registration timestamp. |

---

### 6. `app_config` Table
Runtime configuration key-value store (e.g. OCR verification toggles).

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `key` | `TEXT` | `PRIMARY KEY` | Configuration key (e.g. `ocrConfig`). |
| `value` | `JSONB` | `NOT NULL` | JSON configuration value (e.g. `{ "staff": true, "customer": true }`). |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Last configuration update timestamp. |

---

## ⚡ Useful Team Commands

For complete Vercel & Supabase hosting instructions, refer to the [Deployment Guide](../DEPLOYMENT.md).

All commands run from inside the `backend/` folder:

```powershell
# Reset local database & re-seed default accounts in 2 seconds
npm run db:reset

# Seed default accounts without wiping database
npm run db:seed

# Generate new SQL migration after editing db/schema.ts
npx drizzle-kit generate

# Run API route automated test suite
npm run test:routes
```
