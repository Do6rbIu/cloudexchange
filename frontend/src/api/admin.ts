import { api } from './client';
import type { AdminUser, AuditEntry, MailStackStatus } from '../types/api';

export const adminApi = {
  users: () => api.get<AdminUser[]>('/admin/users'),
  audit: (filters?: { action?: string; actor?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (filters?.action) p.set('action', filters.action);
    if (filters?.actor) p.set('actor', filters.actor);
    if (filters?.limit) p.set('limit', String(filters.limit));
    const qs = p.toString();
    return api.get<AuditEntry[]>(`/admin/audit${qs ? `?${qs}` : ''}`);
  },
  mailStack: () => api.get<MailStackStatus>('/admin/mail-stack'),
};
