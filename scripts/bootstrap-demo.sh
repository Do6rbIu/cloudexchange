#!/usr/bin/env bash
set -euo pipefail

# One-shot demo bootstrap:
#   1. Start mailserver + radicale + bff + frontend
#   2. Create demo mailbox + Radicale user
#   3. Seed inbox, contacts and calendar with realistic Cloud24 data
#
# Idempotent — safe to re-run; seed step skips already-populated stores.

DEMO_EMAIL=${DEMO_EMAIL:-igor.petrov@cloudexchange.local}
DEMO_PASSWORD=${DEMO_PASSWORD:-cloud24demo}
DEMO_DISPLAY_NAME=${DEMO_DISPLAY_NAME:-"Игорь Петров"}

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "▸ Building and starting containers"
docker compose up -d --build mailserver radicale bff frontend

echo "▸ Waiting for mailserver to be ready"
for i in $(seq 1 60); do
  if docker compose exec -T mailserver setup email list >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "▸ Provisioning demo mailbox $DEMO_EMAIL"
if docker compose exec -T mailserver setup email list 2>/dev/null | grep -q "^\* ${DEMO_EMAIL}"; then
  echo "  (already exists, skipping)"
else
  docker compose exec -T mailserver setup email add "$DEMO_EMAIL" "$DEMO_PASSWORD"
fi

echo "▸ Adding $DEMO_EMAIL to Radicale (bcrypt)"
USERS_FILE="$ROOT_DIR/infra/radicale/config/users"
if grep -q "^${DEMO_EMAIL}:" "$USERS_FILE" 2>/dev/null; then
  echo "  (already in htpasswd, skipping)"
else
  HASH=$(docker run --rm tomsquest/docker-radicale:3.2.3.0 htpasswd -nbB "$DEMO_EMAIL" "$DEMO_PASSWORD" | tail -n1)
  echo "$HASH" >> "$USERS_FILE"
  docker compose restart radicale >/dev/null
fi

echo "▸ Seeding demo data"
DEMO_EMAIL="$DEMO_EMAIL" \
DEMO_PASSWORD="$DEMO_PASSWORD" \
DEMO_DISPLAY_NAME="$DEMO_DISPLAY_NAME" \
  docker compose --profile demo run --rm --build seed

echo
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ Cloud24 Exchange demo ready"
echo "════════════════════════════════════════════════════════════════"
echo "  URL:      http://localhost:8080"
echo "  Email:    $DEMO_EMAIL"
echo "  Password: $DEMO_PASSWORD"
echo "════════════════════════════════════════════════════════════════"
