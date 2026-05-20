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

## Быстрый старт (dev-окружение)

```bash
# 1. Конфиг
cp .env.example .env
# Подставьте сильный SESSION_SECRET (например: openssl rand -hex 32)

# 2. Запуск стека
docker compose up -d --build

# 3. Создать тестовый ящик и Radicale-пользователя
./scripts/setup-mailbox.sh user@cloudexchange.local hunter2

# 4. Открыть в браузере
open http://localhost:8080
```

После шага 4 откроется LoginPage. Введите учётные данные, созданные на
шаге 3, — BFF проверит их через IMAP-бинд и положит сессию в cookie.

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
│   └── setup-mailbox.sh
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
