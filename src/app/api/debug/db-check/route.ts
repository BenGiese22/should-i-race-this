import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, count, max, min, gt } from 'drizzle-orm';

/**
 * Debug endpoint to check what's actually in the database
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Count total race results for this user
      const totalCount = await db
        .select({ count: count(raceResults.id) })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id));

      // Get date range of races
      const dateRange = await db
        .select({
          earliest: min(raceResults.raceDate),
          latest: max(raceResults.raceDate),
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id));

      // Get a sample of races
      const sampleRaces = await db
        .select({
          id: raceResults.id,
          subsessionId: raceResults.subsessionId,
          seriesName: raceResults.seriesName,
          trackName: raceResults.trackName,
          sessionType: raceResults.sessionType,
          raceDate: raceResults.raceDate,
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .limit(5)
        .orderBy(raceResults.raceDate);

      // Check for any database errors or constraints
      const uniqueSubsessions = await db
        .select({ 
          subsessionId: raceResults.subsessionId,
          count: count(raceResults.id)
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(raceResults.subsessionId)
        .having(gt(count(raceResults.id), 1))
        .limit(5);

      return NextResponse.json({
        success: true,
        userId: user.id,
        customerId: profile.cust_id,
        database: {
          totalRaces: totalCount[0]?.count || 0,
          dateRange: {
            earliest: dateRange[0]?.earliest,
            latest: dateRange[0]?.latest,
          },
          sampleRaces,
          duplicateSubsessions: uniqueSubsessions,
        },
      });

    } catch (error) {
      console.error('Database check error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}