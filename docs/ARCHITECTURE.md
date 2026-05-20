# Архитектура Cloud24 Exchange

## Уровни

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (SPA)                                              │
│  React 18 · React Router · TypeScript · Vite                │
│  pages/  ←  components/  ←  api/  ←  fetch + cookies        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/JSON (same-origin via nginx)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BFF (backend-for-frontend)                                 │
│  Fastify · @fastify/session · zod                           │
│                                                             │
│  routes/auth     │  services/imap     │  services/smtp     │
│  routes/mail     │  services/caldav   │  services/carddav  │
│  routes/calendar │                                          │
│  routes/contacts │                                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ IMAP/SMTP · CalDAV/CardDAV
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Mail backbone                                              │
│  dev:   docker-mailserver (Postfix + Dovecot) + Radicale    │
│  prod:  grommunio (gromox MAPI/HTTP + EAS + IMAP/CalDAV…)   │
└─────────────────────────────────────────────────────────────┘
```

## Авторизация

* `POST /api/auth/login` принимает `{email, password}`.
* BFF делает короткий IMAP-бинд (`imapflow.connect → logout`). Если бинд
  прошёл — credentials валидны.
* Учётные данные кладутся в зашифрованную серверную сессию
  (`@fastify/session`, cookie `cx_sid`). На клиенте — только cookie.
* Все последующие запросы к IMAP/SMTP/DAV используют пароль из сессии.
* Сессия живёт 12 часов, `httpOnly`, `sameSite=lax`.

> Важно: BFF хранит пароль в памяти процесса сессии. В production
> сессии должны лежать в Redis с шифрованием на стороне сервера
> и регулярной ротацией ключа `SESSION_SECRET`. Лучшая альтернатива —
> переключиться на OAuth/OIDC через Authentik/Keycloak и отдавать
> в IMAP/SMTP XOAUTH2-токены.

## Папки и UID-ы

IMAP-папки именуются строкой (например `INBOX`, `Sent`, `Drafts`).
Frontend хранит выбранную папку в query-параметре `?mailbox=...` и
открытое письмо в URL `/inbox/:uid`. UID-ы стабильны в пределах папки —
если письмо переехало, его UID меняется (это нормально для IMAP).

## Календарь

* CalDAV-обнаружение делается через `tsdav.createDAVClient({ defaultAccountType: 'caldav' })`.
* События парсятся через `ical.js` в `services/caldav.ts:parseEvent`.
* Создание события строит VEVENT-компонент, выгружает `.ics`, шлёт
  `PUT` через `dav.createCalendarObject`.

## Контакты

* CardDAV через тот же `tsdav` (account type `carddav`).
* Парсер vCard — простой ручной (4 поля: FN, EMAIL, TEL, ORG, TITLE, NOTE).
  Этого достаточно для адресной книги; для production-полного парсинга
  имеет смысл подключить `vcard4` или `vcf`.

## Чем не покрыто

* **Поиск по содержимому**: IMAP `SEARCH BODY` работает, но плох на больших
  объёмах. Под нагрузку — внешний индекс (Manticore/Sonic/Meilisearch),
  заполняемый IDLE-консьюмером.
* **Push**: нужен длинноживущий WebSocket-канал клиент↔BFF и IDLE-сессия
  BFF↔IMAP, чтобы поднимать события в реальном времени.
* **Outlook / Exchange ActiveSync**: BFF их не реализует и не должен —
  это работа gromox внутри grommunio. Клиенты Outlook/мобильные
  подключаются напрямую к grommunio через MAPI/HTTP или EAS, не трогая
  наш фронт.
* **Хранение пароля в сессии**: см. выше про переход на OIDC/XOAUTH2.

## Почему именно эта схема

| Альтернатива                          | Почему отвергнута                       |
|---------------------------------------|------------------------------------------|
| Прямой IMAP-клиент в браузере         | Нельзя — браузер не умеет TCP/TLS-сокеты |
| Только REST grommunio-admin-api       | Не покрывает чтение/отправку почты       |
| Прямой EWS из браузера                | EWS требует CORS-доверия + сложен        |
| Безсессионный JWT с паролем           | Слишком хрупко при ротации/отзыве        |

Стандартный BFF с серверной сессией — самый прямой путь от UI к любому
почтовому ядру, поддерживающему IMAP/SMTP. Grommunio, Postfix+Dovecot,
Dovecot+Maddy, Stalwart — всё работает без правки BFF, только смена
переменных окружения.
