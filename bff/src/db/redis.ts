import Redis from 'ioredis';
import { config } from '../config.js';

let client: Redis | null = null;

export function redis(): Redis {
  if (!config.redisUrl) {
    throw new Error('REDIS_URL is not set');
  }
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }
  return client;
}

export async function redisHealthy(): Promise<boolean> {
  try {
    const pong = await redis().ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
