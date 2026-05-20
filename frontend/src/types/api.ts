export interface AuthUser {
  email: string;
  displayName: string;
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
