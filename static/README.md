# Set-password redirect page

Host `set-password.html` so it is served at **`/set-password`** on your domain (e.g. `https://app.mindfulkids.com/set-password`).

Then set in your API env:

```bash
CLINIC_INVITE_BASE_URL=https://app.mindfulkids.com
```

Invite links will be `https://app.mindfulkids.com/set-password?token=...`. When the user taps the link:

1. Safari opens the page (no "invalid address").
2. The page redirects to `mindfulkids://app/set-password?token=...`, which opens the app.
3. If the app doesn’t open, the user can tap "Open Mindful Kids app".

## How to host

- **Vercel / Netlify:** Put `set-password.html` in a folder and add a rewrite so `/set-password` serves it (e.g. Vercel: `rewrites: [{ "source": "/set-password", "destination": "/set-password.html" }]`), or place it at `set-password/index.html`.
- **Any static host:** Serve the file as `set-password/index.html` so the URL is `https://yourdomain.com/set-password` (with no `.html`).
