import { setTimeout as wait } from 'node:timers/promises';
import { ImapFlow } from 'imapflow';
import { createDAVClient } from 'tsdav';
import ICAL from 'ical.js';
import { CONTACTS, DEMO_USER, EVENTS, MESSAGES, SENT_MESSAGES } from './data.js';

const cfg = {
  imapHost: process.env.IMAP_HOST ?? 'localhost',
  imapPort: Number(process.env.IMAP_PORT ?? 1143),
  imapSecure: (process.env.IMAP_SECURE ?? 'false') === 'true',
  caldavUrl: process.env.CALDAV_URL ?? 'http://localhost:5232',
  carddavUrl: process.env.CARDDAV_URL ?? 'http://localhost:5232',
  email: process.env.DEMO_EMAIL ?? DEMO_USER.email,
  password: process.env.DEMO_PASSWORD ?? DEMO_USER.password,
  displayName: process.env.DEMO_DISPLAY_NAME ?? DEMO_USER.displayName,
  // Retry knobs — useful when seed runs right after `docker compose up`.
  maxAttempts: Number(process.env.SEED_MAX_ATTEMPTS ?? 30),
  attemptDelayMs: Number(process.env.SEED_ATTEMPT_DELAY_MS ?? 2000),
};

function log(label: string, msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[seed:${label}] ${msg}`);
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      log(label, `attempt ${attempt}/${cfg.maxAttempts} failed: ${(err as Error).message}`);
      await wait(cfg.attemptDelayMs);
    }
  }
  throw lastErr;
}

// ────────────────────────────────────────────────────────────────────────
// Mail helpers
// ────────────────────────────────────────────────────────────────────────

function dateAt(dayOffset: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function encodeMimeWord(s: string): string {
  // Encode a header value as MIME encoded-word so non-ASCII text survives
  // IMAP transport. We pick base64 because it's safe for binary bytes.
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  const b64 = Buffer.from(s, 'utf8').toString('base64');
  return `=?UTF-8?B?${b64}?=`;
}

function formatAddress(name: string, address: string): string {
  return `${encodeMimeWord(name)} <${address}>`;
}

interface MimeAttachment {
  filename: string;
  content: string;
}

function buildPlainMime(opts: {
  from: { name: string; address: string };
  to: { name: string; address: string };
  subject: string;
  date: Date;
  body: string;
  attachments?: MimeAttachment[];
  messageId?: string;
}): Buffer {
  const boundary = `----cloudexchange-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const headers = [
    `From: ${formatAddress(opts.from.name, opts.from.address)}`,
    `To: ${formatAddress(opts.to.name, opts.to.address)}`,
    `Subject: ${encodeMimeWord(opts.subject)}`,
    `Date: ${opts.date.toUTCString()}`,
    `Message-ID: <${opts.messageId ?? `${Date.now()}.${Math.random().toString(36).slice(2)}@cloudexchange.local`}>`,
    `MIME-Version: 1.0`,
  ];

  const attachments = opts.attachments ?? [];
  if (attachments.length === 0) {
    headers.push('Content-Type: text/plain; charset=UTF-8');
    headers.push('Content-Transfer-Encoding: base64');
    const encoded = Buffer.from(opts.body, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
    return Buffer.from(headers.join('\r\n') + '\r\n\r\n' + encoded + '\r\n', 'utf8');
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  const parts: string[] = [];
  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/plain; charset=UTF-8');
  parts.push('Content-Transfer-Encoding: base64');
  parts.push('');
  parts.push(Buffer.from(opts.body, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'));

  for (const att of attachments) {
    parts.push(`--${boundary}`);
    parts.push(`Content-Type: text/plain; charset=UTF-8; name="${encodeMimeWord(att.filename)}"`);
    parts.push(`Content-Disposition: attachment; filename="${encodeMimeWord(att.filename)}"`);
    parts.push('Content-Transfer-Encoding: base64');
    parts.push('');
    parts.push(Buffer.from(att.content, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'));
  }
  parts.push(`--${boundary}--`);

  return Buffer.from(headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n') + '\r\n', 'utf8');
}

async function ensureMailbox(client: ImapFlow, path: string): Promise<void> {
  try {
    await client.mailboxCreate(path);
  } catch {
    // Already exists — ignore.
  }
}

async function seedMail(): Promise<void> {
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapSecure,
    auth: { user: cfg.email, pass: cfg.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  await withRetry('mail/connect', async () => {
    await client.connect();
  });

  try {
    await ensureMailbox(client, 'INBOX');
    await ensureMailbox(client, 'Sent');
    await ensureMailbox(client, 'Drafts');
    await ensureMailbox(client, 'Trash');
    await ensureMailbox(client, 'Junk');

    // ── INBOX
    {
      const status = await client.status('INBOX', { messages: true });
      if ((status.messages ?? 0) > 0) {
        log('mail', `INBOX already has ${status.messages} messages — skipping inbox seed`);
      } else {
        for (const m of MESSAGES) {
          const mime = buildPlainMime({
            from: { name: m.fromName, address: m.fromAddress },
            to: { name: cfg.displayName, address: cfg.email },
            subject: m.subject,
            date: dateAt(m.dayOffset, m.hour, m.minute),
            body: m.body.join('\r\n'),
            attachments: m.attachments,
          });
          const flags: string[] = [];
          if (!m.unread) flags.push('\\Seen');
          if (m.flagged) flags.push('\\Flagged');
          await client.append('INBOX', mime, flags, dateAt(m.dayOffset, m.hour, m.minute));
        }
        log('mail', `seeded INBOX with ${MESSAGES.length} messages`);
      }
    }

    // ── Sent
    {
      const status = await client.status('Sent', { messages: true });
      if ((status.messages ?? 0) > 0) {
        log('mail', `Sent already has ${status.messages} messages — skipping sent seed`);
      } else {
        for (const m of SENT_MESSAGES) {
          const mime = buildPlainMime({
            from: { name: cfg.displayName, address: cfg.email },
            to: { name: m.to.split('@')[0], address: m.to },
            subject: m.subject,
            date: dateAt(m.dayOffset, m.hour, m.minute),
            body: m.body.join('\r\n'),
          });
          await client.append('Sent', mime, ['\\Seen'], dateAt(m.dayOffset, m.hour, m.minute));
        }
        log('mail', `seeded Sent with ${SENT_MESSAGES.length} messages`);
      }
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}

// ────────────────────────────────────────────────────────────────────────
// CardDAV (contacts)
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
  const client = await withRetry('contacts/connect', async () =>
    createDAVClient({
      serverUrl: cfg.carddavUrl,
      credentials: { username: cfg.email, password: cfg.password },
      authMethod: 'Basic',
      defaultAccountType: 'carddav',
    }),
  );

  const books = await withRetry('contacts/discover', async () => client.fetchAddressBooks());
  if (books.length === 0) {
    log('contacts', 'no address book — Radicale creates one on first PUT, retrying via direct path');
  }

  const book =
    books[0] ??
    ({
      url: `${cfg.carddavUrl.replace(/\/$/, '')}/${encodeURIComponent(cfg.email)}/contacts/`,
    } as { url: string });

  const existing = books.length > 0 ? await client.fetchVCards({ addressBook: book }) : [];
  if (existing.length >= CONTACTS.length) {
    log('contacts', `address book already has ${existing.length} cards — skipping`);
    return;
  }

  for (const c of CONTACTS) {
    const uid = `contact-${c.email}`;
    const vcf = buildVCard(c, uid);
    const filename = `${uid}.vcf`;
    try {
      await client.createVCard({ addressBook: book, filename, vCardString: vcf });
    } catch (err) {
      log('contacts', `skip ${c.fullName}: ${(err as Error).message}`);
    }
  }
  log('contacts', `seeded ${CONTACTS.length} contacts`);
}

// ────────────────────────────────────────────────────────────────────────
// CalDAV (events)
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
  const client = await withRetry('calendar/connect', async () =>
    createDAVClient({
      serverUrl: cfg.caldavUrl,
      credentials: { username: cfg.email, password: cfg.password },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    }),
  );

  const calendars = await withRetry('calendar/discover', async () => client.fetchCalendars());
  const calendar =
    calendars[0] ??
    ({
      url: `${cfg.caldavUrl.replace(/\/$/, '')}/${encodeURIComponent(cfg.email)}/calendar/`,
    } as { url: string });

  const existing = calendars.length > 0 ? await client.fetchCalendarObjects({ calendar }) : [];
  if (existing.length >= EVENTS.length) {
    log('calendar', `calendar already has ${existing.length} events — skipping`);
    return;
  }

  const weekStart = startOfWeek(new Date());
  for (let i = 0; i < EVENTS.length; i++) {
    const ev = EVENTS[i];
    const uid = `seed-event-${i}-${weekStart.toISOString().slice(0, 10)}`;
    const ics = buildIcs(uid, ev, weekStart, cfg.email);
    try {
      await client.createCalendarObject({
        calendar,
        filename: `${uid}.ics`,
        iCalString: ics,
      });
    } catch (err) {
      log('calendar', `skip ${ev.title}: ${(err as Error).message}`);
    }
  }
  log('calendar', `seeded ${EVENTS.length} events for week starting ${weekStart.toISOString().slice(0, 10)}`);
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('main', `target user: ${cfg.email}`);
  log('main', `IMAP: ${cfg.imapHost}:${cfg.imapPort} (secure=${cfg.imapSecure})`);
  log('main', `CalDAV/CardDAV: ${cfg.caldavUrl}`);

  await seedMail();
  await seedContacts();
  await seedCalendar();

  log('main', '✓ demo data ready');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] fatal:', err);
  process.exit(1);
});
