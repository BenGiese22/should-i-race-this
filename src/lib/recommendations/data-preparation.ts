import { and, sql } from 'drizzle-orm';
import { db } from '../db';
import { scheduleEntries } from '../db/schema';
import { 
  UserHistory, 
  SeriesTrackHistory, 
  UserOverallStats, 
  RacingOpportunity,
  GlobalStats,
  TimeSlot,
  Category,
  LicenseLevel
} from './types';
import { analyticsIntegration } from './analytics-integration';
import { recommendationCache, CacheKeys, CacheTTL } from './cache';
import { batchProcessor } from './batch-processor';

/**
 * Prepare user history data for scoring algorithm
 * Now uses analytics integration layer to eliminate duplicate database queries
 * Requirements: 1.1, 2.1, 2.2, 2.3, 7.1
 */
export async function prepareUserHistory(userId: string): Promise<UserHistory> {
  // Use analytics integration to get all user performance data
  const performanceData = await analyticsIntegration.getUserPerformanceData(userId);

  console.log(`Debug: Performance data for user ${userId}:`, {
    seriesTrackHistoryCount: performanceData.seriesTrackHistory?.length || 0,
    overallStats: performanceData.overallStats,
    primaryCategory: performanceData.primaryCategory,
    licenseClassesCount: performanceData.licenseClasses?.length || 0,
    licenseClasses: performanceData.licenseClasses
  });

  // Add null safety for seriesTrackHistory
  const seriesTrackHistory: SeriesTrackHistory[] = (performanceData.seriesTrackHistory || []).map(perf => ({
    seriesId: perf.seriesId,
    trackId: perf.trackId,
    raceCount: perf.raceCount,
    avgStartingPosition: 0, // Not used in scoring, set to default
    avgFinishingPosition: 0, // Not used in scoring, set to default
    avgPositionDelta: perf.avgPositionDelta,
    avgIncidents: perf.avgIncidents,
    finishPositionStdDev: perf.consistency,
    lastRaceDate: new Date() // Not critical for scoring, set to current date
  }));

  const overallStats: UserOverallStats = {
    totalRaces: performanceData.overallStats?.totalRaces || 0,
    avgIncidentsPerRace: performanceData.overallStats?.avgIncidentsPerRace || 0,
    avgPositionDelta: performanceData.overallStats?.avgPositionDelta || 0,
    overallConsistency: performanceData.overallStats?.overallConsistency || 1
  };

  const result: UserHistory = {
    userId,
    seriesTrackHistory,
    overallStats,
    licenseClasses: performanceData.licenseClasses || []
  };

  console.log(`Debug: Final UserHistory for ${userId}:`, {
    userId: result.userId,
    seriesTrackHistoryCount: result.seriesTrackHistory.length,
    overallStats: result.overallStats,
    licenseClassesCount: result.licenseClasses.length,
    licenseClasses: result.licenseClasses
  });

  return result;
}

/**
 * Get current racing opportunities from schedule (optimized version with caching)
 * Now uses analytics integration for global statistics
 * Requirements: 2.3, 7.1
 * Performance Optimization: Enhanced caching and batch processing (Requirements: 8.1, 8.2, 8.3)
 */
export async function getCurrentRacingOpportunities(): Promise<RacingOpportunity[]> {
  // Check cache first
  const cacheKey = CacheKeys.racingOpportunities();
  const cached = recommendationCache.get<RacingOpportunity[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get current week's schedule entries
  const currentDate = new Date();
  const scheduleResults = await db
    .select()
    .from(scheduleEntries)
    .where(
      and(
        sql`${scheduleEntries.weekStart} <= ${currentDate}`,
        sql`${scheduleEntries.weekEnd} >= ${currentDate}`
      )
    );

  // Early return if no schedule entries
  if (scheduleResults.length === 0) {
    const emptyResult: RacingOpportunity[] = [];
    recommendationCache.set(cacheKey, emptyResult, CacheTTL.RACING_OPPORTUNITIES);
    return emptyResult;
  }

  // Prepare batch requests for global stats
  const batchRequests = scheduleResults.map(entry => ({
    seriesId: entry.seriesId,
    trackId: entry.trackId
  }));

  // Use batch processing for global stats to optimize performance
  const batchGlobalStats = await batchProcessor.getBatchGlobalStats(batchRequests);
  
  // Create a map for fast lookup
  const globalStatsMap = new Map<string, GlobalStats>();
  batchGlobalStats.forEach(result => {
    const key = `${result.seriesId}:${result.trackId}`;
    globalStatsMap.set(key, {
      avgIncidentsPerRace: result.stats.avgIncidentsPerRace,
      avgFinishPositionStdDev: result.stats.avgFinishPositionStdDev,
      avgStrengthOfField: result.stats.avgStrengthOfField,
      strengthOfFieldVariability: result.stats.strengthOfFieldVariability,
      attritionRate: result.stats.attritionRate,
      avgRaceLength: result.stats.avgRaceLength
    });
  });
  
  // Build opportunities with cached global stats
  const opportunities: RacingOpportunity[] = scheduleResults.map(entry => {
    const key = `${entry.seriesId}:${entry.trackId}`;
    const globalStats = globalStatsMap.get(key) || {
      avgIncidentsPerRace: 2.5,
      avgFinishPositionStdDev: 8.0,
      avgStrengthOfField: 1500,
      strengthOfFieldVariability: 300,
      attritionRate: 15,
      avgRaceLength: 60
    };
    
    // Generate mock time slots (in a real implementation, this would come from iRacing API)
    const timeSlots = generateMockTimeSlots();
    
    return {
      seriesId: entry.seriesId,
      seriesName: entry.seriesName,
      trackId: entry.trackId,
      trackName: entry.trackName,
      licenseRequired: entry.licenseRequired as LicenseLevel,
      category: entry.category as Category,
      seasonYear: entry.seasonYear,
      seasonQuarter: entry.seasonQuarter,
      raceWeekNum: entry.raceWeekNum,
      raceLength: entry.raceLength ?? 60, // Default to 60 minutes
      hasOpenSetup: entry.hasOpenSetup ?? false,
      timeSlots,
      globalStats
    };
  });

  // Cache the result
  recommendationCache.set(cacheKey, opportunities, CacheTTL.RACING_OPPORTUNITIES);

  return opportunities;
}

/**
 * Clear the racing opportunities cache (useful for testing or when schedule updates)
 * Performance Optimization: Updated to use new cache system (Requirements: 8.1)
 */
export function clearOpportunitiesCache(): void {
  const cacheKey = CacheKeys.racingOpportunities();
  recommendationCache.delete(cacheKey);
}

/**
 * Performance optimization: Prefetch data for faster recommendations
 * Requirements: 8.3
 */
export async function prefetchRecommendationData(userId: string): Promise<void> {
  // Prefetch user data
  await analyticsIntegration.prefetchUserData(userId);
  
  // Prefetch racing opportunities
  await getCurrentRacingOpportunities();
}

/**
 * Get cache performance metrics for monitoring
 */
export function getCachePerformanceMetrics() {
  return analyticsIntegration.getCacheMetrics();
}

/**
 * Generate mock time slots for demonstration
 * In a real implementation, this would come from iRacing's API
 */
function generateMockTimeSlots(): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];
  
  // Generate some typical race times
  const raceTimes = [
    { hour: 14, dayOfWeek: 6 }, // Saturday afternoon
    { hour: 19, dayOfWeek: 6 }, // Saturday evening
    { hour: 15, dayOfWeek: 0 }, // Sunday afternoon
    { hour: 20, dayOfWeek: 2 }, // Tuesday evening
    { hour: 21, dayOfWeek: 4 }, // Thursday evening
  ];

  for (const time of raceTimes) {
    timeSlots.push({
      hour: time.hour,
      dayOfWeek: time.dayOfWeek,
      strengthOfField: 1400 + Math.random() * 400, // Random SOF between 1400-1800
      participantCount: 15 + Math.floor(Math.random() * 20) // Random 15-35 participants
    });
  }

  return timeSlots;
}