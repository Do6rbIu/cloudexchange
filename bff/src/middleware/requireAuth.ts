import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SessionUser } from '../types/session.js';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser> {
  const user = request.session.user;
  if (!user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Not signed in' });
    throw new Error('unauthorized');
  }
  return user;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser> {
  const user = await requireAuth(request, reply);
  if (user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden', message: 'Admin role required' });
    throw new Error('forbidden');
  }
  return user;
}
