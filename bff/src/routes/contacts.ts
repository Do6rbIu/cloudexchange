import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { createContact, deleteContact, listContacts } from '../services/carddav.js';

const createBody = z.object({
  fullName: z.string().min(1),
  emails: z.array(z.string().email()).optional(),
  phones: z.array(z.string()).optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

const deleteBody = z.object({
  url: z.string(),
  etag: z.string(),
});

export async function contactsRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const user = await requireAuth(request, reply);
    return await listContacts(user);
  });

  app.post('/', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = createBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    return await createContact(user, parse.data);
  });

  app.delete('/', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = deleteBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    await deleteContact(user, parse.data.url, parse.data.etag);
    return { ok: true };
  });
}
