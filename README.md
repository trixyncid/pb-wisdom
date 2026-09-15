# PB Wisdom

Internal club companion for **PB Wisdom Medan** — members & admins only. No public marketing site.

## Stack

- **Frontend/API:** Next.js (App Router) on Vercel
- **Database:** PostgreSQL (local Docker / Railway Hobby in production)
- **Auth:** Auth.js — Google (optional) + email/password
- **UI:** Tailwind + shadcn-style components, Motion, mobile bottom nav, PWA manifest

## Local setup

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env
# AUTH_SECRET is already set in .env for local; change for production

# 3. Start Postgres (pick one)
# Docker:
npm run db:up
# Or Homebrew (already used in this machine if Docker is down):
# brew services start postgresql@16
# createuser -s pbwisdom; createdb -O pbwisdom pbwisdom
# psql postgres -c "ALTER USER pbwisdom WITH PASSWORD 'pbwisdom';"

# 4. Schema + seed
npx prisma db push
npm run db:seed

# 5. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pbwisdom.local` | `WisdomAdmin1!` |
| Member | `member@pbwisdom.local` | `WisdomMember1!` |
| Pending | `pending@pbwisdom.local` | `WisdomPending1!` |

Dummy members use password `WisdomMember1!` (e.g. `dedi@pbwisdom.local`).

Club invite code from seed: `WISDOM2026`.

**Do not run the seed against production Railway.**

## UI-only demo on Vercel (no backend)

For member preview of the UI with rich mock data and **no Postgres / no real auth**:

1. Deploy to Vercel as usual.
2. Set these env vars (and **omit** `DATABASE_URL`):

```
DEMO_MODE=1
NEXT_PUBLIC_DEMO_MODE=1
AUTH_SECRET=any-random-string
AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

3. Open the site — you are signed in as **Member** (Budi) by default, with seed-like mock data (jadwal, events, matches, iuran, directory).
4. Use the amber **Demo** banner to switch to **Admin** and open Club tools.

Locally:

```bash
DEMO_MODE=1 NEXT_PUBLIC_DEMO_MODE=1 AUTH_SECRET=demo npm run dev
```

Mutations (RSVP, upload, approve, etc.) are no-ops in demo mode.

## Features

- **Public Home + Jadwal** — browse schedule without login
- **Login modal** for private areas (Events, Play, Profile, Club)
- Google / email-password auth, pending approval gate
- Profiles + directory, invite links
- Monthly iuran with bukti upload + admin verify
- Jadwal latihan (recurring) + RSVP
- Events + RSVP + photo albums per event
- Match logging, opponent confirm, winrate, Home leaderboard (podium + recent matches)
- Club admin hub, announcements, CSV export
- Daily cron for overdue iuran reminders (`/api/cron/overdue-fees`)
- Light sport UI (navy / sky blue / white) with animated shuttle assets

## Production (Vercel + Railway)

1. Create Railway Postgres; enable **Connection Pooling (PgBouncer)**.
2. On Vercel set:
   - `DATABASE_URL` = Railway **pooled public** URL
   - `DIRECT_URL` = Railway **unpooled public** URL (migrations)
   - `AUTH_SECRET`, `AUTH_URL` (https://your-domain)
   - `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` (optional but recommended)
   - `NEXT_PUBLIC_APP_URL`
   - `CRON_SECRET` (Authorization: Bearer … for cron)
3. Cap Postgres RAM ~256–512 MB on Railway. Keep Next.js on Vercel only.
4. For image uploads in production, point bukti/profile/gallery URLs at Cloudinary or UploadThing (local uses paste-URL for simplicity).

```bash
npx prisma migrate deploy
# never: npm run db:seed on production
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run db:up` | Docker Postgres |
| `npx prisma db push` | Sync schema (local) |
| `npm run db:seed` | Seed mock club |
| `npm run build` | Production build |

## Brand

Light blue / dark blue / white sport UI (`#071428` navy, `#22d3ee` cyan). Drop a real club logo into `public/` when ready.
