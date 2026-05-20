import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { createEvent, deleteEvent, listCalendars, listEvents } from '../services/caldav.js';

const rangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const createBody = z.object({
  calendarUrl: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  allDay: z.boolean().optional(),
  attendees: z.array(z.string().email()).optional(),
});

const deleteBody = z.object({
  url: z.string(),
  etag: z.string(),
});

export async function calendarRoutes(app: FastifyInstance) {
  app.get('/calendars', async (request, reply) => {
    const user = await requireAuth(request, reply);
    return await listCalendars(user);
  });

  app.get('/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = rangeQuery.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const now = new Date();
    const start = parse.data.from
      ? new Date(parse.data.from)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const end = parse.data.to
      ? new Date(parse.data.to)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
    return await listEvents(user, start, end);
  });

  app.post('/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = createBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const { calendarUrl, start, end, ...rest } = parse.data;
    return await createEvent(user, calendarUrl, {
      ...rest,
      start: new Date(start),
      end: new Date(end),
    });
  });

  app.delete('/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = deleteBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    await deleteEvent(user, parse.data.url, parse.data.etag);
    return { ok: true };
  });
}
