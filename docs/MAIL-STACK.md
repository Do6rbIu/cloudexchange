# Mail stack — Phase 2

После Phase 2 в почтовом контейнере включены production-функции,
которые обязательны для боевого сервиса. Ниже — что именно включено,
как это проверить и какие DNS-записи нужны.

## Что включено

| Компонент | Что делает | Активирован env-флагом |
|-----------|------------|------------------------|
| **Postfix** | SMTP MTA — приём и отправка почты | (всегда) |
| **Dovecot** | IMAP / POP3 / LMTP / ManageSieve | (всегда) |
| **Rspamd** | Антиспам, Bayes-обучение, проверка SPF/DKIM/DMARC | `ENABLE_RSPAMD=1` |
| **ClamAV** | Антивирусная проверка вложений | `ENABLE_CLAMAV=1` |
| **OpenDKIM** | Подпись исходящей почты ключом домена | `ENABLE_OPENDKIM=1` |
| **OpenDMARC** | Проверка alignment входящих писем | `ENABLE_OPENDMARC=1` |
| **policyd-spf** | SPF-проверка для Postfix | `ENABLE_POLICYD_SPF=1` |
| **Fail2ban** | Блок IP после неудачных логинов | `ENABLE_FAIL2BAN=1` |
| **Quotas** | Лимит дискового пространства на ящик | `ENABLE_QUOTAS=1` |
| **ManageSieve** | Серверные фильтры (правила вида "если From: X → в папку Y") | `ENABLE_MANAGESIEVE=1` |

Все настройки живут в `docker-compose.yml` в секции `services.mailserver.environment`.

## Поток входящего письма

```
Internet
   │
   ▼
Postfix smtpd  ──┐
   │             │  ← policyd-spf, postscreen
   ▼             │
Rspamd  ─────────┘  ← бейзовый Bayes, DKIM/DMARC verification,
   │                  Hfilter, rule-based scoring
   ▼
ClamAV (clamd milter)
   │
   ▼
Dovecot LMTP
   │
   ▼
Sieve (auto-sort: SPAM → Junk, header-based rules)
   │
   ▼
Maildir (квота применяется на запись)
```

Спам с rspamd-score > порога автоматически перекладывается в Junk
(благодаря `MOVE_SPAM_TO_JUNK=1`).

## Поток исходящего письма

```
BFF /api/mail/send
   │
   ▼
Postfix submission :587  (SMTP AUTH через пароль пользователя)
   │
   ▼
OpenDKIM milter — подписывает заголовком DKIM-Signature
   │
   ▼
Rspamd milter — проверяет (для внутренней почты) и логирует
   │
   ▼
Postfix smtp  →  внешний MTA
```

## Проверка работоспособности

### Из админ-панели (UI)

`Admin → Mail-стек` показывает live-статусы IMAP, SMTP submission,
ManageSieve и Rspamd controller.

### С хоста

```bash
# IMAP / SMTP
docker compose exec mailserver ss -lnt

# Логи компонентов
docker compose logs --tail=50 mailserver | grep -E "rspamd|clamav|opendkim|opendmarc"

# Проверка DKIM-подписи на отправленном письме
docker compose exec mailserver postqueue -p

# Bayesian filter status
docker compose exec mailserver rspamadm stat
```

### Проверка spam-фильтра

```bash
# Тестовое письмо с заведомо спамным содержимым (GTUBE)
docker compose exec mailserver sh -c \
  'echo "Subject: spam test\n\nXJS*C4JDBQADN1.NSBN3*2IDNEN*GTUBE-STANDARD-ANTI-UBE-TEST-EMAIL*C.34X" | \
   sendmail -f spammer@evil.test user@cloudexchange.local'

# Через минуту проверить — оно должно оказаться в Junk
```

## DNS-записи для production

Перед публикацией почтового сервиса на боевом домене нужно опубликовать:

| Тип   | Имя                              | Значение                                                              |
|-------|----------------------------------|-----------------------------------------------------------------------|
| A     | `mail.example.com`               | публичный IP сервера                                                  |
| MX    | `example.com`                    | `10 mail.example.com.`                                                |
| TXT   | `example.com`                    | `v=spf1 mx -all`                                                      |
| TXT   | `default._domainkey.example.com` | (вывод `bootstrap-demo.sh`, начинается с `v=DKIM1; k=rsa; p=...`)    |
| TXT   | `_dmarc.example.com`             | `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com`                |
| PTR   | `1.2.3.4.in-addr.arpa`           | `mail.example.com.` (настраивается у хостинг-провайдера)              |

DKIM-ключ генерируется `bootstrap-demo.sh` командой:

```bash
docker compose exec mailserver setup config dkim domain example.com
```

После генерации:

```bash
docker compose exec mailserver cat \
  /tmp/docker-mailserver/opendkim/keys/example.com/mail.txt
```

## Sieve-фильтры

ManageSieve включён, пользователи могут управлять своими правилами через
любой клиент с поддержкой Sieve (Thunderbird, Apple Mail, Roundcube).

В Phase 5 (Admin UI) BFF получит endpoint для управления sieve-сценариями
прямо из веб-интерфейса.

## Известные ограничения

* **Первый запуск медленный** — ClamAV скачивает ~400 MB сигнатур через
  `freshclam`. На медленном канале это занимает 3–5 минут. После этого
  обновления инкрементальные.
* **Память** — со всеми включёнными компонентами контейнеру нужно
  ~1.5–2 GiB. В `docker-compose.yml` стоит `reservations.memory=1500m`.
* **TLS-сертификаты пока самоподписные** — production-сертификаты от
  Let's Encrypt подключаются в Phase 3.
* **DMARC reports не отправляются** — для этого нужен внешний сервис
  отправки агрегатов; пока что только проверка входящих.

## Дальнейшая жёсткость

Что планируется к Phase 3:

* Let's Encrypt сертификаты с auto-renewal
* MTA-STS + TLS-RPT для гарантии TLS-only outbound
* DANE (DNSSEC + TLSA)
* Rspamd web UI за reverse-proxy с админ-авторизацией
* Greylisting (сейчас отключен для удобства dev)
