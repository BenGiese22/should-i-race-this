import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { raceResults, licenseClasses, scheduleEntries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentSeason } from '@/lib/iracing/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.userId;

    // Get user's race results count
    const userRaces = await db.query.raceResults.findMany({
      where: eq(raceResults.userId, userId),
      limit: 5,
      orderBy: desc(raceResults.raceDate),
    });

    // Get user's licenses
    const licenses = await db.query.licenseClasses.findMany({
      where: eq(licenseClasses.userId, userId),
    });

    // Get current season info
    const currentSeason = getCurrentSeason();

    // Get current schedule entries
    const currentSchedule = await db.query.scheduleEntries.findMany({
      where: and(
        eq(scheduleEntries.seasonYear, currentSeason.year),
        eq(scheduleEntries.seasonQuarter, currentSeason.quarter)
      ),
      limit: 5,
      orderBy: scheduleEntries.seriesName,
    });

    // Get total schedule count
    const totalScheduleResult = await db
      .select({ count: scheduleEntries.id })
      .from(scheduleEntries);

    // Check if we can generate recommendations
    const hasRaceData = userRaces.length > 0;
    const hasLicenseData = licenses.length > 0;
    const hasScheduleData = currentSchedule.length > 0;
    const canGenerateRecommendations = hasRaceData && hasLicenseData && hasScheduleData;

    return NextResponse.json({
      userRaceCount: userRaces.length,
      userLicenses: licenses.map(license => ({
        category: license.category,
        level: license.level,
        irating: license.irating,
        safetyRating: license.safetyRating,
      })),
      currentScheduleCount: currentSchedule.length,
      totalScheduleCount: totalScheduleResult.length,
      sampleRaces: userRaces.map(race => ({
        seriesName: race.seriesName,
        trackName: race.trackName,
        sessionType: race.sessionType,
        raceDate: race.raceDate,
      })),
      sampleSchedule: currentSchedule.map(entry => ({
        seriesName: entry.seriesName,
        trackName: entry.trackName,
        weekStart: entry.weekStart,
        weekEnd: entry.weekEnd,
      })),
      recommendations: {
        canGenerateRecommendations,
        needsRaceData: !hasRaceData,
        needsLicenseData: !hasLicenseData,
        needsScheduleData: !hasScheduleData,
      },
      currentSeason,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}