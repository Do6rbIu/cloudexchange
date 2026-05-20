import { createDAVClient, type DAVObject } from 'tsdav';
import { config } from '../config.js';
import type { SessionUser } from '../types/session.js';

export interface Contact {
  uid: string;
  url: string;
  etag: string;
  fullName: string;
  emails: string[];
  phones: string[];
  organization: string | null;
  title: string | null;
  notes: string | null;
}

async function client(user: SessionUser) {
  return await createDAVClient({
    serverUrl: config.carddav.url,
    credentials: { username: user.email, password: user.password },
    authMethod: 'Basic',
    defaultAccountType: 'carddav',
  });
}

function unquote(value: string): string {
  return value.replace(/^"|"$/g, '').trim();
}

function parseVCard(text: string): Partial<Contact> {
  const lines = text.replace(/\r\n /g, '').replace(/\n /g, '').split(/\r?\n/);
  const result: Partial<Contact> = {
    emails: [],
    phones: [],
  };
  for (const line of lines) {
    if (!line || line.startsWith('BEGIN:') || line.startsWith('END:') || line.startsWith('VERSION:')) continue;
    const sepIdx = line.indexOf(':');
    if (sepIdx === -1) continue;
    const left = line.slice(0, sepIdx);
    const value = line.slice(sepIdx + 1);
    const [rawName] = left.split(';');
    const name = rawName.toUpperCase();
    switch (name) {
      case 'UID':
        result.uid = value;
        break;
      case 'FN':
        result.fullName = unquote(value);
        break;
      case 'EMAIL':
        result.emails!.push(value.trim());
        break;
      case 'TEL':
        result.phones!.push(value.trim());
        break;
      case 'ORG':
        result.organization = unquote(value.split(';')[0]);
        break;
      case 'TITLE':
        result.title = unquote(value);
        break;
      case 'NOTE':
        result.notes = unquote(value);
        break;
    }
  }
  return result;
}

function fromDAVObject(obj: DAVObject): Contact | null {
  if (!obj.data || typeof obj.data !== 'string') return null;
  const parsed = parseVCard(obj.data);
  if (!parsed.uid && !parsed.fullName) return null;
  return {
    uid: parsed.uid ?? obj.url,
    url: obj.url,
    etag: obj.etag ?? '',
    fullName: parsed.fullName ?? '(без имени)',
    emails: parsed.emails ?? [],
    phones: parsed.phones ?? [],
    organization: parsed.organization ?? null,
    title: parsed.title ?? null,
    notes: parsed.notes ?? null,
  };
}

export async function listContacts(user: SessionUser): Promise<Contact[]> {
  const dav = await client(user);
  const books = await dav.fetchAddressBooks();
  const all: Contact[] = [];
  for (const book of books) {
    const objects = await dav.fetchVCards({ addressBook: book });
    for (const obj of objects) {
      const c = fromDAVObject(obj);
      if (c) all.push(c);
    }
  }
  return all.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
}

function buildVCard(input: {
  uid: string;
  fullName: string;
  emails?: string[];
  phones?: string[];
  organization?: string;
  title?: string;
  notes?: string;
}): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `UID:${input.uid}`, `FN:${input.fullName}`];
  for (const email of input.emails ?? []) {
    lines.push(`EMAIL:${email}`);
  }
  for (const phone of input.phones ?? []) {
    lines.push(`TEL:${phone}`);
  }
  if (input.organization) lines.push(`ORG:${input.organization}`);
  if (input.title) lines.push(`TITLE:${input.title}`);
  if (input.notes) lines.push(`NOTE:${input.notes}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export async function createContact(
  user: SessionUser,
  input: {
    fullName: string;
    emails?: string[];
    phones?: string[];
    organization?: string;
    title?: string;
    notes?: string;
  },
): Promise<Contact> {
  const dav = await client(user);
  const books = await dav.fetchAddressBooks();
  const book = books[0];
  if (!book) throw new Error('No address book available for user');

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@cloudexchange`;
  const vcard = buildVCard({ uid, ...input });
  const filename = `${uid}.vcf`;
  await dav.createVCard({ addressBook: book, filename, vCardString: vcard });
  return {
    uid,
    url: `${book.url}${filename}`,
    etag: '',
    fullName: input.fullName,
    emails: input.emails ?? [],
    phones: input.phones ?? [],
    organization: input.organization ?? null,
    title: input.title ?? null,
    notes: input.notes ?? null,
  };
}

export async function deleteContact(
  user: SessionUser,
  objectUrl: string,
  etag: string,
): Promise<void> {
  const dav = await client(user);
  await dav.deleteVCard({ vCard: { url: objectUrl, etag } });
}
