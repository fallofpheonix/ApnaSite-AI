// Fixed-window in-memory rate limiter. Good enough for a single-process dev
// server or one small VM; counters reset on restart and are not shared across
// processes. Swap for a SQLite/Redis-backed counter when deploying to
// multiple instances.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Counts a hit against `key` and reports whether it's still under `limit`
 * hits per `windowMs`. Keys should be namespaced by route + identity, e.g.
 * "generate:user:abc123" or "otp:ip:1.2.3.4".
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup so the map doesn't grow forever.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP. Behind a proxy/host platform the real IP arrives in
 * x-forwarded-for; locally there's no header, so everything shares "local". */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
