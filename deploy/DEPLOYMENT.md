# Work Force Management — Production Deployment SOP

Standard Operating Procedure for deploying and operating the **Work Force
Management (WFM)** platform on a single VM, fully containerized with Docker.

---

## 1. Architecture

All four components run as containers on one VM, orchestrated by
`docker-compose.prod.yml`. The browser only ever talks to **one origin**
(the Nginx edge), so there is **no CORS** in production.

```
                       VM (single instance)
                       
   Internet  ──:80/443──▶  ┌─────────────────────────────────┐
                           │  web  (Nginx edge)              │
                           │   • serves React SPA (static)   │
                           │   • proxies /api/* ─────────────┼──▶  api (NestJS :3000)
                           └─────────────────────────────────┘            │
                                                                          │
                              migrate (one-shot) ──────────────▶  postgres (:5432)
                                  prisma migrate deploy          (private volume)
                                  + idempotent seed
```

| Service    | Image base            | Exposed?            | Purpose                                            |
| ---------- | --------------------- | ------------------- | -------------------------------------------------- |
| `postgres` | `postgres:16-alpine`  | No (internal only)  | Database. Data persisted in `wfm_postgres_data`.   |
| `migrate`  | backend `migrate`     | No (one-shot job)   | Runs all pending migrations + seed, then exits.    |
| `api`      | backend `production`  | No (`expose: 3000`) | NestJS API, reachable only through the edge.       |
| `web`      | frontend `production` | **Yes** (`:80`)     | Nginx serving the SPA + reverse-proxying `/api`.   |

**Startup order is enforced:** `postgres` (healthy) → `migrate` (completes
successfully) → `api` (healthy) → `web`. The API never boots against an
un-migrated schema.

### Files

```
.
├── docker-compose.prod.yml        # production orchestration
├── .env.prod.example              # copy to .env and fill secrets
├── Makefile                       # operator shortcuts (make help)
├── deploy/
│   ├── deploy.sh                  # one-command deploy (CI / cron / hook)
│   └── DEPLOYMENT.md              # this document
├── backend/
│   ├── Dockerfile                 # multi-stage: deps/dev/migrate/builder/production
│   └── docker/
│       ├── entrypoints/
│       │   ├── migrate.sh         # migrate deploy (+ gated seed)
│       │   └── production.sh      # node dist/main.js
│       └── postgres/init/         # one-time DB grants
└── frontend/webapp/
    ├── Dockerfile                 # Vite build → Nginx
    └── docker/nginx/default.conf  # SPA + /api reverse proxy
```

---

## 2. VM Provisioning (one-time)

Tested on Ubuntu 22.04 LTS. Run as a sudo-capable user.

```bash
# 2.1 System packages
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git make ufw

# 2.2 Docker Engine + Compose v2 (official convenience script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"          # log out / back in to take effect
docker compose version                    # verify Compose v2

# 2.3 Firewall — only SSH + HTTP/HTTPS reach the internet
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> The database port (5432) is intentionally **never** opened. Postgres is only
> reachable on the internal Docker network.

---

## 3. First Deploy

```bash
# 3.1 Clone
git clone <REPO_URL> wfm && cd wfm

# 3.2 Configure secrets
cp .env.prod.example .env
#   - set a strong POSTGRES_PASSWORD
#   - JWT_SECRET:  openssl rand -base64 48
#   - change the SEED_* passwords
#   - set WEB_HTTP_PORT (default 80)
nano .env

# 3.3 Build + start everything (runs the initial migration automatically)
make up        # = docker compose -f docker-compose.prod.yml up -d --build

# 3.4 Verify
make ps
make health    # edge + API health endpoints should both return ok
```

On first boot the `migrate` service applies **every** migration in
`backend/prisma/migrations/` (including `20250615120000_init`) against the empty
database, then seeds the baseline geography and accounts.

The app is now live at `http://<VM_IP>/`.

---

## 4. Ongoing Deploys (after pushing to git)

Migrations run on **every** deploy via the `migrate` gate, so the schema is
always in sync with the code and partial/conflicting states are avoided.

**Option A — one command (recommended):**

```bash
./deploy/deploy.sh            # current branch
./deploy/deploy.sh main       # or a specific ref
```

**Option B — Make:**

```bash
make deploy                   # git pull + build + up (migrate gate runs)
```

**Option C — manual:**

```bash
git pull --ff-only
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm migrate   # apply migrations
docker compose -f docker-compose.prod.yml up -d               # roll out
```

Because the API `depends_on` the `migrate` service `completed_successfully`,
a failed migration aborts the rollout and the previous API container keeps
running.

---

## 5. Database Migration Workflow

Migrations are authored **in development**, committed to git, and applied
**automatically in production** — production never generates migrations.

```bash
# Developer machine — after editing prisma/schema.prisma:
cd backend
npx prisma migrate dev --name <descriptive_change>   # creates + applies locally
git add prisma/migrations && git commit && git push
```

```bash
# Production VM — picked up on the next deploy:
make deploy        # runs `prisma migrate deploy` for all pending migrations
```

- `prisma migrate deploy` only applies committed migrations and never resets
  data — safe for production.
- The seed (`npm run db:seed`) is **idempotent** (upserts / find-or-create), so
  it is safe to run on every deploy. Set `RUN_SEED=false` in `.env` to skip it
  after the first deploy if preferred.

---

## 6. TLS / HTTPS (recommended)

The edge listens on HTTP `:80`. For public traffic, terminate TLS with one of:

- **Caddy / Traefik** in front of `web` (automatic Let's Encrypt), or
- **Certbot + Nginx** on the host proxying to `web`, or
- A cloud **load balancer** (ALB / Cloud LB) with a managed certificate.

Keep `WEB_HTTP_PORT` bound to localhost (e.g. `127.0.0.1:8080`) and let the TLS
terminator forward to it once a proxy is in place.

---

## 7. Operations Cheat-Sheet

```bash
make help            # list all targets
make ps              # service status
make logs            # tail all logs
make logs-api        # API logs only
make health          # edge + API health checks
make migrate         # apply migrations only (no restart)
make seed            # run idempotent seed manually
make down            # stop stack (data preserved)
make db-shell        # psql into the database
make prune           # reclaim disk from dangling images
```

### Backups

```bash
# Dump
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > wfm-$(date +%F).sql.gz

# Restore (into a running, empty DB)
gunzip -c wfm-YYYY-MM-DD.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Schedule the dump via cron and ship the artifact off-box (S3/object storage).

### Admin DB access (no public port)

```bash
# From your laptop — tunnel 5432 over SSH, then connect pgAdmin to localhost:5432
ssh -L 5432:localhost:5432 user@<VM_IP>
# (temporarily uncomment the 127.0.0.1:5432 bind in docker-compose.prod.yml)
```

---

## 8. Rollback

```bash
git checkout <previous-good-tag>
make deploy
```

Migrations are forward-only. If a release adds a destructive migration, take a
backup (Section 7) **before** deploying so you can restore if needed.

---

## 9. Troubleshooting

| Symptom                            | Check                                                                 |
| ---------------------------------- | --------------------------------------------------------------------- |
| `web` healthy but API 502          | `make logs-api`; confirm `api` is healthy and migrations succeeded.   |
| Deploy aborts at migrate step      | `docker compose -f docker-compose.prod.yml logs migrate` — fix schema.|
| Frontend loads but calls fail      | Ensure `VITE_API_BASE_URL=/api` (rebuild `web` after changing it).    |
| Postgres won't start               | `make logs`; check disk space and the `wfm_postgres_data` volume.     |
| Port 80 already in use             | Change `WEB_HTTP_PORT` in `.env` and `make up`.                       |

---

## 10. Security Notes

- **Never commit `.env`** — it is git-ignored. Rotate `JWT_SECRET` and DB
  credentials if they ever leak.
- A private SSH key (`Work Force Management`) was found in the repo root and is
  now git-ignored. **Remove it from the working tree and rotate the key** if it
  was ever committed: `git rm --cached "Work Force Management" "Work Force Management.pub"`.
- The database and API are not exposed to the internet — only the Nginx edge is.
- Keep the host patched and Docker images rebuilt regularly (`make deploy`).
```
