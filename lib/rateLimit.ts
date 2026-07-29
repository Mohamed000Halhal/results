import { NextRequest } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

// Clean up expired IP keys periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, store] of rateLimitMap.entries()) {
      if (now > store.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Basic Memory Rate Limiter
 * @param request NextRequest
 * @param limit Max allowed requests within windowMs
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  request: NextRequest,
  limit: number = 20,
  windowMs: number = 60 * 1000
): { success: boolean; limit: number; remaining: number } {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, limit, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0 };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count };
}
