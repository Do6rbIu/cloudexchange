import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import type { SessionStore } from '@fastify/session';
import RedisStore from 'connect-redis';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { mailRoutes } from './routes/mail.js';
import { calendarRoutes } from './routes/calendar.js';
import { contactsRoutes } from './routes/contacts.js';
import { adminRoutes } from './routes/admin.js';
import { dbHealthy } from './db/pool.js';
import { redis, redisHealthy } from './db/redis.js';
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
  trustProxy: config.trustProxy,
  disableRequestLogging: false,
});

await app.register(cors, {
  origin: config.corsOrigin,
  credentials: true,
});

await app.register(cookie);

// Sessions live in Redis. Eject the demo "in-memory" store from Phase 0 —
// this makes the BFF stateless and horizontally scalable.
const store: SessionStore = new RedisStore({
  client: redis(),
  prefix: 'cxsess:',
  ttl: 60 * 60 * 12, // 12h
});

await app.register(session, {
  secret: config.sessionSecret.padEnd(32, '0').slice(0, 64),
  cookieName: 'cx_sid',
  store,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production' && config.trustProxy,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12,
  },
  saveUninitialized: false,
  rolling: true,
});

app.get('/api/health', async () => {
  const [dbOk, redisOk] = await Promise.all([dbHealthy(), redisHealthy()]);
  return {
    status: dbOk && redisOk ? 'ok' : 'degraded',
    service: 'cloudexchange-bff',
    version: '0.2.0',
    deps: { postgres: dbOk, redis: redisOk },
  };
});

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(mailRoutes, { prefix: '/api/mail' });
await app.register(calendarRoutes, { prefix: '/api/calendar' });
await app.register(contactsRoutes, { prefix: '/api/contacts' });
await app.register(adminRoutes, { prefix: '/api/admin' });

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
