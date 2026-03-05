# Legal gate – manual test plan

When you bump `CURRENT_LEGAL` in `src/config/legalVersions.js`, use this to verify forced re-acceptance across all roles.

## 1. Bump version

- In `src/config/legalVersions.js`, set e.g. `terms: '2026-04-01'` (or any new value) so it no longer matches what existing users have accepted.

## 2. Parent

- Log in as a **parent** (or use an existing parent token).
- Call any gated parent route, e.g.:
  - `GET /api/children`
  - `GET /api/appointments`
  - `GET /api/parent/streak`
- **Expect:** `428` with body `{ code: 'LEGAL_REACCEPT_REQUIRED', missing: [{ document_type, document_version }, ...] }`.
- Open the **mobile app** as that parent:
  - **Expect:** LegalReacceptGateScreen is shown (blocking).
- Accept all missing documents in the gate, then continue.
- Retry the same API call (or any parent route).
- **Expect:** `200` (or normal response); app proceeds.

## 3. Admin

- Log in as **admin**.
- Call e.g. `GET /api/admin/dashboard`.
- **Expect:** `428` with `LEGAL_REACCEPT_REQUIRED` until current legal docs are accepted.
- In app (or by calling `POST /auth/me/legal-acceptance` for each missing item), record acceptances for the new version.
- Retry `GET /api/admin/dashboard`.
- **Expect:** `200`; dashboard loads.

## 4. Gate endpoints must stay ungated

- `GET /auth/me/required-acceptances` and `POST /auth/me/legal-acceptance` use only `authenticate` (no `requireLegalAcceptances`), so they remain callable to resolve the gate. Do not add legal gate middleware to auth routes.

## 5. Public routes unchanged

- Public routes (e.g. `GET /content`, `GET /daily-tip`, `GET /search/*`, public clinic/psychologist pages, `POST /auth/login`, `POST /auth/register`, `POST /auth/set-password-from-invite`) are not gated and should behave as before.
