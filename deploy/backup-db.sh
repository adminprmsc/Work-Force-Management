#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Pull a Postgres dump from the production VM onto this Mac.
#
# Runs pg_dump inside the remote postgres container and streams the gzipped
# SQL over SSH straight into ./backups/ — nothing is left on the VM disk.
#
# Usage:
#   ./deploy/backup-db.sh
#   ./deploy/backup-db.sh --host 101.50.84.209
#   WFM_SSH_HOST=101.50.84.209 ./deploy/backup-db.sh
#
# Optional env (or matching flags below):
#   WFM_SSH_HOST      VM hostname or IP          (required)
#   WFM_SSH_USER      SSH user                   (default: adminprms98)
#   WFM_SSH_KEY       Path to private key        (default: ~/.ssh/wfm_instance)
#   WFM_REMOTE_DIR    App directory on the VM    (default: ~/wfm)
#   WFM_BACKUP_DIR    Local folder for dumps     (default: <repo>/backups)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SSH_HOST="${WFM_SSH_HOST:-}"
SSH_USER="${WFM_SSH_USER:-adminprms98}"
SSH_KEY="${WFM_SSH_KEY:-$HOME/.ssh/wfm_instance}"
REMOTE_DIR="${WFM_REMOTE_DIR:-~/wfm}"
BACKUP_DIR="${WFM_BACKUP_DIR:-$ROOT_DIR/backups}"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \?//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -H|--host)        SSH_HOST="$2"; shift 2 ;;
    -u|--user)        SSH_USER="$2"; shift 2 ;;
    -i|--identity)    SSH_KEY="$2"; shift 2 ;;
    -d|--remote-dir)  REMOTE_DIR="$2"; shift 2 ;;
    -o|--output)      BACKUP_DIR="$2"; shift 2 ;;
    -h|--help)        usage ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

[[ -n "$SSH_HOST" ]] || die "Set WFM_SSH_HOST or pass --host <ip>. Example:
  WFM_SSH_HOST=101.50.84.209 ./deploy/backup-db.sh"

[[ -f "$SSH_KEY" ]] || die "SSH key not found: $SSH_KEY
  Set WFM_SSH_KEY or pass --identity /path/to/key"

command -v ssh >/dev/null 2>&1 || die "ssh is required"
command -v scp >/dev/null 2>&1 || true

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/wfm-${STAMP}.sql.gz"
PARTIAL_FILE="${OUT_FILE}.partial"

SSH_OPTS=(
  -i "$SSH_KEY"
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=15
)

REMOTE="${SSH_USER}@${SSH_HOST}"

log "Checking SSH access to ${REMOTE}..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "test -d ${REMOTE_DIR}" \
  || die "Cannot reach ${REMOTE} or missing remote dir ${REMOTE_DIR}"

log "Dumping database on VM (streamed over SSH)..."
# Credentials come from the postgres container env (Compose injects .env).
# Custom format is avoided so the artifact stays a plain gzipped SQL dump,
# matching the restore recipe in deploy/DEPLOYMENT.md.
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$REMOTE_DIR" <<'REMOTE_EOF' >"$PARTIAL_FILE"
set -euo pipefail
REMOTE_DIR="$1"
# Expand a leading ~ against the remote user's home (quoted paths skip tilde).
case "$REMOTE_DIR" in
  "~/"*) REMOTE_DIR="${HOME}/${REMOTE_DIR#~/}" ;;
  "~")   REMOTE_DIR="${HOME}" ;;
esac
cd "$REMOTE_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

$COMPOSE exec -T postgres true >/dev/null 2>&1 \
  || { echo "postgres container is not running on the VM" >&2; exit 1; }

$COMPOSE exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' \
  | gzip -c
REMOTE_EOF

mv "$PARTIAL_FILE" "$OUT_FILE"

BYTES="$(wc -c <"$OUT_FILE" | tr -d ' ')"
if [[ "$BYTES" -lt 100 ]]; then
  rm -f "$OUT_FILE"
  die "Backup looks empty (${BYTES} bytes). Check VM logs: make logs on the host."
fi

# Human-readable size without requiring numfmt (macOS-friendly).
if command -v du >/dev/null 2>&1; then
  SIZE="$(du -h "$OUT_FILE" | awk '{print $1}')"
else
  SIZE="${BYTES}B"
fi

log "Backup saved: ${OUT_FILE} (${SIZE})"
log "Restore later with (on the VM, into a running stack):
  gunzip -c ${OUT_FILE} | docker compose -f docker-compose.prod.yml exec -T postgres \\
    sh -c 'psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"'"
