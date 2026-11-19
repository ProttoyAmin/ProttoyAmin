import "server-only";

/**
 * A small in-process token bucket limiter.
 *
 * The interface is intentionally narrow so a Redis-backed implementation can
 * replace it for multi-instance deployments without touching call sites.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Periodic cleanup so the map cannot grow without bound. */
export function pruneRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
