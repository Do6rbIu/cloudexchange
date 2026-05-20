#!/usr/bin/env bash
set -euo pipefail

# Creates a mail user inside the running mailserver container and adds the
# same credentials to Radicale (htpasswd) so calendar+contacts work.
#
# Usage:  ./scripts/setup-mailbox.sh user@example.com password
#
# Run "docker compose up -d" first.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <email> <password>"
  exit 1
fi

EMAIL=$1
PASSWORD=$2

echo "→ Creating mailbox $EMAIL on mailserver"
docker compose exec -T mailserver setup email add "$EMAIL" "$PASSWORD"

echo "→ Adding $EMAIL to Radicale users (bcrypt)"
HASH=$(docker compose exec -T radicale htpasswd -nbB "$EMAIL" "$PASSWORD" | tail -n1)
USERS_FILE=./infra/radicale/config/users
# Drop any previous entry for this email
TMP=$(mktemp)
grep -v -E "^${EMAIL//./\\.}:" "$USERS_FILE" 2>/dev/null > "$TMP" || true
echo "$HASH" >> "$TMP"
mv "$TMP" "$USERS_FILE"

echo "→ Restarting Radicale to pick up new credentials"
docker compose restart radicale >/dev/null

echo
echo "✓ Done. Sign in at http://localhost:8080 as $EMAIL"
