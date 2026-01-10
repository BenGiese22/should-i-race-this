import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Reset sync timestamp to force a fresh sync
 */
export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Reset the lastSyncAt timestamp to null to force a fresh sync
      await db
        .update(users)
        .set({ lastSyncAt: null })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        userId: user.id,
        message: 'Sync timestamp reset. Next sync will fetch all data fresh.',
      });

    } catch (error) {
      console.error('Reset sync error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}