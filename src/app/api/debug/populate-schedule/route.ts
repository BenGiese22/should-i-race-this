import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { scheduleEntries } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date for this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)

    // Convert dates to strings for database
    const weekStartStr = startOfWeek.toISOString().split('T')[0];
    const weekEndStr = endOfWeek.toISOString().split('T')[0];

    // Sample schedule entries for the current week
    const sampleSchedule = [
      {
        seriesId: 1,
        seriesName: 'Skip Barber Formula 2000',
        trackId: 101,
        trackName: 'Road Atlanta',
        licenseRequired: 'D',
        category: 'formula_car', // Formula series -> formula_car
        raceLength: 45,
        hasOpenSetup: false,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      },
      {
        seriesId: 2,
        seriesName: 'Global Mazda MX-5 Cup',
        trackId: 102,
        trackName: 'Laguna Seca',
        licenseRequired: 'D',
        category: 'sports_car', // Sports car series -> sports_car
        raceLength: 30,
        hasOpenSetup: false,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      },
      {
        seriesId: 3,
        seriesName: 'GT4 Challenge by Falken Tyre',
        trackId: 103,
        trackName: 'Nürburgring Grand-Prix-Strecke',
        licenseRequired: 'C',
        category: 'sports_car', // GT series -> sports_car
        raceLength: 60,
        hasOpenSetup: true,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      },
      {
        seriesId: 4,
        seriesName: 'Sports Car Challenge by Falken Tyre',
        trackId: 103,
        trackName: 'Nürburgring Grand-Prix-Strecke',
        licenseRequired: 'B',
        category: 'sports_car', // Sports car series -> sports_car
        raceLength: 90,
        hasOpenSetup: true,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      },
      {
        seriesId: 5,
        seriesName: 'Street Stock',
        trackId: 201,
        trackName: 'Charlotte Motor Speedway',
        licenseRequired: 'rookie',
        category: 'oval',
        raceLength: 25,
        hasOpenSetup: false,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      },
      {
        seriesId: 6,
        seriesName: 'ARCA Menards Series',
        trackId: 202,
        trackName: 'Daytona International Speedway',
        licenseRequired: 'D',
        category: 'oval',
        raceLength: 40,
        hasOpenSetup: false,
        seasonYear: 2024,
        seasonQuarter: 1,
        raceWeekNum: 5,
        weekStart: startOfWeek,
        weekEnd: endOfWeek
      }
    ];

    // Clear existing schedule entries for this week
    await db.delete(scheduleEntries);

    // Insert sample schedule entries
    await db.insert(scheduleEntries).values(sampleSchedule);

    return NextResponse.json({
      message: 'Sample schedule populated successfully',
      entriesAdded: sampleSchedule.length,
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      entries: sampleSchedule.map(entry => ({
        seriesName: entry.seriesName,
        trackName: entry.trackName,
        licenseRequired: entry.licenseRequired,
        category: entry.category
      }))
    });
  } catch (error) {
    console.error('Error populating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to populate schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}