import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Debug endpoint to get comprehensive event type mapping from actual data
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Get all unique combinations of event_type and event_type_name from raw data
      const eventTypeMappings = await db
        .select({
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          currentSessionType: raceResults.sessionType,
          count: sql<number>`count(*)`,
          sampleSubsessionIds: sql<number[]>`array_agg(${raceResults.subsessionId})`,
          sampleSeriesNames: sql<string[]>`array_agg(DISTINCT ${raceResults.seriesName})`,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(
          sql`raw_data->>'event_type'`,
          sql`raw_data->>'event_type_name'`,
          raceResults.sessionType
        )
        .orderBy(
          sql`(raw_data->>'event_type')::int`,
          sql`raw_data->>'event_type_name'`
        );

      // Group by event type for easier analysis
      const groupedByEventType: Record<number, Array<{
        eventTypeName: string;
        currentSessionType: string;
        count: number;
        sampleSubsessionIds: number[];
        sampleSeriesNames: string[];
      }>> = {};

      eventTypeMappings.forEach(mapping => {
        if (!groupedByEventType[mapping.eventType]) {
          groupedByEventType[mapping.eventType] = [];
        }
        groupedByEventType[mapping.eventType].push({
          eventTypeName: mapping.eventTypeName,
          currentSessionType: mapping.currentSessionType,
          count: mapping.count,
          sampleSubsessionIds: mapping.sampleSubsessionIds.slice(0, 3), // Limit to 3 samples
          sampleSeriesNames: mapping.sampleSeriesNames.slice(0, 3), // Limit to 3 samples
        });
      });

      // Get some sample raw data for manual inspection
      const sampleRawData = await db
        .select({
          subsessionId: raceResults.subsessionId,
          seriesName: raceResults.seriesName,
          sessionType: raceResults.sessionType,
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          officialSession: sql<boolean>`(raw_data->>'official_session')::boolean`,
          startingPosition: raceResults.startingPosition,
          finishingPosition: raceResults.finishingPosition,
          champPoints: sql<number>`(raw_data->>'champ_points')::int`,
          dropRace: sql<boolean>`(raw_data->>'drop_race')::boolean`,
          raceDate: raceResults.raceDate,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .orderBy(sql`(raw_data->>'event_type')::int`, raceResults.raceDate)
        .limit(50);

      // Summary statistics
      const summary = {
        totalRecords: eventTypeMappings.reduce((sum, item) => sum + item.count, 0),
        uniqueEventTypes: Object.keys(groupedByEventType).map(Number).sort((a, b) => a - b),
        uniqueEventTypeNames: [...new Set(eventTypeMappings.map(item => item.eventTypeName))].sort(),
        currentSessionTypeDistribution: eventTypeMappings.reduce((acc, item) => {
          acc[item.currentSessionType] = (acc[item.currentSessionType] || 0) + item.count;
          return acc;
        }, {} as Record<string, number>),
      };

      return NextResponse.json({
        success: true,
        userId: user.id,
        analysis: {
          eventTypeMappings: groupedByEventType,
          rawMappings: eventTypeMappings,
          sampleRawData,
          summary,
        },
      });

    } catch (error) {
      console.error('Event type mapping debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}