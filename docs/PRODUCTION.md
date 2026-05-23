# Cloud24 Exchange — production roadmap

Документ описывает поэтапный переход от dev-демо к полноценному
почтовому сервису production-уровня. Каждый этап даёт самостоятельную
ценность и не ломает то, что уже работает.

## Целевой стек (after all phases)

```
                            ┌──────────────────────┐
                            │  Browser (React/TS)  │
                            └──────────┬───────────┘
                                       │ HTTPS
                                       ▼
                            ┌──────────────────────┐
                            │   Nginx + Let's       │  TLS termination,
                            │   Encrypt (acme.sh)   │  HTTP/2, HSTS
                            └──────────┬───────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
   │  BFF (Fastify+TS)  │  │   SOGo (PSGI)      │  │  Admin API (BFF)   │
   │  /api/{auth,mail,  │  │   ActiveSync,      │  │  /api/admin/*      │
   │     calendar,…}    │  │   CalDAV, CardDAV  │  │                    │
   └──────────┬─────────┘  └──────────┬─────────┘  └──────────┬─────────┘
              │                       │                       │
              ▼                       │                       │
   ┌────────────────────┐             │                       │
   │   Redis (sessions, │◀────────────┘                       │
   │   rate-limits,     │                                     │
   │   IDLE pubsub)     │                                     │
   └────────────────────┘                                     │
              │                                               │
              ▼                                               ▼
              ┌─────────────────────────────────────────────────┐
              │  PostgreSQL                                     │
              │   users, domains, aliases, audit_log, sessions  │
              └──────────────────────────┬──────────────────────┘
                                         │ virtual-mailbox-maps
                                         ▼
   ┌───────────────────────────────────────────────────────────┐
   │   Mail backbone                                           │
   │                                                           │
   │   Postfix ── Rspamd ── ClamAV                             │
   │      │         │                                          │
   │      ▼         ▼                                          │
   │   Dovecot (LMTP, IMAP, sieve, FTS-flatcurve, quotas)      │
   │      │                                                    │
   │      ▼                                                    │
   │   Mailboxes (Maildir, encrypted-at-rest in prod)          │
   └───────────────────────────────────────────────────────────┘

   Cross-cutting:
   ├─ OpenDKIM/OpenDMARC (signing + verification)
   ├─ Fail2ban (brute-force protection)
   ├─ Prometheus + Grafana (metrics)
   ├─ Loki (centralized logs)
   ├─ Restic (backups to S3/B2)
   └─ Manticore Search (full-text mail index)
```

## Этапы

### Phase 0 · Demo bootstrap fix
**Status: in progress · risk: low**

Закрыть проблемы с текущим dev-демо чтобы оно гарантированно работало
end-to-end и было пригодно для презентации.

- [x] Seed-данные (письма, контакты, события)
- [x] Bootstrap-скрипт
- [ ] **Fix:** Явное создание Radicale-коллекций (MKCOL/MKCALENDAR)
- [ ] **Fix:** Healthcheck'и в docker-compose чтобы seed ждал готовности
- [ ] **Fix:** Seed использует SMTP submission (а не IMAP APPEND) — проходит через MTA, имитирует реальную доставку

### Phase 1 · Production foundation
**Status: this commit · risk: low**

Подложить продакшен-инфраструктуру под текущий функционал. Внешне ничего
не меняется, но архитектура готова к масштабированию.

- [ ] PostgreSQL контейнер с volumes и healthcheck'ом
- [ ] Redis контейнер
- [ ] BFF: сессии переезжают из in-memory в Redis (stateless BFF, готов к
      горизонтальному масштабированию)
- [ ] BFF: подключение к PostgreSQL, миграции через node-pg-migrate
- [ ] Schema v1: `users`, `audit_log`, `app_settings`
- [ ] Nginx как единственный публичный entrypoint (порт 80/443); BFF и
      frontend больше не торчат наружу
- [ ] Docker-compose разделён на `docker-compose.yml` (base) и
      `docker-compose.dev.yml` (dev overrides)

### Phase 2 · Production mail stack
**Status: in progress · risk: medium**

Замена dev-mailserver на полноценный mail-стек с антиспамом, антивирусом
и DKIM-подписью исходящей почты.

- [x] Rspamd для проверки входящей почты (репутация, Bayes, DKIM/SPF/DMARC)
- [x] ClamAV для антивирусной проверки вложений
- [x] OpenDKIM подписывает исходящую почту корпоративным ключом
- [x] OpenDMARC проверяет alignment входящих
- [x] policyd-spf для SPF-проверки на уровне Postfix
- [x] Fail2ban: блок IP-адресов после неудачных IMAP/SMTP логинов
- [x] Quotas: лимит места на ящик (5 GiB по умолчанию)
- [x] ManageSieve: серверные фильтры (правила в почтовом ящике)
- [x] Server-side full-text search в IMAP (BFF → IMAP SEARCH BODY)
- [x] Admin UI: статус mail-стека и DNS-инструкции
- [x] Документация: docs/MAIL-STACK.md
- [ ] Postfix настроен на TLS-only outbound + DANE *(Phase 3)*
- [ ] FTS-flatcurve полнотекстовый индекс для быстрого поиска *(Phase 4)*

### Phase 2.5 · SOGo + Postgres-backed user management
**Status: this commit · risk: medium**

Замена Radicale на SOGo (полноценный групповой календарь + ActiveSync)
и единый источник правды по пользователям через PostgreSQL.

- [x] SOGo контейнер (build из официального APT-репо Inverse Inc.)
- [x] Memcached как session-backend SOGo
- [x] PostgreSQL `sogo` БД с ролью, FDW-view на `cloudexchange.users`
- [x] SOGo конфиг: IMAP-аутентификация, SQL-источник пользователей
- [x] nginx-edge проксирует `/SOGo`, `/Microsoft-Server-ActiveSync`,
      `/.well-known/{caldav,carddav}`, autodiscover.xml
- [x] BFF переключён с Radicale на SOGo (CALDAV_URL / CARDDAV_URL)
- [x] Seed-скрипт работает через SOGo (tsdav discovery)
- [x] docs/SOGO.md
- [ ] User management API через UI *(next commit)*
- [ ] LDAP-провизионер вместо docker socket *(Phase 3+)*
- [ ] Password change endpoint через UI *(Phase 5)*

### Phase 3 · TLS, identity, security
**Status: planned · risk: medium**

- [ ] Let's Encrypt через acme.sh с DNS-01 (или HTTP-01 через nginx)
- [ ] Автообновление сертификатов
- [ ] Fail2ban: блок по IMAP/SMTP/HTTP auth failures
- [ ] Двухфакторная аутентификация (TOTP) для веб-логина
- [ ] OAuth2/OIDC sign-in (Keycloak или Authentik) как опция
- [ ] CSRF-токены в BFF
- [ ] Rate-limiting в Redis (per-IP и per-user)
- [ ] DOMPurify санитизация HTML писем на фронтенде
- [ ] Audit log: все админ-действия и логины пишутся в Postgres

### Phase 4 · Real-time + search
**Status: planned · risk: medium**

- [ ] IMAP IDLE-консьюмер в BFF: получает уведомления о новых письмах
- [ ] WebSocket-канал клиент↔BFF: push-уведомления в браузер
- [ ] Service Worker + Web Push: уведомления когда вкладка не активна
- [ ] Manticore Search: индексация Maildir, BFF-эндпоинт
      `/api/mail/search?q=...`
- [ ] Live-обновление списка писем без F5

### Phase 5 · Admin UI + user management
**Status: planned · risk: low**

- [ ] BFF-эндпоинты `/api/admin/{users,domains,aliases,quotas}`
- [ ] Frontend: раздел "Администрирование" (только для пользователей с
      ролью `admin`)
- [ ] Создание/блокировка/удаление пользователей через UI
- [ ] Управление доменами и MX-записями (генерация DNS-инструкций)
- [ ] Quota dashboard
- [ ] Self-service: смена пароля, восстановление, настройка sieve-правил

### Phase 6 · Observability
**Status: planned · risk: low**

- [ ] Prometheus + node-exporter + postfix-exporter + dovecot-exporter
- [ ] Grafana с готовыми дашбордами (mail flow, queue size, auth failures)
- [ ] Loki для централизованных логов
- [ ] BFF: structured JSON logging + trace-id correlation
- [ ] Alertmanager: алерты в Telegram/Slack/email при инцидентах

### Phase 7 · Backups + DR
**Status: planned · risk: medium**

- [ ] Restic-контейнер с расписанием backup'ов
- [ ] Бэкапы Maildir, PostgreSQL, конфигов в S3-совместимое хранилище
- [ ] Encrypted-at-rest бэкапы
- [ ] Восстановление: документированный runbook + тестовый скрипт
- [ ] Retention policies для писем (compliance)

### Phase 8 · Migration paths
**Status: planned · risk: high**

Варианты замены mail-ядра без правки BFF/frontend:

- [ ] **grommunio**: установка на отдельный хост, BFF переключается через
      env-переменные (IMAP_HOST=mail.org.tld). Даёт Outlook/EAS-совместимость
      на уровне gromox.
- [ ] **mailcow-dockerized**: drop-in замена нашего mail-стека на mailcow
      как self-contained стек.
- [ ] **Stalwart Mail Server**: одна Rust-бинарь со всем функционалом —
      экспериментально, но самое чистое будущее.

### Phase 9 · Compliance + scale-out
**Status: planned · risk: high**

- [ ] Шифрование почты at-rest (Dovecot mail_crypt plugin)
- [ ] GDPR-инструменты: экспорт, удаление, anonymization
- [ ] Multi-tenancy: несколько изолированных доменов
- [ ] Scale-out: несколько Dovecot-узлов через director, Postfix-haproxy
- [ ] Geo-replication PostgreSQL
- [ ] Read-replica для BFF

## Дорожная карта по неделям (грубо)

| Неделя | Этап           | Деливерабл                                                  |
|--------|----------------|-------------------------------------------------------------|
| 1      | Phase 0+1      | Demo fix, Postgres+Redis, BFF-refactor, Nginx-фронт         |
| 2      | Phase 2        | Rspamd, ClamAV, OpenDKIM, sieve+quotas                      |
| 3      | Phase 2        | SOGo вместо Radicale, миграция данных                       |
| 4      | Phase 3        | TLS, Fail2ban, 2FA, CSRF                                    |
| 5      | Phase 4        | IDLE+WebSocket, Manticore                                   |
| 6      | Phase 5        | Admin UI                                                    |
| 7      | Phase 6        | Prometheus + Grafana + Loki                                 |
| 8      | Phase 7        | Restic-бэкапы, runbook                                      |

## Что считается "production-ready"

К окончанию Phase 3 продукт можно поставить в реальную инфраструктуру:
TLS-сертификаты валидные, есть антиспам и антивирус, есть DKIM-подпись
исходящих, есть 2FA, есть audit-log, есть резервное копирование.

К окончанию Phase 6 продукт готов к нагрузке: есть мониторинг, есть
алерты, есть поиск, есть push-уведомления.

К окончанию Phase 8 продукт может конкурировать с Exchange/Microsoft 365
по списку базовых функций.
