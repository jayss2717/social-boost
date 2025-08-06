import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

function getRateLimitKey(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for static assets and health checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/env-check')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    
    if (isRateLimited(key)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString(),
          }
        }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Allow embedding for Shopify apps - check if request is from Shopify admin
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  const secFetchSite = request.headers.get('sec-fetch-site') || '';
  
  // More comprehensive Shopify admin detection
  const isShopifyAdmin = 
    userAgent.includes('Shopify') || 
    referer.includes('admin.shopify.com') ||
    origin.includes('admin.shopify.com') ||
    secFetchSite === 'cross-site' ||
    request.nextUrl.searchParams.get('embedded') === '1' ||
    request.nextUrl.searchParams.get('hmac') ||
    request.nextUrl.searchParams.get('shop') ||
    request.nextUrl.searchParams.get('v') || // Allow cache-busting parameter
    // Also check for Shopify admin in the hostname or path
    request.nextUrl.hostname.includes('shopify') ||
    request.nextUrl.pathname.includes('admin') ||
    // Check if this is a request from within an iframe
    request.headers.get('sec-fetch-dest') === 'iframe';
  
  if (isShopifyAdmin) {
    // Allow embedding in Shopify admin
    response.headers.set('X-Frame-Options', 'ALLOW-FROM https://admin.shopify.com');
    // Force cache refresh for Shopify admin requests
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    console.log('Shopify admin detected - allowing iframe embedding - v4');
  } else {
    // Deny embedding for non-Shopify requests
    response.headers.set('X-Frame-Options', 'DENY');
    console.log('Non-Shopify request - denying iframe embedding - v4');
  }
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://cdn.shopify.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
    "img-src 'self' data: https: blob: https://cdn.shopify.com",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.myshopify.com https://admin.shopify.com https://monorail-edge.shopifysvc.com",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://admin.shopify.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-merchant-id');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 