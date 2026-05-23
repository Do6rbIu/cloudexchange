#!/usr/bin/env bash
set -euo pipefail

# One-shot demo bootstrap (Phase 2 architecture):
#   1. Start postgres, redis, mailserver, radicale, bff, frontend, edge
#   2. Wait for the mailserver to be healthy (this takes ~2 min on first
#      boot while ClamAV downloads its signature database)
#   3. Provision the demo mailbox + Radicale htpasswd entry
#   4. Generate OpenDKIM signing keys for the local domain
#   5. Apply a mailbox quota
#   6. Run the seed container to populate inbox / sent / contacts / calendar
#
# Idempotent: re-runs reuse existing state.

DEMO_EMAIL=${DEMO_EMAIL:-igor.petrov@cloudexchange.local}
DEMO_PASSWORD=${DEMO_PASSWORD:-cloud24demo}
DEMO_DISPLAY_NAME=${DEMO_DISPLAY_NAME:-"Игорь Петров"}
MAIL_HOSTNAME=${MAIL_HOSTNAME:-mail.cloudexchange.local}
DEMO_DOMAIN=${DEMO_DOMAIN:-cloudexchange.local}
QUOTA=${DEMO_QUOTA:-5G}

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "▸ .env not found — copying from .env.example"
  cp .env.example .env
fi

echo "▸ Building and starting core stack"
docker compose up -d --build postgres redis mailserver radicale bff frontend edge

echo "▸ Waiting for mailserver to be healthy"
echo "  First boot can take 2-3 minutes (ClamAV downloads ~400 MB of signatures)"
last_state=""
for i in $(seq 1 90); do
  state=$(docker inspect -f '{{.State.Health.Status}}' cx-mail 2>/dev/null || echo starting)
  if [[ "$state" != "$last_state" ]]; then
    echo "  mailserver: $state ($i/90)"
    last_state=$state
  fi
  if [[ "$state" == "healthy" ]]; then
    break
  fi
  sleep 4
done
if [[ "$last_state" != "healthy" ]]; then
  echo "  ⚠ mailserver not healthy yet — continuing anyway; check 'docker compose logs mailserver'"
fi

echo "▸ Provisioning demo mailbox $DEMO_EMAIL"
if docker compose exec -T mailserver setup email list 2>/dev/null | grep -q "^\* ${DEMO_EMAIL}"; then
  echo "  (already exists, skipping)"
else
  docker compose exec -T mailserver setup email add "$DEMO_EMAIL" "$DEMO_PASSWORD"
  sleep 3
fi

echo "▸ Applying mailbox quota ($QUOTA)"
docker compose exec -T mailserver setup quota set "$DEMO_EMAIL" "$QUOTA" 2>&1 \
  | grep -vi "already" || true

echo "▸ Generating OpenDKIM signing keys for $DEMO_DOMAIN"
if docker compose exec -T mailserver test -f "/tmp/docker-mailserver/opendkim/keys/${DEMO_DOMAIN}/mail.private" 2>/dev/null; then
  echo "  (DKIM keys already present, skipping)"
else
  docker compose exec -T mailserver setup config dkim domain "$DEMO_DOMAIN" 2>&1 \
    | sed 's/^/  /' || \
    docker compose exec -T mailserver setup config dkim 2>&1 | sed 's/^/  /'
  # Reload Postfix/OpenDKIM so the new keys take effect.
  docker compose exec -T mailserver postfix reload >/dev/null 2>&1 || true
  docker compose exec -T mailserver supervisorctl restart opendkim >/dev/null 2>&1 || true
fi

DKIM_PUB_FILE="/tmp/docker-mailserver/opendkim/keys/${DEMO_DOMAIN}/mail.txt"
DKIM_RECORD=""
if docker compose exec -T mailserver test -f "$DKIM_PUB_FILE" 2>/dev/null; then
  DKIM_RECORD=$(docker compose exec -T mailserver cat "$DKIM_PUB_FILE" 2>/dev/null | tr -d '\r')
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
echo "  Quota:    $QUOTA"
echo ""
echo "  Mail stack: Rspamd + ClamAV + OpenDKIM + OpenDMARC + Fail2ban"
echo "════════════════════════════════════════════════════════════════"

if [[ -n "$DKIM_RECORD" ]]; then
  echo
  echo "▸ DKIM DNS record to publish for production deployments:"
  echo "$DKIM_RECORD" | sed 's/^/  /'
  echo
  echo "  Also add (replace mail.example.com with your real hostname):"
  echo "    $DEMO_DOMAIN.        MX   10  $MAIL_HOSTNAME."
  echo "    $DEMO_DOMAIN.        TXT  \"v=spf1 mx -all\""
  echo "    _dmarc.$DEMO_DOMAIN. TXT  \"v=DMARC1; p=quarantine; rua=mailto:dmarc@$DEMO_DOMAIN\""
fi
