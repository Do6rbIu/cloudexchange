import { createDAVClient, type DAVCalendar, type DAVObject } from 'tsdav';
import ICAL from 'ical.js';
import { config } from '../config.js';
import type { SessionUser } from '../types/session.js';

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

export interface CalendarSummary {
  url: string;
  displayName: string;
  description: string | null;
  color: string | null;
}

async function client(user: SessionUser) {
  return await createDAVClient({
    serverUrl: config.caldav.url,
    credentials: { username: user.email, password: user.password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });
}

export async function listCalendars(user: SessionUser): Promise<CalendarSummary[]> {
  const dav = await client(user);
  const calendars: DAVCalendar[] = await dav.fetchCalendars();
  return calendars.map((c) => ({
    url: c.url,
    displayName: typeof c.displayName === 'string' ? c.displayName : c.url,
    description: typeof c.description === 'string' ? c.description : null,
    color: typeof c.calendarColor === 'string' ? c.calendarColor : null,
  }));
}

function parseEvent(obj: DAVObject, calendarUrl: string): CalendarEvent | null {
  if (!obj.data || typeof obj.data !== 'string') return null;
  try {
    const jcal = ICAL.parse(obj.data);
    const comp = new ICAL.Component(jcal);
    const vevent = comp.getFirstSubcomponent('vevent');
    if (!vevent) return null;
    const event = new ICAL.Event(vevent);
    const attendees = (vevent.getAllProperties('attendee') ?? []).map((p) => String(p.getFirstValue()));
    const organizerProp = vevent.getFirstProperty('organizer');
    return {
      uid: event.uid,
      calendarUrl,
      url: obj.url,
      etag: obj.etag ?? '',
      title: event.summary ?? '(без названия)',
      description: event.description ?? null,
      location: event.location ?? null,
      start: event.startDate.toJSDate().toISOString(),
      end: event.endDate.toJSDate().toISOString(),
      allDay: event.startDate.isDate,
      organizer: organizerProp ? String(organizerProp.getFirstValue()) : null,
      attendees,
    };
  } catch {
    return null;
  }
}

export async function listEvents(
  user: SessionUser,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const dav = await client(user);
  const calendars = await dav.fetchCalendars();
  const events: CalendarEvent[] = [];
  for (const cal of calendars) {
    const objects = await dav.fetchCalendarObjects({
      calendar: cal,
      timeRange: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
    });
    for (const obj of objects) {
      const parsed = parseEvent(obj, cal.url);
      if (parsed) events.push(parsed);
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}

export async function createEvent(
  user: SessionUser,
  calendarUrl: string,
  input: {
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    attendees?: string[];
  },
): Promise<CalendarEvent> {
  const dav = await client(user);
  const calendars = await dav.fetchCalendars();
  const calendar = calendars.find((c) => c.url === calendarUrl) ?? calendars[0];
  if (!calendar) throw new Error('No calendar available for user');

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@cloudexchange`;
  const comp = new ICAL.Component(['vcalendar', [], []]);
  comp.updatePropertyWithValue('prodid', '-//Cloud24 Exchange//BFF//EN');
  comp.updatePropertyWithValue('version', '2.0');

  const vevent = new ICAL.Component('vevent');
  vevent.updatePropertyWithValue('uid', uid);
  vevent.updatePropertyWithValue('summary', input.title);
  if (input.description) vevent.updatePropertyWithValue('description', input.description);
  if (input.location) vevent.updatePropertyWithValue('location', input.location);
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now());

  const startTime = ICAL.Time.fromJSDate(input.start, false);
  const endTime = ICAL.Time.fromJSDate(input.end, false);
  if (input.allDay) {
    startTime.isDate = true;
    endTime.isDate = true;
  }
  vevent.updatePropertyWithValue('dtstart', startTime);
  vevent.updatePropertyWithValue('dtend', endTime);

  for (const a of input.attendees ?? []) {
    const prop = new ICAL.Property('attendee');
    prop.setValue(`mailto:${a}`);
    vevent.addProperty(prop);
  }

  comp.addSubcomponent(vevent);
  const ics = comp.toString();
  const filename = `${uid}.ics`;

  await dav.createCalendarObject({
    calendar,
    filename,
    iCalString: ics,
  });

  return {
    uid,
    calendarUrl: calendar.url,
    url: `${calendar.url}${filename}`,
    etag: '',
    title: input.title,
    description: input.description ?? null,
    location: input.location ?? null,
    start: input.start.toISOString(),
    end: input.end.toISOString(),
    allDay: input.allDay ?? false,
    organizer: user.email,
    attendees: input.attendees ?? [],
  };
}

export async function deleteEvent(
  user: SessionUser,
  objectUrl: string,
  etag: string,
): Promise<void> {
  const dav = await client(user);
  await dav.deleteCalendarObject({ calendarObject: { url: objectUrl, etag } });
}
