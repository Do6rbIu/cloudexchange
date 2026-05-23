#!/usr/bin/env bash
set -euo pipefail

# One-shot demo bootstrap (Phase 1 architecture):
#   1. Start postgres, redis, mailserver, radicale, bff, frontend, edge
#   2. Wait for the mailserver to be healthy
#   3. Provision the demo mailbox in docker-mailserver + Radicale htpasswd
#   4. Run the seed container to populate inbox / sent / contacts / calendar
#
# Idempotent: re-runs reuse existing data.

DEMO_EMAIL=${DEMO_EMAIL:-igor.petrov@cloudexchange.local}
DEMO_PASSWORD=${DEMO_PASSWORD:-cloud24demo}
DEMO_DISPLAY_NAME=${DEMO_DISPLAY_NAME:-"Игорь Петров"}

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "▸ .env not found — copying from .env.example"
  cp .env.example .env
fi

echo "▸ Building and starting core stack"
docker compose up -d --build postgres redis mailserver radicale bff frontend edge

echo "▸ Waiting for mailserver to be healthy (this can take 30–60s on first boot)"
for i in $(seq 1 60); do
  state=$(docker inspect -f '{{.State.Health.Status}}' cx-mail 2>/dev/null || echo starting)
  if [[ "$state" == "healthy" ]]; then
    echo "  mailserver: healthy"
    break
  fi
  printf '  mailserver: %s (%s/60)\r' "$state" "$i"
  sleep 2
done
echo

echo "▸ Provisioning demo mailbox $DEMO_EMAIL"
if docker compose exec -T mailserver setup email list 2>/dev/null | grep -q "^\* ${DEMO_EMAIL}"; then
  echo "  (already exists, skipping)"
else
  docker compose exec -T mailserver setup email add "$DEMO_EMAIL" "$DEMO_PASSWORD"
  # Dovecot picks up new users on the fly via the postfix-accounts watcher,
  # but giving it a beat avoids a race with the seeder's first IMAP bind.
  sleep 3
fi

echo "▸ Adding $DEMO_EMAIL to Radicale (bcrypt)"
USERS_FILE="$ROOT_DIR/infra/radicale/config/users"
if grep -q "^${DEMO_EMAIL}:" "$USERS_FILE" 2>/dev/null; then
  echo "  (already in htpasswd, skipping)"
else
  HASH=$(docker run --rm tomsquest/docker-radicale:3.2.3.0 htpasswd -nbB "$DEMO_EMAIL" "$DEMO_PASSWORD" | tail -n1)
  echo "$HASH" >> "$USERS_FILE"
  docker compose restart radicale >/dev/null
  sleep 2
fi

echo "▸ Seeding demo data (inbox via SMTP, contacts via CardDAV, events via CalDAV)"
DEMO_EMAIL="$DEMO_EMAIL" \
DEMO_PASSWORD="$DEMO_PASSWORD" \
DEMO_DISPLAY_NAME="$DEMO_DISPLAY_NAME" \
  docker compose --profile demo run --rm --build seed

echo
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ Cloud24 Exchange demo ready"
echo "════════════════════════════════════════════════════════════════"
echo "  Web URL:  http://localhost:8080"
echo "  Email:    $DEMO_EMAIL"
echo "  Password: $DEMO_PASSWORD"
echo "  Role:     admin (admin panel visible)"
echo ""
echo "  Tip: on the login page click \"Войти как демо-пользователь\""
echo "════════════════════════════════════════════════════════════════"
