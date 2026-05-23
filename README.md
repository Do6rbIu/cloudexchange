# Cloud24 Exchange

Альтернатива Microsoft Exchange на базе открытого ПО. Веб-интерфейс
([cloudexchange](https://github.com/Do6rbIu/cloudexchange) · React + TypeScript) поверх стандартных
почтовых протоколов IMAP/SMTP/CalDAV/CardDAV. В роли почтового ядра —
[grommunio](https://github.com/grommunio) (production) или связка
Postfix + Dovecot + Radicale (dev).

## Архитектура (Phase 1 — production foundation)

```
            ┌──────────┐
            │  Browser │
            └────┬─────┘
                 │ HTTP(S)
                 ▼
       ┌─────────────────┐
       │   Edge (nginx)  │  единственный публичный entrypoint
       └────┬──────┬─────┘
            │      │
   /api/*   │      │  /
            ▼      ▼
     ┌──────────┐  ┌───────────┐
     │   BFF    │  │ Frontend  │
     │ Fastify  │  │  (nginx)  │
     └─┬──┬──┬──┘  └───────────┘
       │  │  │
       │  │  └────────────────▶ Postgres (users, audit, settings)
       │  └────────────────────▶ Redis (sessions, rate-limit)
       │
       ▼ IMAP/SMTP/CalDAV/CardDAV
   ┌────────────────────────────┐
   │  Mail backbone             │
   │  Postfix + Dovecot         │
   │  Radicale (CalDAV/CardDAV) │
   └────────────────────────────┘
```

Все сервисы запускаются одним `docker compose up`. Наружу торчит только
nginx-edge (порт 8080). BFF stateless — сессии в Redis, метаданные в
Postgres, поэтому масштабируется горизонтально.

* **frontend/** — Vite + React + TypeScript. Inbox, Composer, Calendar,
  Contacts, Settings, Admin. Тёмная и светлая темы.
* **bff/** — Node.js + Fastify + TypeScript. Сессии в Redis,
  пользователи/audit в Postgres, IMAP через `imapflow`, SMTP через
  `nodemailer`, CalDAV/CardDAV через `tsdav`.
* **seed/** — скрипт первоначальной загрузки демо-данных через
  настоящие SMTP + WebDAV (доставка идёт через MTA, как в production).
* **infra/** — конфиги nginx-edge, Postgres init-схемы, Radicale,
  docker-mailserver.
* **docs/PRODUCTION.md** — поэтапный roadmap до production-уровня.
* `Cloud24 Exchange.html`, `design-canvas.jsx`, `src/*.jsx` — исходный
  design-canvas как UI-референс.

## Быстрый старт — демо-режим (одной командой)

```bash
cp .env.example .env  # подставьте SESSION_SECRET
./scripts/bootstrap-demo.sh
open http://localhost:8080
```

Скрипт сам поднимет стек, создаст демо-ящик `igor.petrov@cloudexchange.local`
с паролем `cloud24demo` и наполнит его реалистичными данными из дизайн-канваса:

- **12 писем во "Входящих"** от разных корреспондентов (партнёры Газпром-Tech и
  Сбер, коллеги по Cloud24, HR, Security, бухгалтерия), 3 непрочитанных, 2 со
  вложениями.
- **2 письма в "Отправленных"**.
- **10 контактов** с телефонами, должностями и заметками.
- **18 событий в календаре** на текущую рабочую неделю.

На странице логина есть кнопка **«Войти как демо-пользователь»** — нажмите её,
чтобы попасть прямо в Inbox без ввода кредов. Удобно для презентации.

## Быстрый старт — пустое dev-окружение

```bash
cp .env.example .env
docker compose up -d --build
./scripts/setup-mailbox.sh user@cloudexchange.local hunter2
open http://localhost:8080
```

BFF проверит креды через IMAP-бинд и положит сессию в cookie.

## Сервисы и порты

| Сервис      | Внутри сети       | Наружу (host)     | Назначение                          |
|-------------|-------------------|-------------------|-------------------------------------|
| edge        | nginx :80         | http://:8080      | Единственный публичный entrypoint   |
| frontend    | nginx :80         | —                 | SPA (раздаётся через edge)          |
| bff         | :4000             | —                 | REST API (за edge)                  |
| postgres    | :5432             | —                 | metadata, audit, users + SOGo DB    |
| redis       | :6379             | —                 | sessions, rate-limit                |
| memcached   | :11211            | —                 | SOGo cache                          |
| mailserver  | :25/143/587/4190  | —                 | Postfix + Dovecot + Rspamd + ClamAV |
| sogo        | :20000            | —                 | SOGo (CalDAV + CardDAV + ActiveSync)|

> Edge выставляет наружу: `/`, `/api/*`, `/SOGo/*`, `/Microsoft-Server-ActiveSync`,
> `/.well-known/{caldav,carddav}`. Для production добавьте 443 в edge с TLS
> (Phase 3) — без TLS нативные клиенты Outlook/iOS отказываются от ActiveSync.

## Переключение на grommunio

BFF работает только на стандартных протоколах. Чтобы перейти на
grommunio в production, измените переменные окружения сервиса `bff`
в `docker-compose.yml` (или через `.env`):

```yaml
- IMAP_HOST=mail.your-org.tld
- IMAP_PORT=993
- IMAP_SECURE=true
- SMTP_HOST=mail.your-org.tld
- SMTP_PORT=465
- SMTP_SECURE=true
- CALDAV_URL=https://mail.your-org.tld/dav/
- CARDDAV_URL=https://mail.your-org.tld/dav/
```

Контейнеры `mailserver` и `radicale` тогда не нужны — выключите их в
`docker-compose.yml`. Сам grommunio устанавливается на отдельный хост
по [официальной инструкции](https://docs.grommunio.com/admin/installation.html).

## REST API (кратко)

| Метод      | Путь                              | Что делает                          |
|------------|-----------------------------------|-------------------------------------|
| `POST`     | `/api/auth/login`                 | Создаёт сессию (проверяет IMAP)     |
| `POST`     | `/api/auth/logout`                | Завершает сессию                    |
| `GET`      | `/api/auth/me`                    | Текущий пользователь                |
| `GET`      | `/api/mail/folders`               | Список папок IMAP                   |
| `GET`      | `/api/mail/messages?mailbox=...`  | Последние письма                    |
| `GET`      | `/api/mail/messages/:uid`         | Полное письмо (с HTML/attachments)  |
| `POST`     | `/api/mail/messages/:uid/flags`   | Установить/снять флаги              |
| `DELETE`   | `/api/mail/messages/:uid`         | Удалить письмо                      |
| `POST`     | `/api/mail/send`                  | Отправить SMTP                      |
| `GET`      | `/api/calendar/calendars`         | Список календарей пользователя      |
| `GET`      | `/api/calendar/events?from=&to=`  | События за период                   |
| `POST`     | `/api/calendar/events`            | Создать событие                     |
| `DELETE`   | `/api/calendar/events`            | Удалить событие                     |
| `GET`      | `/api/contacts/`                  | Список контактов                    |
| `POST`     | `/api/contacts/`                  | Создать контакт                     |
| `DELETE`   | `/api/contacts/`                  | Удалить контакт                     |

Все защищённые маршруты требуют `cx_sid` cookie из `/api/auth/login`.

## Локальная разработка без Docker

```bash
# BFF
cd bff && npm install && npm run dev      # → :4000

# Frontend (другой терминал)
cd frontend && npm install && npm run dev # → :5173 (proxy /api → :4000)
```

При этом сам почтовый сервер должен где-то крутиться. Можно использовать
docker-compose только для `mailserver` + `radicale`:

```bash
docker compose up -d mailserver radicale
```

## Production roadmap

Этот репозиторий движется к полноценной production-системе. Дорожная
карта по этапам (Phase 0 → Phase 9) расписана в
[`docs/PRODUCTION.md`](docs/PRODUCTION.md).

Текущее состояние — **Phase 1 завершён** (production foundation):
PostgreSQL, Redis, nginx-edge, BFF stateless с Redis-сессиями, аудит-лог,
схема пользователей и role-based авторизация (есть админ-страница).

Дальше: Phase 2 — полный mail-стек (Rspamd, ClamAV, OpenDKIM, SOGo).

## Что не входит в Phase 1

* Поиск по содержимому письма (нужен полнотекстовый индекс — Manticore или Sonic).
* Push-уведомления (нужен IDLE-консьюмер + WebSocket).
* AI-черновики (есть в design-canvas как макет — для реальной реализации
  нужен LLM-провайдер).
* Тёмная тема (переключатель в shell, но не во всех экранах).
* Outlook/EAS-совместимость — поддерживается на стороне grommunio, не BFF.
* Санитизация HTML писем (сейчас отображается as-is — добавить DOMPurify
  перед production-релизом).

## Структура репозитория

```
cloudexchange/
├── README.md
├── docker-compose.yml
├── .env.example
├── scripts/
│   ├── bootstrap-demo.sh     # одна команда: стек + ящик + демо-данные
│   └── setup-mailbox.sh
├── seed/                     # Node-скрипт наполнения сервера демо-данными
│   ├── src/{index,data}.ts
│   └── Dockerfile
├── docs/
│   ├── ARCHITECTURE.md       # архитектура BFF/протоколов
│   └── PRODUCTION.md         # поэтапный roadmap до production
├── infra/
│   ├── edge/                 # nginx-edge (TLS, reverse-proxy)
│   ├── postgres/init/        # SQL-миграции для первого запуска
│   ├── mail/                 # docker-mailserver runtime (gitignored)
│   └── radicale/             # Radicale config
├── frontend/                 # Vite + React + TS — рабочее приложение
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── Dockerfile
├── bff/                      # Node + Fastify + TS — REST API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── types/
│   │   ├── config.ts
│   │   └── server.ts
│   └── Dockerfile
├── infra/
│   ├── mail/                 # runtime mail data (gitignored)
│   └── radicale/
├── docs/
├── src/                      # legacy design-canvas (референс)
├── design-canvas.jsx         # legacy
├── tweaks-panel.jsx          # legacy
└── Cloud24 Exchange.html     # legacy
```
