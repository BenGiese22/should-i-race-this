import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { fetchMemberRecentRaces, getCurrentSeason } from '@/lib/iracing/client';
import { db, raceResults } from '@/lib/db';
import { eq, max } from 'drizzle-orm';
import { normalizeSessionType } from '@/lib/iracing/session-types';

/**
 * Detailed debug endpoint that actually tries to process and insert data
 * to see exactly where the sync is failing
 */
export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      const debugInfo: any = {
        userId: user.id,
        customerId: profile.cust_id,
        steps: [],
        errors: [],
      };

      // Step 1: Get last race date from database
      const lastRaceResult = await db
        .select({ raceDate: max(raceResults.raceDate) })
        .from(raceResults)
        .where(eq(raceResults.userId, user.id))
        .limit(1);

      const lastSyncDate = lastRaceResult[0]?.raceDate || new Date('2020-01-01');
      debugInfo.steps.push({
        step: 1,
        description: 'Get last sync date',
        result: { lastSyncDate },
      });

      // Step 2: Fetch one season of data
      const currentSeason = getCurrentSeason();
      debugInfo.steps.push({
        step: 2,
        description: 'Current season',
        result: currentSeason,
      });

      let allRaces: any[] = [];
      try {
        const response = await fetchMemberRecentRaces(
          user.id,
          profile.cust_id,
          currentSeason.year,
          currentSeason.quarter
        );
        
        if (response.results) {
          allRaces = response.results;
        }
        
        debugInfo.steps.push({
          step: 3,
          description: 'Fetch races from API',
          result: {
            racesFound: allRaces.length,
            sampleRace: allRaces[0] || null,
          },
        });
      } catch (error) {
        debugInfo.errors.push(`API fetch failed: ${error}`);
        return NextResponse.json({ success: false, debugInfo });
      }

      // Step 4: Filter races by date
      const newRaces = allRaces.filter(race => {
        const startTime = race.start_time || race.session_start_time || race.event_start_time;
        if (!startTime) return false;
        
        const raceDate = new Date(startTime);
        return raceDate > lastSyncDate;
      });

      debugInfo.steps.push({
        step: 4,
        description: 'Filter races by date',
        result: {
          totalRaces: allRaces.length,
          newRaces: newRaces.length,
          sampleNewRace: newRaces[0] || null,
        },
      });

      if (newRaces.length === 0) {
        debugInfo.steps.push({
          step: 5,
          description: 'No new races to process',
          result: 'Complete - no new data',
        });
        return NextResponse.json({ success: true, debugInfo });
      }

      // Step 5: Process first race to see what happens
      const firstRace = newRaces[0];
      let processedRace: any = null;
      let processingError: string | null = null;

      try {
        // Normalize session type
        const sessionType = normalizeSessionType(
          firstRace.event_type,
          firstRace.event_type_name
        );

        // Handle different possible field names
        const startTime = firstRace.start_time || firstRace.session_start_time || firstRace.event_start_time;
        const finishPosition = firstRace.finish_position || firstRace.finish_pos || firstRace.finishPos;
        const startingPosition = firstRace.starting_position || firstRace.start_position || firstRace.start_pos;
        const trackId = firstRace.track_id || firstRace.track?.track_id;
        const trackName = firstRace.track_name || firstRace.track?.track_name;

        processedRace = {
          userId: user.id,
          subsessionId: firstRace.subsession_id,
          seriesId: firstRace.series_id,
          seriesName: firstRace.series_name,
          trackId: trackId,
          trackName: trackName,
          sessionType,
          startingPosition: startingPosition,
          finishingPosition: finishPosition,
          incidents: firstRace.incidents,
          strengthOfField: firstRace.event_strength_of_field || firstRace.strength_of_field,
          raceDate: new Date(startTime),
          seasonYear: firstRace.season_year,
          seasonQuarter: firstRace.season_quarter,
          raceWeekNum: firstRace.race_week_num,
          raceLength: 60, // Default
          rawData: firstRace,
        };

        debugInfo.steps.push({
          step: 5,
          description: 'Process first race',
          result: {
            originalRace: {
              subsession_id: firstRace.subsession_id,
              series_name: firstRace.series_name,
              track_name: trackName,
              event_type: firstRace.event_type,
              event_type_name: firstRace.event_type_name,
              availableFields: Object.keys(firstRace),
            },
            processedRace: {
              ...processedRace,
              rawData: '[hidden for brevity]',
            },
          },
        });

      } catch (error) {
        processingError = `Processing failed: ${error}`;
        debugInfo.errors.push(processingError);
      }

      // Step 6: Try to insert the processed race
      if (processedRace && !processingError) {
        try {
          const insertResult = await db.insert(raceResults)
            .values([processedRace])
            .returning({ id: raceResults.id });

          debugInfo.steps.push({
            step: 6,
            description: 'Insert test race',
            result: {
              success: true,
              insertedId: insertResult[0]?.id,
              message: 'Successfully inserted one race',
            },
          });

          // Clean up the test insert
          if (insertResult[0]?.id) {
            await db.delete(raceResults).where(eq(raceResults.id, insertResult[0].id));
            debugInfo.steps.push({
              step: 7,
              description: 'Clean up test insert',
              result: 'Test race removed',
            });
          }

        } catch (error) {
          const insertError = `Database insert failed: ${error}`;
          debugInfo.errors.push(insertError);
          debugInfo.steps.push({
            step: 6,
            description: 'Insert test race',
            result: {
              success: false,
              error: insertError,
              sqlError: error instanceof Error ? error.message : 'Unknown SQL error',
            },
          });
        }
      }

      return NextResponse.json({
        success: debugInfo.errors.length === 0,
        debugInfo,
        summary: {
          totalRacesFromAPI: allRaces.length,
          newRacesToProcess: newRaces.length,
          processingErrors: debugInfo.errors.length,
          canProcessRaces: !processingError,
          canInsertToDatabase: debugInfo.errors.length === 0,
        },
      });

    } catch (error) {
      console.error('Detailed sync debug error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}