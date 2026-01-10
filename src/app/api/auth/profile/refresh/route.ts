import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { syncUserLicenses } from '@/lib/auth/profile';
import { getUserProfile } from '@/lib/auth/db';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, session) => {
    try {
      // Sync user licenses from iRacing
      await syncUserLicenses(session.userId);
      
      // Return updated user profile
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
      console.error('Profile refresh error:', error);
      return NextResponse.json(
        { error: 'Failed to refresh profile' },
        { status: 500 }
      );
    }
  });
}