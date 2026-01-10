import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Wipe all race data for the authenticated user
 * WARNING: This deletes all race results data
 */
export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Get count before deletion
      const beforeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id));

      // Delete all race results for this user
      const deleteResult = await db
        .delete(raceResults)
        .where(eq(raceResults.userId, user.id));

      return NextResponse.json({
        success: true,
        userId: user.id,
        results: {
          recordsDeleted: beforeCount[0]?.count || 0,
          message: 'All race data has been wiped. You can now re-sync with the corrected session type logic.',
        },
      });

    } catch (error) {
      console.error('Wipe database error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}