/**
 * Rate Limiter for Edge Functions
 * Uses in-memory storage with sliding window algorithm
 * Designed to prevent scraping while allowing legitimate users
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

// In-memory rate limit store (resets on cold start, which is acceptable)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Max requests per window
  blockDurationMs: number;   // How long to block after exceeding limit
  keyPrefix?: string;        // Optional prefix for the key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;           // Seconds until reset
  blocked: boolean;
  retryAfter?: number;       // Seconds until unblocked (if blocked)
}

// Default configs for different use cases
export const RATE_LIMIT_CONFIGS = {
  // Pricing API: generous for legitimate users, blocks aggressive scrapers
  pricing: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute (enough for browsing multiple routes)
    blockDurationMs: 5 * 60 * 1000,  // 5 minute block
    keyPrefix: 'pricing',
  } as RateLimitConfig,
  
  // Strict: for sensitive operations
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDurationMs: 15 * 60 * 1000,  // 15 minute block
    keyPrefix: 'strict',
  } as RateLimitConfig,
  
  // Lenient: for less sensitive public data
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    blockDurationMs: 2 * 60 * 1000,
    keyPrefix: 'lenient',
  } as RateLimitConfig,
};

/**
 * Extract client identifier from request
 * Uses multiple signals for accurate identification
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers (in order of reliability)
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const xRealIp = req.headers.get('x-real-ip');
  const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const xClientInfo = req.headers.get('x-client-info');
  
  const ip = cfConnectingIp || xRealIp || xForwardedFor || 'unknown';
  
  // Combine IP with user-agent fingerprint for better accuracy
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const uaHash = userAgent.length.toString(16) + userAgent.charCodeAt(0).toString(16);
  
  return `${ip}:${uaHash}`;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn: retryAfter,
      blocked: true,
      retryAfter,
    };
  }
  
  // Reset if blocked period is over or window expired
  if (!entry || entry.blockedUntil <= now && entry.blocked) {
    entry = { count: 0, windowStart: now, blocked: false, blockedUntil: 0 };
  }
  
  // Check if window has expired
  if (now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now, blocked: false, blockedUntil: 0 };
  }
  
  // Increment count
  entry.count++;
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = now + config.blockDurationMs;
    rateLimitStore.set(key, entry);
    
    const retryAfter = Math.ceil(config.blockDurationMs / 1000);
    console.log(`🚫 Rate limit exceeded for ${identifier} - blocked for ${retryAfter}s`);
    
    return {
      allowed: false,
      remaining: 0,
      resetIn: retryAfter,
      blocked: true,
      retryAfter,
    };
  }
  
  // Update store
  rateLimitStore.set(key, entry);
  
  const remaining = config.maxRequests - entry.count;
  const resetIn = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
  
  return {
    allowed: true,
    remaining,
    resetIn,
    blocked: false,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

/**
 * Create rate-limited 429 response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>
): Response {
  const headers = addRateLimitHeaders(corsHeaders, result, config);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Please slow down and try again later',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
  );
}

// Cleanup old entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > maxAge && (!entry.blocked || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
