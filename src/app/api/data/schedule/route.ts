/**
 * Schedule Data API Endpoint
 * 
 * GET /api/data/schedule - Get current race schedule with caching
 * POST /api/data/schedule - Sync schedule data from iRacing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAuthAndProfile } from '@/lib/auth/server';
import {
  getCurrentSchedule,
  getScheduleCacheStatus,
  syncScheduleData,
  getSeriesSchedule,
  getTrackSchedule,
} from '@/lib/iracing/schedule';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_request, _session) => {
    try {
      const url = new URL(request.url);
      const seasonYear = url.searchParams.get('season_year');
      const seasonQuarter = url.searchParams.get('season_quarter');
      const raceWeekNum = url.searchParams.get('race_week_num');
      const seriesId = url.searchParams.get('series_id');
      const trackId = url.searchParams.get('track_id');

      const parsedSeasonYear = seasonYear ? parseInt(seasonYear) : undefined;
      const parsedSeasonQuarter = seasonQuarter ? parseInt(seasonQuarter) : undefined;
      const parsedRaceWeekNum = raceWeekNum ? parseInt(raceWeekNum) : undefined;
      const parsedSeriesId = seriesId ? parseInt(seriesId) : undefined;
      const parsedTrackId = trackId ? parseInt(trackId) : undefined;

      // Get cache status
      const cacheStatus = await getScheduleCacheStatus(parsedSeasonYear, parsedSeasonQuarter);

      let schedule;
      if (parsedSeriesId) {
        // Get schedule for specific series
        schedule = await getSeriesSchedule(parsedSeriesId, parsedSeasonYear, parsedSeasonQuarter);
      } else if (parsedTrackId) {
        // Get schedule for specific track
        schedule = await getTrackSchedule(parsedTrackId, parsedSeasonYear, parsedSeasonQuarter);
      } else {
        // Get current schedule
        schedule = await getCurrentSchedule(parsedSeasonYear, parsedSeasonQuarter, parsedRaceWeekNum);
      }

      return NextResponse.json({
        success: true,
        schedule,
        cacheStatus,
      });

    } catch (error) {
      console.error('Schedule API error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to get schedule',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, _profile) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { season_year, season_quarter, force } = body;

      // Check if sync is needed
      const cacheStatus = await getScheduleCacheStatus(season_year, season_quarter);
      
      if (!force && !cacheStatus.needsUpdate) {
        return NextResponse.json({
          success: true,
          message: 'Schedule is up to date',
          cacheStatus,
        });
      }

      // Sync schedule data
      const result = await syncScheduleData(user.id, season_year, season_quarter);

      if (result.success) {
        const updatedCacheStatus = await getScheduleCacheStatus(season_year, season_quarter);
        
        return NextResponse.json({
          success: true,
          message: `Schedule sync completed. Added ${result.entriesAdded} entries.`,
          entriesAdded: result.entriesAdded,
          cacheStatus: updatedCacheStatus,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.error || 'Schedule sync failed',
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Schedule sync API error:', error);
      return NextResponse.json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}