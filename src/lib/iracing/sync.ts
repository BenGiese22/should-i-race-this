/**
 * Race Data Synchronization
 * 
 * Handles fetching and storing user race history from iRacing API
 * with incremental sync to avoid duplicates and progress tracking
 */

import { db, raceResults, users } from '../db';
import { eq, max, count } from 'drizzle-orm';
import { fetchMemberRecentRaces, getCurrentSeason } from './client';
import { normalizeSessionType } from './session-types';

export interface SyncProgress {
  totalRaces: number;
  processedRaces: number;
  newRaces: number;
  errors: string[];
  isComplete: boolean;
}

export interface SyncResult {
  success: boolean;
  progress: SyncProgress;
  error?: string;
}

/**
 * Sync user's race data from iRacing API
 */
export async function syncUserRaceData(
  userId: string,
  customerId: number,
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  const progress: SyncProgress = {
    totalRaces: 0,
    processedRaces: 0,
    newRaces: 0,
    errors: [],
    isComplete: false,
  };

  try {
    // Get the user's last sync timestamp to determine where to start
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the most recent race date we have for this user
    const lastRaceResult = await db
      .select({ raceDate: max(raceResults.raceDate) })
      .from(raceResults)
      .where(eq(raceResults.userId, userId))
      .limit(1);

    const lastSyncDate = lastRaceResult[0]?.raceDate || new Date('2020-01-01');
    
    // Get current season info
    const currentSeason = getCurrentSeason();
    
    // Fetch race data for multiple recent seasons to ensure we get data
    // Try current season and the last 3 seasons
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

    const allRaces: any[] = [];
    
    // Fetch races from each season
    for (const season of seasonsToSync) {
      try {
        const response = await fetchMemberRecentRaces(
          userId,
          customerId,
          season.year,
          season.quarter
        );
        
        if (response.results) {
          allRaces.push(...response.results);
        }
      } catch (error) {
        const errorMsg = `Failed to fetch races for season ${season.year || 'all'}Q${season.quarter || 'all'}: ${error}`;
        progress.errors.push(errorMsg);
        
        // Don't fail completely if one season fails - continue with others
        console.warn(errorMsg);
      }
    }

    // Filter out races we already have and races older than last sync
    // Handle different possible field names for start time
    const newRaces = allRaces.filter(race => {
      const startTime = race.start_time || race.session_start_time || race.event_start_time;
      if (!startTime) return false;
      
      const raceDate = new Date(startTime);
      return raceDate > lastSyncDate;
    });

    progress.totalRaces = newRaces.length;
    onProgress?.(progress);

    // Process races in batches to avoid overwhelming the database
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < newRaces.length; i += batchSize) {
      batches.push(newRaces.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const raceRecords = batch.map(race => {
        try {
          // Normalize session type
          const sessionType = normalizeSessionType(
            race.event_type,
            race.event_type_name
          );

          // Handle different possible field names based on the reference implementation
          const startTime = race.start_time || race.session_start_time || race.event_start_time;
          const finishPosition = race.finish_position || race.finish_pos || race.finishPos;
          const startingPosition = race.starting_position || race.start_position || race.start_pos;
          const trackId = race.track_id || race.track?.track_id;
          const trackName = race.track_name || race.track?.track_name;

          return {
            userId,
            subsessionId: race.subsession_id,
            seriesId: race.series_id,
            seriesName: race.series_name,
            trackId: trackId,
            trackName: trackName,
            sessionType,
            startingPosition: startingPosition,
            finishingPosition: finishPosition,
            incidents: race.incidents,
            strengthOfField: race.event_strength_of_field || race.strength_of_field,
            raceDate: new Date(startTime),
            seasonYear: race.season_year,
            seasonQuarter: race.season_quarter,
            raceWeekNum: race.race_week_num,
            raceLength: calculateRaceLength(race),
            rawData: race,
          };
        } catch (error) {
          progress.errors.push(`Failed to process race ${race.subsession_id}: ${error}`);
          return null;
        }
      }).filter((record): record is NonNullable<typeof record> => record !== null);

      // Insert batch into database
      if (raceRecords.length > 0) {
        try {
          await db.insert(raceResults)
            .values(raceRecords)
            .onConflictDoNothing(); // Ignore duplicates based on unique constraint
          
          progress.newRaces += raceRecords.length;
        } catch (error) {
          progress.errors.push(`Failed to insert batch: ${error}`);
        }
      }

      progress.processedRaces += batch.length;
      onProgress?.(progress);
    }

    // Update user's last sync timestamp
    await db.update(users)
      .set({ lastSyncAt: new Date() })
      .where(eq(users.id, userId));

    progress.isComplete = true;
    onProgress?.(progress);

    return {
      success: true,
      progress,
    };

  } catch (error) {
    progress.errors.push(`Sync failed: ${error}`);
    return {
      success: false,
      progress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate race length from race data
 */
function calculateRaceLength(race: any): number | null {
  // Try to extract race length from various fields
  if (race.race_time_limit && race.race_time_limit > 0) {
    return race.race_time_limit;
  }
  
  if (race.event_laps_complete && race.event_average_lap) {
    // Estimate based on laps and average lap time
    return Math.round((race.event_laps_complete * race.event_average_lap) / 60000); // Convert to minutes
  }
  
  // Default estimates based on session type
  const sessionType = normalizeSessionType(race.event_type, race.event_type_name);
  switch (sessionType) {
    case 'practice':
      return 30; // 30 minutes typical practice
    case 'qualifying':
      return 15; // 15 minutes typical qualifying
    case 'time_trial':
      return 10; // 10 minutes typical time trial
    case 'race':
      return 60; // 60 minutes typical race
    default:
      return null;
  }
}

/**
 * Get sync status for a user
 */
export async function getUserSyncStatus(userId: string): Promise<{
  lastSyncAt: Date | null;
  totalRaces: number;
  latestRaceDate: Date | null;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const raceStats = await db
    .select({
      count: count(raceResults.id),
      latestDate: max(raceResults.raceDate),
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId))
    .limit(1);

  const totalRaces = await db
    .select({ count: count(raceResults.id) })
    .from(raceResults)
    .where(eq(raceResults.userId, userId));

  return {
    lastSyncAt: user?.lastSyncAt || null,
    totalRaces: totalRaces[0]?.count || 0,
    latestRaceDate: raceStats[0]?.latestDate || null,
  };
}

/**
 * Check if user needs sync (hasn't synced in last 24 hours)
 */
export function needsSync(lastSyncAt: Date | null): boolean {
  if (!lastSyncAt) return true;
  
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSyncAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceSync >= 24;
}