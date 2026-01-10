import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { getUserProfile } from './db';

/**
 * Authentication middleware for protecting API routes
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, session);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Enhanced middleware that includes full user profile
 */
export async function withAuthAndProfile(
  request: NextRequest,
  handler: (user: any, profile: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get full user profile
    const userProfile = await getUserProfile(session.userId);
    
    // Create user object for handler
    const user = {
      id: userProfile.id,
      displayName: userProfile.displayName,
    };
    
    // Create profile object for handler (with cust_id for compatibility)
    const profile = {
      cust_id: userProfile.iracingCustomerId,
      display_name: userProfile.displayName,
      id: userProfile.id,
    };
    
    return handler(user, profile);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Get user from request headers (set by Next.js middleware)
 */
export function getUserFromHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const iracingCustomerId = request.headers.get('x-iracing-customer-id');
  
  if (!userId || !iracingCustomerId) {
    return null;
  }
  
  return {
    userId,
    iracingCustomerId: parseInt(iracingCustomerId, 10),
  };
}

/**
 * Check if user is authenticated (for client-side use)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session !== null;
  } catch {
    return false;
  }
}