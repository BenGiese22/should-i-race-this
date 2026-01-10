import { NextRequest, NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth/server';
import { deleteUserTokens } from '@/lib/auth/server';

export async function POST(_request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (session) {
      // Delete tokens from database
      await deleteUserTokens(session.userId);
    }
    
    // Clear session cookie
    await clearSessionCookie();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}