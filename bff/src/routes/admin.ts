import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../middleware/requireAuth.js';
import { listUsers } from '../db/users.js';
import { listAudit } from '../db/audit.js';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/users', async (request, reply) => {
    await requireAdmin(request, reply);
    const users = await listUsers();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      quotaBytes: u.quotaBytes,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    }));
  });

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
