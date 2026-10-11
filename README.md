# PB Wisdom

Internal club companion for **PB Wisdom Medan** — members & admins only. No public marketing site.

## Stack

- **App + API:** Next.js 16 (App Router, Server Actions), built with bun, run with Node
- **Database:** PostgreSQL 16 with Prisma migrations
- **Auth:** Auth.js — Google (optional) + email/password
- **UI:** Tailwind + shadcn-style components, Motion, mobile bottom nav, PWA manifest
- **Hosting:** Docker on a VPS behind Caddy — see [DEPLOY.md](DEPLOY.md)

## Local setup

```bash
# 1. Install
bun install

# 2. Env
cp .env.example .env
# set AUTH_SECRET (openssl rand -base64 32)

# 3. Start Postgres (pick one)
# Docker:
bun run db:up
# Or Homebrew:
# brew services start postgresql@16
# createuser -s pbwisdom; createdb -O pbwisdom pbwisdom
# psql postgres -c "ALTER USER pbwisdom WITH PASSWORD 'pbwisdom';"

# 4. Schema + seed
bun run db:deploy
bun run db:seed

# 5. Dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

A database created earlier with `prisma db push` already has the schema; mark
the migrations as applied once instead of running them:

```bash
bunx prisma migrate resolve --applied 0_init
bunx prisma migrate resolve --applied 1_add_indexes   # if it already has the indexes
```

Schema changes: edit `prisma/schema.prisma`, then `bun run db:migrate` to
create a migration, and commit it.

### Seed logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pbwisdom.local` | `WisdomAdmin1!` |
| Member | `member@pbwisdom.local` | `WisdomMember1!` |
| Pending | `pending@pbwisdom.local` | `WisdomPending1!` |

Dummy members use password `WisdomMember1!` (e.g. `dedi@pbwisdom.local`).

Club invite code from seed: `WISDOM2026`.

The seed deletes all data first and refuses to run with `NODE_ENV=production`.

## UI-only demo on Vercel (no backend)

For member preview of the UI with rich mock data and **no Postgres / no real auth**:

1. Deploy to Vercel as usual.
2. Set these env vars (and **omit** `DATABASE_URL`):

```
DEMO_MODE=1
AUTH_SECRET=any-random-string
AUTH_URL=https://your-app.vercel.app
```

3. Open the site — you are signed in as **Member** (Budi) by default, with seed-like mock data (jadwal, events, matches, iuran, directory).
4. Use the amber **Demo** banner to switch to **Admin** and open Club tools.

Locally:

```bash
DEMO_MODE=1 AUTH_SECRET=demo bun run dev
```

Mutations (RSVP, upload, approve, etc.) are no-ops in demo mode.

## Features

- **Public Home + Jadwal** — browse schedule without login
- **Login modal** for private areas (Events, Play, Profile, Club)
- Google / email-password auth, pending approval gate
- Profiles + directory, invite links
- Monthly iuran with photo proof upload (private to member + admins) + admin verify
- Jadwal latihan (recurring) + RSVP
- Events + RSVP + photo albums per event
- Match logging, opponent confirm, admin dispute resolution, winrate, Home leaderboard
- Club admin hub, announcements, CSV export
- Daily job (`/api/cron/daily`): upcoming training sessions + weekly overdue iuran reminders
- Light sport UI (navy / sky blue / white) with animated shuttle assets

## Production

Docker on the `dc-yukpartneran` VPS, deployed by GitHub Actions on every push
to `main`. Setup, secrets, data migration, backups and rollback:
**[DEPLOY.md](DEPLOY.md)**.

## Scripts

| Script | Purpose |
|--------|---------|
| `bun run dev` | Next.js dev server |
| `bun run lint` / `bun run typecheck` | ESLint / TypeScript |
| `bun run db:up` | Local Docker Postgres |
| `bun run db:migrate` | Create + apply a migration (dev) |
| `bun run db:deploy` | Apply pending migrations |
| `bun run db:seed` | Seed mock club (wipes data) |
| `bun run build` | Production build |

## Brand

Light blue / dark blue / white sport UI (`#071428` navy, `#22d3ee` cyan). Drop a real club logo into `public/` when ready.
