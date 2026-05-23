import pg from 'pg';
import { config } from '../config.js';

let pool: pg.Pool | null = null;

export function db(): pg.Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function dbHealthy(): Promise<boolean> {
  try {
    const res = await db().query('SELECT 1');
    return res.rowCount === 1;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
