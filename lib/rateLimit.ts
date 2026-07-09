// Redis-backed fixed-window rate limiter with in-memory fallback.
//
// Set REDIS_URL in .env to enable Redis (shared across processes/instances).
// When REDIS_URL is absent the module falls back to a per-process in-memory
// Map – identical behaviour to the old implementation.

import Redis from "ioredis";

// ---------------------------------------------------------------------------
// Redis client (lazy singleton, created once if REDIS_URL is set)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      // If Redis is unreachable, degrade gracefully to in-memory.
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying → client disconnects
        return Math.min(times * 200, 2000);
      },
    });
    redis.on("error", () => {
      // Silently degrade – the fallback path handles it.
    });
    redis.connect().catch(() => {
      // Connection failed – will use in-memory fallback.
    });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// In-memory fallback (identical to the old implementation)
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const memBuckets = new Map<string, Bucket>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Counts a hit against `key` and reports whether it's still under `limit`
 * hits per `windowMs`. Keys should be namespaced by route + identity, e.g.
 * "generate:user:abc123" or "otp:ip:1.2.3.4".
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const r = getRedis();
  if (r && r.status === "ready") {
    return redisRateLimit(r, key, limit, windowMs);
  }
  return memRateLimit(key, limit, windowMs);
}

// Synchronous version for callers that can't await.
export function rateLimitSync(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return memRateLimit(key, limit, windowMs);
}

// ---------------------------------------------------------------------------
// Redis implementation (fixed window via INCR + EXPIRE)
// ---------------------------------------------------------------------------

async function redisRateLimit(
  r: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    const count = await r.incr(redisKey);
    if (count === 1) {
      await r.expire(redisKey, windowSec);
    }

    if (count > limit) {
      const ttl = await r.ttl(redisKey);
      return { ok: false, retryAfterSeconds: ttl > 0 ? ttl : Math.ceil(windowMs / 1000) };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch {
    // Redis error → degrade to in-memory for this request.
    return memRateLimit(key, limit, windowMs);
  }
}

// ---------------------------------------------------------------------------
// In-memory implementation
// ---------------------------------------------------------------------------

function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup so the map doesn't grow forever.
  if (memBuckets.size > 5000) {
    for (const [k, b] of memBuckets) {
      if (b.resetAt <= now) memBuckets.delete(k);
    }
  }

  const bucket = memBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Best-effort client IP. Behind a proxy/host platform the real IP arrives in
 * x-forwarded-for; locally there's no header, so everything shares "local". */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
