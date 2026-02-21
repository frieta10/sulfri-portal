/**
 * Simple in-memory rate limiter for MVP
 * Production: Use Redis or Upstash for distributed rate limiting
 */

type RateLimitEntry = {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, email)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // First request or window expired, create new entry
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return false
  }

  // Increment count
  entry.count++
  return true
}

/**
 * Get remaining attempts for an identifier
 */
export function getRemainingAttempts(
  identifier: string,
  limit: number = 10
): number {
  const entry = rateLimitMap.get(identifier)
  if (!entry || entry.resetTime < Date.now()) {
    return limit
  }
  return Math.max(0, limit - entry.count)
}

/**
 * Reset rate limit for an identifier (for testing or admin purposes)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier)
}
