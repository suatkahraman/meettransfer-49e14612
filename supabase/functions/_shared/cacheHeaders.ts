/**
 * Shared cache headers for edge functions
 * Implements aggressive caching strategies to improve TTFB
 */

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Cache headers for static/rarely changing data
export const staticCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  'CDN-Cache-Control': 'public, max-age=86400',
  'Vercel-CDN-Cache-Control': 'public, max-age=86400',
};

// Cache headers for semi-static data (e.g., reviews, prices)
export const semiStaticCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, max-age=3600',
  'Vercel-CDN-Cache-Control': 'public, max-age=3600',
};

// Cache headers for dynamic but cacheable data (5 min)
export const dynamicCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
  'CDN-Cache-Control': 'public, max-age=300',
  'Vercel-CDN-Cache-Control': 'public, max-age=300',
};

// No-cache headers for user-specific data
export const noCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Short cache for real-time data (1 min)
export const shortCacheHeaders = {
  ...corsHeaders,
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  'CDN-Cache-Control': 'public, max-age=60',
  'Vercel-CDN-Cache-Control': 'public, max-age=60',
};

/**
 * Get appropriate cache headers based on data type
 */
export function getCacheHeaders(
  type: 'static' | 'semi-static' | 'dynamic' | 'short' | 'none' = 'dynamic'
): Record<string, string> {
  switch (type) {
    case 'static':
      return staticCacheHeaders;
    case 'semi-static':
      return semiStaticCacheHeaders;
    case 'dynamic':
      return dynamicCacheHeaders;
    case 'short':
      return shortCacheHeaders;
    case 'none':
    default:
      return noCacheHeaders;
  }
}

/**
 * Create JSON response with proper cache headers
 */
export function jsonResponse(
  data: unknown,
  cacheType: 'static' | 'semi-static' | 'dynamic' | 'short' | 'none' = 'dynamic',
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCacheHeaders(cacheType),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create error response with no caching
 */
export function errorResponse(
  message: string,
  status = 500
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...noCacheHeaders,
      'Content-Type': 'application/json',
    },
  });
}
