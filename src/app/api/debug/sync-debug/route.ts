import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { fetchMemberRecentRaces, getCurrentSeason } from '@/lib/iracing/client';
import { db, raceResults } from '@/lib/db';
import { eq, max } from 'drizzle-orm';

/**
 * Debug endpoint to test sync process step by step
 */
export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      const debugInfo: any = {
        userId: user.id,
        customerId: profile.cust_id,
        steps: [],
      };

      // Step 1: Check current season
      const currentSeason = getCurrentSeason();
      debugInfo.steps.push({
        step: 1,
        description: 'Get current season',
        result: currentSeason,
      });

      // Step 2: Get last race date from database
      const lastRaceResult = await db
        .select({ raceDate: max(raceResults.raceDate) })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .limit(1);

      const lastSyncDate = lastRaceResult[0]?.raceDate || new Date('2020-01-01');
      debugInfo.steps.push({
        step: 2,
        description: 'Get last sync date from database',
        result: {
          lastRaceDate: lastRaceResult[0]?.raceDate,
          lastSyncDate: lastSyncDate,
        },
      });

      // Step 3: Define seasons to sync
      const seasonsToSync = [
        currentSeason,
        // Previous seasons (go back further to ensure we get data)
        currentSeason.quarter === 1 
          ? { year: currentSeason.year - 1, quarter: 4 }
          : { year: currentSeason.year, quarter: currentSeason.quarter - 1 },
        currentSeason.quarter <= 2
          ? { year: currentSeason.year - 1, quarter: currentSeason.quarter + 2 }
          : { year: currentSeason.year, quarter: currentSeason.quarter - 2 },
      ];
      debugInfo.steps.push({
        step: 3,
        description: 'Seasons to sync',
        result: seasonsToSync,
      });

      // Step 4: Fetch races from iRacing API
      const allRaces: any[] = [];
      const apiErrors: string[] = [];
      
      for (const season of seasonsToSync) {
        try {
          const seasonLabel = `${season.year}Q${season.quarter}`;
          debugInfo.steps.push({
            step: `4.${seasonLabel}`,
            description: `Fetching races for season ${seasonLabel}`,
            status: 'attempting',
          });

          const response = await fetchMemberRecentRaces(
            user.id,
            profile.cust_id,
            season.year,
            season.quarter
          );
          
          debugInfo.steps.push({
            step: `4.${seasonLabel}`,
            description: `Fetched races for season ${seasonLabel}`,
            status: 'success',
            result: {
              racesFound: response.results?.length || 0,
              hasRacesArray: !!response.results,
              responseKeys: Object.keys(response),
              hasChunkInfo: !!(response.data?.chunk_info),
              chunkFiles: response.data?.chunk_info?.chunk_file_names?.length || 0,
              sampleRace: response.results?.[0] || null,
              // Add more debugging info
              responseStructure: {
                hasData: !!response.data,
                hasLink: !!response.link,
                dataKeys: response.data ? Object.keys(response.data) : null,
                fullResponse: Object.keys(response).length < 10 ? response : 'Response too large to display',
              },
            },
          });
          
          if (response.results) {
            allRaces.push(...response.results);
          }
        } catch (error) {
          const seasonLabel = `${season.year}Q${season.quarter}`;
          const errorMsg = `Failed to fetch races for season ${seasonLabel}: ${error}`;
          apiErrors.push(errorMsg);
          debugInfo.steps.push({
            step: `4.${seasonLabel}`,
            description: `Error fetching races for season ${seasonLabel}`,
            status: 'error',
            error: errorMsg,
          });
        }
      }

      debugInfo.steps.push({
        step: 5,
        description: 'Total races fetched from API',
        result: {
          totalRaces: allRaces.length,
          apiErrors,
          sampleRace: allRaces[0] || null,
        },
      });

      // Step 6: Filter races by date
      const newRaces = allRaces.filter(race => {
        const startTime = race.start_time || race.session_start_time || race.event_start_time;
        if (!startTime) return false;
        
        const raceDate = new Date(startTime);
        return raceDate > lastSyncDate;
      });

      debugInfo.steps.push({
        step: 6,
        description: 'Filter races by date',
        result: {
          racesAfterDateFilter: newRaces.length,
          lastSyncDate: lastSyncDate,
          sampleFilteredRace: newRaces[0] || null,
        },
      });

      // Step 7: Show what would be processed (without actually inserting)
      if (newRaces.length > 0) {
        const sampleRace = newRaces[0];
        debugInfo.steps.push({
          step: 7,
          description: 'Sample race processing (dry run)',
          result: {
            originalRace: {
              subsession_id: sampleRace.subsession_id,
              series_name: sampleRace.series_name,
              track_name: sampleRace.track_name || sampleRace.track?.track_name,
              start_time: sampleRace.start_time || sampleRace.session_start_time || sampleRace.event_start_time,
              event_type: sampleRace.event_type,
              event_type_name: sampleRace.event_type_name,
              starting_position: sampleRace.starting_position || sampleRace.start_position,
              finish_position: sampleRace.finish_position || sampleRace.finish_pos,
              // Show all available fields for debugging
              availableFields: Object.keys(sampleRace),
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        debugInfo,
        summary: {
          totalRacesFetched: allRaces.length,
          racesAfterDateFilter: newRaces.length,
          apiErrors: apiErrors.length,
          wouldInsertToDatabase: newRaces.length,
        },
      });

    } catch (error) {
      console.error('Sync debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}