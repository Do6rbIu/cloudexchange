import { api } from './client';
import type { MailboxSummary, MessageDetail, MessageSummary, SendPayload } from '../types/api';

export const mailApi = {
  folders: () => api.get<MailboxSummary[]>('/mail/folders'),
  messages: (mailbox = 'INBOX', limit = 50) =>
    api.get<MessageSummary[]>(
      `/mail/messages?mailbox=${encodeURIComponent(mailbox)}&limit=${limit}`,
    ),
  message: (uid: number, mailbox = 'INBOX') =>
    api.get<MessageDetail>(
      `/mail/messages/${uid}?mailbox=${encodeURIComponent(mailbox)}`,
    ),
  setFlags: (uid: number, flags: string[], add: boolean, mailbox = 'INBOX') =>
    api.post<{ ok: true }>(
      `/mail/messages/${uid}/flags?mailbox=${encodeURIComponent(mailbox)}`,
      { flags, add },
    ),
  remove: (uid: number, mailbox = 'INBOX') =>
    api.delete<{ ok: true }>(
      `/mail/messages/${uid}?mailbox=${encodeURIComponent(mailbox)}`,
    ),
  send: (payload: SendPayload) =>
    api.post<{ ok: true; messageId: string }>('/mail/send', payload),
};
