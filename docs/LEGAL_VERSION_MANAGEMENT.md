# Legal version management

This document describes how legal document versions are managed and how to update terms (or other legal documents) without a code deploy.

## How to update terms

1. **Update the document text in the mobile app**  
   Publish the new wording (e.g. Terms of Service, Privacy Policy) in your app content or in-app screens so users see the new text when they open the gate.

2. **Bump the required version via the API**  
   Call the admin endpoint with the new version string (e.g. a date or semantic version):

   ```http
   PATCH /api/admin/legal-documents/terms
   Authorization: Bearer <admin JWT>
   Content-Type: application/json

   { "version": "2026-04-01" }
   ```

   Response:

   ```json
   { "document_type": "terms", "new_version": "2026-04-01" }
   ```

3. **Users are gated automatically**  
   The API uses the `legal_documents` table as the source of “current” versions. After you bump the version, `requireLegalAcceptances` and `GET /auth/me/required-acceptances` will require the new version. Users who have not yet accepted that version will receive `428` with `code: "LEGAL_REACCEPT_REQUIRED"` and a `missing` list; the mobile app’s legal gate will prompt them to accept before using protected features.

## Version source and cache

- **Source of truth:** table `legal_documents` (columns: `document_type`, `current_version`, `updated_at`).
- **In-app cache:** `getCurrentLegalVersions()` caches the result in memory for 60 seconds. When an admin updates a version via `PATCH /admin/legal-documents/:document_type`, the cache is invalidated so the next check uses the new version.

## Acceptance history

- **`legal_acceptances`** stores one row per (user, document_type, document_version) when a user accepts. Historical versions remain stored; only the *current* required version per type is defined in `legal_documents` and used for gating.
- When you bump a version, existing acceptances for older versions are not modified; users who had accepted the previous version must accept the new version (and a new row is written) to pass the gate.

## Document types

Supported `document_type` values for the admin PATCH endpoint and for required-acceptance checks:

- `terms`
- `privacy_policy`
- `professional_disclaimer`
- `provider_terms`

Roles determine which of these are required (e.g. therapists and clinic admins require all four; parents and admins require terms and privacy_policy only). See `getRequiredDocTypesForRole` in `src/config/legalVersions.js`.

## Audit trail

All legal document version updates are recorded in the **`legal_document_updates`** table. Each row is created when an admin calls `PATCH /admin/legal-documents/:document_type` with a new version.

| Column          | Description                                      |
|-----------------|--------------------------------------------------|
| `id`            | UUID primary key                                 |
| `document_type` | One of: terms, privacy_policy, professional_disclaimer, provider_terms |
| `old_version`   | Version string before the update                 |
| `new_version`   | Version string after the update                  |
| `updated_by`    | UUID of the admin user who performed the update (references `users.id`) |
| `updated_at`    | Timestamp of the update                          |

Use this table for compliance and to answer “who changed which document version and when.”
