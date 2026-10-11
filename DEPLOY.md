# Deploying PB Wisdom

Production runs on the `dc-yukpartneran` VPS (Tencent Lighthouse, 2 vCPU / 4 GB,
`43.163.108.105`) next to the yukpartneran stack, at **https://pb-wisdom.trixync.id**.

```
Caddy (yukpartneran stack, owns :80/:443)
├─ api.yukpartneran.id    → membership-backend:8000
└─ pb-wisdom.trixync.id   → pb-wisdom-app:3000      (via the shared `edge` network)

~/pb-wisdom  (compose project "pb-wisdom", docker-compose.prod.yml)
├─ app      Next.js standalone server (image from GHCR)
├─ migrate  one-shot `prisma migrate deploy` before every app start
├─ db       Postgres 16, private network only, volume `pgdata`
├─ cron     09:00 WIB daily → /api/cron/daily
└─ backup   nightly pg_dump, 7 daily / 4 weekly / 3 monthly, volume `backups`
```

The two stacks share nothing except Caddy and the `edge` network. Deploying
one never restarts or removes the other's containers.

## Day-to-day

Push to `main`. The **Deploy** workflow lints, type-checks, checks migrations,
builds `ghcr.io/trixyncid/pb-wisdom:<sha>`, uploads `docker-compose.prod.yml`
and runs `docker compose up -d` on the server. The app only starts if the
migration step succeeds, and the job fails if the app is not healthy.

Schema changes: edit `prisma/schema.prisma`, run `bun run db:migrate` locally
(creates a migration), commit the migration folder. It is applied on deploy.

Useful commands on the server (`cd ~/pb-wisdom` first):

```bash
dc() { docker compose -f docker-compose.prod.yml --env-file .env "$@"; }
dc ps                      # status
dc logs -f --tail=100 app  # logs
dc restart app
```

**Rollback:** set `APP_IMAGE` in `.env` to an earlier `ghcr.io/trixyncid/pb-wisdom:<sha>`
and run `dc up -d`. Migrations are not rolled back automatically; only roll
back across a migration if it was purely additive.

## First-time setup

### 1. Shared network and Caddy (dc-yukpartneran repo)

On the server, once:

```bash
docker network create edge
```

Then commit to the **dc-yukpartneran** repo (never edit these files on the
server: its deploy runs `git pull --ff-only` and would fail on local changes):

- `backend/docker-compose.prod.yml`: attach the `caddy` service to `edge`

  ```yaml
  services:
    caddy:
      networks: [default, edge]
  networks:
    edge:
      external: true
      name: edge
  ```

- `backend/caddy/Caddyfile`: add a site block

  ```caddyfile
  pb-wisdom.trixync.id {
  	encode zstd gzip
  	header {
  		Strict-Transport-Security "max-age=31536000; includeSubDomains"
  		X-Content-Type-Options "nosniff"
  		Referrer-Policy "strict-origin-when-cross-origin"
  		X-Frame-Options "DENY"
  		-Server
  	}
  	reverse_proxy pb-wisdom-app:3000
  }
  ```

Its CI runs `caddy validate`; its deploy recreates Caddy on the new network and
reloads the config. Caddy requests the certificate once DNS points at the
server (step 5); until then that site just fails TLS, the API is unaffected.

### 2. Server directory and secrets

```bash
mkdir -p ~/pb-wisdom && cd ~/pb-wisdom
# copy deploy/.env.production.example here as .env and fill it in
chmod 600 .env
```

Generate values with `openssl rand -hex 24` (Postgres password, must be
URL-safe), `openssl rand -base64 32` (`AUTH_SECRET`), `openssl rand -hex 32`
(`CRON_SECRET`).

### 3. GitHub repository secrets (trixyncid/pb-wisdom)

Create a deploy key on your laptop and allow it on the server:

```bash
ssh-keygen -t ed25519 -N "" -C pb-wisdom-deploy -f ~/.ssh/pb_wisdom_deploy
ssh-copy-id -i ~/.ssh/pb_wisdom_deploy.pub dc-yukpartneran
ssh-keyscan -H 43.163.108.105     # value for VPS_KNOWN_HOSTS
```

| Secret | Value |
|---|---|
| `VPS_HOST` | `43.163.108.105` |
| `VPS_USER` | `regretzz` |
| `VPS_SSH_KEY` | contents of `~/.ssh/pb_wisdom_deploy` |
| `VPS_KNOWN_HOSTS` | output of `ssh-keyscan` above |

Also create a `production` environment under Settings → Environments (the
deploy job uses it; add required reviewers there if you want a manual gate).

### 4. Move the data from Railway

Use a `pg_dump` at least as new as Railway's Postgres, and set the `db` image
in `docker-compose.prod.yml` to the **same major version** as Railway before
the first start (check with `SELECT version();`).

```bash
# laptop: dump (use Railway's direct / unpooled URL)
docker run --rm postgres:16-alpine pg_dump --format=custom --no-owner --no-acl \
  "$RAILWAY_DIRECT_URL" > railway.dump
scp railway.dump dc-yukpartneran:pb-wisdom/

# server: start only the database, restore, mark the baseline as applied
dc up -d db
dc exec -T db sh -c 'pg_restore --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < railway.dump
dc run --rm migrate prisma migrate resolve --applied 0_init
dc up -d                    # migrate applies 1_add_indexes, then the app starts
```

`0_init` is the schema Railway was created with (`db push`); `1_add_indexes`
adds indexes only. If `migrate deploy` reports drift, stop and compare before
continuing.

**Event times:** events created through the deployed app before the time-zone
fix were stored 7 hours late (19:00 WIB saved as 19:00 UTC). Shift only those
rows back, e.g. `UPDATE "Event" SET "startsAt" = "startsAt" - interval '7 hours',
"endsAt" = "endsAt" - interval '7 hours' WHERE id IN (...);`

**Invite code:** after the move, click **Regenerate** once on /club so the
seeded `WISDOM2026` code stops working.

### 5. Go live

1. Run the Deploy workflow (push to `main` or "Run workflow").
2. Test via the server before DNS changes: `curl -H "Host: pb-wisdom.trixync.id" http://43.163.108.105`.
3. Vercel → Domains → trixync.id → DNS: set `pb-wisdom` to **A 43.163.108.105**
   and remove the domain from the Vercel project.
4. Google OAuth (if used): authorized redirect URI
   `https://pb-wisdom.trixync.id/api/auth/callback/google`.
5. Remove the old Vercel cron / project once the VPS has run cleanly for a few days.

## Backups

Nightly dumps live in the `backups` volume. Copy them off the server regularly,
for example from your laptop:

```bash
ssh dc-yukpartneran 'cd ~/pb-wisdom && docker compose -f docker-compose.prod.yml exec -T backup cat /backups/daily/pbwisdom-latest.sql.gz' > pbwisdom-$(date +%F).sql.gz
```

Restore into the running stack. This **replaces all data**; the dumps have no
DROP statements, so the schema is emptied first:

```bash
dc stop app cron
dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gunzip -c pbwisdom-YYYY-MM-DD.sql.gz | dc exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
dc up -d
```

Test a restore occasionally; an untested backup is not a backup.
