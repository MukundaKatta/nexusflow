// ============================================================
// NexusFlow — Redis Client (Upstash)
// ============================================================

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await getRedis().get<T>(key);
  return data;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await getRedis().set(key, value, { ex: ttlSeconds });
  } else {
    await getRedis().set(key, value);
  }
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();
  const key = `ratelimit:${identifier}`;
  const current = await r.incr(key);

  if (current === 1) {
    await r.expire(key, windowSeconds);
  }

  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
  };
}

// Execution locking (prevent duplicate runs)
export async function acquireLock(
  key: string,
  ttlSeconds: number = 300
): Promise<boolean> {
  const r = getRedis();
  const result = await r.set(`lock:${key}`, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

export async function releaseLock(key: string): Promise<void> {
  await getRedis().del(`lock:${key}`);
}
