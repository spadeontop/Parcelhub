# 🚀 ParcelHub Backend Deployment Guide

This guide covers deploying the ParcelHub Next.js backend to **Vercel** with a remote **Supabase PostgreSQL** database.

---

## ⚡ Quick Start (3 Steps)

### 1. Database Setup (Supabase)
1. In your [Supabase Dashboard](https://supabase.com/dashboard), open your project.
2. Go to the **SQL Editor** tab (`>_` on the left sidebar) -> **New query**.
3. Copy and run the SQL migration located at [`backend/db/migrations/0000_thick_phil_sheldon.sql`](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/backend/db/migrations/0000_thick_phil_sheldon.sql).
4. Go to **Project Settings** -> **Database** -> **Connection string** -> select **URI** and choose **Transaction pooler**.
5. Copy the connection URI:
   ```text
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### 2. Vercel Configuration
1. Import the Git repository in [Vercel](https://vercel.com).
2. Set the **Root Directory** to `backend`.
3. Add the following **Environment Variables**:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler URI | `postgresql://postgres.xxx:pass@aws-0-xxx.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | 32+ character random secret for HS256 tokens | `generate-random-32-char-string` |
| `CLIENT_RETRIEVE_TIMER` | Active claim timer duration (minutes) | `5` |
| `AI_VERIFICATION` | Require AI OCR screenshot verification | `false` |

### 3. Deploy & Verify
1. Click **Deploy**.
2. Once complete, test health with any API client (e.g., Hoppscotch or cURL):
   ```bash
   curl -X POST https://your-app.vercel.app/api/v1/customer/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   ```
   *Receiving `404 Email is not registered` confirms your Vercel deployment is successfully talking to your live database.*

---

## 🔍 In-Depth Details & Architecture Notes

### Why the Port 6543 Pooler is Required on Vercel
* **Vercel Serverless Functions use IPv4 egress.**
* Supabase's **Direct connection** (`db.[ref].supabase.co:5432`) resolves **only to IPv6** addresses on standard projects. Attempting to hit port 5432 directly from Vercel results in connection timeouts (`ENETUNREACH`).
* Supabase's **Transaction Pooler** (`aws-0-[region].pooler.supabase.com:6543`) resolves to **IPv4 addresses**, bypassing the IPv6 restriction completely without needing any paid add-ons.
* `db/index.ts` is pre-configured with `{ prepare: false, max: 5, ssl: 'require' }`, which is specifically required when connecting through Supabase's pooler.

### Local Development vs. Production
* **Local embedded PGlite:** Leave `DATABASE_URL` unset or commented in `backend/.env`. The backend automatically creates and runs an embedded PostgreSQL database inside `backend/pgdata`.
* **Connecting to live Supabase locally:** Set `DATABASE_URL` in `backend/.env`. `drizzle.config.ts` and `db/index.ts` automatically detect and use the live database.

### Schema Updates & Migrations
1. When you edit schema definitions in [`backend/db/schema.ts`](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/backend/db/schema.ts):
   ```powershell
   npx drizzle-kit generate
   ```
2. Apply the generated SQL file via Supabase SQL Editor, or run:
   ```powershell
   npx drizzle-kit migrate
   ```
   *(Note: Avoid running `drizzle-kit push` directly against Supabase as its schema introspection triggers known `checkValue.replace` bugs on managed Postgres system catalogs).*

### Initial Staff Account Seeding
Newly initialized databases have 0 staff accounts. Customer accounts can register publicly via `POST /api/v1/customer/register`, but staff accounts must be pre-created by inserting into the `staff` table with a bcrypt-hashed password:
```sql
-- Password: "password123"
INSERT INTO staff (id, username, password_hash, first_name, last_name)
VALUES (
  'STF-001',
  'staff',
  '$2a$10$wN9i073UjQcWkJ1Zf09VbOqjNq1k1zF.7t2c8rB5yR0aD5xK8vE.e',
  'Admin',
  'Staff'
);
```

