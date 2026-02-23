# Therapist Onboarding System

Enterprise therapist onboarding: professional registration, credential submission, verification status, clinic affiliation, public profile generation, and admin approval workflow.

## User roles

- **parent** – App user (default).
- **therapist** – Can apply for onboarding; when approved, gets a **public psychologist profile** linked via `psychologists.user_id`. Use `GET /api/therapist/profile` for the linked profile.
- **clinic_admin** – Can manage **multiple clinics** (assigned by platform admin). Each clinic can have **multiple therapists** (psychologists affiliated via `therapist_clinics`). Role-based access: clinic_admin only sees/edits clinics they are assigned to.
- **admin** – Platform admin; full access.

## Overview

- **Therapists** register with role `therapist`, then create and submit an **application** (profile + credentials + clinic affiliations).
- **Admins** review applications and **approve** or **reject**. On approval, a **public psychologist profile** is created and linked to the therapist’s user account; **clinic affiliations** are copied to the directory.
- **Clinic admins** are assigned to clinics by platform admin. They can list their clinics, list therapists per clinic, and remove a therapist from a clinic.
- **Clinics** are created by admins; therapists choose affiliations when applying. Public **psychologist** detail includes `clinics`.

## Data model

- **users** – `role`: `parent`, `admin`, `therapist`, or `clinic_admin`.
- **clinics** – Name, slug, description, address, country, website, logo. Used for therapist affiliation.
- **clinic_admins** – `(user_id, clinic_id)` many-to-many: which users (role clinic_admin) manage which clinics. A clinic can have multiple admins; a clinic_admin can manage multiple clinics.
- **therapist_applications** – One per therapist user: professional info, credentials (JSONB array), status (`draft` | `pending` | `approved` | `rejected`), review metadata, and optional `psychologist_id` after approval.
- **therapist_application_clinics** – Application’s chosen clinic IDs (and role/is_primary); copied to `therapist_clinics` on approval.
- **psychologists** – Optional `user_id`; set when created from an approved application (therapist linked to public profile).
- **therapist_clinics** – Psychologist–clinic many-to-many; clinic can have multiple therapists.

## API

### Auth

- **POST /api/auth/register**  
  Body: `{ email, password, name, role? }`  
  `role` optional: `parent` (default), `therapist`, or `clinic_admin`.

### Therapist (authenticated, role = therapist)

- **GET /api/therapist/application**  
  Returns current user’s application (if any) and `clinic_affiliations`.

- **PUT /api/therapist/application**  
  Create or update **draft**. Body: professional fields (`professional_name`, `email`, `phone`, `specialty`, `specialization`, `bio`, `location`, `languages`, `profile_image_url`, `video_urls`, `contact_info`, `credentials`), and optional `clinic_affiliations`: `[{ clinic_id, role_label?, is_primary? }]`.

- **POST /api/therapist/application/submit**  
  Submit draft for review (status → `pending`).

- **GET /api/therapist/profile**  
  Returns the therapist’s **linked public profile** (psychologist row with clinics and ratings) when approved; otherwise `profile: null`.

### Clinic admin (authenticated, role = clinic_admin)

- **GET /api/clinic-admin/clinics**  
  List clinics the current user manages (assigned via `clinic_admins`).

- **GET /api/clinic-admin/clinics/:clinicId**  
  One clinic (must be one they manage) with `therapist_count`.

- **GET /api/clinic-admin/clinics/:clinicId/therapists**  
  List psychologists (therapists) affiliated with this clinic.

- **DELETE /api/clinic-admin/clinics/:clinicId/therapists/:psychologistId**  
  Remove therapist affiliation from the clinic.

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
- **GET /api/admin/clinics/:id/admins** – List users who are clinic admins for this clinic.
- **POST /api/admin/clinics/:id/admins** – Assign a user as clinic admin (body: `{ user_id }`). User’s role is set to `clinic_admin` if not already admin/clinic_admin.
- **DELETE /api/admin/clinics/:id/admins/:userId** – Remove clinic admin from clinic.

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

- Migration `011_therapist_onboarding.sql`: `therapist` role, `psychologists.user_id`, `clinics`, `therapist_applications`, `therapist_application_clinics`, `therapist_clinics`.
- Migration `012_clinic_admin_role.sql`: `clinic_admin` role, `clinic_admins` table (user–clinic management).
