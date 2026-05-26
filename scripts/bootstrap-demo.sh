#!/usr/bin/env bash
set -euo pipefail

# One-shot demo bootstrap (Phase 2.5 architecture):
#   1. Start postgres + redis (needed by sogo init scripts)
#   2. Start mailserver, memcached, sogo, bff, frontend, edge
#   3. Wait for mailserver to be healthy
#   4. Provision the demo mailbox via setup email add
#   5. Generate OpenDKIM signing keys for the local domain
#   6. Apply a mailbox quota
#   7. Wait for SOGo to be reachable (it creates personal calendar +
#      address book on first IMAP-validated login)
#   8. Run the seed container to populate inbox / sent / contacts / events
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

echo "▸ Ensuring TLS certificate exists (self-signed for dev)"
"$ROOT_DIR/scripts/gen-dev-certs.sh"

echo "▸ Building and starting core stack"
docker compose up -d --build postgres redis memcached mailserver sogo bff frontend edge

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
  docker compose exec -T mailserver postfix reload >/dev/null 2>&1 || true
  docker compose exec -T mailserver supervisorctl restart opendkim >/dev/null 2>&1 || true
fi

DKIM_PUB_FILE="/tmp/docker-mailserver/opendkim/keys/${DEMO_DOMAIN}/mail.txt"
DKIM_RECORD=""
if docker compose exec -T mailserver test -f "$DKIM_PUB_FILE" 2>/dev/null; then
  DKIM_RECORD=$(docker compose exec -T mailserver cat "$DKIM_PUB_FILE" 2>/dev/null | tr -d '\r')
fi

echo "▸ Ensuring app-level user record exists for $DEMO_EMAIL"
# The init SQL already inserts this user. If you re-run with a different
# demo email, this UPSERT picks up the change.
docker compose exec -T postgres psql -U cloudexchange -d cloudexchange -c \
  "INSERT INTO users (email, display_name, role) VALUES ('$DEMO_EMAIL', '$DEMO_DISPLAY_NAME', 'admin') ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, role = 'admin';" \
  >/dev/null 2>&1 || true

echo "▸ Waiting for SOGo to be reachable"
for i in $(seq 1 60); do
  if docker compose exec -T sogo nc -z 127.0.0.1 20000 2>/dev/null; then
    echo "  sogo: ready"
    break
  fi
  sleep 2
done

echo "▸ Seeding demo data (inbox via SMTP, contacts + events via SOGo DAV)"
DEMO_EMAIL="$DEMO_EMAIL" \
DEMO_PASSWORD="$DEMO_PASSWORD" \
DEMO_DISPLAY_NAME="$DEMO_DISPLAY_NAME" \
  docker compose --profile demo run --rm --build seed

echo
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ Cloud24 Exchange demo ready"
echo "════════════════════════════════════════════════════════════════"
echo "  Web URL:     https://localhost:8443  (or http://localhost:8080)"
echo "  SOGo Web UI: https://localhost:8443/SOGo  (built-in webmail)"
echo "  ActiveSync:  https://localhost:8443/Microsoft-Server-ActiveSync"
echo "               (self-signed cert — accept the browser warning once)"
echo ""
echo "  Email:       $DEMO_EMAIL"
echo "  Password:    $DEMO_PASSWORD"
echo "  Role:        admin (User Management panel visible)"
echo "  Quota:       $QUOTA"
echo ""
echo "  Mail stack:  Rspamd + ClamAV + OpenDKIM + OpenDMARC + Fail2ban"
echo "  Groupware:   SOGo (CalDAV + CardDAV + ActiveSync)"
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
