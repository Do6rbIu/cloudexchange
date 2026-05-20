import { api } from './client';
import type { Contact } from '../types/api';

export interface CreateContactInput {
  fullName: string;
  emails?: string[];
  phones?: string[];
  organization?: string;
  title?: string;
  notes?: string;
}

export const contactsApi = {
  list: () => api.get<Contact[]>('/contacts/'),
  create: (input: CreateContactInput) => api.post<Contact>('/contacts/', input),
  remove: (url: string, etag: string) => api.delete<{ ok: true }>('/contacts/', { url, etag }),
};
