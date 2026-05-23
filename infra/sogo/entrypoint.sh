#!/usr/bin/env bash
set -euo pipefail

# Wait until Postgres is reachable before starting SOGo. On first boot
# the postgres init scripts (001_initial.sql, 002_sogo.sql) need to run
# before SOGo can connect with its dedicated role.
PG_HOST=${SOGO_PG_HOST:-postgres}
PG_PORT=${SOGO_PG_PORT:-5432}
PG_USER=${SOGO_PG_USER:-sogo}
PG_DB=${SOGO_PG_DB:-sogo}

echo "[entrypoint] Waiting for postgres at ${PG_HOST}:${PG_PORT}…"
for i in $(seq 1 60); do
  if nc -z "$PG_HOST" "$PG_PORT" 2>/dev/null; then
    echo "[entrypoint] postgres port open"
    break
  fi
  sleep 2
done

echo "[entrypoint] Waiting for the sogo role to exist…"
for i in $(seq 1 60); do
  if PGPASSWORD="$SOGO_PG_PASSWORD" psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -c 'SELECT 1' >/dev/null 2>&1; then
    echo "[entrypoint] postgres ready"
    break
  fi
  sleep 2
done

# On first start, the IMAP container may still be initialising. The
# SOGo workers will retry IMAP for the first login, but we give it a
# brief grace period so logs are clean.
sleep 2

echo "[entrypoint] Starting sogod…"
exec sudo -E -u sogo /usr/sbin/sogod \
    -WONoDetach YES \
    -WOLogFile - \
    -WOWorkersCount 3
