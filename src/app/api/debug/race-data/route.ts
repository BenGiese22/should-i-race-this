import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

/**
 * Debug endpoint to check race data in database
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get total count of race results for this user
    const totalCount = await db
      .select({ count: count() })
      .from(raceResults)
      .where(eq(raceResults.userId, session.userId));

    // Get a sample of race results
    const sampleResults = await db
      .select()
      .from(raceResults)
      .where(eq(raceResults.userId, session.userId))
      .limit(5);

    // Get unique session types
    const sessionTypes = await db
      .selectDistinct({ sessionType: raceResults.sessionType })
      .from(raceResults)
      .where(eq(raceResults.userId, session.userId));

    // Get unique series
    const series = await db
      .selectDistinct({ 
        seriesId: raceResults.seriesId,
        seriesName: raceResults.seriesName 
      })
      .from(raceResults)
      .where(eq(raceResults.userId, session.userId))
      .limit(10);

    return NextResponse.json({
      userId: session.userId,
      totalRaceResults: totalCount[0]?.count || 0,
      sessionTypes: sessionTypes.map(s => s.sessionType),
      sampleSeries: series,
      sampleResults: sampleResults.map(result => ({
        id: result.id,
        seriesName: result.seriesName,
        trackName: result.trackName,
        sessionType: result.sessionType,
        startingPosition: result.startingPosition,
        finishingPosition: result.finishingPosition,
        positionDelta: result.positionDelta,
        raceDate: result.raceDate,
      })),
      success: true,
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}