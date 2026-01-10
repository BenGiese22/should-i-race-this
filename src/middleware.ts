import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

/**
 * Next.js middleware for authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and API auth routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/debug') || // Allow debug API routes for testing
    pathname.startsWith('/oauth') ||
    pathname === '/' ||
    pathname.startsWith('/debug') || // Allow debug route for testing
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }
  
  // Check for session token
  const sessionToken = request.cookies.get('racing-session')?.value;
  
  if (!sessionToken) {
    // Redirect to login for protected routes
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  try {
    // Verify session token
    const session = await verifySessionToken(sessionToken);
    
    if (!session) {
      // Invalid session, redirect to login
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Add user info to request headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    response.headers.set('x-iracing-customer-id', session.iracingCustomerId.toString());
    
    return response;
  } catch (error) {
    console.error('Middleware authentication error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - oauth (OAuth callback routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (home page)
     */
    '/((?!api/auth|oauth|_next/static|_next/image|favicon.ico|$).*)',
  ],
};