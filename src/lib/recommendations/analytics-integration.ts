import { 
  getPerformanceMetrics, 
  getSeriesTrackPerformance, 
  getGlobalSeriesTrackStats 
} from '../db/analytics';
import type { 
  Category, 
  LicenseLevel, 
  UserHistory, 
  SeriesTrackHistory, 
  UserOverallStats, 
  LicenseClass,
  GlobalStats 
} from './types';
import { eq, sql, and, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { licenseClasses, raceResults, scheduleEntries } from '../db/schema';
import { recommendationCache, CacheKeys, CacheTTL } from './cache';
import { batchProcessor } from './batch-processor';

// Analytics integration logging
interface AnalyticsCall {
  timestamp: Date;
  method: string;
  userId?: string;
  seriesId?: number;
  trackId?: number;
  duration: number;
  cacheHit: boolean;
  error?: string;
}

class AnalyticsLogger {
  private calls: AnalyticsCall[] = [];
  private maxCalls = 1000; // Keep last 1000 calls

  log(call: AnalyticsCall) {
    this.calls.push(call);
    if (this.calls.length > this.maxCalls) {
      this.calls.shift(); // Remove oldest call
    }
  }

  getCalls(limit?: number): AnalyticsCall[] {
    return limit ? this.calls.slice(-limit) : [...this.calls];
  }

  getCallStats() {
    const totalCalls = this.calls.length;
    const cacheHits = this.calls.filter(c => c.cacheHit).length;
    const errors = this.calls.filter(c => c.error).length;
    const avgDuration = totalCalls > 0 ? 
      this.calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls : 0;

    return {
      totalCalls,
      cacheHitRate: totalCalls > 0 ? cacheHits / totalCalls : 0,
      errorRate: totalCalls > 0 ? errors / totalCalls : 0,
      avgDurationMs: avgDuration,
      recentCalls: this.calls.slice(-10)
    };
  }

  clear() {
    this.calls = [];
  }
}

const analyticsLogger = new AnalyticsLogger();

export type ConfidenceLevel = 'high' | 'estimated' | 'no_data';

export interface UserPerformanceData {
  seriesTrackHistory: SeriesTrackPerformance[];
  overallStats: OverallPerformance;
  primaryCategory: Category;
  licenseClasses: LicenseClass[];
}

export interface SeriesTrackPerformance {
  seriesId: number;
  trackId: number;
  raceCount: number;
  avgPositionDelta: number;
  avgIncidents: number;
  consistency: number;
  confidenceLevel: ConfidenceLevel;
}

export interface OverallPerformance {
  totalRaces: number;
  avgIncidentsPerRace: number;
  avgPositionDelta: number;
  overallConsistency: number;
}

export interface GlobalStatistics {
  avgIncidentsPerRace: number;
  avgFinishPositionStdDev: number;
  avgStrengthOfField: number;
  strengthOfFieldVariability: number;
  attritionRate: number;
  avgRaceLength: number;
  dataQuality: 'high' | 'moderate' | 'default';
}

export interface CategoryAnalysis {
  primaryCategory: Category;
  confidence: number; // 0-1, based on percentage
  raceDistribution: CategoryDistribution;
}

export interface CategoryDistribution {
  road: number;
  oval: number;
  dirt_road: number;
  dirt_oval: number;
  total: number;
}

/**
 * Analytics Integration Layer
 * Maps analytics data to recommendation types and provides confidence indicators
 */
export class AnalyticsIntegration {
  /**
   * Get user performance data using existing analytics functions
   * Requirements: 2.1, 2.2, 2.3, 5.2
   * Performance Optimization: Added caching (Requirements: 8.1)
   */
  async getUserPerformanceData(userId: string): Promise<UserPerformanceData> {
    const startTime = Date.now();
    let cacheHit = false;
    let error: string | undefined;

    try {
      // TEMPORARILY DISABLE CACHE FOR DEBUGGING
      // Check cache first
      // const cacheKey = CacheKeys.userPerformanceData(userId);
      // const cached = recommendationCache.get<UserPerformanceData>(cacheKey);
      // if (cached) {
      //   cacheHit = true;
      //   analyticsLogger.log({
      //     timestamp: new Date(),
      //     method: 'getUserPerformanceData',
      //     userId,
      //     duration: Date.now() - startTime,
      //     cacheHit: true
      //   });
      //   return cached;
      // }

      // Get series-track performance using analytics system
      const analyticsData = await getPerformanceMetrics(userId, 'series_track');
      console.log(`Debug: Found ${analyticsData?.length || 0} series-track performance records for user ${userId}`);
      
      // Convert analytics data to recommendation format with confidence levels
      const seriesTrackHistory: SeriesTrackPerformance[] = (analyticsData || []).map(metric => ({
        seriesId: metric.seriesId!,
        trackId: metric.trackId!,
        raceCount: metric.raceCount,
        avgPositionDelta: metric.positionDelta,
        avgIncidents: metric.avgIncidents,
        consistency: metric.consistency, // Keep original value for now to match test expectations
        confidenceLevel: this.getConfidenceLevel(metric.raceCount)
      }));

      // Get overall stats using analytics system
      const overallAnalytics = await getPerformanceMetrics(userId, 'series');
      console.log(`Debug: Found ${overallAnalytics?.length || 0} series performance records for user ${userId}`);
      const overallStats = this.calculateOverallStats(overallAnalytics || []);

      // Get user's license classes with enhanced debugging (v2)
      console.log(`Debug: Querying licenses for user ${userId}`);
      console.log('Debug: Database URL exists:', !!process.env.DATABASE_URL);
      console.log('Debug: Database URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      
      let licenses = await db
        .select()
        .from(licenseClasses)
        .where(eq(licenseClasses.userId, userId));
      
      console.log(`Debug: First query result - found ${licenses?.length || 0} licenses`);
      
      // If no licenses found, wait a moment and try again (handles transaction timing issues)
      if ((!licenses || licenses.length === 0)) {
        console.log(`Debug: No licenses found on first attempt, retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        
        licenses = await db
          .select()
          .from(licenseClasses)
          .where(eq(licenseClasses.userId, userId));
        
        console.log(`Debug: Retry found ${licenses?.length || 0} licenses`);
        
        // If still no licenses, try a raw SQL query to see if it's a Drizzle issue
        if ((!licenses || licenses.length === 0)) {
          console.log('Debug: Trying raw SQL query as fallback...');
          try {
            const { neon } = await import('@neondatabase/serverless');
            const sql = neon(process.env.DATABASE_URL!);
            const rawResult = await sql`
              SELECT * FROM license_classes 
              WHERE user_id = ${userId}
            `;
            console.log(`Debug: Raw SQL found ${rawResult.length} licenses`);
            if (rawResult.length > 0) {
              // Convert raw result to expected format
              licenses = rawResult.map(row => ({
                id: row.id,
                userId: row.user_id,
                category: row.category,
                level: row.level,
                safetyRating: row.safety_rating,
                irating: row.irating,
                updatedAt: row.updated_at
              }));
              console.log('Debug: Converted raw result to Drizzle format');
            }
          } catch (rawError) {
            console.error('Debug: Raw SQL query failed:', rawError);
          }
        }
      }
      
      console.log(`Debug: Final query result - found ${licenses?.length || 0} licenses for user ${userId}`);
      if (licenses && licenses.length > 0) {
        console.log('License data from DB:', licenses);
      } else {
        console.log('Debug: User has no licenses');
      }

      // Detect primary category
      const primaryCategory = await this.getPrimaryCategory(userId);

      // Handle case where user has race data but no license data
      // This can happen if license sync failed or hasn't run yet
      let finalLicenses = licenses.map(license => ({
        category: license.category as Category,
        level: license.level as LicenseLevel,
        safetyRating: parseFloat(license.safetyRating),
        iRating: license.irating
      }));

      // If user has race data but no licenses, provide default licenses based on their racing activity
      if (finalLicenses.length === 0 && (analyticsData?.length || 0) > 0) {
        console.log(`Debug: User ${userId} has race data but no licenses. Providing default licenses.`);
        
        // Provide default license for the primary category
        finalLicenses = [{
          category: primaryCategory,
          level: 'D' as LicenseLevel, // Default to D license
          safetyRating: 3.0, // Default safe rating
          iRating: 1350 // Default iRating
        }];

        console.log(`Debug: Generated default licenses:`, finalLicenses);
      }

      const result: UserPerformanceData = {
        seriesTrackHistory,
        overallStats,
        primaryCategory,
        licenseClasses: finalLicenses
      };

      // TEMPORARILY DISABLE CACHE FOR DEBUGGING
      // Cache the result
      // recommendationCache.set(cacheKey, result, CacheTTL.USER_PERFORMANCE);

      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error in getUserPerformanceData:', error);
      
      // Return safe defaults on error
      const defaultResult: UserPerformanceData = {
        seriesTrackHistory: [],
        overallStats: {
          totalRaces: 0,
          avgIncidentsPerRace: 0,
          avgPositionDelta: 0,
          overallConsistency: 0
        },
        primaryCategory: 'road' as Category,
        licenseClasses: []
      };
      
      return defaultResult;
    } finally {
      analyticsLogger.log({
        timestamp: new Date(),
        method: 'getUserPerformanceData',
        userId,
        duration: Date.now() - startTime,
        cacheHit,
        error
      });
    }
  }

  /**
   * Get global statistics using existing analytics functions
   * Requirements: 2.3
   * Performance Optimization: Added caching (Requirements: 8.1)
   */
  async getGlobalStatistics(seriesId: number, trackId: number): Promise<GlobalStatistics> {
    const startTime = Date.now();
    let cacheHit = false;
    let error: string | undefined;

    try {
      // Check cache first
      const cacheKey = CacheKeys.globalStats(seriesId, trackId);
      const cached = recommendationCache.get<GlobalStatistics>(cacheKey);
      if (cached) {
        cacheHit = true;
        analyticsLogger.log({
          timestamp: new Date(),
          method: 'getGlobalStatistics',
          seriesId,
          trackId,
          duration: Date.now() - startTime,
          cacheHit: true
        });
        return cached;
      }

      const analyticsStats = await getGlobalSeriesTrackStats(seriesId, trackId);
      
      let result: GlobalStatistics;
      
      if (!analyticsStats || analyticsStats.totalRaces < 10) {
        // Insufficient data - return defaults with appropriate quality indicator
        result = {
          avgIncidentsPerRace: 2.5,
          avgFinishPositionStdDev: 8.0,
          avgStrengthOfField: 1500,
          strengthOfFieldVariability: 300,
          attritionRate: 15,
          avgRaceLength: 60,
          dataQuality: 'default'
        };
      } else {
        // Convert analytics data to recommendation format
        const dataQuality: 'high' | 'moderate' | 'default' = 
          analyticsStats.totalRaces >= 50 ? 'high' : 
          analyticsStats.totalRaces >= 20 ? 'moderate' : 'default';

        result = {
          avgIncidentsPerRace: parseFloat(analyticsStats.avgIncidents?.toString() ?? '2.5'),
          avgFinishPositionStdDev: analyticsStats.consistencyMetric ?? 8.0,
          avgStrengthOfField: parseFloat(analyticsStats.avgStrengthOfField?.toString() ?? '1500'),
          strengthOfFieldVariability: 300, // Default - analytics doesn't track this yet
          attritionRate: (analyticsStats.attritionRate ?? 0.15) * 100, // Convert to percentage
          avgRaceLength: 60, // Default - analytics doesn't track this yet
          dataQuality
        };
      }

      // Cache the result
      recommendationCache.set(cacheKey, result, CacheTTL.GLOBAL_STATS);

      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      analyticsLogger.log({
        timestamp: new Date(),
        method: 'getGlobalStatistics',
        seriesId,
        trackId,
        duration: Date.now() - startTime,
        cacheHit,
        error
      });
    }
  }

  /**
   * Detect user's primary racing category
   * Requirements: 9.1, 9.2
   * Performance Optimization: Added caching (Requirements: 8.1)
   */
  async getPrimaryCategory(userId: string): Promise<Category> {
    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Check cache first
    // const cacheKey = CacheKeys.primaryCategory(userId);
    // const cached = recommendationCache.get<Category>(cacheKey);
    // if (cached) {
    //   return cached;
    // }

    const categoryAnalysis = await this.getCategoryDistribution(userId);
    
    // If user has 70%+ races in one category, that's their primary
    const totalRaces = categoryAnalysis.total;
    let result: Category = 'road'; // Default to road if no data

    if (totalRaces > 0) {
      const roadPercentage = categoryAnalysis.road / totalRaces;
      const ovalPercentage = categoryAnalysis.oval / totalRaces;
      const dirtRoadPercentage = categoryAnalysis.dirt_road / totalRaces;
      const dirtOvalPercentage = categoryAnalysis.dirt_oval / totalRaces;

      if (roadPercentage >= 0.7) result = 'road';
      else if (ovalPercentage >= 0.7) result = 'oval';
      else if (dirtRoadPercentage >= 0.7) result = 'dirt_road';
      else if (dirtOvalPercentage >= 0.7) result = 'dirt_oval';
      else {
        // If no clear primary (70%+), return the category with most races
        const maxRaces = Math.max(
          categoryAnalysis.road,
          categoryAnalysis.oval,
          categoryAnalysis.dirt_road,
          categoryAnalysis.dirt_oval
        );

        if (categoryAnalysis.road === maxRaces) result = 'road';
        else if (categoryAnalysis.oval === maxRaces) result = 'oval';
        else if (categoryAnalysis.dirt_road === maxRaces) result = 'dirt_road';
        else result = 'dirt_oval';
      }
    }

    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Cache the result
    // recommendationCache.set(cacheKey, result, CacheTTL.PRIMARY_CATEGORY);

    return result;
  }

  /**
   * Calculate confidence level based on race count thresholds
   * Requirements: 5.2
   */
  getConfidenceLevel(raceCount: number): ConfidenceLevel {
    if (raceCount >= 3) return 'high';
    if (raceCount >= 1) return 'estimated';
    return 'no_data';
  }

  /**
   * Batch processing: Get global statistics for multiple series-track combinations
   * Performance Optimization: Requirements 8.2
   */
  async getBatchGlobalStatistics(
    combinations: Array<{seriesId: number, trackId: number}>
  ): Promise<Array<{seriesId: number, trackId: number, stats: GlobalStatistics}>> {
    return batchProcessor.getBatchGlobalStats(combinations);
  }

  /**
   * Batch processing: Get user performance for multiple series-track combinations
   * Performance Optimization: Requirements 8.2
   */
  async getBatchUserPerformance(
    userId: string,
    combinations: Array<{seriesId: number, trackId: number}>
  ): Promise<Array<{seriesId: number, trackId: number, performance: SeriesTrackPerformance}>> {
    const batchResults = await batchProcessor.getBatchUserPerformance(userId, combinations);
    
    return batchResults.map(result => ({
      seriesId: result.seriesId,
      trackId: result.trackId,
      performance: {
        seriesId: result.seriesId,
        trackId: result.trackId,
        raceCount: result.raceCount,
        avgPositionDelta: result.avgPositionDelta,
        avgIncidents: result.avgIncidents,
        consistency: result.consistency,
        confidenceLevel: this.getConfidenceLevel(result.raceCount)
      }
    }));
  }

  /**
   * Performance optimization: Prefetch data for common combinations
   * Requirements: 8.3
   */
  async prefetchUserData(userId: string): Promise<void> {
    await batchProcessor.warmupUserCache(userId);
    await batchProcessor.prefetchCommonCombinations(userId);
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics() {
    return batchProcessor.getCacheMetrics();
  }

  /**
   * Get analytics integration call logs and statistics
   * Requirements: 12.4 - Add logging for analytics integration calls
   */
  getAnalyticsCallLogs(limit?: number) {
    return analyticsLogger.getCalls(limit);
  }

  /**
   * Get analytics integration call statistics
   * Requirements: 12.4 - Add logging for analytics integration calls
   */
  getAnalyticsCallStats() {
    return analyticsLogger.getCallStats();
  }

  /**
   * Clear analytics call logs
   */
  clearAnalyticsLogs() {
    analyticsLogger.clear();
  }

  /**
   * Clear all caches (useful for testing or data refresh)
   */
  clearCaches(): void {
    batchProcessor.clearAllCaches();
  }

  /**
   * Get category distribution for primary category detection
   * Performance Optimization: Added caching (Requirements: 8.1)
   */
  private async getCategoryDistribution(userId: string): Promise<CategoryDistribution> {
    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Check cache first
    // const cacheKey = CacheKeys.categoryDistribution(userId);
    // const cached = recommendationCache.get<CategoryDistribution>(cacheKey);
    // if (cached) {
    //   return cached;
    // }

    // Join raceResults with scheduleEntries to get category information
    // Since raceResults doesn't have a category column, we need to join with scheduleEntries
    const results = await db
      .select({
        category: scheduleEntries.category,
        raceCount: sql<number>`COUNT(*)`
      })
      .from(raceResults)
      .innerJoin(scheduleEntries, and(
        eq(raceResults.seriesId, scheduleEntries.seriesId),
        eq(raceResults.trackId, scheduleEntries.trackId)
      ))
      .where(and(
        eq(raceResults.userId, userId),
        eq(raceResults.sessionType, 'race') // Only count actual race sessions
      ))
      .groupBy(scheduleEntries.category);

    const distribution: CategoryDistribution = {
      road: 0,
      oval: 0,
      dirt_road: 0,
      dirt_oval: 0,
      total: 0
    };

    results.forEach(result => {
      const category = result.category as Category;
      const count = result.raceCount;
      
      if (category in distribution) {
        distribution[category] = count;
        distribution.total += count;
      }
    });

    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Cache the result
    // recommendationCache.set(cacheKey, distribution, CacheTTL.PRIMARY_CATEGORY);

    return distribution;
  }

  /**
   * Calculate overall stats from analytics data
   */
  private calculateOverallStats(analyticsData: any[]): OverallPerformance {
    if (analyticsData.length === 0) {
      return {
        totalRaces: 0,
        avgIncidentsPerRace: 0,
        avgPositionDelta: 0,
        overallConsistency: 0
      };
    }

    // Aggregate across all series
    let totalRaces = 0;
    let totalIncidents = 0;
    let totalPositionDelta = 0;
    let totalConsistency = 0;

    analyticsData.forEach(metric => {
      totalRaces += metric.raceCount;
      totalIncidents += metric.avgIncidents * metric.raceCount;
      totalPositionDelta += metric.positionDelta * metric.raceCount;
      
      // Handle NaN consistency values
      const consistencyValue = Number.isFinite(metric.consistency) ? metric.consistency : 0;
      totalConsistency += consistencyValue * metric.raceCount;
    });

    return {
      totalRaces,
      avgIncidentsPerRace: totalRaces > 0 ? totalIncidents / totalRaces : 0,
      avgPositionDelta: totalRaces > 0 ? totalPositionDelta / totalRaces : 0,
      overallConsistency: totalRaces > 0 ? totalConsistency / totalRaces : 0
    };
  }
}

// Export singleton instance
export const analyticsIntegration = new AnalyticsIntegration();