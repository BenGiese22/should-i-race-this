import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduleEntries } from '@/lib/db/schema';
import { calculateNextRaceTime, type RaceTimeDescriptor } from '@/lib/iracing/race-time-calculator';
import { and, sql } from 'drizzle-orm';

/**
 * Debug endpoint to show next race times for all current series
 * Helps verify that race time filtering is working correctly
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'America/Denver'; // Default to MST
    
    // Get current time
    const currentTime = new Date();
    
    // Get current week's schedule entries
    const scheduleResults = await db
      .select()
      .from(scheduleEntries)
      .where(
        and(
          sql`${scheduleEntries.weekStart} <= ${currentTime}`,
          sql`${scheduleEntries.weekEnd} >= ${currentTime}`
        )
      )
      .limit(50); // Limit for debugging

    // Calculate next race time for each series
    const raceTimesInfo = scheduleResults.map(entry => {
      const nextRace = entry.raceTimeDescriptors
        ? calculateNextRaceTime(
            entry.raceTimeDescriptors as RaceTimeDescriptor[],
            currentTime
          )
        : null;

      return {
        seriesId: entry.seriesId,
        seriesName: entry.seriesName,
        trackName: entry.trackName,
        weekStart: entry.weekStart,
        weekEnd: entry.weekEnd,
        hasRaceTimeDescriptors: !!entry.raceTimeDescriptors,
        nextRaceTime: nextRace?.nextRaceTime?.toISOString() || null,
        nextRaceTimeLocal: nextRace?.nextRaceTime
          ? nextRace.nextRaceTime.toLocaleString('en-US', { timeZone: timezone })
          : null,
        isRepeating: nextRace?.isRepeating || false,
        repeatMinutes: nextRace?.repeatMinutes || null,
        isPastRace: !nextRace,
        raceTimeDescriptors: entry.raceTimeDescriptors
      };
    });

    // Separate into upcoming and past races
    const upcomingRaces = raceTimesInfo.filter(r => !r.isPastRace);
    const pastRaces = raceTimesInfo.filter(r => r.isPastRace);

    // Sort upcoming races by next race time
    upcomingRaces.sort((a, b) => {
      if (!a.nextRaceTime) return 1;
      if (!b.nextRaceTime) return -1;
      return new Date(a.nextRaceTime).getTime() - new Date(b.nextRaceTime).getTime();
    });

    return NextResponse.json({
      success: true,
      currentTime: currentTime.toISOString(),
      currentTimeLocal: currentTime.toLocaleString('en-US', { timeZone: timezone }),
      timezone,
      summary: {
        totalSeries: scheduleResults.length,
        upcomingRaces: upcomingRaces.length,
        pastRaces: pastRaces.length,
        seriesWithoutTimeDescriptors: raceTimesInfo.filter(r => !r.hasRaceTimeDescriptors).length
      },
      upcomingRaces: upcomingRaces.slice(0, 20), // Show top 20
      pastRaces: pastRaces.slice(0, 10), // Show first 10 past races
      note: 'This endpoint helps debug race time filtering. Past races should not appear in recommendations.'
    });
  } catch (error) {
    console.error('Error in next-race-times debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
