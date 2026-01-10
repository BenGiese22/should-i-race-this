import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Debug endpoint to analyze session types and event types in the data
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Get event type distribution from raw data
      const eventTypeDistribution = await db
        .select({
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          sessionType: raceResults.sessionType,
          count: sql<number>`count(*)`,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(
          sql`raw_data->>'event_type'`,
          sql`raw_data->>'event_type_name'`,
          raceResults.sessionType
        )
        .orderBy(sql`count(*) DESC`);

      // Get sample races with their raw event data
      const sampleRaces = await db
        .select({
          subsessionId: raceResults.subsessionId,
          seriesName: raceResults.seriesName,
          sessionType: raceResults.sessionType,
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          officialSession: sql<boolean>`(raw_data->>'official_session')::boolean`,
          strengthOfField: raceResults.strengthOfField,
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          incidents: raceResults.incidents,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .limit(20);

      // Look for patterns that might indicate actual races
      const potentialRaces = await db
        .select({
          subsessionId: raceResults.subsessionId,
          seriesName: raceResults.seriesName,
          sessionType: raceResults.sessionType,
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          officialSession: sql<boolean>`(raw_data->>'official_session')::boolean`,
          strengthOfField: raceResults.strengthOfField,
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          champPoints: sql<number>`(raw_data->>'champ_points')::int`,
          dropRace: sql<boolean>`(raw_data->>'drop_race')::boolean`,
        })
        .from(raceResults)
        .where(
          eq(raceResults.userId, user.id)
        )
        .limit(10);

      return NextResponse.json({
        success: true,
        userId: user.id,
        analysis: {
          eventTypeDistribution,
          sampleRaces,
          potentialRaces,
          summary: {
            totalSessions: eventTypeDistribution.reduce((sum, item) => sum + item.count, 0),
            uniqueEventTypes: [...new Set(eventTypeDistribution.map(item => item.eventType))],
            uniqueEventTypeNames: [...new Set(eventTypeDistribution.map(item => item.eventTypeName))],
          }
        },
      });

    } catch (error) {
      console.error('Session types debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}