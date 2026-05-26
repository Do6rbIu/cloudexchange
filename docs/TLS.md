# TLS — сертификаты и HTTPS

Phase 3a выводит весь стек на HTTPS. Edge-nginx терминирует TLS на :443,
а тот же сертификат используется почтовым сервером для IMAPS/SMTPS и
SOGo для ActiveSync.

## Dev — самоподписанный сертификат

```bash
./scripts/gen-dev-certs.sh
docker compose up -d
```

`gen-dev-certs.sh` создаёт `infra/edge/certs/{fullchain,privkey}.pem` с
SAN для `mail.cloudexchange.local`, `localhost`, `*.cloudexchange.local`.
`bootstrap-demo.sh` вызывает его автоматически.

Открывайте `https://localhost:8443` — браузер один раз предупредит о
самоподписанном сертификате, примите исключение.

> Порт 80 (`http://localhost:8080`) тоже работает в dev для удобства —
> в production его переключают на принудительный редирект (см. ниже).

## Production — Let's Encrypt

Нужен реальный домен с A-записью на сервер и открытые порты 80/443.

### Шаг 1. Поднять стек с временным самоподписанным сертом

```bash
MAIL_HOSTNAME=mail.example.com ./scripts/gen-dev-certs.sh
HTTP_PORT=80 HTTPS_PORT=443 docker compose up -d
```

### Шаг 2. Выпустить сертификат через certbot (HTTP-01)

Edge уже отдаёт `/.well-known/acme-challenge/` из общего webroot-вольюма.

```bash
docker compose --profile letsencrypt run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d mail.example.com \
  --email admin@example.com --agree-tos --no-eff-email
```

### Шаг 3. Скопировать выпущенный серт в общий каталог edge

```bash
docker compose --profile letsencrypt run --rm --entrypoint /bin/sh certbot -c '
  cp /etc/letsencrypt/live/mail.example.com/fullchain.pem /cx-certs/fullchain.pem &&
  cp /etc/letsencrypt/live/mail.example.com/privkey.pem  /cx-certs/privkey.pem'
docker compose restart edge mailserver
```

### Шаг 4. Включить принудительный HTTPS

В `infra/edge/conf.d/cloudexchange.conf`, в server-блоке `:80`:
* раскомментируйте `return 301 https://$host$request_uri;`
* удалите/закомментируйте `include .../app-locations.conf;`

```bash
docker compose restart edge
```

### Автообновление

Let's Encrypt-сертификаты живут 90 дней. Поставьте в cron на хосте:

```cron
0 3 * * * cd /opt/cloudexchange && docker compose --profile letsencrypt run --rm certbot renew --webroot -w /var/www/certbot --quiet && \
  docker compose --profile letsencrypt run --rm --entrypoint /bin/sh certbot -c 'cp /etc/letsencrypt/live/*/fullchain.pem /cx-certs/fullchain.pem; cp /etc/letsencrypt/live/*/privkey.pem /cx-certs/privkey.pem' && \
  docker compose restart edge mailserver
```

### DNS-01 (для wildcard или закрытого 80)

Если порт 80 закрыт или нужен wildcard-серт, используйте DNS-01 через
плагин вашего DNS-провайдера (Cloudflare, Route53, и т.д.) — см.
документацию certbot. Тогда webroot не нужен.

## Почтовый сервер (IMAPS/SMTPS)

`docker-mailserver` берёт тот же сертификат через `SSL_TYPE=manual`:

```
SSL_TYPE=manual
SSL_CERT_PATH=/tmp/dms/custom-certs/fullchain.pem
SSL_KEY_PATH=/tmp/dms/custom-certs/privkey.pem
```

Каталог `infra/edge/certs` смонтирован в mailserver read-only, так что
после обновления серта достаточно `docker compose restart mailserver`.

Чтобы временно отключить TLS на почте (например, для отладки), задайте
`MAIL_SSL_TYPE=` (пусто) в `.env`.

## Порты

| Порт (host)      | Назначение                                   |
|------------------|----------------------------------------------|
| `${HTTP_PORT}`  (8080 dev / 80 prod)  | HTTP: ACME challenge + redirect |
| `${HTTPS_PORT}` (8443 dev / 443 prod) | HTTPS: весь трафик              |

В dev оставлены нестандартные 8080/8443, чтобы не требовать root и не
конфликтовать с другими сервисами. В production выставьте
`HTTP_PORT=80 HTTPS_PORT=443` в `.env`.

## Почему важен TLS для ActiveSync

Нативные клиенты Outlook, iOS Mail и Android Mail **отказываются**
подключаться к Exchange/ActiveSync по незашифрованному HTTP. Без
валидного (или явно доверенного) сертификата мобильная синхронизация
не заработает. Самоподписанный серт на устройстве нужно установить как
доверенный вручную, либо использовать Let's Encrypt.

## Проверка

```bash
# Сертификат, который отдаёт edge
echo | openssl s_client -connect localhost:8443 -servername mail.cloudexchange.local 2>/dev/null | openssl x509 -noout -subject -dates

# IMAPS почтового сервера
echo | openssl s_client -connect localhost:993 2>/dev/null | openssl x509 -noout -subject
```
