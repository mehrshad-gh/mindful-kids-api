# Clinic invite (set-password) security

## Current approach

- **Token in URL**: Invite link is `https://your-api/set-password?token=<64-char-hex>`. This is a standard pattern (used by GitHub, Slack, etc.) when done correctly.
- **Why it's safe**:
  - Token is 32 random bytes (unguessable).
  - Single-use: token is deleted after password is set (or when account already exists).
  - Expiry: 24 hours (see `clinicApplicationController` when creating the invite).
  - HTTPS only.
  - Rate limit: 10 attempts per 15 minutes per IP on `POST /api/auth/set-password-from-invite`.

## Optional hardening

- **Shorter/longer expiry**: In `clinicApplicationController.js`, the invite `expiresAt` is 24 hours; adjust if needed.
- **Logging**: Avoid logging the full URL for `GET /set-password` (query string contains the token). If using a logging/monitoring service, redact the `token` query parameter for that path.
- **Send link securely**: Invite is sent to the clinic contact email; treat the link as secret and ask them not to share it.

## Alternative: one-time code (no token in URL)

If you want to avoid any secret in the URL:

1. User opens `https://your-api/set-password` (no token). Page shows a short-lived **code** (e.g. 6–8 digits) that the backend associates with the invite (e.g. store `code → invite_id` with 10‑minute TTL). Code is sent to their email at the same time, or they must have arrived from the link in email (session cookie set when they land with token once, then redirect to code-only URL).
2. User opens the app, enters the code. App calls `POST /auth/set-password-with-code` with `{ code, password }`. Backend validates code, consumes invite, creates account.

This removes the token from the URL but adds complexity (code generation, code entry screen in app, email or session flow). The current token-in-URL approach is industry-standard and secure when implemented as above.
