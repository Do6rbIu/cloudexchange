import { api } from './client';
import type { AdminUser, AuditEntry, MailStackStatus } from '../types/api';

export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
  role?: 'user' | 'admin';
  quotaBytes?: number;
}

export const adminApi = {
  users: () => api.get<AdminUser[]>('/admin/users'),
  createUser: (input: CreateUserInput) => api.post<AdminUser>('/admin/users', input),
  setActive: (email: string, active: boolean) =>
    api.post<AdminUser>(`/admin/users/${encodeURIComponent(email)}/active`, { active }),
  setRole: (email: string, role: 'user' | 'admin') =>
    api.post<AdminUser>(`/admin/users/${encodeURIComponent(email)}/role`, { role }),
  setPassword: (email: string, password: string) =>
    api.post<{ ok: true }>(`/admin/users/${encodeURIComponent(email)}/password`, { password }),
  setQuota: (email: string, quota: string) =>
    api.post<{ ok: true }>(`/admin/users/${encodeURIComponent(email)}/quota`, { quota }),
  deleteUser: (email: string) => api.delete<{ ok: true }>(`/admin/users/${encodeURIComponent(email)}`),
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
