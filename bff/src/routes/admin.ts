import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../middleware/requireAuth.js';
import {
  createUser,
  deleteUser,
  listUsers,
  setUserActive,
  setUserRole,
} from '../db/users.js';
import { audit, listAudit } from '../db/audit.js';
import { checkMailStack } from '../services/mailStack.js';
import {
  provisionMailAccount,
  removeMailAccount,
  setMailAccountPassword,
  setMailAccountQuota,
} from '../services/mailProvisioning.js';

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).optional(),
  quotaBytes: z.number().int().positive().optional(),
});

const passwordResetSchema = z.object({
  password: z.string().min(8),
});

const quotaSchema = z.object({
  // e.g. "5G", "500M". Postfix-style.
  quota: z.string().regex(/^\d+[KMG]?$/i),
});

function serializeUser(u: Awaited<ReturnType<typeof listUsers>>[number]) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    quotaBytes: u.quotaBytes,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}

export async function adminRoutes(app: FastifyInstance) {
  // ── Mail-stack status (Phase 2)
  app.get('/mail-stack', async (request, reply) => {
    await requireAdmin(request, reply);
    return await checkMailStack();
  });

  // ── List users
  app.get('/users', async (request, reply) => {
    await requireAdmin(request, reply);
    const users = await listUsers();
    return users.map(serializeUser);
  });

  // ── Create user (Phase 2.5)
  // Two-stage write: Postgres `users` (source of truth for our app +
  // SOGo's directory view) and docker-mailserver (mailbox + IMAP/SMTP
  // credentials). If the mailserver step fails we roll back the DB row
  // so the system stays consistent.
  app.post('/users', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    const parse = createUserSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const { email, displayName, password, role, quotaBytes } = parse.data;

    const row = await createUser({ email, displayName, role, quotaBytes }).catch((err) => {
      if (/duplicate key/i.test(String(err))) {
        return null;
      }
      throw err;
    });
    if (!row) {
      return reply.status(409).send({ error: 'Conflict', message: 'User already exists' });
    }

    try {
      await provisionMailAccount(email, password);
      if (quotaBytes) {
        const gib = Math.max(1, Math.floor(quotaBytes / (1024 * 1024 * 1024)));
        await setMailAccountQuota(email, `${gib}G`);
      }
    } catch (err) {
      // Rollback the application row so we don't leave a half-created user.
      await deleteUser(email).catch(() => undefined);
      await audit({
        actorEmail: actor.email,
        action: 'admin.user.create',
        target: email,
        result: 'failure',
        ipAddress: request.ip,
        detail: { reason: (err as Error).message },
      });
      return reply.status(502).send({
        error: 'MailProvisioningFailed',
        message: (err as Error).message,
      });
    }

    await audit({
      actorEmail: actor.email,
      action: 'admin.user.create',
      target: email,
      ipAddress: request.ip,
      detail: { role: role ?? 'user' },
    });
    return reply.status(201).send(serializeUser(row));
  });

  // ── Update password
  app.post<{ Params: { email: string } }>(
    '/users/:email/password',
    async (request, reply) => {
      const actor = await requireAdmin(request, reply);
      const parse = passwordResetSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
      }
      try {
        await setMailAccountPassword(request.params.email, parse.data.password);
      } catch (err) {
        return reply.status(502).send({ error: 'MailProvisioningFailed', message: (err as Error).message });
      }
      await audit({
        actorEmail: actor.email,
        action: 'admin.user.password',
        target: request.params.email,
        ipAddress: request.ip,
      });
      return { ok: true };
    },
  );

  // ── Update quota
  app.post<{ Params: { email: string } }>('/users/:email/quota', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    const parse = quotaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    try {
      await setMailAccountQuota(request.params.email, parse.data.quota);
    } catch (err) {
      return reply.status(502).send({ error: 'MailProvisioningFailed', message: (err as Error).message });
    }
    await audit({
      actorEmail: actor.email,
      action: 'admin.user.quota',
      target: request.params.email,
      ipAddress: request.ip,
      detail: { quota: parse.data.quota },
    });
    return { ok: true };
  });

  // ── Activate / deactivate
  app.post<{ Params: { email: string }; Body: { active: boolean } }>(
    '/users/:email/active',
    async (request, reply) => {
      const actor = await requireAdmin(request, reply);
      const active = Boolean(request.body?.active);
      const row = await setUserActive(request.params.email, active);
      if (!row) return reply.status(404).send({ error: 'NotFound', message: 'user not found' });
      await audit({
        actorEmail: actor.email,
        action: active ? 'admin.user.activate' : 'admin.user.deactivate',
        target: request.params.email,
        ipAddress: request.ip,
      });
      return serializeUser(row);
    },
  );

  // ── Change role
  app.post<{ Params: { email: string }; Body: { role: 'user' | 'admin' } }>(
    '/users/:email/role',
    async (request, reply) => {
      const actor = await requireAdmin(request, reply);
      const role = request.body?.role;
      if (role !== 'user' && role !== 'admin') {
        return reply.status(400).send({ error: 'BadRequest', message: 'role must be user|admin' });
      }
      const row = await setUserRole(request.params.email, role);
      if (!row) return reply.status(404).send({ error: 'NotFound', message: 'user not found' });
      await audit({
        actorEmail: actor.email,
        action: 'admin.user.role',
        target: request.params.email,
        ipAddress: request.ip,
        detail: { role },
      });
      return serializeUser(row);
    },
  );

  // ── Delete user (mailbox + Postgres row)
  app.delete<{ Params: { email: string } }>('/users/:email', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    const email = request.params.email;
    if (email === actor.email) {
      return reply.status(400).send({ error: 'BadRequest', message: 'cannot delete yourself' });
    }
    try {
      await removeMailAccount(email);
    } catch (err) {
      request.log.warn({ err }, 'mailserver removal failed; continuing with DB cleanup');
    }
    const removed = await deleteUser(email);
    if (!removed) return reply.status(404).send({ error: 'NotFound', message: 'user not found' });
    await audit({
      actorEmail: actor.email,
      action: 'admin.user.delete',
      target: email,
      ipAddress: request.ip,
    });
    return { ok: true };
  });

  // ── Audit log
  app.get<{ Querystring: { action?: string; actor?: string; limit?: string } }>(
    '/audit',
    async (request, reply) => {
      await requireAdmin(request, reply);
      const limit = request.query.limit ? Number(request.query.limit) : 100;
      const entries = await listAudit({
        action: request.query.action,
        actorEmail: request.query.actor,
        limit: Number.isFinite(limit) ? limit : 100,
      });
      return entries.map((e) => ({
        id: String(e.id),
        occurredAt: e.occurred_at.toISOString(),
        actorEmail: e.actor_email,
        action: e.action,
        target: e.target,
        ipAddress: e.ip_address,
        userAgent: e.user_agent,
        result: e.result,
        detail: e.detail,
      }));
    },
  );
}
