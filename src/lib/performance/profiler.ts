/**
 * Performance Profiler for Identifying Bottlenecks
 * Requirements: General performance improvements - profile recommendation loading times and optimize bottlenecks
 */

import { performanceMonitor } from './monitoring';

export interface ProfileResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  children: ProfileResult[];
  metadata?: Record<string, any>;
}

export interface ProfilerOptions {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  threshold?: number; // Only log operations slower than this (ms)
}

/**
 * Performance profiler for detailed timing analysis
 */
export class PerformanceProfiler {
  private activeProfiles = new Map<string, { startTime: number; children: ProfileResult[] }>();
  private completedProfiles: ProfileResult[] = [];
  private options: ProfilerOptions;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      enableLogging: true,
      enableMetrics: true,
      threshold: 10,
      ...options
    };
  }

  /**
   * Start profiling an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    
    this.activeProfiles.set(name, {
      startTime,
      children: []
    });

    if (this.options.enableLogging) {
      console.time(`[PROFILE] ${name}`);
    }
  }

  /**
   * End profiling an operation
   */
  end(name: string, metadata?: Record<string, any>): ProfileResult | null {
    const endTime = performance.now();
    const profile = this.activeProfiles.get(name);
    
    if (!profile) {
      console.warn(`[PROFILER] No active profile found for: ${name}`);
      return null;
    }

    const duration = endTime - profile.startTime;
    const result: ProfileResult = {
      name,
      duration,
      startTime: profile.startTime,
      endTime,
      children: profile.children,
      metadata
    };

    this.activeProfiles.delete(name);
    this.completedProfiles.push(result);

    // Log if enabled and above threshold
    if (this.options.enableLogging) {
      console.timeEnd(`[PROFILE] ${name}`);
      
      if (duration > (this.options.threshold || 10)) {
        console.log(`[PROFILE] ${name}: ${duration.toFixed(2)}ms`, metadata);
      }
    }

    // Record metric if enabled
    if (this.options.enableMetrics) {
      performanceMonitor.recordMetric(
        'profiler_operation',
        duration,
        'ms',
        'api',
        { operation: name, ...metadata }
      );
    }

    return result;
  }

  /**
   * Profile a function execution
   */
  async profile<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; profile: ProfileResult }> {
    this.start(name, metadata);
    
    try {
      const result = await fn();
      const profile = this.end(name, metadata)!;
      return { result, profile };
    } catch (error) {
      const profile = this.end(name, { ...metadata, error: true })!;
      throw error;
    }
  }

  /**
   * Profile a synchronous function
   */
  profileSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; profile: ProfileResult } {
    this.start(name, metadata);
    
    try {
      const result = fn();
      const profile = this.end(name, metadata)!;
      return { result, profile };
    } catch (error) {
      const profile = this.end(name, { ...metadata, error: true })!;
      throw error;
    }
  }

  /**
   * Get all completed profiles
   */
  getProfiles(): ProfileResult[] {
    return [...this.completedProfiles];
  }

  /**
   * Get profiles filtered by name pattern
   */
  getProfilesByName(pattern: string | RegExp): ProfileResult[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.completedProfiles.filter(profile => regex.test(profile.name));
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    totalTime: number;
    averageTime: number;
    slowestOperations: ProfileResult[];
    operationCounts: Record<string, number>;
    operationTotals: Record<string, number>;
  } {
    const totalOperations = this.completedProfiles.length;
    const totalTime = this.completedProfiles.reduce((sum, p) => sum + p.duration, 0);
    const averageTime = totalOperations > 0 ? totalTime / totalOperations : 0;
    
    const slowestOperations = [...this.completedProfiles]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const operationCounts: Record<string, number> = {};
    const operationTotals: Record<string, number> = {};

    this.completedProfiles.forEach(profile => {
      operationCounts[profile.name] = (operationCounts[profile.name] || 0) + 1;
      operationTotals[profile.name] = (operationTotals[profile.name] || 0) + profile.duration;
    });

    return {
      totalOperations,
      totalTime,
      averageTime,
      slowestOperations,
      operationCounts,
      operationTotals
    };
  }

  /**
   * Clear all profiles
   */
  clear(): void {
    this.activeProfiles.clear();
    this.completedProfiles = [];
  }

  /**
   * Export profiles for analysis
   */
  export(): {
    profiles: ProfileResult[];
    summary: ReturnType<typeof this.getSummary>;
    timestamp: number;
  } {
    return {
      profiles: this.getProfiles(),
      summary: this.getSummary(),
      timestamp: Date.now()
    };
  }
}

/**
 * Decorator for automatic profiling of class methods
 */
export function profile(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const profileName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const profiler = new PerformanceProfiler();
      
      if (originalMethod.constructor.name === 'AsyncFunction') {
        const { result } = await profiler.profile(profileName, () => originalMethod.apply(this, args));
        return result;
      } else {
        const { result } = profiler.profileSync(profileName, () => originalMethod.apply(this, args));
        return result;
      }
    };

    return descriptor;
  };
}

/**
 * Utility functions for common profiling scenarios
 */
export class ProfilerUtils {
  /**
   * Profile database queries
   */
  static async profileQuery<T>(
    queryName: string,
    query: () => Promise<T>,
    expectedRowCount?: number
  ): Promise<T> {
    const profiler = new PerformanceProfiler();
    const { result, profile } = await profiler.profile(
      `db_query_${queryName}`,
      query,
      { queryName, expectedRowCount }
    );

    // Record database metric
    performanceMonitor.recordDatabaseMetric(queryName, profile.duration, expectedRowCount);

    return result;
  }

  /**
   * Profile API calls
   */
  static async profileApiCall<T>(
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const profiler = new PerformanceProfiler();
    const startTime = Date.now();
    
    try {
      const { result, profile } = await profiler.profile(
        `api_${method}_${endpoint}`,
        apiCall,
        { endpoint, method }
      );

      // Record API metric
      performanceMonitor.recordApiMetric(endpoint, method, profile.duration, 200);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = error instanceof Error && 'status' in error ? (error as any).status : 500;
      
      performanceMonitor.recordApiMetric(endpoint, method, duration, status);
      throw error;
    }
  }

  /**
   * Profile React component renders
   */
  static profileRender<T>(
    componentName: string,
    renderFn: () => T
  ): T {
    const profiler = new PerformanceProfiler();
    const { result, profile } = profiler.profileSync(
      `render_${componentName}`,
      renderFn,
      { component: componentName }
    );

    // Record UI metric
    performanceMonitor.recordUIMetric(componentName, 'render', profile.duration);

    return result;
  }

  /**
   * Profile cache operations
   */
  static profileCache<T>(
    operation: 'get' | 'set' | 'delete',
    cacheKey: string,
    cacheFn: () => T
  ): T {
    const profiler = new PerformanceProfiler();
    const { result, profile } = profiler.profileSync(
      `cache_${operation}`,
      cacheFn,
      { operation, cacheKey }
    );

    // Record cache metric
    performanceMonitor.recordCacheMetric(
      operation === 'get' ? (result ? 'hit' : 'miss') : 'set',
      'recommendation'
    );

    return result;
  }
}

// Export singleton profiler for global use
export const globalProfiler = new PerformanceProfiler({
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
  threshold: 50 // Only log operations slower than 50ms
});