import { ImapFlow, type ListResponse } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { config } from '../config.js';
import type { SessionUser } from '../types/session.js';

export interface MailboxSummary {
  path: string;
  name: string;
  specialUse?: string;
  unread: number;
  total: number;
}

export interface MessageSummary {
  uid: number;
  seq: number;
  subject: string;
  from: { name: string; address: string } | null;
  to: Array<{ name: string; address: string }>;
  date: string;
  preview: string;
  unread: boolean;
  flagged: boolean;
  hasAttachment: boolean;
  size: number;
}

export interface MessageDetail extends MessageSummary {
  html: string | null;
  text: string | null;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  cc: Array<{ name: string; address: string }>;
  bcc: Array<{ name: string; address: string }>;
  messageId: string | null;
  inReplyTo: string | null;
}

function makeClient(user: SessionUser): ImapFlow {
  return new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: { user: user.email, pass: user.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });
}

export async function verifyImapLogin(email: string, password: string): Promise<void> {
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: { user: email, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.logout();
}

export async function listMailboxes(user: SessionUser): Promise<MailboxSummary[]> {
  const client = makeClient(user);
  await client.connect();
  try {
    const boxes: ListResponse[] = await client.list();
    const summaries: MailboxSummary[] = [];
    for (const box of boxes) {
      const status = await client.status(box.path, { messages: true, unseen: true });
      summaries.push({
        path: box.path,
        name: box.name,
        specialUse: box.specialUse,
        unread: status.unseen ?? 0,
        total: status.messages ?? 0,
      });
    }
    return summaries;
  } finally {
    await client.logout();
  }
}

function addressList(addr: ParsedMail['from'] | undefined): Array<{ name: string; address: string }> {
  if (!addr) return [];
  const items = Array.isArray(addr) ? addr : [addr];
  const out: Array<{ name: string; address: string }> = [];
  for (const item of items) {
    if (!item) continue;
    for (const entry of item.value) {
      if (entry.address) out.push({ name: entry.name ?? '', address: entry.address });
    }
  }
  return out;
}

function firstAddress(
  list: Array<{ name: string; address: string }>,
): { name: string; address: string } | null {
  return list[0] ?? null;
}

function makePreview(text: string | undefined, html: string | undefined): string {
  const source = text ?? (html ? html.replace(/<[^>]+>/g, ' ') : '');
  return source.replace(/\s+/g, ' ').trim().slice(0, 200);
}

export async function listMessages(
  user: SessionUser,
  mailboxPath: string,
  limit = 50,
): Promise<MessageSummary[]> {
  const client = makeClient(user);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      const status = await client.status(mailboxPath, { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return [];
      const start = Math.max(1, total - limit + 1);
      const range = `${start}:${total}`;
      const out: MessageSummary[] = [];
      for await (const msg of client.fetch(range, {
        envelope: true,
        flags: true,
        size: true,
        bodyStructure: true,
        uid: true,
      })) {
        const env = msg.envelope;
        const flags = msg.flags ?? new Set<string>();
        const fromList = (env?.from ?? []).map((a) => ({
          name: a.name ?? '',
          address: a.address ?? '',
        }));
        const toList = (env?.to ?? []).map((a) => ({
          name: a.name ?? '',
          address: a.address ?? '',
        }));
        out.push({
          uid: msg.uid,
          seq: msg.seq,
          subject: env?.subject ?? '(без темы)',
          from: firstAddress(fromList),
          to: toList,
          date: (env?.date ?? new Date()).toISOString(),
          preview: '',
          unread: !flags.has('\\Seen'),
          flagged: flags.has('\\Flagged'),
          hasAttachment: hasAttachmentStructure(msg.bodyStructure),
          size: msg.size ?? 0,
        });
      }
      return out.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasAttachmentStructure(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === 'attachment') return true;
  if (Array.isArray(structure.childNodes)) {
    return structure.childNodes.some(hasAttachmentStructure);
  }
  return false;
}

export async function getMessage(
  user: SessionUser,
  mailboxPath: string,
  uid: number,
): Promise<MessageDetail | null> {
  const client = makeClient(user);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      const downloaded = await client.download(String(uid), undefined, { uid: true });
      if (!downloaded) return null;
      const parsed: ParsedMail = await simpleParser(downloaded.content);
      const fromList = addressList(parsed.from);
      const toList = addressList(parsed.to as ParsedMail['from']);
      const ccList = addressList(parsed.cc as ParsedMail['from']);
      const bccList = addressList(parsed.bcc as ParsedMail['from']);
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      return {
        uid,
        seq: 0,
        subject: parsed.subject ?? '(без темы)',
        from: firstAddress(fromList),
        to: toList,
        cc: ccList,
        bcc: bccList,
        date: (parsed.date ?? new Date()).toISOString(),
        preview: makePreview(parsed.text, parsed.html || undefined),
        unread: false,
        flagged: false,
        hasAttachment: (parsed.attachments ?? []).length > 0,
        size: parsed.text?.length ?? (typeof parsed.html === 'string' ? parsed.html.length : 0),
        html: typeof parsed.html === 'string' ? parsed.html : null,
        text: parsed.text ?? null,
        attachments: (parsed.attachments ?? []).map((a) => ({
          filename: a.filename ?? 'attachment',
          contentType: a.contentType ?? 'application/octet-stream',
          size: a.size ?? 0,
          contentId: a.contentId,
        })),
        messageId: parsed.messageId ?? null,
        inReplyTo: parsed.inReplyTo ?? null,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function setFlags(
  user: SessionUser,
  mailboxPath: string,
  uid: number,
  flags: string[],
  add: boolean,
): Promise<void> {
  const client = makeClient(user);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      if (add) {
        await client.messageFlagsAdd(String(uid), flags, { uid: true });
      } else {
        await client.messageFlagsRemove(String(uid), flags, { uid: true });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function deleteMessage(
  user: SessionUser,
  mailboxPath: string,
  uid: number,
): Promise<void> {
  const client = makeClient(user);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(mailboxPath);
    try {
      await client.messageDelete(String(uid), { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
