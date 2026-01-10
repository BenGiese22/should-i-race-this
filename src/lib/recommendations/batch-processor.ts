/**
 * Performance Optimization: Batch Processing for Multiple Series-Track Combinations
 * Requirements: 8.2, 8.3
 */

import { getGlobalSeriesTrackStats, getPerformanceMetrics } from '../db/analytics';
import { recommendationCache, CacheKeys, CacheTTL } from './cache';
import type { GlobalStatistics } from './analytics-integration';

export interface BatchRequest {
  seriesId: number;
  trackId: number;
}

export interface BatchGlobalStatsResult {
  seriesId: number;
  trackId: number;
  stats: GlobalStatistics;
  fromCache: boolean;
}

export interface BatchPerformanceResult {
  userId: string;
  seriesId: number;
  trackId: number;
  raceCount: number;
  avgPositionDelta: number;
  avgIncidents: number;
  consistency: number;
  fromCache: boolean;
}

/**
 * Batch processor for optimizing multiple database queries
 */
export class BatchProcessor {
  /**
   * Get global statistics for multiple series-track combinations with caching
   * Requirements: 8.1, 8.2
   */
  async getBatchGlobalStats(requests: BatchRequest[]): Promise<BatchGlobalStatsResult[]> {
    const results: BatchGlobalStatsResult[] = [];
    const uncachedRequests: BatchRequest[] = [];

    // Check cache first for each request
    for (const request of requests) {
      const cacheKey = CacheKeys.globalStats(request.seriesId, request.trackId);
      const cached = recommendationCache.get<GlobalStatistics>(cacheKey);
      
      if (cached) {
        results.push({
          ...request,
          stats: cached,
          fromCache: true
        });
      } else {
        uncachedRequests.push(request);
      }
    }

    // Process uncached requests in batches to avoid overwhelming the database
    const batchSize = 10; // Process 10 at a time
    for (let i = 0; i < uncachedRequests.length; i += batchSize) {
      const batch = uncachedRequests.slice(i, i + batchSize);
      
      // Execute batch queries in parallel
      const batchPromises = batch.map(async (request) => {
        try {
          const analyticsStats = await getGlobalSeriesTrackStats(request.seriesId, request.trackId);
          
          let stats: GlobalStatistics;
          if (!analyticsStats || analyticsStats.totalRaces < 10) {
            // Insufficient data - return defaults
            stats = {
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

            stats = {
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
          const cacheKey = CacheKeys.globalStats(request.seriesId, request.trackId);
          recommendationCache.set(cacheKey, stats, CacheTTL.GLOBAL_STATS);

          return {
            ...request,
            stats,
            fromCache: false
          };
        } catch (error) {
          console.error(`Error processing batch request for series ${request.seriesId}, track ${request.trackId}:`, error);
          
          // Return default stats on error
          const defaultStats: GlobalStatistics = {
            avgIncidentsPerRace: 2.5,
            avgFinishPositionStdDev: 8.0,
            avgStrengthOfField: 1500,
            strengthOfFieldVariability: 300,
            attritionRate: 15,
            avgRaceLength: 60,
            dataQuality: 'default'
          };

          return {
            ...request,
            stats: defaultStats,
            fromCache: false
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get user performance data for multiple series-track combinations with caching
   * Requirements: 8.1, 8.2
   */
  async getBatchUserPerformance(
    userId: string, 
    requests: BatchRequest[]
  ): Promise<BatchPerformanceResult[]> {
    // Check if we have cached user performance data
    const userCacheKey = CacheKeys.userPerformanceData(userId);
    let userPerformanceData = recommendationCache.get<any[]>(userCacheKey);

    if (!userPerformanceData) {
      // Fetch all user performance data at once
      userPerformanceData = await getPerformanceMetrics(userId, 'series_track');
      recommendationCache.set(userCacheKey, userPerformanceData, CacheTTL.USER_PERFORMANCE);
    }

    // Create a map for fast lookup
    const performanceMap = new Map<string, any>();
    userPerformanceData.forEach(metric => {
      if (metric.seriesId && metric.trackId) {
        const key = `${metric.seriesId}:${metric.trackId}`;
        performanceMap.set(key, metric);
      }
    });

    // Build results for all requested combinations
    const results: BatchPerformanceResult[] = requests.map(request => {
      const key = `${request.seriesId}:${request.trackId}`;
      const performance = performanceMap.get(key);

      if (performance) {
        return {
          userId,
          seriesId: request.seriesId,
          trackId: request.trackId,
          raceCount: performance.raceCount,
          avgPositionDelta: performance.positionDelta,
          avgIncidents: performance.avgIncidents,
          consistency: performance.consistency || 0,
          fromCache: true // Since we got it from cache or single query
        };
      } else {
        // No data for this combination
        return {
          userId,
          seriesId: request.seriesId,
          trackId: request.trackId,
          raceCount: 0,
          avgPositionDelta: 0,
          avgIncidents: 0,
          consistency: 0,
          fromCache: false
        };
      }
    });

    return results;
  }

  /**
   * Prefetch commonly requested data combinations
   * Requirements: 8.3
   */
  async prefetchCommonCombinations(userId: string): Promise<void> {
    try {
      // Get user's most common series-track combinations from their history
      const userPerformanceData = await getPerformanceMetrics(userId, 'series_track');
      
      // Sort by race count and take top 20 combinations
      const topCombinations = userPerformanceData
        .filter(metric => metric.seriesId && metric.trackId && metric.raceCount > 0)
        .sort((a, b) => b.raceCount - a.raceCount)
        .slice(0, 20)
        .map(metric => ({
          seriesId: metric.seriesId!,
          trackId: metric.trackId!
        }));

      if (topCombinations.length > 0) {
        // Prefetch global stats for these combinations
        await this.getBatchGlobalStats(topCombinations);
      }
    } catch (error) {
      console.warn('Prefetch failed:', error);
      // Don't throw - prefetch is optional optimization
    }
  }

  /**
   * Warm up cache with user data
   * Requirements: 8.3
   */
  async warmupUserCache(userId: string): Promise<void> {
    try {
      // Prefetch user performance data
      const userCacheKey = CacheKeys.userPerformanceData(userId);
      if (!recommendationCache.get(userCacheKey)) {
        const userPerformanceData = await getPerformanceMetrics(userId, 'series_track');
        recommendationCache.set(userCacheKey, userPerformanceData, CacheTTL.USER_PERFORMANCE);
      }

      // Prefetch user licenses
      const licensesCacheKey = CacheKeys.userLicenses(userId);
      if (!recommendationCache.get(licensesCacheKey)) {
        // This would be fetched by analytics integration, so we'll let it handle caching
      }

      // Prefetch primary category
      const categoryCacheKey = CacheKeys.primaryCategory(userId);
      if (!recommendationCache.get(categoryCacheKey)) {
        // This would be calculated by category analyzer, so we'll let it handle caching
      }
    } catch (error) {
      console.warn('Cache warmup failed:', error);
      // Don't throw - warmup is optional optimization
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): {
    stats: ReturnType<typeof recommendationCache.getStats>;
    size: number;
    keys: string[];
  } {
    return {
      stats: recommendationCache.getStats(),
      size: recommendationCache.size(),
      keys: recommendationCache.getKeys()
    };
  }

  /**
   * Clear all caches (useful for testing or data refresh)
   */
  clearAllCaches(): void {
    recommendationCache.clear();
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor();