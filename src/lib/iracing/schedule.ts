/**
 * Schedule Fetching and Caching
 * 
 * Handles fetching current iRacing race schedule with caching
 * and automatic updates when weekly changes occur
 */

import { db, scheduleEntries } from '../db';
import { eq, and, lte, desc } from 'drizzle-orm';
import { getCurrentSeason, makeAuthenticatedRequest } from './client';
import { LicenseHelper, LicenseLevel } from '../types/license';
import { Category, CategoryHelper } from '../types/category';

export interface ScheduleEntry {
  id: string;
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  licenseRequired: string;
  category: string;
  raceLength: number | null;
  hasOpenSetup: boolean;
  seasonYear: number;
  seasonQuarter: number;
  raceWeekNum: number;
  weekStart: Date;
  weekEnd: Date;
  createdAt: Date;
}

export interface ScheduleCacheStatus {
  lastUpdated: Date | null;
  entryCount: number;
  currentWeek: number;
  needsUpdate: boolean;
}

/**
 * Get current race week number (0-based)
 */
function getCurrentRaceWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 0, 1); // Approximate season start
  const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return weeksSinceStart % 13; // iRacing seasons are typically 12-13 weeks
}

/**
 * Calculate week start and end dates for a given race week
 */
function getWeekDates(raceWeekNum: number, seasonYear: number, seasonQuarter: number): { start: Date; end: Date } {
  // Approximate calculation - in reality this would need to be more precise
  // based on iRacing's actual season calendar
  const quarterStartMonth = (seasonQuarter - 1) * 3;
  const seasonStart = new Date(seasonYear, quarterStartMonth, 1);
  
  const weekStart = new Date(seasonStart);
  weekStart.setDate(seasonStart.getDate() + (raceWeekNum * 7));
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { start: weekStart, end: weekEnd };
}

/**
 * Extract license level from series/season data using centralized license helper
 *
 * The iRacing API may provide license info in different fields depending on the endpoint.
 * We check multiple possible field names with logging to help debug issues.
 */
function extractLicenseLevel(seasonData: any): string {
  // Log available fields for debugging (first few entries only)
  const relevantFields = {
    license_group: seasonData.license_group,
    license_group_id: seasonData.license_group_id,
    min_license_level: seasonData.min_license_level,
    license_level: seasonData.license_level,
    series_id: seasonData.series_id,
    season_id: seasonData.season_id,
  };

  // Try license_group first (most common in iRacing API)
  if (seasonData.license_group !== undefined && seasonData.license_group !== null) {
    const licenseLevel = LicenseHelper.fromIRacingGroup(seasonData.license_group);
    return licenseLevel;
  }

  // Try license_group_id (alternative field name)
  if (seasonData.license_group_id !== undefined && seasonData.license_group_id !== null) {
    const licenseLevel = LicenseHelper.fromIRacingGroup(seasonData.license_group_id);
    return licenseLevel;
  }

  // Log when falling back to Rookie so we can identify API field issues
  console.warn(`License level extraction falling back to Rookie for season/series. Available fields:`, relevantFields);

  return LicenseLevel.ROOKIE;
}

/**
 * Determine if a series has open setup based on API data
 *
 * Checks both season-level and schedule entry-level fields with proper fallback.
 * Default to fixed setup (false) when data is missing to be conservative.
 */
function extractHasOpenSetup(seasonData: any, scheduleEntry: any): boolean {
  // Check schedule entry level first (per-week override)
  if (scheduleEntry.fixed_setup === true) {
    return false; // Explicitly fixed
  }
  if (scheduleEntry.fixed_setup === false) {
    return true; // Explicitly open
  }

  // Check season/series level
  if (seasonData.fixed_setup === true) {
    return false; // Series is fixed setup
  }
  if (seasonData.fixed_setup === false) {
    return true; // Series is open setup
  }

  // Check open_setup field if available
  if (seasonData.open_setup === true) {
    return true;
  }
  if (seasonData.open_setup === false) {
    return false;
  }

  // Default to fixed setup when unknown (conservative approach)
  return false;
}

/**
 * Extract category from schedule entry or season data using the Category enum
 *
 * Checks multiple possible field locations and normalizes legacy values like "road"
 * to the current 5-category system.
 */
function extractCategory(scheduleEntry: any, seasonData?: any): Category {
  // Try schedule entry level first
  if (scheduleEntry.category) {
    const normalized = CategoryHelper.fromScheduleCategory(scheduleEntry.category);
    return normalized;
  }
  if (scheduleEntry.category_id !== undefined) {
    return mapScheduleCategory(scheduleEntry.category_id);
  }

  // Try season/series level as fallback
  if (seasonData?.category) {
    const normalized = CategoryHelper.fromScheduleCategory(seasonData.category);
    return normalized;
  }
  if (seasonData?.category_id !== undefined) {
    return mapScheduleCategory(seasonData.category_id);
  }

  // Log when falling back to default
  console.warn('Category extraction falling back to SPORTS_CAR. Available fields:', {
    scheduleEntry_category: scheduleEntry.category,
    scheduleEntry_category_id: scheduleEntry.category_id,
    seasonData_category: seasonData?.category,
    seasonData_category_id: seasonData?.category_id,
  });

  return Category.SPORTS_CAR;
}

/**
 * Map iRacing schedule category to our standardized Category enum
 * This should match the license category mapping in auth/db.ts
 */
function mapScheduleCategory(categoryId: number | string): Category {
  if (typeof categoryId === 'string') {
    return CategoryHelper.fromScheduleCategory(categoryId);
  }
  
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  switch (id) {
    case 1: return Category.OVAL;
    case 2: return Category.SPORTS_CAR; // Legacy road -> sports_car
    case 3: return Category.DIRT_OVAL;
    case 4: return Category.DIRT_ROAD;
    case 5: return Category.SPORTS_CAR; // Sports Car
    case 6: return Category.FORMULA_CAR; // Formula Car
    default: return Category.SPORTS_CAR;
  }
}

/**
 * Sync schedule data from iRacing API
 */
export async function syncScheduleData(
  userId: string,
  seasonYear?: number,
  seasonQuarter?: number
): Promise<{ success: boolean; entriesAdded: number; error?: string }> {
  try {
    const season = seasonYear && seasonQuarter 
      ? { year: seasonYear, quarter: seasonQuarter }
      : getCurrentSeason();

    console.log(`Syncing schedule data for ${season.year}Q${season.quarter}...`);

    // Get the list of seasons with embedded schedules
    let seasonsData: any[] = [];
    
    try {
      const seasonsResponse = await makeAuthenticatedRequest(
        userId,
        '/series/seasons',
        { 
          season_year: season.year,
          season_quarter: season.quarter,
          include_series: 1  // Use number instead of boolean
        }
      );
      
      if (seasonsResponse && Array.isArray(seasonsResponse)) {
        seasonsData = seasonsResponse;
        console.log(`Found ${seasonsData.length} seasons from series/seasons`);
      }
    } catch (error) {
      console.warn('Failed to get seasons data:', error);
      return { success: false, entriesAdded: 0, error: 'Failed to get seasons data' };
    }

    if (seasonsData.length === 0) {
      console.warn('No seasons data found');
      return { success: true, entriesAdded: 0 };
    }

    let entriesAdded = 0;
    let skippedEntries = 0;
    let debugLogCount = 0;
    const MAX_DEBUG_LOGS = 3; // Log first few entries for debugging

    // Process each season and its embedded schedule
    for (const seasonData of seasonsData) {
      // Debug: Log first few season data objects to understand API structure
      if (debugLogCount < MAX_DEBUG_LOGS) {
        console.log(`Debug: Season data sample ${debugLogCount + 1}:`, {
          season_id: seasonData.season_id,
          series_id: seasonData.series_id,
          season_name: seasonData.season_name,
          // License-related fields
          license_group: seasonData.license_group,
          license_group_id: seasonData.license_group_id,
          min_license_level: seasonData.min_license_level,
          // Setup-related fields
          fixed_setup: seasonData.fixed_setup,
          open_setup: seasonData.open_setup,
          // Category fields
          category: seasonData.category,
          category_id: seasonData.category_id,
          // List all top-level keys for discovery
          all_keys: Object.keys(seasonData).slice(0, 20),
        });
        debugLogCount++;
      }
      if (!seasonData.season_id || !seasonData.schedules || !Array.isArray(seasonData.schedules)) {
        console.log(`Skipping season ${seasonData.season_id}: no schedules array`);
        skippedEntries++;
        continue;
      }

      // Extract series information from season data
      const seriesId = seasonData.series_id;
      const seriesName = seasonData.season_name || seasonData.season_short_name || `Series ${seriesId}`;

      if (!seriesId || !seriesName) {
        console.log(`Skipping season ${seasonData.season_id}: missing series info`);
        skippedEntries++;
        continue;
      }

      // Process each race week in the season's schedule
      for (const scheduleEntry of seasonData.schedules) {
        // Debug: Log race_time_descriptors for first few entries
        if (debugLogCount < MAX_DEBUG_LOGS) {
          console.log(`Debug: Schedule entry ${debugLogCount + 1} race_time_descriptors:`, {
            series_id: seriesId,
            race_week_num: scheduleEntry.race_week_num,
            has_race_time_descriptors: !!scheduleEntry.race_time_descriptors,
            race_time_descriptors: scheduleEntry.race_time_descriptors,
            all_schedule_keys: Object.keys(scheduleEntry).slice(0, 15)
          });
        }

        // Extract required data
        const trackId = scheduleEntry.track?.track_id;
        const trackName = scheduleEntry.track?.track_name;
        const raceWeekNum = scheduleEntry.race_week_num;

        // Skip entries with missing required data
        if (!trackId || !trackName || raceWeekNum === undefined) {
          console.log(`Skipping schedule entry: missing data - trackId: ${trackId}, trackName: ${trackName}, raceWeekNum: ${raceWeekNum}`);
          skippedEntries++;
          continue;
        }

        const weekDates = getWeekDates(raceWeekNum, season.year, season.quarter);
        
        // Calculate race length from race_time_descriptors
        let raceLength: number | null = null;
        if (scheduleEntry.race_time_descriptors && Array.isArray(scheduleEntry.race_time_descriptors)) {
          const raceSession = scheduleEntry.race_time_descriptors[0]; // Take first descriptor
          if (raceSession && raceSession.session_minutes) {
            raceLength = raceSession.session_minutes;
          }
        }

        // Fallback to race time limit
        if (!raceLength && scheduleEntry.race_time_limit) {
          raceLength = scheduleEntry.race_time_limit;
        }

        const licenseRequired = extractLicenseLevel(seasonData);
        const category = extractCategory(scheduleEntry, seasonData); // Check both levels
        const hasOpenSetup = extractHasOpenSetup(seasonData, scheduleEntry);

        const dbEntry = {
          seriesId,
          seriesName,
          trackId,
          trackName,
          licenseRequired,
          category,
          raceLength,
          hasOpenSetup,
          seasonYear: season.year,
          seasonQuarter: season.quarter,
          raceWeekNum,
          weekStart: weekDates.start.toISOString().split('T')[0], // Convert to date string
          weekEnd: weekDates.end.toISOString().split('T')[0], // Convert to date string
          raceTimeDescriptors: scheduleEntry.race_time_descriptors || null, // Store race timing info
        };

        // Debug: Log the first few entries being inserted
        if (entriesAdded < 2) {
          console.log(`Inserting schedule entry ${entriesAdded + 1}: ${seriesName} at ${trackName} (Week ${raceWeekNum})`);
        }

        try {
          // Use onConflictDoUpdate to update race_time_descriptors for existing entries
          await db.insert(scheduleEntries)
            .values(dbEntry)
            .onConflictDoUpdate({
              target: [
                scheduleEntries.seriesId,
                scheduleEntries.trackId,
                scheduleEntries.seasonYear,
                scheduleEntries.seasonQuarter,
                scheduleEntries.raceWeekNum
              ],
              set: {
                raceTimeDescriptors: dbEntry.raceTimeDescriptors,
                seriesName: dbEntry.seriesName,
                trackName: dbEntry.trackName,
                licenseRequired: dbEntry.licenseRequired,
                category: dbEntry.category,
                raceLength: dbEntry.raceLength,
                hasOpenSetup: dbEntry.hasOpenSetup,
                weekStart: dbEntry.weekStart,
                weekEnd: dbEntry.weekEnd
              }
            });
          
          entriesAdded++;
        } catch (error) {
          // Log insertion errors for debugging
          console.log('Schedule insert failed:', error instanceof Error ? error.message : 'Unknown error');
          skippedEntries++;
        }
      }
    }

    console.log(`Schedule sync completed: ${entriesAdded} entries added, ${skippedEntries} skipped`);
    return { success: true, entriesAdded };

  } catch (error) {
    console.error('Schedule sync error:', error);
    return {
      success: false,
      entriesAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current schedule from cache
 */
export async function getCurrentSchedule(
  seasonYear?: number,
  seasonQuarter?: number,
  raceWeekNum?: number
): Promise<ScheduleEntry[]> {
  const season = seasonYear && seasonQuarter 
    ? { year: seasonYear, quarter: seasonQuarter }
    : getCurrentSeason();
  
  const currentWeek = raceWeekNum ?? getCurrentRaceWeek();
  
  const entries = await db.query.scheduleEntries.findMany({
    where: and(
      eq(scheduleEntries.seasonYear, season.year),
      eq(scheduleEntries.seasonQuarter, season.quarter),
      eq(scheduleEntries.raceWeekNum, currentWeek)
    ),
    orderBy: [scheduleEntries.seriesName, scheduleEntries.trackName],
  });

  return entries.map(entry => ({
    ...entry,
    weekStart: new Date(entry.weekStart),
    weekEnd: new Date(entry.weekEnd),
    createdAt: new Date(entry.createdAt || new Date()),
    hasOpenSetup: entry.hasOpenSetup ?? false,
  }));
}

/**
 * Get schedule cache status
 */
export async function getScheduleCacheStatus(
  seasonYear?: number,
  seasonQuarter?: number
): Promise<ScheduleCacheStatus> {
  const season = seasonYear && seasonQuarter 
    ? { year: seasonYear, quarter: seasonQuarter }
    : getCurrentSeason();

  const entries = await db.query.scheduleEntries.findMany({
    where: and(
      eq(scheduleEntries.seasonYear, season.year),
      eq(scheduleEntries.seasonQuarter, season.quarter)
    ),
    orderBy: desc(scheduleEntries.createdAt),
    limit: 1,
  });

  const lastUpdated = entries.length > 0 ? new Date(entries[0].createdAt || new Date()) : null;
  
  const totalEntries = await db
    .select({ count: scheduleEntries.id })
    .from(scheduleEntries)
    .where(and(
      eq(scheduleEntries.seasonYear, season.year),
      eq(scheduleEntries.seasonQuarter, season.quarter)
    ));

  const currentWeek = getCurrentRaceWeek();
  
  // Determine if update is needed
  let needsUpdate = false;
  if (!lastUpdated) {
    needsUpdate = true;
  } else {
    // Update if cache is older than 24 hours
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    needsUpdate = hoursSinceUpdate >= 24;
  }

  return {
    lastUpdated,
    entryCount: totalEntries.length,
    currentWeek,
    needsUpdate,
  };
}

/**
 * Get schedule for specific series
 */
export async function getSeriesSchedule(
  seriesId: number,
  seasonYear?: number,
  seasonQuarter?: number
): Promise<ScheduleEntry[]> {
  const season = seasonYear && seasonQuarter 
    ? { year: seasonYear, quarter: seasonQuarter }
    : getCurrentSeason();

  const entries = await db.query.scheduleEntries.findMany({
    where: and(
      eq(scheduleEntries.seriesId, seriesId),
      eq(scheduleEntries.seasonYear, season.year),
      eq(scheduleEntries.seasonQuarter, season.quarter)
    ),
    orderBy: scheduleEntries.raceWeekNum,
  });

  return entries.map(entry => ({
    ...entry,
    weekStart: new Date(entry.weekStart),
    weekEnd: new Date(entry.weekEnd),
    createdAt: new Date(entry.createdAt || new Date()),
    hasOpenSetup: entry.hasOpenSetup ?? false,
  }));
}

/**
 * Get schedule for specific track
 */
export async function getTrackSchedule(
  trackId: number,
  seasonYear?: number,
  seasonQuarter?: number
): Promise<ScheduleEntry[]> {
  const season = seasonYear && seasonQuarter 
    ? { year: seasonYear, quarter: seasonQuarter }
    : getCurrentSeason();

  const entries = await db.query.scheduleEntries.findMany({
    where: and(
      eq(scheduleEntries.trackId, trackId),
      eq(scheduleEntries.seasonYear, season.year),
      eq(scheduleEntries.seasonQuarter, season.quarter)
    ),
    orderBy: [scheduleEntries.seriesName, scheduleEntries.raceWeekNum],
  });

  return entries.map(entry => ({
    ...entry,
    weekStart: new Date(entry.weekStart),
    weekEnd: new Date(entry.weekEnd),
    createdAt: new Date(entry.createdAt || new Date()),
    hasOpenSetup: entry.hasOpenSetup ?? false,
  }));
}

/**
 * Clear old schedule data (cleanup)
 */
export async function clearOldScheduleData(olderThanDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(scheduleEntries)
    .where(lte(scheduleEntries.createdAt, cutoffDate));

  return result.rowCount || 0;
}