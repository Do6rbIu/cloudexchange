import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { mailRoutes } from './routes/mail.js';
import { calendarRoutes } from './routes/calendar.js';
import { contactsRoutes } from './routes/contacts.js';
import type { SessionUser } from './types/session.js';

declare module 'fastify' {
  interface Session {
    user?: SessionUser;
  }
}

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport:
      config.nodeEnv === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  },
  trustProxy: true,
});

await app.register(cors, {
  origin: config.corsOrigin,
  credentials: true,
});

await app.register(cookie);

await app.register(session, {
  secret: config.sessionSecret.padEnd(32, '0').slice(0, 64),
  cookieName: 'cx_sid',
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12,
  },
  saveUninitialized: false,
});

app.get('/api/health', async () => ({ status: 'ok', service: 'cloudexchange-bff' }));

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(mailRoutes, { prefix: '/api/mail' });
await app.register(calendarRoutes, { prefix: '/api/calendar' });
await app.register(contactsRoutes, { prefix: '/api/contacts' });

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'request failed');
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    error: error.name || 'InternalError',
    message: statusCode >= 500 ? 'Internal server error' : error.message,
  });
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Cloud24 Exchange BFF listening on :${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
