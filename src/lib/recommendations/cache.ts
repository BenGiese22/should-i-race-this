/**
 * Performance Optimization: Caching System for Recommendations
 * Requirements: 8.1, 8.2, 8.3
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

/**
 * In-memory cache with TTL support and performance monitoring
 */
export class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0
  };

  /**
   * Get cached value or return null if expired/missing
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired - remove from cache
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0
    };
  }
}

/**
 * Cache key generators for consistent caching
 */
export class CacheKeys {
  static userPerformanceData(userId: string): string {
    return `user_performance:${userId}`;
  }

  static globalStats(seriesId: number, trackId: number): string {
    return `global_stats:${seriesId}:${trackId}`;
  }

  static primaryCategory(userId: string): string {
    return `primary_category:${userId}`;
  }

  static categoryDistribution(userId: string): string {
    return `category_dist:${userId}`;
  }

  static racingOpportunities(): string {
    return 'racing_opportunities';
  }

  static batchGlobalStats(combinations: Array<{seriesId: number, trackId: number}>): string {
    const sorted = combinations
      .map(c => `${c.seriesId}:${c.trackId}`)
      .sort()
      .join(',');
    return `batch_global_stats:${sorted}`;
  }

  static userLicenses(userId: string): string {
    return `user_licenses:${userId}`;
  }
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  USER_PERFORMANCE: 5 * 60 * 1000,      // 5 minutes - user data changes less frequently
  GLOBAL_STATS: 10 * 60 * 1000,         // 10 minutes - global stats are more stable
  PRIMARY_CATEGORY: 30 * 60 * 1000,     // 30 minutes - category rarely changes
  RACING_OPPORTUNITIES: 60 * 1000,      // 1 minute - next race times need frequent updates
  USER_LICENSES: 60 * 60 * 1000,        // 1 hour - licenses change infrequently
  BATCH_OPERATIONS: 10 * 60 * 1000       // 10 minutes - batch results are stable
} as const;

// Export singleton cache instance
export const recommendationCache = new PerformanceCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const removed = recommendationCache.cleanup();
  if (removed > 0) {
    console.log(`Cache cleanup: removed ${removed} expired entries`);
  }
}, 5 * 60 * 1000);