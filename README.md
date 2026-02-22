# Mindful Kids API

Backend API for the Mindful Kids app (parents, children, activities, advice, progress, emotion logs).

**Designed to run on [Railway](https://railway.app)** — no local database required.

---

## Deploy on Railway (recommended)

1. **Create a project** at [railway.app](https://railway.app) and connect your GitHub. Deploy this repo.

2. **Add PostgreSQL**  
   In the same project: **New** → **Database** → **PostgreSQL**.  
   Railway creates the database and sets **`DATABASE_URL`** on your API service (via **Variables** → **Reference** from the Postgres service).

3. **Set env vars** on your API service (Variables):
   - `JWT_SECRET` — pick a long random string (e.g. from a password generator).
   - Optionally: `NODE_ENV=production`.

   You do **not** set `DATABASE_URL` manually — it comes from the Postgres service.

4. **Run migrations once**  
   In your API service: **Settings** → **Deploy** or use a one-off run:
   - Railway dashboard: **…** on the service → **Run Command** → `npm run migrate`
   - Or with [Railway CLI](https://docs.railway.app/develop/cli): `railway run npm run migrate`

5. **Use the API**  
   Railway gives you a public URL (e.g. `https://your-app.up.railway.app`).  
   Health check: `GET https://your-app.up.railway.app/api/health`

---

## API overview

- **Health:** `GET /api/health`
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Children:** `GET /api/children`, `POST /api/children`, etc.
- **Activities, advice, psychologists, reviews, progress, emotion-logs** — see `src/routes/`.

---

## Scripts (for Railway or local)

| Command           | Use |
|------------------|-----|
| `npm start`      | Run API (used by Railway) |
| `npm run migrate` | Apply DB migrations (run once after adding Postgres) |
| `npm run migrate:rollback` | Roll back last migration |

---

## Optional: run locally

Only if you want to run the API on your machine (e.g. with a local Postgres or by copying `DATABASE_URL` from Railway):

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` (or use Railway’s: Postgres service → **Connect** → copy URL into `.env`).
3. Set `JWT_SECRET` in `.env`.
4. Run `npm run migrate`, then `npm start` (or `npm run dev` for watch mode).
