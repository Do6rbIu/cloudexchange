import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyImapLogin } from '../services/imap.js';
import { upsertUserOnLogin, findUserByEmail } from '../db/users.js';
import { audit } from '../db/audit.js';
import { isTotpEnabled } from '../db/totp.js';
import { randomToken } from '../services/totp.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  displayName: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  // CSRF token issuance — the SPA fetches this once and echoes it back in
  // the x-csrf-token header on every mutating request.
  app.get('/csrf', async (request) => {
    if (!request.session.csrfToken) {
      request.session.csrfToken = randomToken(32);
    }
    return { csrfToken: request.session.csrfToken };
  });

  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
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

      const role = userRow?.role ?? 'user';
      const resolvedName = userRow?.displayName ?? finalDisplayName;

      // If 2FA is enabled, hold the credentials in a pending slot and
      // require a TOTP code before completing the session.
      const twofa = await isTotpEnabled(email).catch(() => false);
      if (twofa) {
        request.session.pending2fa = {
          email,
          password,
          displayName: resolvedName,
          role,
          since: Date.now(),
        };
        delete request.session.user;
        return { ok: true, twofaRequired: true };
      }

      request.session.user = { email, password, displayName: resolvedName, role };
      await audit({
        actorEmail: email,
        action: 'auth.login',
        result: 'success',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      return {
        ok: true,
        twofaRequired: false,
        user: { email, displayName: resolvedName, role },
      };
    },
  );

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
    if (!user) {
      const pending = request.session.pending2fa ? { twofaRequired: true } : {};
      return reply.status(401).send({ error: 'Unauthorized', message: 'Not signed in', ...pending });
    }
    const fresh = await findUserByEmail(user.email).catch(() => null);
    if (fresh) {
      request.session.user = { ...user, role: fresh.role, displayName: fresh.displayName };
    }
    const twofa = await isTotpEnabled(user.email).catch(() => false);
    return {
      email: user.email,
      displayName: request.session.user?.displayName ?? user.displayName,
      role: request.session.user?.role ?? user.role,
      twofaEnabled: twofa,
    };
  });
}
