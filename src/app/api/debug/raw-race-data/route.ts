import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { raceResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Debug endpoint to examine raw race data from iRacing API
 * GET /api/debug/raw-race-data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get a few races with their raw data - specifically look for "unofficial" ones
    const races = await db
      .select({
        id: raceResults.id,
        subsessionId: raceResults.subsessionId,
        seriesName: raceResults.seriesName,
        trackName: raceResults.trackName,
        sessionType: raceResults.sessionType,
        raceDate: raceResults.raceDate,
        startingPosition: raceResults.startingPosition,
        finishingPosition: raceResults.finishingPosition,
        strengthOfField: raceResults.strengthOfField,
        rawData: raceResults.rawData,
      })
      .from(raceResults)
      .where(eq(raceResults.userId, session.userId))
      .orderBy(desc(raceResults.raceDate))
      .limit(10);

    // Analyze the raw data to see what fields are present
    const analysis = races.map(race => {
      const raw = race.rawData as Record<string, unknown> | null;
      return {
        subsessionId: race.subsessionId,
        seriesName: race.seriesName,
        trackName: race.trackName,
        raceDate: race.raceDate,
        stored: {
          sessionType: race.sessionType,
          startingPosition: race.startingPosition,
          finishingPosition: race.finishingPosition,
          strengthOfField: race.strengthOfField,
        },
        rawFields: raw ? {
          // Session type fields - THIS IS KEY
          event_type: raw.event_type,
          event_type_name: raw.event_type_name,
          official_session: raw.official_session,
          // Session start time
          session_start_time: raw.session_start_time,
          start_time: raw.start_time,
          // Position fields
          starting_position: raw.starting_position,
          start_position: raw.start_position,
          finish_position: raw.finish_position,
          // SOF fields
          event_strength_of_field: raw.event_strength_of_field,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      raceCount: races.length,
      analysis,
    });
  } catch (error) {
    console.error('Debug raw data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raw data', details: String(error) },
      { status: 500 }
    );
  }
}
