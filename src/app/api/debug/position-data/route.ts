import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Debug endpoint to analyze starting position data
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Get position data distribution
      const positionStats = await db
        .select({
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          seriesName: raceResults.seriesName,
          sessionType: raceResults.sessionType,
          count: sql<number>`count(*)`,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(
          raceResults.startingPosition,
          raceResults.finishingPosition,
          raceResults.seriesName,
          raceResults.sessionType
        )
        .orderBy(raceResults.startingPosition)
        .limit(50);

      // Get negative starting positions
      const negativeStarts = await db
        .select({
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          seriesName: raceResults.seriesName,
          sessionType: raceResults.sessionType,
          subsessionId: raceResults.subsessionId,
        })
        .from(raceResults)
        .where(
          eq(raceResults.userId, user.id)
        )
        .having(sql`${raceResults.startingPosition} < 1`)
        .limit(20);

      // Get current analytics with bad data
      const currentAnalytics = await db
        .select({
          seriesName: raceResults.seriesName,
          avgStartingPosition: sql<number>`AVG(${raceResults.startingPosition})`,
          avgFinishingPosition: sql<number>`AVG(${raceResults.finishingPosition})`,
          raceCount: sql<number>`COUNT(*)`,
          minStartingPosition: sql<number>`MIN(${raceResults.startingPosition})`,
          maxStartingPosition: sql<number>`MAX(${raceResults.startingPosition})`,
        })
        .from(raceResults)
        .where(
          eq(raceResults.userId, user.id)
        )
        .groupBy(raceResults.seriesName)
        .orderBy(sql`AVG(${raceResults.startingPosition})`)
        .limit(10);

      return NextResponse.json({
        success: true,
        userId: user.id,
        analysis: {
          positionStats,
          negativeStarts,
          currentAnalytics,
          summary: {
            totalRecords: positionStats.reduce((sum, item) => sum + item.count, 0),
            negativeStartCount: negativeStarts.length,
          }
        },
      });

    } catch (error) {
      console.error('Position data debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}