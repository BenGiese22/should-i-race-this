import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Debug endpoint to check why analytics isn't returning data
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Check total races in database
      const totalRaces = await db
        .select({ count: sql<number>`count(*)` })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id));

      // Check races with valid positions
      const validPositionRaces = await db
        .select({ count: sql<number>`count(*)` })
        .from(raceResults)
        .where(
          and(
            eq(raceResults.userId, user.id),
            sql`${raceResults.startingPosition} IS NOT NULL AND ${raceResults.finishingPosition} IS NOT NULL`
          )
        );

      // Check races with non-negative positions
      const nonNegativePositionRaces = await db
        .select({ count: sql<number>`count(*)` })
        .from(raceResults)
        .where(
          and(
            eq(raceResults.userId, user.id),
            sql`${raceResults.startingPosition} >= 0 AND ${raceResults.finishingPosition} >= 0`
          )
        );

      // Get sample races to see the data
      const sampleRaces = await db
        .select({
          id: raceResults.id,
          subsessionId: raceResults.subsessionId,
          seriesName: raceResults.seriesName,
          trackName: raceResults.trackName,
          sessionType: raceResults.sessionType,
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          incidents: raceResults.incidents,
          raceDate: raceResults.raceDate,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .limit(10);

      // Check session type distribution
      const sessionTypeDistribution = await db
        .select({
          sessionType: raceResults.sessionType,
          count: sql<number>`count(*)`,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(raceResults.sessionType);

      // Check races filtered by sessionType = 'race'
      const raceSessionsOnly = await db
        .select({ count: sql<number>`count(*)` })
        .from(raceResults)
        .where(
          and(
            eq(raceResults.userId, user.id),
            eq(raceResults.sessionType, 'race')
          )
        );

      // Try the actual analytics query to see what happens
      let analyticsResult = null;
      try {
        analyticsResult = await db
          .select({
            seriesId: raceResults.seriesId,
            seriesName: raceResults.seriesName,
            avgStartingPosition: sql<number>`avg(${raceResults.startingPosition})`,
            avgFinishingPosition: sql<number>`avg(${raceResults.finishingPosition})`,
            raceCount: sql<number>`count(*)`,
          })
          .from(raceResults)
          .where(
            and(
              eq(raceResults.userId, user.id),
              eq(raceResults.sessionType, 'race'),
              sql`${raceResults.startingPosition} IS NOT NULL AND ${raceResults.finishingPosition} IS NOT NULL`
            )
          )
          .groupBy(raceResults.seriesId, raceResults.seriesName)
          .limit(5);
      } catch (error) {
        analyticsResult = { error: String(error) };
      }

      return NextResponse.json({
        success: true,
        userId: user.id,
        debug: {
          totalRaces: totalRaces[0]?.count || 0,
          validPositionRaces: validPositionRaces[0]?.count || 0,
          nonNegativePositionRaces: nonNegativePositionRaces[0]?.count || 0,
          raceSessionsOnly: raceSessionsOnly[0]?.count || 0,
          sessionTypeDistribution,
          sampleRaces,
          analyticsQueryResult: analyticsResult,
        },
      });

    } catch (error) {
      console.error('Analytics debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}