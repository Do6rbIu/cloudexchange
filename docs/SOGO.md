# SOGo — групповой календарь, контакты и ActiveSync

После Phase 2.5 в стек добавлен SOGo вместо Radicale. SOGo даёт всё, что
было у Radicale, плюс **Microsoft ActiveSync** — нативный протокол
Outlook, iOS Mail и Android Mail.

## Что меняется в архитектуре

```
┌──────────────┐                  ┌───────────────┐
│   Browser    │ ─────────────────▶│    Edge       │
│  (React UI)  │                  │   (nginx)     │
└──────────────┘                  └───┬───────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
    ┌──────────────┐         ┌──────────────┐       ┌──────────────────┐
    │     BFF      │         │     SOGo     │       │  ActiveSync      │
    │   (REST)     │         │  (Web UI,    │       │  endpoint        │
    │              │         │   CalDAV,    │       │  (also SOGo)     │
    │              │         │   CardDAV)   │       │                  │
    └──────┬───────┘         └──────┬───────┘       └──────────────────┘
           │                        │
           │ IMAP/SMTP              │ IMAP/SMTP (auth)
           │                        │ SQL (metadata)
           ▼                        ▼
    ┌─────────────┐          ┌──────────────┐
    │  Mailserver │          │  PostgreSQL  │
    │  (Postfix + │          │              │
    │   Dovecot)  │          │  sogo + cx   │
    └─────────────┘          └──────────────┘
```

* **BFF** говорит со SOGo как с обычным CalDAV/CardDAV-сервером.
* **SOGo** хранит свои метаданные (events, vcards, profiles, sessions) в
  Postgres-базе `sogo`, но **аутентифицирует пользователей через IMAP** —
  то есть пароли никогда не покидают Dovecot.
* **Источник пользователей** — VIEW `sogo.sogo_users`, которая через
  `postgres_fdw` смотрит на `cloudexchange.users`. Один source of truth.

## Эндпоинты SOGo

| URL                                    | Назначение                                |
|----------------------------------------|-------------------------------------------|
| `http://localhost:8080/SOGo/`          | Web UI (классический webmail SOGo)        |
| `http://localhost:8080/SOGo/dav/`      | CalDAV + CardDAV root                     |
| `http://localhost:8080/Microsoft-Server-ActiveSync` | Exchange ActiveSync          |
| `http://localhost:8080/.well-known/caldav` | RFC 6764 discovery → `/SOGo/dav/`     |
| `http://localhost:8080/.well-known/carddav` | RFC 6352 discovery → `/SOGo/dav/`    |
| `http://localhost:8080/autodiscover/autodiscover.xml` | Outlook autodiscover         |

## Подключение клиентов

### Apple Mail / Calendar / Contacts (macOS, iOS)
* Системные настройки → "Учётные записи" → "Добавить" → "Другая"
* Сервер: `mail.example.com`, имя пользователя — email, пароль —
  пароль почтового ящика
* Apple клиенты сами найдут CalDAV/CardDAV через `.well-known`

### Outlook (Windows, mobile)
* Добавить аккаунт → Exchange
* Email: `user@example.com`, пароль
* Outlook сам подтянет конфигурацию через autodiscover → ActiveSync

### Android Mail
* Добавить аккаунт → Exchange / Corporate
* Сервер: `mail.example.com`, email, пароль

### Thunderbird
* IMAP/SMTP — autoconfig
* CalDAV/CardDAV — вручную URL `https://mail.example.com/SOGo/dav/<email>/Calendar/personal/`

## Пользовательские VIEW в PostgreSQL

```
cloudexchange (DB)
  └── users (table) ← source of truth
        ├── id          uuid
        ├── email       citext
        ├── display_name
        ├── role        'user' | 'admin'
        ├── quota_bytes
        └── is_active

sogo (DB)
  ├── cx_users (foreign table → cloudexchange.users)
  ├── sogo_users (view) ← VIEW SOGo reads
  │     ├── c_uid       = email
  │     ├── c_name      = email
  │     ├── c_password  = 'imap-auth'  (placeholder, never checked)
  │     ├── c_cn        = display_name
  │     └── mail        = email
  ├── sogo_user_profile (created by SOGo)
  ├── sogo_folder_info  (created by SOGo)
  ├── sogo_store        (created by SOGo) — event / vcard storage
  └── …
```

## Создание пользователя из админ-панели

`Admin → Пользователи → + Создать пользователя` делает в одной транзакции:

1. `INSERT INTO cloudexchange.users` (email, display_name, role, quota)
2. `docker exec mailserver setup email add` (Postfix/Dovecot creds)
3. `docker exec mailserver setup quota set` (если задана)

SOGo автоматически "видит" нового пользователя через VIEW. При первом
заходе в Web UI или через CalDAV — SOGo создаёт ему `personal` календарь
и адресную книгу.

Если шаг 2 падает, шаг 1 откатывается — система остаётся консистентной.

## Откуда берётся пакет SOGo

`infra/sogo/Dockerfile` ставит SOGo из официального APT-репо Inverse Inc.
(`packages.sogo.nu`). Это нативный путь, рекомендуемый разработчиками SOGo.

Если репо недоступно, можно собрать SOGo из исходников — это редкий
кейс, такой fallback добавим в Phase 7.

## Известные ограничения Phase 2.5

* **Provisioning через docker socket** — BFF создаёт ящики, выполняя
  команды внутри mailserver-контейнера. Это работает, но не масштабируется
  на multi-host деплой. Phase 3 / Phase 7 заменяют это на LDAP-провизионер
  (lldap или OpenLDAP).
* **Удаление ящика не удаляет почту с диска сразу** — Maildir остаётся,
  пока админ не запустит `find /var/mail -name "<user>*" -delete`.
  Это намеренно: даёт окно для отката случайного delete.
* **SOGo first-login latency** — первый CalDAV-запрос пользователя
  занимает 1–2 секунды (SOGo создаёт `personal` коллекции). Seed-скрипт
  это учитывает.
* **Encryption key в sogo.conf** — placeholder `REPLACE-WITH-32-BYTE-RANDOM`.
  В production его нужно заменить на реальный ключ и хранить в Vault/Secrets.

## Дальнейшие шаги (Phase 3+)

* TLS-сертификаты — без них ActiveSync с реальных клиентов не работает
  (Outlook и iOS отказываются от HTTP)
* LDAP-провизионер (lldap) → docker-mailserver `ACCOUNT_PROVISIONER=LDAP`,
  убирает зависимость от docker socket
* SOGo password change → BFF endpoint меняет пароль одновременно
  в Dovecot и Postgres
