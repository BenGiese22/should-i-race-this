import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { prepareUserHistory } from '@/lib/recommendations/data-preparation';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user history data
    const userHistory = await prepareUserHistory(session.userId);

    return NextResponse.json({
      success: true,
      userHistory: {
        userId: userHistory.userId,
        licenseClasses: userHistory.licenseClasses,
        overallStats: userHistory.overallStats,
        seriesTrackHistory: userHistory.seriesTrackHistory,
        seriesTrackCount: userHistory.seriesTrackHistory.length,
        totalRacesInHistory: userHistory.seriesTrackHistory.reduce((sum, h) => sum + h.raceCount, 0)
      }
    });
  } catch (error) {
    console.error('User race history debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}