# Clinic onboarding and verification

Production-ready pipeline: clinics apply (with document upload), admin reviews, approve creates a verified clinic; public directory shows only verified clinics.

## Migration (Part 1)

**File:** `src/database/migrations/017_clinic_applications.sql`

**Run locally:** `npm run migrate` (uses `DATABASE_URL` from `.env`).

**Run on Railway:**
- **Option A (recommended):** Deploy as usual. This repo’s `railway.toml` sets a **pre-deploy command** `npm run migrate`, so migrations run automatically on each deploy against Railway’s Postgres.
- **Option B (one-off):** From your machine with [Railway CLI](https://docs.railway.com/develop/cli) installed and linked: `railway run npm run migrate`. That uses the Railway project’s `DATABASE_URL` and runs the migrate script in the cloud.
- **Option C:** In Railway dashboard → your service → Variables, copy `DATABASE_URL` into your local `.env`, then run `npm run migrate` locally (migrations run against the Railway DB).

Creates table `clinic_applications` with:
- `id` (UUID PK), `clinic_name`, `country`, `contact_email`, `contact_phone`, `description`
- `document_storage_path` (required), `status` (pending | approved | rejected)
- `submitted_at`, `reviewed_at`, `reviewed_by` (→ users.id), `rejection_reason`
- Indexes: `status`, `country`

---

## Created routes (Parts 2–4)

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/clinic-applications` | Submit application (multipart: `document` file + clinic_name, country, contact_email, contact_phone, description). Uploads to secure storage, creates row with `status = 'pending'`. |

### Admin (require `Authorization: Bearer <admin JWT>`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/clinic-applications` | List applications (query: `status`, `country`, `limit`). |
| GET | `/api/admin/clinic-applications/:id` | Full application (no `document_storage_path` exposed; `has_document` boolean). |
| GET | `/api/admin/clinic-applications/:id/document` | Returns `{ url, expires_in_seconds: 300 }`. URL is signed, expires in 5 minutes; never exposes storage path. |
| PATCH | `/api/admin/clinic-applications/:id` | Body: `status` = `approved` \| `rejected`, optional `rejection_reason`. On approve: creates clinic, sets `verification_status = 'verified'`, `verified_at`, `verified_by`, audit log. On reject: updates status, audit log. |

### Document access (no auth; token in URL)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/clinic-applications/document?token=<jwt>` | Serves the file. Token is the signed URL from `GET .../:id/document`; valid 5 minutes. |

---

## Updated / existing behavior (Parts 5–6)

- **Public clinic directory**  
  - `GET /api/clinics` – only clinics with `verification_status = 'verified'`.  
  - `GET /api/clinics/:id` – returns 404 if clinic is not verified.  
  - Responses include `verification_status`, `verified_at`, `country` (already in `clinics` columns).

- **Audit log**  
  All admin actions write to `admin_audit_log`:  
  - `clinic_application_approved` (target_type: `clinic_application`, details: `clinic_id`)  
  - `clinic_application_rejected` (target_type: `clinic_application`, details: `rejection_reason` if any)  
  - `clinic_verification_updated` (target_type: `clinic`, when admin PATCHes clinic `verification_status`)

- **Validation**  
  - Document upload: PDF, JPEG, PNG, WebP only; max 10 MB.  
  - Inputs sanitized (trim, length limits). `contact_email` must be a valid email format.  
  - Admin role required for list, get one, document URL, and PATCH.

- **Rate limiting**  
  - Public `POST /api/clinic-applications`: 10 requests per 15 minutes per IP to reduce spam and storage abuse.

---

## Models

- **New:** `src/models/ClinicApplication.js` – `findAll`, `findById`, `create`, `update` for `clinic_applications`.
- **Updated:** `src/models/Clinic.js` – `findAll` accepts `verification_status` filter (used by public directory).

---

## Environment variables

Same as existing app; clinic application documents use the same volume/local pattern as credential uploads.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (migration + app). |
| `JWT_SECRET` | Signing admin JWTs and document tokens (5 min expiry). |
| `BASE_URL` | Optional; used for signed document URL base (e.g. `https://your-api.up.railway.app`). |
| `RAILWAY_VOLUME_MOUNT_PATH` | Optional; e.g. `/data` – clinic application files stored under `{volume}/uploads/clinic-applications/`. |
| `UPLOAD_DIR` | Optional; fallback when volume not used (e.g. `./uploads`). |

No new env vars required; existing `BASE_URL`, `JWT_SECRET`, and upload dir behaviour cover clinic applications.

---

## How to test with curl

Assume API base `http://localhost:8080` and replace with your URL. Get an admin JWT from your auth flow (e.g. `POST /api/auth/login` with admin user).

### 1. Submit clinic application (public, no auth)

```bash
curl -X POST http://localhost:8080/api/clinic-applications \
  -F "clinic_name=Test Family Clinic" \
  -F "country=US" \
  -F "contact_email=admin@testclinic.com" \
  -F "contact_phone=+1 555 000 0000" \
  -F "description=Child and family therapy." \
  -F "document=@/path/to/your.pdf"
```

Expected: `201` with `{ "message": "Application submitted.", "application": { "id": "...", "status": "pending", "submitted_at": "..." } }`.

### 2. List clinic applications (admin)

```bash
curl -s -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  "http://localhost:8080/api/admin/clinic-applications"
```

### 3. Get one application (admin)

```bash
curl -s -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  "http://localhost:8080/api/admin/clinic-applications/APPLICATION_ID"
```

### 4. Get signed document URL (admin)

```bash
curl -s -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  "http://localhost:8080/api/admin/clinic-applications/APPLICATION_ID/document"
```

Returns `{ "url": "http://.../api/admin/clinic-applications/document?token=...", "expires_in_seconds": 300 }`. Open `url` in browser or:

```bash
curl -s -o downloaded.pdf "THE_URL_FROM_ABOVE"
```

### 5. Approve application (admin)

```bash
curl -X PATCH "http://localhost:8080/api/admin/clinic-applications/APPLICATION_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

### 6. Reject application (admin)

```bash
curl -X PATCH "http://localhost:8080/api/admin/clinic-applications/APPLICATION_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","rejection_reason":"Documentation incomplete."}'
```

### 7. Public clinic directory (verified only)

```bash
curl -s "http://localhost:8080/api/clinics"
curl -s "http://localhost:8080/api/clinics/CLINIC_ID"
```

Responses include `verification_status`, `verified_at`, `country` for each clinic.
