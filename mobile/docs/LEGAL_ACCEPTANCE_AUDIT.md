# Legal Acceptance Recording – Audit Report

## Summary

- **Checkbox gating** is UI-only; acceptances are **recorded in the backend** via `POST /auth/me/legal-acceptance` with `document_version` set to `LEGAL_DOCUMENT_VERSION` from `mobile/src/constants/legalContent.ts`.
- Recording happens **only after** successful authenticated account creation or set-password (token stored). No recording in unauthenticated flows.

---

## Per-screen audit

| Screen | Recorded? | Where |
|--------|-----------|--------|
| **FamilyAuthScreen** (Create account tab) | **YES** | After `await register(...)` succeeds → `recordStandardAcceptances(['terms', 'privacy_policy'])` in `handleRegister`. Checkbox is validated before `register()` is called. |
| **AuthLandingScreen** (Sign Up / Create account) | **YES** | After `await register(...)` succeeds → `recordStandardAcceptances(['terms', 'privacy_policy'])` in `handleAction` (register branch). Checkbox validated before `register()`. |
| **RegisterScreen** (legacy family register) | **YES** | After `await register(...)` succeeds → `recordStandardAcceptances(['terms', 'privacy_policy'])` in `handleRegister`. |
| **TherapistRegisterScreen** | **YES** | After `await register(..., 'therapist')` succeeds → `recordStandardAcceptances(['terms', 'privacy_policy', 'professional_disclaimer'])` in `handleRegister`. Checkbox validated before `register()`. |
| **SetPasswordScreen** (clinic invite) | **YES** | After `await setPasswordFromInvite(token, password)` succeeds (token stored inside that call) → `recordStandardAcceptances(['terms', 'privacy_policy', 'professional_disclaimer'])`; then `refreshAuth()`. Checkbox validated before submit. |
| **ClinicApplicationFormScreen** | **NO** | Checkbox only gates submission. **No** `recordLegalAcceptance` or `recordStandardAcceptances` – no authenticated user at apply time. |

---

## document_version

- **Source of truth:** `LEGAL_DOCUMENT_VERSION` in `mobile/src/constants/legalContent.ts` (e.g. `'2026-03-04'`).
- **Mobile:** `authService.recordLegalAcceptance(documentType, documentVersion)` sends `document_version` in the request body when provided. `recordStandardAcceptances()` always passes `LEGAL_DOCUMENT_VERSION`.
- **Backend:** `POST /auth/me/legal-acceptance` accepts `document_version` and stores it in `legal_acceptances.document_version` (see `LegalAcceptance.record(userId, documentType, documentVersion)`). No schema changes.

---

## Implementation details

- **Helper:** `mobile/src/utils/legalAcceptance.ts` – `recordStandardAcceptances(types)` runs `recordLegalAcceptance(type, LEGAL_DOCUMENT_VERSION)` for each type with try/catch per call so recording failures do not block auth.
- **Dev logging:** In `__DEV__`, a single `console.log` per successful acceptance (`[legal] Recorded acceptance: <type> @ <version>`) and `console.warn` on failure. No production spam.

---

## Files modified / added

**Added**

- `mobile/src/utils/legalAcceptance.ts`

**Modified**

- `mobile/src/screens/auth/FamilyAuthScreen.tsx` – use `recordStandardAcceptances(['terms', 'privacy_policy'])`
- `mobile/src/screens/auth/AuthLandingScreen.tsx` – use `recordStandardAcceptances(['terms', 'privacy_policy'])`
- `mobile/src/screens/auth/RegisterScreen.tsx` – use `recordStandardAcceptances(['terms', 'privacy_policy'])`
- `mobile/src/screens/auth/SetPasswordScreen.tsx` – use `recordStandardAcceptances(['terms', 'privacy_policy', 'professional_disclaimer'])`
- `mobile/src/screens/therapist/TherapistRegisterScreen.tsx` – use `recordStandardAcceptances(['terms', 'privacy_policy', 'professional_disclaimer'])`

**Not modified (verified)**

- `mobile/src/screens/auth/ClinicApplicationFormScreen.tsx` – no acceptance recording; checkbox gates submit only.
- Backend: no new endpoints; existing `POST /auth/me/legal-acceptance` and storage of `document_version` unchanged.

---

## Backend idempotency and version history

- **Unique key:** One row per `(user_id, document_type, document_version)`. Constraint: `uq_legal_acceptances_user_doc_version`.
- **Idempotent per version:** Repeated `POST /auth/me/legal-acceptance` with the same user, document type, and version is a no-op (no new row); response is `200` with `message: 'Acceptance already recorded'`.
- **Version history preserved:** If the client sends a new `document_version` (e.g. terms v2026-04-01 after v2026-03-04), a **new row** is inserted. Old rows remain for audit.
- **Implementation:** `INSERT ... ON CONFLICT (user_id, document_type, document_version) DO NOTHING`. First call for a version → `201`; duplicate → `200`.
- **GET /auth/me/legal-acceptances** returns the **latest** acceptance per `document_type` (by `accepted_at` DESC, tiebreak by `document_version` DESC) for re-accept gating.

---

## Manual acceptance tests (backend)

1. **Idempotent per version:** Call `POST /auth/me/legal-acceptance` twice with the same `document_type` and `document_version` (same user/token). First response `201`, second `200`. Only one row in `legal_acceptances` for that (user_id, document_type, document_version).
2. **New version = new row:** Call POST once for version `2026-03-04`, then once for version `2026-04-01` (same document_type). Two rows exist; GET acceptances returns the newest version/timestamp for that doc.
3. **GET latest:** `GET /auth/me/legal-acceptances` returns one entry per document_type with the row that has the latest `accepted_at` (and highest `document_version` on tie).

---

## TypeScript before production

Existing TypeScript errors in the repo (e.g. `@expo/vector-icons`, navigation types, `ViewStyle[]`) do not affect the legal acceptance system. Before production, run `tsc --noEmit` and fix or suppress those errors so the project builds cleanly.
