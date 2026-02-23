# Therapist Onboarding System

Enterprise therapist onboarding: professional registration, credential submission, verification status, clinic affiliation, public profile generation, and admin approval workflow.

## Overview

- **Therapists** register with role `therapist`, then create and submit an **application** (profile + credentials + clinic affiliations).
- **Admins** review applications and **approve** or **reject**. On approval, a **public psychologist profile** is created and linked to the therapist’s user account; **clinic affiliations** are copied to the directory.
- **Clinics** are managed by admins; therapists choose affiliations when applying. Public **psychologist** detail includes `clinics`.

## Data model

- **users** – `role` can be `parent`, `admin`, or `therapist`.
- **clinics** – Name, slug, description, address, country, website, logo. Used for therapist affiliation.
- **therapist_applications** – One per therapist user: professional info, credentials (JSONB array), status (`draft` | `pending` | `approved` | `rejected`), review metadata, and optional `psychologist_id` after approval.
- **therapist_application_clinics** – Application’s chosen clinic IDs (and role/is_primary); copied to `therapist_clinics` on approval.
- **psychologists** – Optional `user_id`; set when created from an approved application. Public directory row.
- **therapist_clinics** – Psychologist–clinic many-to-many for directory display.

## API

### Auth

- **POST /api/auth/register**  
  Body: `{ email, password, name, role? }`  
  `role` optional: `parent` (default) or `therapist`.

### Therapist (authenticated, role = therapist)

- **GET /api/therapist/application**  
  Returns current user’s application (if any) and `clinic_affiliations`.

- **PUT /api/therapist/application**  
  Create or update **draft**. Body: professional fields (`professional_name`, `email`, `phone`, `specialty`, `specialization`, `bio`, `location`, `languages`, `profile_image_url`, `video_urls`, `contact_info`, `credentials`), and optional `clinic_affiliations`: `[{ clinic_id, role_label?, is_primary? }]`.

- **POST /api/therapist/application/submit**  
  Submit draft for review (status → `pending`).

### Admin (authenticated, role = admin)

- **GET /api/admin/therapist-applications**  
  Query: `?status=pending` (or `draft`|`approved`|`rejected`), `?limit=50`. Returns applications with `user_email`, `user_name`.

- **GET /api/admin/therapist-applications/:id**  
  One application with `clinic_affiliations`.

- **PATCH /api/admin/therapist-applications/:id**  
  Body: `{ status: "approved" | "rejected", rejection_reason? }`.  
  On **approve**: creates psychologist row (verified), sets `psychologist_id`, copies clinic affiliations to `therapist_clinics`.

- **GET /api/admin/clinics** – List clinics.  
- **POST /api/admin/clinics** – Create clinic (body: `name`, optional `slug`, `description`, `address`, `country`, `website`, `logo_url`).

### Public

- **GET /api/clinics** – List active clinics (`?country=`, `?search=`, `?limit=`). Used by therapist onboarding to pick affiliations.
- **GET /api/clinics/:id** – One clinic.
- **GET /api/psychologists**, **GET /api/psychologists/:id** – Unchanged; detail response now includes `psychologist.clinics` (from `therapist_clinics`).

## Credentials format

In `therapist_applications.credentials` (and request body), use an array of objects, e.g.:

```json
[
  { "type": "license", "issuer": "State Board", "number": "XYZ123", "document_url": "https://...", "verified": false }
]
```

Verification and document storage are app-specific; the field is stored for admin review.

## Migration

Run:

```bash
npm run migrate
```

Migration `011_therapist_onboarding.sql` adds: `therapist` role, `psychologists.user_id`, `clinics`, `therapist_applications`, `therapist_application_clinics`, `therapist_clinics`, and indexes/triggers.
