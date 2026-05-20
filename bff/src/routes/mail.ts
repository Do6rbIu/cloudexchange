import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteMessage,
  getMessage,
  listMailboxes,
  listMessages,
  setFlags,
} from '../services/imap.js';
import { sendMessage } from '../services/smtp.js';

const listMessagesQuery = z.object({
  mailbox: z.string().default('INBOX'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const flagsBody = z.object({
  flags: z.array(z.string()).min(1),
  add: z.boolean().default(true),
});

const sendBody = z.object({
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
});

export async function mailRoutes(app: FastifyInstance) {
  app.get('/folders', async (request, reply) => {
    const user = await requireAuth(request, reply);
    return await listMailboxes(user);
  });

  app.get('/messages', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = listMessagesQuery.safeParse(request.query);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    return await listMessages(user, parse.data.mailbox, parse.data.limit);
  });

  app.get<{ Params: { uid: string }; Querystring: { mailbox?: string } }>(
    '/messages/:uid',
    async (request, reply) => {
      const user = await requireAuth(request, reply);
      const uid = Number(request.params.uid);
      if (!Number.isFinite(uid)) {
        return reply.status(400).send({ error: 'BadRequest', message: 'uid must be a number' });
      }
      const mailbox = request.query.mailbox ?? 'INBOX';
      const message = await getMessage(user, mailbox, uid);
      if (!message) return reply.status(404).send({ error: 'NotFound', message: 'message not found' });
      return message;
    },
  );

  app.post<{ Params: { uid: string }; Querystring: { mailbox?: string } }>(
    '/messages/:uid/flags',
    async (request, reply) => {
      const user = await requireAuth(request, reply);
      const parse = flagsBody.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
      }
      const uid = Number(request.params.uid);
      const mailbox = request.query.mailbox ?? 'INBOX';
      await setFlags(user, mailbox, uid, parse.data.flags, parse.data.add);
      return { ok: true };
    },
  );

  app.delete<{ Params: { uid: string }; Querystring: { mailbox?: string } }>(
    '/messages/:uid',
    async (request, reply) => {
      const user = await requireAuth(request, reply);
      const uid = Number(request.params.uid);
      const mailbox = request.query.mailbox ?? 'INBOX';
      await deleteMessage(user, mailbox, uid);
      return { ok: true };
    },
  );

  app.post('/send', async (request, reply) => {
    const user = await requireAuth(request, reply);
    const parse = sendBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'BadRequest', message: parse.error.message });
    }
    const messageId = await sendMessage(user, parse.data);
    return { ok: true, messageId };
  });
}
