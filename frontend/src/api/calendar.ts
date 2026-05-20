import { api } from './client';
import type { CalendarEvent, CalendarSummary } from '../types/api';

export interface CreateEventInput {
  calendarUrl: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  attendees?: string[];
}

export const calendarApi = {
  calendars: () => api.get<CalendarSummary[]>('/calendar/calendars'),
  events: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return api.get<CalendarEvent[]>(`/calendar/events${qs ? `?${qs}` : ''}`);
  },
  create: (input: CreateEventInput) => api.post<CalendarEvent>('/calendar/events', input),
  remove: (url: string, etag: string) => api.delete<{ ok: true }>('/calendar/events', { url, etag }),
};
