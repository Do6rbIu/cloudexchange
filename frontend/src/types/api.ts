export interface AuthUser {
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  quotaBytes: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SearchHit extends MessageSummary {
  mailbox: string;
}

export interface PortProbe {
  host: string;
  port: number;
  open: boolean;
  responseMs: number | null;
}

export interface MailStackStatus {
  imap: PortProbe;
  smtp: PortProbe;
  managesieve: PortProbe;
  rspamdController: PortProbe;
}

export interface AuditEntry {
  id: string;
  occurredAt: string;
  actorEmail: string | null;
  action: string;
  target: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  result: 'success' | 'failure';
  detail: Record<string, unknown>;
}

export interface Address {
  name: string;
  address: string;
}

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
  from: Address | null;
  to: Address[];
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
  cc: Address[];
  bcc: Address[];
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  messageId: string | null;
  inReplyTo: string | null;
}

export interface SendPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface CalendarSummary {
  url: string;
  displayName: string;
  description: string | null;
  color: string | null;
}

export interface CalendarEvent {
  uid: string;
  calendarUrl: string;
  url: string;
  etag: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  organizer: string | null;
  attendees: string[];
}

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
