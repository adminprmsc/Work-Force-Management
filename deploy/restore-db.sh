#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Restore a Postgres backup into the production Docker stack.
#
# Run on the VM from the repo root (after postgres is up, or this script will
# start it). Destructive: drops and recreates the target database.
#
# Usage (on the VM):
#   ./deploy/restore-db.sh backups/wfm-20260810-073821.sql.gz
#   ./deploy/restore-db.sh /path/to/wfm-YYYYMMDD-HHMMSS.sql.gz
#
# From your Mac (copy backup to VM, then restore):
#   scp -i ~/.ssh/wfm_instance backups/wfm-20260810-073821.sql.gz \
#     adminprms98@<NEW_VM_IP>:~/wfm/backups/
#   ssh -i ~/.ssh/wfm_instance adminprms98@<NEW_VM_IP> \
#     'cd ~/wfm && ./deploy/restore-db.sh backups/wfm-20260810-073821.sql.gz'
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_FILE="${1:-}"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \?//'
  exit 0
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && usage
[[ -n "$BACKUP_FILE" ]] || die "Pass the backup file path.
  Example: ./deploy/restore-db.sh backups/wfm-20260810-073821.sql.gz"

[[ -f "$BACKUP_FILE" ]] || die "Backup not found: $BACKUP_FILE"
[[ -f .env ]] || die ".env not found. Run: cp .env.prod.example .env && edit secrets."

command -v docker >/dev/null 2>&1 || die "docker is not installed."
$COMPOSE version >/dev/null 2>&1 || die "docker compose v2 is required."

BYTES="$(wc -c <"$BACKUP_FILE" | tr -d ' ')"
[[ "$BYTES" -ge 100 ]] || die "Backup file looks empty ($BYTES bytes)."

log "Stopping API and web (postgres data is preserved)..."
$COMPOSE stop api web migrate 2>/dev/null || true

log "Starting postgres..."
$COMPOSE up -d postgres

log "Waiting for postgres to become healthy..."
for _ in $(seq 1 30); do
  if $COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER:-wfm_user}" -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
$COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER:-wfm_user}" -d postgres >/dev/null \
  || die "Postgres did not become ready. Check: $COMPOSE logs postgres"

# shellcheck disable=SC1091
set -a && source .env && set +a
: "${POSTGRES_USER:?POSTGRES_USER missing in .env}"
: "${POSTGRES_DB:?POSTGRES_DB missing in .env}"

log "Dropping and recreating database ${POSTGRES_DB}..."
$COMPOSE exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${POSTGRES_DB}";
CREATE DATABASE "${POSTGRES_DB}";
SQL

log "Restoring from ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | awk '{print $1}'))..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | $COMPOSE exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q
else
  $COMPOSE exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q \
    < "$BACKUP_FILE"
fi

log "Applying any migrations newer than the backup (seed skipped)..."
$COMPOSE run --rm -e RUN_SEED=false migrate

log "Starting full stack..."
$COMPOSE up -d

sleep 5
$COMPOSE ps

PORT="$(grep -E '^WEB_HTTP_PORT=' .env | cut -d= -f2 || true)"
PORT="${PORT:-80}"
if curl -fsS "http://localhost:${PORT}/healthz" >/dev/null; then
  log "Restore complete. Edge healthy on port ${PORT}."
else
  die "Restore finished but health check failed — inspect: $COMPOSE logs"
fi
