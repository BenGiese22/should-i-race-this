import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { getUserProfile } from '@/lib/auth/server';

export async function GET(_request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get full user profile
    const user = await getUserProfile(session.userId);
    
    return NextResponse.json({
      user: {
        id: user.id,
        iracingCustomerId: user.iracingCustomerId,
        displayName: user.displayName,
        licenseClasses: user.licenseClasses,
        createdAt: user.createdAt,
        lastSyncAt: user.lastSyncAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}