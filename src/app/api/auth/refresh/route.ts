import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { refreshUserTokens } from '@/lib/auth/server';

export async function POST(_request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Attempt to refresh tokens
    const refreshed = await refreshUserTokens(session.userId);
    
    if (!refreshed) {
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh tokens' },
      { status: 500 }
    );
  }
}