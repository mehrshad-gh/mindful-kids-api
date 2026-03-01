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

## 2. Only admin routes can request signed URLs

- **Clinic application documents:**  
  - `GET /api/admin/clinic-applications/:id/document` returns the signed URL.  
  - Route lives under `adminClinicApplications.js`: `authenticate` + `requireRole('admin')`.  
  - Only admins can call this; the response is the only way to obtain the document link.

- **Credential documents:**  
  - No signed URL. Files are served at `GET /api/therapist/credential-document/:filename` with `requireRole('admin')`.  
  - Admin-only.

**Conclusion:** Document access is restricted to admin.

---

## 3. Signed URL expiry

- Clinic document link: JWT with `expiresIn: '5m'` (see `DOCUMENT_TOKEN_EXPIRY` in `clinicApplicationController.js`).  
- `serveDocumentByToken` verifies the JWT and returns 401 when expired.

**Conclusion:** Signed URLs expire after 5 minutes.
