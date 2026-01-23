import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { raceResults } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/data/analytics/races
 *
 * Fetch individual race results for a specific series and/or track combination.
 * Used for expanding aggregated rows in the analytics dashboard.
 *
 * Query Parameters:
 * - seriesId: Filter by series ID (optional)
 * - trackId: Filter by track ID (optional)
 * - limit: Max results to return (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    const trackId = searchParams.get('trackId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

    // Must have at least one filter
    if (!seriesId && !trackId) {
      return NextResponse.json(
        { error: 'Must provide seriesId and/or trackId' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [
      eq(raceResults.userId, session.userId),
      // Only include actual race sessions, not practice/qualifying
      eq(raceResults.sessionType, 'race'),
    ];

    if (seriesId) {
      conditions.push(eq(raceResults.seriesId, parseInt(seriesId)));
    }

    if (trackId) {
      conditions.push(eq(raceResults.trackId, parseInt(trackId)));
    }

    // Fetch individual race results (only race sessions, not practice/qualifying)
    const races = await db
      .select({
        id: raceResults.id,
        subsessionId: raceResults.subsessionId,
        seriesId: raceResults.seriesId,
        seriesName: raceResults.seriesName,
        trackId: raceResults.trackId,
        trackName: raceResults.trackName,
        raceDate: raceResults.raceDate,
        startingPosition: raceResults.startingPosition,
        finishingPosition: raceResults.finishingPosition,
        positionDelta: raceResults.positionDelta,
        incidents: raceResults.incidents,
        strengthOfField: raceResults.strengthOfField,
      })
      .from(raceResults)
      .where(and(...conditions))
      .orderBy(desc(raceResults.raceDate))
      .limit(limit);

    // Note: For official vs unofficial race distinction, use:
    // - SOF > 0 = official race (affects iRating)
    // - SOF = -1 = unofficial race (does not affect iRating)
    // - The authoritative source is `official_session` in rawData JSON

    return NextResponse.json({
      races,
      count: races.length,
      success: true,
    });

  } catch (error) {
    console.error('Races API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
