# Mindful Kids API

Backend API for the Mindful Kids app (parents, children, activities, advice, psychologists, reviews, progress, emotion logs). **Runs on [Railway](https://railway.app).**

---

## Deploy on Railway

1. **Create a project** at [railway.app](https://railway.app) and connect your GitHub. Deploy this repo.

2. **Add PostgreSQL**  
   **New** → **Database** → **PostgreSQL**.  
   Railway sets **`DATABASE_URL`** on your API service (Variables → Reference from the Postgres service).

3. **Set env vars** on the API service:
   - `JWT_SECRET` — long random string (e.g. password generator).
   - Optionally: `NODE_ENV=production`.

4. **Run migrations once**  
   On the API service: **…** → **Run Command** → `npm run migrate`  
   (or `railway run npm run migrate` with [Railway CLI](https://docs.railway.app/develop/cli)).

5. **Use the API**  
   Your app URL: `https://<your-app>.up.railway.app`  
   Health: `GET https://<your-app>.up.railway.app/api/health`

---

## Scripts

| Command | Use |
|--------|-----|
| `npm start` | Run API (Railway default) |
| `npm run migrate` | Apply DB migrations |
| `npm run migrate:rollback` | Roll back last migration |
| `npm run db:check` | Verify DB connection and list migrations/tables |

---

## API overview

- **Health:** `GET /api/health`
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Children, activities, advice, psychologists, reviews, progress, emotion-logs** — see `src/routes/`.

### Progress

- **Upsert completion:** `PUT /api/progress/children/:child_id/activities/:activity_id` with `{ stars }` (1–5).
- **Summary:** `GET /api/progress/children/:child_id/summary` (totals, streak, recent).
- **Streak:** `GET /api/progress/children/:child_id/streak`.
