# Secure credential document storage

This document describes where credential files are stored, who can access them, and how they are protected. For a healthcare-related platform this design is critical for compliance and privacy.

## Architecture

```
Mobile (therapist) → POST /api/therapist/credential-document → secure storage (server)
                                                                    ↓
Application payload (document_url) → DB (therapist_applications.credentials)
                                                                    ↓
Admin UI → GET /api/therapist/credential-document/:filename (admin-only) → view for verification
```

- **Upload:** Therapist uploads via mobile; file is stored on the server; API returns a URL.
- **Storage:** Files live on server disk (or Railway volume in production). Only the **URL** is stored in the database.
- **Access:** Only **admins** can open/view credential documents (e.g. for application review). Therapists cannot view stored files after upload.

## Where files are uploaded

- **Production (Railway):** `RAILWAY_VOLUME_MOUNT_PATH` or `/data` → `{volume}/uploads/credentials/`. The volume persists across deploys.
- **Local/fallback:** `UPLOAD_DIR` or `./uploads` → `uploads/credentials/`.
- Upload directory is resolved on first use so the volume is available at runtime. See `.env.example` for `RAILWAY_VOLUME_MOUNT_PATH`.

## Who can access them

| Action | Who |
|--------|-----|
| **Upload** | Authenticated **therapist** only (`requireRole('therapist')`). |
| **View / download** | **Admin** only (`requireRole('admin')`). Used for application verification in the admin UI. Therapists do not have a “view document” action; they only upload and store the URL. |

Applications reference `document_url` in `therapist_applications.credentials` (JSONB). Only admins can resolve that URL to actual file content.

## How they are protected

1. **Authentication:** All document endpoints require a valid JWT (`authenticate` middleware). No public, unauthenticated URLs.
2. **Role checks:** Upload is therapist-only; serve is admin-only. No cross-role or anonymous access.
3. **No directory listing:** There is no API to list files. Access is by exact filename only.
4. **Unguessable filenames:** Stored filenames are UUID-based (e.g. `{uuid}.pdf`), so they cannot be guessed.
5. **Path safety:** The serve handler validates the filename (no `..` or `/`), resolves it under the uploads directory, and checks `filepath.startsWith(resolvedDir)` before sending the file.
6. **Allowed types:** Only PDF, JPEG, PNG, and WebP are accepted; max size 10 MB (enforced by multer).
7. **Database:** Only the URL string is stored in the DB; file content is never stored in the database.

## API summary

- **POST** `/api/therapist/credential-document`  
  - Body: multipart, field `document` (file).  
  - Auth: therapist.  
  - Response: `{ url }` for use as `document_url` in the application payload.

- **GET** `/api/therapist/credential-document/:filename`  
  - Auth: admin.  
  - Response: file stream (PDF/image). Used by admin app for “View attached document”.

## Mobile / admin flows

- **Therapist:** Uploads file in license/credentials flow; receives URL and saves it in the application. No in-app “open document” for the therapist.
- **Admin:** In application detail, “View attached document” calls the GET endpoint with admin JWT and displays the file in-app (e.g. image/PDF viewer); data is not written to device storage.
