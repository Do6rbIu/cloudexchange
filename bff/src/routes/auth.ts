import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyImapLogin } from '../services/imap.js';
import { upsertUserOnLogin, findUserByEmail } from '../db/users.js';
import { audit } from '../db/audit.js';

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
      await audit({
        actorEmail: email,
        action: 'auth.login',
        result: 'failure',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
        detail: { reason: (err as Error).message },
      });
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const finalDisplayName = displayName ?? email.split('@')[0];
    const userRow = await upsertUserOnLogin(email, finalDisplayName).catch((err) => {
      request.log.warn({ err }, 'user upsert failed — continuing with session-only auth');
      return null;
    });

    request.session.user = {
      email,
      password,
      displayName: userRow?.displayName ?? finalDisplayName,
      role: userRow?.role ?? 'user',
    };

    await audit({
      actorEmail: email,
      action: 'auth.login',
      result: 'success',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });

    return {
      ok: true,
      user: {
        email,
        displayName: request.session.user.displayName,
        role: request.session.user.role,
      },
    };
  });

  app.post('/logout', async (request) => {
    const email = request.session.user?.email;
    await new Promise<void>((resolve) => {
      request.session.destroy(() => resolve());
    });
    if (email) {
      await audit({ actorEmail: email, action: 'auth.logout', ipAddress: request.ip });
    }
    return { ok: true };
  });

  app.get('/me', async (request, reply) => {
    const user = request.session.user;
    if (!user) return reply.status(401).send({ error: 'Unauthorized', message: 'Not signed in' });
    // Refresh role from Postgres so admin/un-admin changes propagate.
    const fresh = await findUserByEmail(user.email).catch(() => null);
    if (fresh) {
      request.session.user = { ...user, role: fresh.role, displayName: fresh.displayName };
    }
    return {
      email: user.email,
      displayName: request.session.user?.displayName ?? user.displayName,
      role: request.session.user?.role ?? user.role,
    };
  });
}
