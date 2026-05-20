import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyImapLogin } from '../services/imap.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  displayName: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const { email, password, displayName } = parse.data;
    try {
      await verifyImapLogin(email, password);
    } catch (err) {
      request.log.warn({ err, email }, 'IMAP login failed');
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }
    request.session.user = {
      email,
      password,
      displayName: displayName ?? email.split('@')[0],
    };
    return { ok: true, user: { email, displayName: request.session.user.displayName } };
  });

  app.post('/logout', async (request) => {
    await new Promise<void>((resolve) => {
      request.session.destroy(() => resolve());
    });
    return { ok: true };
  });

  app.get('/me', async (request, reply) => {
    const user = request.session.user;
    if (!user) return reply.status(401).send({ error: 'Unauthorized', message: 'Not signed in' });
    return { email: user.email, displayName: user.displayName };
  });
}
