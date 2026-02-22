# Mindful Kids API

Backend API for the Mindful Kids app (parents, children, activities, advice, progress, emotion logs).

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** (running locally or reachable via `DATABASE_URL`)

## Setup

1. **Environment**

   Copy `.env.example` to `.env` and set `DATABASE_URL` for your PostgreSQL instance:

   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL (e.g. postgresql://user:password@localhost:5432/mindful_kids)
   ```

2. **Database**

   Create the database and run migrations:

   ```bash
   createdb mindful_kids
   npm run migrate
   ```

3. **Run the server**

   ```bash
   npm run dev
   ```

   The server checks the database connection on startup. If PostgreSQL is not running or `DATABASE_URL` is wrong, it will exit with a clear error and tip.

## Scripts

- `npm start` — run server (no watch)
- `npm run dev` — run server with `--watch`
- `npm run migrate` — apply database migrations
- `npm run migrate:rollback` — rollback last migration

## Health

- `GET /api/health` — returns `{ "status": "ok", "timestamp": "..." }`

---

## Deploy on Railway (simpler than local)

Your app uses the same thing everywhere: a **`DATABASE_URL`** env var to talk to Postgres. Locally you install Postgres and set it yourself; on Railway they give it to you.

**On Railway:**

1. Create a project and add **PostgreSQL** from the catalog (one click). Railway creates the database and sets **`DATABASE_URL`** for you.
2. Add your API (this repo) as a service and connect the repo. Railway will run `npm start` (or whatever start command you set).
3. Add env vars if needed: `JWT_SECRET`, `NODE_ENV=production`, etc. You do **not** need to set `DATABASE_URL` — it’s already there from the Postgres service.
4. Run migrations once: in your Railway project, open your API service → **Settings** → one-off command or a **Deploy** step: `npm run migrate` (or use Railway CLI: `railway run npm run migrate`).

After that, the API runs on Railway’s URL and uses Railway’s Postgres. Same code, same `DATABASE_URL` — no local Postgres or `.env` needed for production.
