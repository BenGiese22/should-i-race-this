import { eq, and, gte, lte, avg, count, sum, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import { raceResults, scheduleEntries } from './schema';
import type { GroupingType, PerformanceMetric } from '@/types';
import { SessionType } from '../types/session';

/**
 * Calculate performance metrics grouped by series, track, or series+track combinations
 * Implements proper position delta calculation with sign conventions:
 * - Positive delta = improvement (started lower, finished higher)
 * - Negative delta = decline (started higher, finished lower)
 */
export async function getPerformanceMetrics(
  userId: string,
  groupBy: GroupingType,
  filters?: {
    sessionTypes?: SessionType[];
    seasonYear?: number;
    seasonQuarter?: number;
    startDate?: Date;
    endDate?: Date;
    seriesIds?: number[];
    trackIds?: number[];
  }
): Promise<PerformanceMetric[]> {
  const whereConditions = [eq(raceResults.userId, userId)];

  // Apply filters
  if (filters?.sessionTypes && filters.sessionTypes.length > 0) {
    whereConditions.push(inArray(raceResults.sessionType, filters.sessionTypes));
  }
  if (filters?.seasonYear) {
    whereConditions.push(eq(raceResults.seasonYear, filters.seasonYear));
  }
  if (filters?.seasonQuarter) {
    whereConditions.push(eq(raceResults.seasonQuarter, filters.seasonQuarter));
  }
  if (filters?.startDate) {
    whereConditions.push(gte(raceResults.raceDate, filters.startDate));
  }
  if (filters?.endDate) {
    whereConditions.push(lte(raceResults.raceDate, filters.endDate));
  }
  if (filters?.seriesIds && filters.seriesIds.length > 0) {
    whereConditions.push(inArray(raceResults.seriesId, filters.seriesIds));
  }
  if (filters?.trackIds && filters.trackIds.length > 0) {
    whereConditions.push(inArray(raceResults.trackId, filters.trackIds));
  }

  // Only include results with valid position data for meaningful calculations
  // Exclude starting position -1 (pit starts) and other invalid positions
  whereConditions.push(
    sql`${raceResults.startingPosition} IS NOT NULL AND ${raceResults.finishingPosition} IS NOT NULL AND ${raceResults.startingPosition} > 0 AND ${raceResults.finishingPosition} > 0`
  );

  let queryResult;
  switch (groupBy) {
    case 'series':
      queryResult = await db
        .select({
          seriesId: raceResults.seriesId,
          seriesName: raceResults.seriesName,
          trackId: sql<number | null>`NULL`,
          trackName: sql<string | null>`NULL`,
          avgStartingPosition: avg(raceResults.startingPosition),
          avgFinishingPosition: avg(raceResults.finishingPosition),
          positionDelta: avg(raceResults.positionDelta),
          avgIncidents: avg(raceResults.incidents),
          raceCount: count(),
          consistency: sql<number>`COALESCE(STDDEV(${raceResults.finishingPosition}), 0)`,
        })
        .from(raceResults)
        .where(and(...whereConditions))
        .groupBy(raceResults.seriesId, raceResults.seriesName);
      break;
    case 'track':
      queryResult = await db
        .select({
          seriesId: sql<number | null>`NULL`,
          seriesName: sql<string | null>`NULL`,
          trackId: raceResults.trackId,
          trackName: raceResults.trackName,
          avgStartingPosition: avg(raceResults.startingPosition),
          avgFinishingPosition: avg(raceResults.finishingPosition),
          positionDelta: avg(raceResults.positionDelta),
          avgIncidents: avg(raceResults.incidents),
          raceCount: count(),
          consistency: sql<number>`COALESCE(STDDEV(${raceResults.finishingPosition}), 0)`,
        })
        .from(raceResults)
        .where(and(...whereConditions))
        .groupBy(raceResults.trackId, raceResults.trackName);
      break;
    case 'series_track':
      queryResult = await db
        .select({
          seriesId: raceResults.seriesId,
          seriesName: raceResults.seriesName,
          trackId: raceResults.trackId,
          trackName: raceResults.trackName,
          avgStartingPosition: avg(raceResults.startingPosition),
          avgFinishingPosition: avg(raceResults.finishingPosition),
          positionDelta: avg(raceResults.positionDelta),
          avgIncidents: avg(raceResults.incidents),
          raceCount: count(),
          consistency: sql<number>`COALESCE(STDDEV(${raceResults.finishingPosition}), 0)`,
        })
        .from(raceResults)
        .where(and(...whereConditions))
        .groupBy(
          raceResults.seriesId,
          raceResults.seriesName,
          raceResults.trackId,
          raceResults.trackName
        );
      break;
    default:
      throw new Error(`Invalid groupBy type: ${groupBy}`);
  }

  // Convert the query result to match PerformanceMetric interface
  return queryResult.map(row => ({
    seriesId: row.seriesId ?? undefined,
    seriesName: row.seriesName ?? undefined,
    trackId: row.trackId ?? undefined,
    trackName: row.trackName ?? undefined,
    avgStartingPosition: parseFloat(row.avgStartingPosition || '0'),
    avgFinishingPosition: parseFloat(row.avgFinishingPosition || '0'),
    positionDelta: parseFloat(row.positionDelta || '0'),
    avgIncidents: parseFloat(row.avgIncidents || '0'),
    raceCount: row.raceCount,
    consistency: row.consistency || 0,
  }));
}

/**
 * Get user's race history with pagination and filtering
 */
export async function getRaceHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    sessionType?: string;
    seriesId?: number;
    trackId?: number;
    seasonYear?: number;
    seasonQuarter?: number;
  }
) {
  const whereConditions = [eq(raceResults.userId, userId)];

  if (options?.sessionType) {
    whereConditions.push(eq(raceResults.sessionType, options.sessionType));
  }
  if (options?.seriesId) {
    whereConditions.push(eq(raceResults.seriesId, options.seriesId));
  }
  if (options?.trackId) {
    whereConditions.push(eq(raceResults.trackId, options.trackId));
  }
  if (options?.seasonYear) {
    whereConditions.push(eq(raceResults.seasonYear, options.seasonYear));
  }
  if (options?.seasonQuarter) {
    whereConditions.push(eq(raceResults.seasonQuarter, options.seasonQuarter));
  }

  const query = db
    .select()
    .from(raceResults)
    .where(and(...whereConditions))
    .orderBy(desc(raceResults.raceDate));

  if (options?.limit) {
    query.limit(options.limit);
  }
  if (options?.offset) {
    query.offset(options.offset);
  }

  return query;
}

/**
 * Get available seasons for a user (based on their race history)
 */
export async function getUserSeasons(userId: string) {
  return db
    .selectDistinct({
      seasonYear: raceResults.seasonYear,
      seasonQuarter: raceResults.seasonQuarter,
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId))
    .orderBy(desc(raceResults.seasonYear), desc(raceResults.seasonQuarter));
}

/**
 * Get current racing opportunities from schedule
 */
export async function getCurrentRacingOpportunities(
  licenseCategories?: string[],
  licenseLevels?: string[]
) {
  const whereConditions = [];

  if (licenseCategories?.length) {
    whereConditions.push(sql`${scheduleEntries.category} = ANY(${licenseCategories})`);
  }
  if (licenseLevels?.length) {
    whereConditions.push(sql`${scheduleEntries.licenseRequired} = ANY(${licenseLevels})`);
  }

  // Get current week's schedule (simplified - would need actual date logic)
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  
  whereConditions.push(
    and(
      lte(scheduleEntries.weekStart, currentDateStr),
      gte(scheduleEntries.weekEnd, currentDateStr)
    )
  );

  return db
    .select()
    .from(scheduleEntries)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(asc(scheduleEntries.seriesName));
}

/**
 * Get user's performance summary for a specific series-track combination
 */
export async function getSeriesTrackPerformance(
  userId: string,
  seriesId: number,
  trackId: number
) {
  const results = await db
    .select({
      totalRaces: count(),
      avgStartingPosition: avg(raceResults.startingPosition),
      avgFinishingPosition: avg(raceResults.finishingPosition),
      avgPositionDelta: avg(raceResults.positionDelta),
      avgIncidents: avg(raceResults.incidents),
      bestFinish: sql<number>`MIN(${raceResults.finishingPosition})`,
      worstFinish: sql<number>`MAX(${raceResults.finishingPosition})`,
      totalIncidents: sum(raceResults.incidents),
      consistency: sql<number>`STDDEV(${raceResults.finishingPosition})`,
      lastRaceDate: sql<Date>`MAX(${raceResults.raceDate})`,
    })
    .from(raceResults)
    .where(
      and(
        eq(raceResults.userId, userId),
        eq(raceResults.seriesId, seriesId),
        eq(raceResults.trackId, trackId),
        eq(raceResults.sessionType, SessionType.RACE) // Only count actual races
      )
    );

  return results[0];
}

/**
 * Calculate position delta for a single race result
 * Returns positive for improvement, negative for decline
 */
export function calculatePositionDelta(startingPosition: number | null, finishingPosition: number | null): number | null {
  if (startingPosition === null || finishingPosition === null) {
    return null;
  }
  return startingPosition - finishingPosition;
}

/**
 * Get performance trends over time for a user
 */
export async function getPerformanceTrends(
  userId: string,
  options?: {
    seriesId?: number;
    trackId?: number;
    sessionType?: SessionType;
    periodMonths?: number; // Default 12 months
  }
) {
  const whereConditions = [eq(raceResults.userId, userId)];
  
  if (options?.seriesId) {
    whereConditions.push(eq(raceResults.seriesId, options.seriesId));
  }
  if (options?.trackId) {
    whereConditions.push(eq(raceResults.trackId, options.trackId));
  }
  if (options?.sessionType) {
    whereConditions.push(eq(raceResults.sessionType, options.sessionType));
  }
  
  // Default to last 12 months
  const monthsBack = options?.periodMonths || 12;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);
  whereConditions.push(gte(raceResults.raceDate, startDate));

  // Only include results with valid position data (exclude pit starts)
  whereConditions.push(
    sql`${raceResults.startingPosition} IS NOT NULL AND ${raceResults.finishingPosition} IS NOT NULL AND ${raceResults.startingPosition} > 0 AND ${raceResults.finishingPosition} > 0`
  );

  return db
    .select({
      raceDate: raceResults.raceDate,
      seriesName: raceResults.seriesName,
      trackName: raceResults.trackName,
      startingPosition: raceResults.startingPosition,
      finishingPosition: raceResults.finishingPosition,
      positionDelta: raceResults.positionDelta,
      incidents: raceResults.incidents,
      strengthOfField: raceResults.strengthOfField,
    })
    .from(raceResults)
    .where(and(...whereConditions))
    .orderBy(asc(raceResults.raceDate));
}

/**
 * Calculate performance statistics for multiple session types
 */
export async function getSessionTypeComparison(
  userId: string,
  options?: {
    seriesId?: number;
    trackId?: number;
    seasonYear?: number;
    seasonQuarter?: number;
  }
) {
  const whereConditions = [eq(raceResults.userId, userId)];
  
  if (options?.seriesId) {
    whereConditions.push(eq(raceResults.seriesId, options.seriesId));
  }
  if (options?.trackId) {
    whereConditions.push(eq(raceResults.trackId, options.trackId));
  }
  if (options?.seasonYear) {
    whereConditions.push(eq(raceResults.seasonYear, options.seasonYear));
  }
  if (options?.seasonQuarter) {
    whereConditions.push(eq(raceResults.seasonQuarter, options.seasonQuarter));
  }

  // Only include results with valid position data (exclude pit starts)
  whereConditions.push(
    sql`${raceResults.startingPosition} IS NOT NULL AND ${raceResults.finishingPosition} IS NOT NULL AND ${raceResults.startingPosition} > 0 AND ${raceResults.finishingPosition} > 0`
  );

  return db
    .select({
      sessionType: raceResults.sessionType,
      avgStartingPosition: avg(raceResults.startingPosition),
      avgFinishingPosition: avg(raceResults.finishingPosition),
      avgPositionDelta: avg(raceResults.positionDelta),
      avgIncidents: avg(raceResults.incidents),
      raceCount: count(),
      consistency: sql<number>`COALESCE(STDDEV(${raceResults.finishingPosition}), 0)`,
    })
    .from(raceResults)
    .where(and(...whereConditions))
    .groupBy(raceResults.sessionType)
    .orderBy(asc(raceResults.sessionType));
}

export async function getGlobalSeriesTrackStats(seriesId: number, trackId: number) {
  const results = await db
    .select({
      totalRaces: count(),
      avgIncidents: avg(raceResults.incidents),
      avgStrengthOfField: avg(raceResults.strengthOfField),
      consistencyMetric: sql<number>`STDDEV(${raceResults.finishingPosition})`,
      attritionRate: sql<number>`
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE COUNT(CASE WHEN ${raceResults.finishingPosition} IS NULL THEN 1 END)::float / 
               COUNT(*)::float
        END
      `,
    })
    .from(raceResults)
    .where(
      and(
        eq(raceResults.seriesId, seriesId),
        eq(raceResults.trackId, trackId),
        eq(raceResults.sessionType, SessionType.RACE),
        // Only recent data (last 3 months for relevance)
        gte(raceResults.raceDate, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      )
    );

  const result = results[0];
  
  // Handle case where no data exists
  if (!result || result.totalRaces === 0) {
    return {
      totalRaces: 0,
      avgIncidents: null,
      avgStrengthOfField: null,
      consistencyMetric: null,
      attritionRate: null
    };
  }
  
  return result;
}