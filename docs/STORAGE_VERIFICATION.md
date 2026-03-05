# Storage verification checklist (Railway backend)

## 1. Uploaded documents in persistent volume or object storage

- **Clinic applications:** `src/controllers/clinicApplicationController.js`  
  - Uses `RAILWAY_VOLUME_MOUNT_PATH` (or `/data`) → `uploads/clinic-applications`.  
  - When the Railway volume is mounted, files persist across deploys.  
  - Fallback: local `./uploads` when volume is not available.

- **Therapist credentials:** `src/controllers/credentialUploadController.js`  
  - Same pattern: `RAILWAY_VOLUME_MOUNT_PATH/uploads/credentials`.

**Conclusion:** With a Railway volume attached and `RAILWAY_VOLUME_MOUNT_PATH` set, uploads are on persistent storage. Safe for MVP.

---

## 2. Only admin routes can request signed document links

- **Clinic application documents:**  
  - `GET /api/admin/clinic-applications/:id/document-link` returns `{ "url": "/clinic-documents/<token>" }`.  
  - Route lives under `adminClinicApplications.js`: `authenticate` + `requireRole('admin')` + `requireLegalAcceptances`.  
  - Only admins can obtain the link; the actual file is served at `GET /api/clinic-documents/:token` (token verified, no auth header).

- **Credential documents:**  
  - No signed URL. Files are served at `GET /api/therapist/credential-document/:filename` with `requireRole('admin')`.  
  - Admin-only.

**Conclusion:** Document access is restricted to admin.

---

## 3. Signed document token expiry

- Clinic document token: JWT with payload `{ clinic_application_id, file_path }`, default 5 min expiry (`src/utils/signedDocumentToken.js`).  
- `GET /api/clinic-documents/:token` verifies the token (using `DOCUMENT_TOKEN_SECRET`): expired → 401, invalid → 403.

**Conclusion:** Signed document links expire after 5 minutes.
