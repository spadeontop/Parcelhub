# 🗄️ ParcelHub Database Architecture

This database runs on **PostgreSQL** via **Drizzle ORM**.
* **Local Development:** Runs embedded in-process via **PGlite** (persisting to `./pgdata`). No Docker, XAMPP, or external server required.
* **Production / Staging:** Connects directly to **Supabase PostgreSQL** via standard `DATABASE_URL`.

---

## 📋 Entity Schemas & Field Reference

### 1. `customers` Table
Stores registered customer accounts and authentication/security states.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique customer UUIDv7 (`$defaultFn: uuidv7()`). Time-ordered, collision-safe. |
| `email` | `TEXT` | `NOT NULL`, `UNIQUE` | User login email (case-insensitive in queries). |
| `password_hash` | `TEXT` | `NOT NULL` | Hashed password. |
| `first_name` | `TEXT` | `NOT NULL` | Customer first name. |
| `last_name` | `TEXT` | `NOT NULL` | Customer last name. |
| `middle_initial` | `TEXT` | `NULLABLE` | Customer middle initial. |
| `phone_number` | `TEXT` | `NOT NULL` | Verified mobile phone number format. |
| `mpin` | `TEXT` | `NULLABLE` | 4-digit security MPIN for parcel claims. |
| `blacklisted` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Prevents customer from claiming/initializing orders. |
| `blacklist_reason`| `TEXT` | `NULLABLE` | Reason why customer was blacklisted by admin. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Account creation timestamp. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Last account update timestamp. |

---
    
### 2. `staff` Table
Stores staff member credentials and contact info for order fulfillment.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique staff UUIDv7 (`$defaultFn: uuidv7()`). |
| `email` | `TEXT` | `NOT NULL`, `UNIQUE` | Staff work email. |
| `password_hash` | `TEXT` | `NOT NULL` | Hashed password. |
| `first_name` | `TEXT` | `NOT NULL` | Staff first name. |
| `last_name` | `TEXT` | `NOT NULL` | Staff last name. |
| `middle_initial` | `TEXT` | `NULLABLE` | Staff middle initial. |
| `phone_number` | `TEXT` | `NOT NULL` | Staff phone number. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Creation timestamp. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Update timestamp. |

---

### 3. `orders` Table
Tracks parcel lifecycle, pricing, claims, and timeline progression.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique internal order UUIDv7 (`$defaultFn: uuidv7()`). |
| `ticket_code` | `TEXT` | `NULLABLE` | Short human-facing code for counter handoff (e.g. `492-817`). |
| `tracking_id` | `TEXT` | `NOT NULL`, `UNIQUE` | Waybill / courier tracking number. |
| `productName` | `TEXT` | `NOT NULL` | Item description or parcel name. |
| `recipient_name` | `TEXT` | `NOT NULL` | Name of person receiving the item. |
| `price` | `DOUBLE PRECISION`| `NOT NULL` | Total parcel cost / COD amount. |
| `change` | `DOUBLE PRECISION`| `NOT NULL`, `DEFAULT 0` | Change owed to customer (amountReceived - price). |
| `amount_received` | `DOUBLE PRECISION`| `NULLABLE` | Cash received from customer. |
| `status` | `TEXT` | `NOT NULL` | Order lifecycle status (see enum below). |
| `status_timeline` | `JSONB` | `NOT NULL` | Chronological list of status changes with timestamps. |
| `qr_image_url` | `TEXT` | `NOT NULL` | URL of generated QR code for handoff. |
| `image_url` | `TEXT` | `NULLABLE` | Uploaded parcel photo on initialization. |
| `proof_image_url`| `TEXT` | `NULLABLE` | Uploaded photo proof of courier payment / parcel receipt. |
| `customer_id` | `TEXT` | `NOT NULL`, `REFERENCES customers(id)` | Foreign key linking parcel to owner customer. |
| `modified_by` | `TEXT` | `NOT NULL` | User/Staff ID or `SYSTEM` that triggered the latest update. |
| `claim_requested`| `BOOLEAN` | `NOT NULL`, `DEFAULT false` | True when customer requested retrieval timer. |
| `claim_initiated_at`| `TIMESTAMPTZ`| `NULLABLE` | Start timestamp of customer retrieval countdown. |
| `claim_expires_at` | `TIMESTAMPTZ`| `NULLABLE` | Expiration timestamp of claim timer. |
| `courier_paid` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Whether courier fee has been paid at parcel receipt. |
| `courier_paid_by` | `TEXT` | `NULLABLE` | Staff ID who paid the courier. |
| `courier_paid_at` | `TIMESTAMPTZ`| `NULLABLE` | Timestamp when courier was paid. |
| `timestamp` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Main creation/activity timestamp. |

#### Order Statuses:
* `PENDING_INITIALIZATION`
* `PAYMENT_REQUIRED`
* `AWAITING_PARCEL`
* `READY_FOR_PICKUP`
* `CLAIMED`
* `CANCELLED`

---

### 4. `fcm_tokens` Table
Maintains mobile push notification tokens.

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `token` | `TEXT` | `PRIMARY KEY` | Firebase Cloud Messaging device registration token. |
| `user_id` | `TEXT` | `NULLABLE` | Optional customer or staff user identifier. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Registration timestamp. |

---

### 5. `app_config` Table
Dynamic runtime configuration (e.g. AI OCR verification toggles).

| Column | SQL Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `key` | `TEXT` | `PRIMARY KEY` | Setting name (e.g. `ocrConfig`). |
| `value` | `JSONB` | `NOT NULL` | JSON configuration object (e.g. `{ "staff": true, "customer": true }`). |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL`, `DEFAULT now()` | Last update timestamp. |

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

