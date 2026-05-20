# Cloud24 Exchange

Альтернатива Microsoft Exchange на базе открытого ПО. Веб-интерфейс
([cloudexchange](https://github.com/Do6rbIu/cloudexchange) · React + TypeScript) поверх стандартных
почтовых протоколов IMAP/SMTP/CalDAV/CardDAV. В роли почтового ядра —
[grommunio](https://github.com/grommunio) (production) или связка
Postfix + Dovecot + Radicale (dev).

## Архитектура

```
┌──────────────┐    HTTPS/JSON     ┌──────────────┐    IMAP/SMTP     ┌──────────────────┐
│   Browser    │ ─────────────────▶│     BFF      │ ────────────────▶│  Postfix+Dovecot │
│  (React/TS)  │                   │  Fastify+TS  │   CalDAV/CardDAV │   /  grommunio   │
└──────────────┘                   └──────────────┘ ────────────────▶│     Radicale     │
                                                                     └──────────────────┘
```

* **frontend/** — Vite + React + TypeScript. Inbox, Composer, Calendar,
  Contacts, Settings. Сборка отдаётся nginx-ом.
* **bff/** — Node.js + Fastify + TypeScript. Авторизация (cookie-сессии),
  IMAP через [`imapflow`](https://github.com/postalsys/imapflow),
  SMTP через [`nodemailer`](https://github.com/nodemailer/nodemailer),
  CalDAV/CardDAV через [`tsdav`](https://github.com/natelindev/tsdav).
* **infra/** — конфиги Postfix/Dovecot (через `docker-mailserver`) и
  Radicale (CalDAV+CardDAV).
* `Cloud24 Exchange.html`, `design-canvas.jsx`, `src/*.jsx` —
  оригинальный design-canvas из v0 проекта. Оставлен как референс для
  дальнейшей доработки UI.

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

| Сервис      | Внутри сети  | Наружу (host)     | Назначение                |
|-------------|--------------|-------------------|---------------------------|
| frontend    | nginx :80    | http://:8080      | SPA + reverse-proxy к BFF |
| bff         | :4000        | http://:4000      | REST API                  |
| mailserver  | :25/143/587  | :1025/1143/1587   | SMTP + IMAP               |
| radicale    | :5232        | http://:5232      | CalDAV + CardDAV          |

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

## Что не входит в MVP

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
