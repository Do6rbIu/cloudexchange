# Security — Phase 3b

Application-level защита поверх TLS (Phase 3a). Покрывает аутентификацию,
защиту от автоматизированных атак и санитизацию недоверенного контента.

## Двухфакторная аутентификация (TOTP)

Стандарт RFC 6238 — совместим с Google Authenticator, Aegis, 1Password,
Microsoft Authenticator и любым TOTP-приложением.

### Поток

```
Настройка (Settings → 2FA → Включить):
  POST /api/auth/2fa/setup    → секрет + QR + 10 резервных кодов (показ 1 раз)
  POST /api/auth/2fa/confirm  → пользователь вводит код → 2FA активна

Вход с включённой 2FA:
  POST /api/auth/login        → пароль верный → { twofaRequired: true }
                                (сессия в состоянии pending, НЕ authenticated)
  POST /api/auth/2fa/login    → код верный → полная сессия

Отключение:
  POST /api/auth/2fa/disable  → требует текущий код или резервный
```

### Хранение секретов

* TOTP-секрет шифруется **AES-256-GCM** (`services/crypto.ts`) ключом,
  производным от `SESSION_SECRET`. В БД лежит только шифртекст
  (`user_totp.secret_enc`).
* Резервные коды хранятся как **SHA-256 хеши** — оригиналы показываются
  пользователю один раз и невосстановимы.
* Каждый резервный код одноразовый: при использовании удаляется из списка.

> Ротация `SESSION_SECRET` инвалидирует все TOTP-секреты. В production
> вынесите ключ шифрования в отдельную переменную/Vault с процедурой
> ротации.

## Rate limiting

`@fastify/rate-limit` с Redis-backend (общий счётчик для нескольких
инстансов BFF):

| Область              | Лимит              |
|----------------------|--------------------|
| Глобально (per-IP)   | 300 запросов / мин |
| `POST /auth/login`   | 10 / мин           |
| `POST /auth/2fa/login` | 10 / мин         |

При превышении — `429 TooManyRequests`. Счётчики живут в Redis, поэтому
переживают рестарт BFF и работают при горизонтальном масштабировании.

## CSRF-защита

Synchronizer-token pattern:

1. SPA при старте вызывает `GET /api/auth/csrf` → токен кладётся в сессию
   и возвращается клиенту.
2. API-клиент автоматически прикрепляет его в заголовке `x-csrf-token`
   на каждый `POST/PUT/PATCH/DELETE`.
3. Глобальный preHandler-hook BFF сверяет заголовок с токеном в сессии;
   несовпадение → `403 CSRF`.
4. При устаревании токена (рестарт сервера) клиент один раз
   перезапрашивает и повторяет запрос.

Дополнительный слой поверх `SameSite=lax` cookie, который уже блокирует
большинство cross-site POST.

## Санитизация HTML писем

Тела писем — недоверенный контент. Перед рендером прогоняются через
**DOMPurify** (`InboxPage.sanitizeMailHtml`):

* вырезаются `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`,
  `<input>`, `<button>`;
* удаляются обработчики событий (`onerror`, `onclick`, …) — по умолчанию
  DOMPurify;
* `data-*` атрибуты запрещены;
* inline-стили сохраняются (вёрстка писем), опасный CSS вычищается.

## Fail2ban (mail)

Брутфорс по IMAP/SMTP/ManageSieve блокируется Fail2ban внутри
docker-mailserver (включён в Phase 2, `ENABLE_FAIL2BAN=1`). Веб-логины
дополнительно прикрыты rate-limit'ом выше.

## Что ещё впереди (Phase 3+)

* OAuth2/OIDC sign-in (Keycloak / Authentik) как альтернатива паролю
* WebAuthn / passkeys
* LDAP-провизионер вместо Docker socket (убрать привилегию BFF)
* Вынос ключа шифрования TOTP из SESSION_SECRET
* Content-Security-Policy заголовок на edge (требует аккуратной настройки
  под inline-стили писем)

## Checklist при выкатке в production

- [ ] `SESSION_SECRET` — 32+ случайных байта, не дефолтный
- [ ] TLS-сертификат от Let's Encrypt (не self-signed)
- [ ] `HTTP_PORT=80 HTTPS_PORT=443`, включён HTTP→HTTPS redirect
- [ ] `PUBLIC_ORIGIN=https://mail.your-domain`
- [ ] Postgres-пароль (`POSTGRES_PASSWORD`) сменён с дефолтного
- [ ] SOGo `sogo.conf`: `SOGoEncryptionKey` заменён на случайный
- [ ] Демо-пользователь удалён, создан реальный админ
- [ ] 2FA включена для всех админ-аккаунтов
