FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC

# Install SOGo from the official Inverse Inc. APT repository so we ride
# on signed upstream packages instead of an unmaintained Docker image.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg netcat-openbsd postgresql-client procps \
 && install -d -m 0755 /etc/apt/keyrings \
 && curl -fsSL https://packages.sogo.nu/keys/sogo.asc \
        | gpg --dearmor -o /etc/apt/keyrings/sogo.gpg \
 && echo "deb [signed-by=/etc/apt/keyrings/sogo.gpg] https://packages.sogo.nu/nightly/5/debian bookworm bookworm" \
        > /etc/apt/sources.list.d/sogo.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
        sogo \
        sogo-activesync \
        sogo-tool \
        sope4.9-gdl1-postgresql \
        gnustep-base-runtime \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Phase 1 SOGo packages may not exist on every mirror; if the install
# above fails for the SOGo packages specifically, the Inverse APT mirror
# is down — switch to a pinned distribution mirror via:
#   docker compose build --build-arg SOGO_MIRROR=alt sogo
# (we'll add that arg in a future hardening pass).

COPY sogo.conf /etc/sogo/sogo.conf
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
 && mkdir -p /var/run/sogo /var/log/sogo /var/spool/sogo \
 && chown -R sogo:sogo /var/run/sogo /var/log/sogo /var/spool/sogo /etc/sogo

EXPOSE 20000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
