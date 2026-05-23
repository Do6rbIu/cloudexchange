function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be numeric, got: ${raw}`);
  }
  return parsed;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export const config = {
  port: num('PORT', 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sessionSecret: required('SESSION_SECRET', 'dev-secret-change-me'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:8080',
  trustProxy: bool('TRUST_PROXY', false),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  imap: {
    host: required('IMAP_HOST', 'localhost'),
    port: num('IMAP_PORT', 143),
    secure: bool('IMAP_SECURE', false),
  },
  smtp: {
    host: required('SMTP_HOST', 'localhost'),
    port: num('SMTP_PORT', 587),
    secure: bool('SMTP_SECURE', false),
  },
  caldav: {
    url: required('CALDAV_URL', 'http://localhost:5232'),
  },
  carddav: {
    url: required('CARDDAV_URL', 'http://localhost:5232'),
  },
};

export type AppConfig = typeof config;
