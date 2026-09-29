/**
 * Simple in-memory rate limiter used by middleware.
 *
 * Not distributed (won't shared state across Vercel serverless instances) —
 * which is fine as a first line of defense against a single hammering IP.
 * It will slow down casual abuse significantly; dedicated rate limiting
 * (Upstash/Redis or Vercel KV) can be added later without changing callers.
 */
interface Bucket {
  count: number
  resetAt: number
}
const buckets = new Map<string, Bucket>()

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number
  /** Window size in seconds */
  windowSec: number
}

export function rateLimit(
  key: string,
  { max, windowSec }: RateLimitConfig,
  nowMs: number = Date.now(),
): { ok: boolean; remaining: number; resetAt: number } {
  const now = nowMs
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowSec * 1000 }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  const remaining = Math.max(0, max - bucket.count)
  const ok = bucket.count <= max
  // Occasional cleanup to avoid memory growth
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  }
  return { ok, remaining, resetAt: bucket.resetAt }
}

/** Build a stable bucket key from IP + path prefix. */
export function rateLimitKey(ip: string, scope: string): string {
  return `${scope}:${ip}`
}
