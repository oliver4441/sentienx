/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach.
 *
 * For production with multiple instances, swap this for upstash/ratelimit
 * or a Redis-backed solution.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check if a request is rate limited.
 * Returns { allowed: true } or { allowed: false, retryAfter: number }
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Get client identifier from request (IP-based)
 */
export function getClientIdentifier(request: Request): string {
  // Try common proxy headers first
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (for cases where IP isn't available)
  return "unknown";
}
