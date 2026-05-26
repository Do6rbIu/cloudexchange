#!/usr/bin/env bash
set -euo pipefail

# Generates a self-signed certificate for local development so the whole
# stack can run over TLS without a public domain or Let's Encrypt.
#
# Production deployments should NOT use this — see docs/TLS.md for the
# Let's Encrypt (acme.sh / certbot) flow.

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/infra/edge/certs"
DOMAIN=${MAIL_HOSTNAME:-mail.cloudexchange.local}

mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/fullchain.pem" && -f "$CERT_DIR/privkey.pem" ]]; then
  echo "▸ Dev certificate already exists at $CERT_DIR — skipping"
  echo "  (delete fullchain.pem + privkey.pem to regenerate)"
  exit 0
fi

echo "▸ Generating self-signed certificate for: $DOMAIN, localhost, cloudexchange.local"
openssl req -x509 -newkey rsa:4096 -sha256 -days 825 -nodes \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=RU/O=Cloud24/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,DNS:cloudexchange.local,DNS:*.cloudexchange.local,IP:127.0.0.1"

chmod 644 "$CERT_DIR/fullchain.pem"
chmod 600 "$CERT_DIR/privkey.pem"

echo "✓ Wrote:"
echo "    $CERT_DIR/fullchain.pem"
echo "    $CERT_DIR/privkey.pem"
echo
echo "  Browsers will warn about the self-signed cert — accept the exception once."
