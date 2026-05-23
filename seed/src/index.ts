import { setTimeout as wait } from 'node:timers/promises';
import net from 'node:net';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import ICAL from 'ical.js';
import { CONTACTS, DEMO_USER, EVENTS, MESSAGES, SENT_MESSAGES } from './data.js';
import { ensureAddressBook, ensureCalendar, putResource } from './dav.js';

const cfg = {
  imapHost: process.env.IMAP_HOST ?? 'localhost',
  imapPort: Number(process.env.IMAP_PORT ?? 143),
  imapSecure: (process.env.IMAP_SECURE ?? 'false') === 'true',
  smtpHost: process.env.SMTP_HOST ?? process.env.IMAP_HOST ?? 'localhost',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: (process.env.SMTP_SECURE ?? 'false') === 'true',
  caldavUrl: process.env.CALDAV_URL ?? 'http://localhost:5232',
  carddavUrl: process.env.CARDDAV_URL ?? 'http://localhost:5232',
  email: process.env.DEMO_EMAIL ?? DEMO_USER.email,
  password: process.env.DEMO_PASSWORD ?? DEMO_USER.password,
  displayName: process.env.DEMO_DISPLAY_NAME ?? DEMO_USER.displayName,
  maxAttempts: Number(process.env.SEED_MAX_ATTEMPTS ?? 60),
  attemptDelayMs: Number(process.env.SEED_ATTEMPT_DELAY_MS ?? 2000),
};

function log(label: string, msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[seed:${label}] ${msg}`);
}

async function waitForPort(host: string, port: number, label: string): Promise<void> {
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    const ok = await new Promise<boolean>((resolve) => {
      const sock = new net.Socket();
      sock.setTimeout(2000);
      sock
        .once('connect', () => {
          sock.destroy();
          resolve(true);
        })
        .once('timeout', () => {
          sock.destroy();
          resolve(false);
        })
        .once('error', () => {
          sock.destroy();
          resolve(false);
        })
        .connect(port, host);
    });
    if (ok) {
      log(label, `port ${host}:${port} is up (attempt ${attempt})`);
      return;
    }
    log(label, `waiting for ${host}:${port} (attempt ${attempt}/${cfg.maxAttempts})`);
    await wait(cfg.attemptDelayMs);
  }
  throw new Error(`Timeout waiting for ${host}:${port}`);
}

// ────────────────────────────────────────────────────────────────────────
// Mail
// ────────────────────────────────────────────────────────────────────────

function dateAt(dayOffset: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedInboxViaSmtp(): Promise<void> {
  // Send each demo message *to* the demo user from each sender. This
  // exercises the real SMTP delivery path (MTA → LMTP → Maildir), so the
  // mailserver, antispam and quotas all run against the seed data — much
  // closer to a production smoke-test than an IMAP APPEND.
  for (const m of MESSAGES) {
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: cfg.smtpPort,
      secure: cfg.smtpSecure,
      // For docker-mailserver we don't authenticate as the foreign
      // sender (we don't have their password). Instead we connect as
      // the demo user — Postfix accepts authenticated submissions and
      // applies SMTP filters but lets us spoof the From: header in dev.
      auth: { user: cfg.email, pass: cfg.password },
      tls: { rejectUnauthorized: false },
    });
    try {
      await transport.sendMail({
        envelope: { from: cfg.email, to: cfg.email },
        from: { name: m.fromName, address: m.fromAddress },
        to: { name: cfg.displayName, address: cfg.email },
        date: dateAt(m.dayOffset, m.hour, m.minute),
        subject: m.subject,
        text: m.body.join('\n'),
        attachments: (m.attachments ?? []).map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: 'text/plain; charset=utf-8',
        })),
      });
    } finally {
      transport.close();
    }
  }
  log('mail', `delivered ${MESSAGES.length} inbox messages via SMTP`);
}

async function appendSent(): Promise<void> {
  // Sent items don't pass through the MTA — append them directly to the
  // user's Sent folder via IMAP.
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapSecure,
    auth: { user: cfg.email, pass: cfg.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    try {
      await client.mailboxCreate('Sent');
    } catch {
      // Already exists.
    }
    for (const m of SENT_MESSAGES) {
      const date = dateAt(m.dayOffset, m.hour, m.minute);
      const headers = [
        `From: =?UTF-8?B?${Buffer.from(cfg.displayName).toString('base64')}?= <${cfg.email}>`,
        `To: <${m.to}>`,
        `Subject: =?UTF-8?B?${Buffer.from(m.subject).toString('base64')}?=`,
        `Date: ${date.toUTCString()}`,
        `Message-ID: <sent-${Date.now()}-${Math.random().toString(36).slice(2)}@cloudexchange.local>`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
      ];
      const body = Buffer.from(m.body.join('\n'), 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
      const mime = Buffer.from(headers.join('\r\n') + '\r\n\r\n' + body + '\r\n', 'utf8');
      await client.append('Sent', mime, ['\\Seen'], date);
    }
    log('mail', `appended ${SENT_MESSAGES.length} sent items via IMAP`);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function isInboxAlreadySeeded(): Promise<boolean> {
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapSecure,
    auth: { user: cfg.email, pass: cfg.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const status = await client.status('INBOX', { messages: true });
    return (status.messages ?? 0) >= MESSAGES.length;
  } finally {
    await client.logout().catch(() => undefined);
  }
}

// ────────────────────────────────────────────────────────────────────────
// Contacts (CardDAV)
// ────────────────────────────────────────────────────────────────────────

function buildVCard(c: (typeof CONTACTS)[number], uid: string): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `UID:${uid}`, `FN:${c.fullName}`];
  lines.push(`N:${c.fullName.split(' ').reverse().join(';')};;;`);
  lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
  lines.push(`TEL;TYPE=CELL:${c.phone}`);
  lines.push(`ORG:${c.organization}`);
  lines.push(`TITLE:${c.title}`);
  lines.push(`NOTE:${c.notes.replace(/\n/g, '\\n')}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

async function seedContacts(): Promise<void> {
  const davCfg = { baseUrl: cfg.carddavUrl, email: cfg.email, password: cfg.password };
  const bookUrl = await ensureAddressBook(davCfg, 'Корпоративная книга');
  for (const c of CONTACTS) {
    const uid = `contact-${c.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const url = `${bookUrl}${uid}.vcf`;
    try {
      await putResource(url, buildVCard(c, uid), 'text/vcard; charset=utf-8', davCfg);
    } catch (err) {
      log('contacts', `skip ${c.fullName}: ${(err as Error).message}`);
    }
  }
  log('contacts', `seeded ${CONTACTS.length} contacts at ${bookUrl}`);
}

// ────────────────────────────────────────────────────────────────────────
// Calendar (CalDAV)
// ────────────────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

function buildIcs(uid: string, e: (typeof EVENTS)[number], weekStart: Date, organizer: string): string {
  const start = new Date(weekStart);
  start.setDate(start.getDate() + e.weekday);
  start.setHours(e.startHour, e.startMinute, 0, 0);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + e.weekday);
  end.setHours(e.endHour, e.endMinute, 0, 0);

  const cal = new ICAL.Component(['vcalendar', [], []]);
  cal.updatePropertyWithValue('prodid', '-//Cloud24 Exchange//Seed//EN');
  cal.updatePropertyWithValue('version', '2.0');

  const vevent = new ICAL.Component('vevent');
  vevent.updatePropertyWithValue('uid', uid);
  vevent.updatePropertyWithValue('summary', e.title);
  if (e.description) vevent.updatePropertyWithValue('description', e.description);
  if (e.location) vevent.updatePropertyWithValue('location', e.location);
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now());
  vevent.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(start, false));
  vevent.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(end, false));
  const organizerProp = new ICAL.Property('organizer');
  organizerProp.setValue(`mailto:${organizer}`);
  vevent.addProperty(organizerProp);
  for (const att of e.attendees ?? []) {
    const prop = new ICAL.Property('attendee');
    prop.setValue(`mailto:${att}`);
    vevent.addProperty(prop);
  }
  cal.addSubcomponent(vevent);
  return cal.toString();
}

async function seedCalendar(): Promise<void> {
  const davCfg = { baseUrl: cfg.caldavUrl, email: cfg.email, password: cfg.password };
  const calUrl = await ensureCalendar(davCfg, 'Рабочий календарь');
  const weekStart = startOfWeek(new Date());
  for (let i = 0; i < EVENTS.length; i++) {
    const ev = EVENTS[i];
    const uid = `seed-event-${i}-${weekStart.toISOString().slice(0, 10)}`;
    const ics = buildIcs(uid, ev, weekStart, cfg.email);
    const url = `${calUrl}${uid}.ics`;
    try {
      await putResource(url, ics, 'text/calendar; charset=utf-8', davCfg);
    } catch (err) {
      log('calendar', `skip ${ev.title}: ${(err as Error).message}`);
    }
  }
  log('calendar', `seeded ${EVENTS.length} events at ${calUrl}`);
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('main', `target user: ${cfg.email}`);
  log('main', `IMAP: ${cfg.imapHost}:${cfg.imapPort}  SMTP: ${cfg.smtpHost}:${cfg.smtpPort}`);
  log('main', `DAV:  ${cfg.caldavUrl}`);

  await waitForPort(cfg.imapHost, cfg.imapPort, 'main');
  await waitForPort(cfg.smtpHost, cfg.smtpPort, 'main');
  await waitForPort(new URL(cfg.caldavUrl).hostname, Number(new URL(cfg.caldavUrl).port || 80), 'main');

  // The mail step is the slowest because Postfix can take a few seconds
  // after the port opens before it accepts SMTP AUTH.
  if (await isInboxAlreadySeeded()) {
    log('mail', 'INBOX already populated, skipping mail seed');
  } else {
    await seedInboxViaSmtp();
    await appendSent();
  }

  await seedContacts();
  await seedCalendar();

  log('main', '✓ demo data ready');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] fatal:', err);
  process.exit(1);
});
