import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { db, raceResults } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { normalizeSessionType } from '@/lib/iracing/session-types';

/**
 * Fix session types in existing database records
 */
export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Get all records that need fixing
      const recordsToFix = await db
        .select({
          id: raceResults.id,
          eventType: sql<number>`(raw_data->>'event_type')::int`,
          eventTypeName: sql<string>`raw_data->>'event_type_name'`,
          currentSessionType: raceResults.sessionType,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id));

      let updatedCount = 0;
      let errors: string[] = [];

      // Process each record
      for (const record of recordsToFix) {
        try {
          // Calculate the correct session type
          const correctSessionType = normalizeSessionType(
            record.eventType,
            undefined, // no session name
            record.eventTypeName
          );

          // Only update if it's different
          if (correctSessionType !== record.currentSessionType) {
            await db
              .update(raceResults)
              .set({ sessionType: correctSessionType })
              .where(eq(raceResults.id, record.id));
            
            updatedCount++;
          }
        } catch (error) {
          errors.push(`Failed to update record ${record.id}: ${error}`);
        }
      }

      // Get updated distribution
      const updatedDistribution = await db
        .select({
          sessionType: raceResults.sessionType,
          count: sql<number>`count(*)`,
        })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .groupBy(raceResults.sessionType);

      return NextResponse.json({
        success: true,
        userId: user.id,
        results: {
          totalRecords: recordsToFix.length,
          updatedRecords: updatedCount,
          errors: errors.length,
          errorMessages: errors.slice(0, 5), // First 5 errors
          updatedDistribution,
        },
      });

    } catch (error) {
      console.error('Fix session types error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}