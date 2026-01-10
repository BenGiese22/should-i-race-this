/**
 * Performance Monitoring System for Production Deployment
 * Requirements: General performance improvements
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  category: 'api' | 'ui' | 'cache' | 'database' | 'network';
  tags?: Record<string, string>;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
}

export interface PerformanceAlert {
  metric: string;
  level: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

/**
 * Performance monitoring class with alerting and metrics collection
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private maxMetricsHistory = 1000; // Keep last 1000 metrics
  private maxAlertsHistory = 100;   // Keep last 100 alerts

  constructor() {
    this.setupDefaultThresholds();
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    category: PerformanceMetric['category'],
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      category,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    
    // Trim metrics history
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check thresholds and generate alerts
    this.checkThresholds(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${name}: ${value}${unit} (${category})`, tags);
    }
  }

  /**
   * Time a function execution and record the metric
   */
  async timeFunction<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', category, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', category, { 
        ...tags, 
        error: 'true',
        errorType: error instanceof Error ? error.constructor.name : 'unknown'
      });
      throw error;
    }
  }

  /**
   * Record API response time
   */
  recordApiMetric(endpoint: string, method: string, duration: number, status: number): void {
    this.recordMetric(
      'api_response_time',
      duration,
      'ms',
      'api',
      {
        endpoint,
        method,
        status: status.toString(),
        success: status < 400 ? 'true' : 'false'
      }
    );
  }

  /**
   * Record cache performance
   */
  recordCacheMetric(operation: 'hit' | 'miss' | 'set', cacheType: string): void {
    this.recordMetric(
      'cache_operation',
      1,
      'count',
      'cache',
      {
        operation,
        cacheType
      }
    );
  }

  /**
   * Record database query performance
   */
  recordDatabaseMetric(query: string, duration: number, rowCount?: number): void {
    this.recordMetric(
      'database_query_time',
      duration,
      'ms',
      'database',
      {
        query: query.substring(0, 50), // Truncate long queries
        rowCount: rowCount?.toString()
      }
    );
  }

  /**
   * Record UI rendering performance
   */
  recordUIMetric(component: string, operation: string, duration: number): void {
    this.recordMetric(
      'ui_render_time',
      duration,
      'ms',
      'ui',
      {
        component,
        operation
      }
    );
  }

  /**
   * Get performance summary for the last N minutes
   */
  getPerformanceSummary(lastMinutes: number = 5): {
    metrics: {
      api: { avg: number; p95: number; count: number };
      cache: { hitRate: number; operations: number };
      database: { avg: number; p95: number; count: number };
      ui: { avg: number; p95: number; count: number };
    };
    alerts: PerformanceAlert[];
    timeRange: { start: number; end: number };
  } {
    const cutoffTime = Date.now() - (lastMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    const recentAlerts = this.alerts.filter(a => a.timestamp >= cutoffTime);

    // Calculate API metrics
    const apiMetrics = recentMetrics.filter(m => m.category === 'api');
    const apiTimes = apiMetrics.map(m => m.value);
    
    // Calculate cache metrics
    const cacheMetrics = recentMetrics.filter(m => m.category === 'cache');
    const cacheHits = cacheMetrics.filter(m => m.tags?.operation === 'hit').length;
    const cacheMisses = cacheMetrics.filter(m => m.tags?.operation === 'miss').length;
    const cacheHitRate = cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    // Calculate database metrics
    const dbMetrics = recentMetrics.filter(m => m.category === 'database');
    const dbTimes = dbMetrics.map(m => m.value);

    // Calculate UI metrics
    const uiMetrics = recentMetrics.filter(m => m.category === 'ui');
    const uiTimes = uiMetrics.map(m => m.value);

    return {
      metrics: {
        api: {
          avg: this.calculateAverage(apiTimes),
          p95: this.calculatePercentile(apiTimes, 95),
          count: apiTimes.length
        },
        cache: {
          hitRate: cacheHitRate,
          operations: cacheMetrics.length
        },
        database: {
          avg: this.calculateAverage(dbTimes),
          p95: this.calculatePercentile(dbTimes, 95),
          count: dbTimes.length
        },
        ui: {
          avg: this.calculateAverage(uiTimes),
          p95: this.calculatePercentile(uiTimes, 95),
          count: uiTimes.length
        }
      },
      alerts: recentAlerts,
      timeRange: {
        start: cutoffTime,
        end: Date.now()
      }
    };
  }

  /**
   * Get all metrics for export/analysis
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Set performance threshold for a metric
   */
  setThreshold(metricName: string, warning: number, critical: number): void {
    this.thresholds.set(metricName, { warning, critical });
  }

  private setupDefaultThresholds(): void {
    // API response time thresholds
    this.setThreshold('api_response_time', 1000, 3000); // 1s warning, 3s critical
    
    // Database query thresholds
    this.setThreshold('database_query_time', 500, 2000); // 500ms warning, 2s critical
    
    // UI render time thresholds
    this.setThreshold('ui_render_time', 100, 500); // 100ms warning, 500ms critical
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;

    let alertLevel: 'warning' | 'critical' | null = null;
    let thresholdValue = 0;

    if (metric.value >= threshold.critical) {
      alertLevel = 'critical';
      thresholdValue = threshold.critical;
    } else if (metric.value >= threshold.warning) {
      alertLevel = 'warning';
      thresholdValue = threshold.warning;
    }

    if (alertLevel) {
      const alert: PerformanceAlert = {
        metric: metric.name,
        level: alertLevel,
        value: metric.value,
        threshold: thresholdValue,
        timestamp: metric.timestamp,
        message: `${metric.name} exceeded ${alertLevel} threshold: ${metric.value}${metric.unit} > ${thresholdValue}${metric.unit}`
      };

      this.alerts.push(alert);
      
      // Trim alerts history
      if (this.alerts.length > this.maxAlertsHistory) {
        this.alerts = this.alerts.slice(-this.maxAlertsHistory);
      }

      // Log alert
      console.warn(`[PERF ALERT] ${alert.message}`, metric.tags);
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring in components
 */
export function usePerformanceMonitor() {
  const recordRenderTime = (componentName: string, operation: string, duration: number) => {
    performanceMonitor.recordUIMetric(componentName, operation, duration);
  };

  const timeRender = async <T>(
    componentName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return performanceMonitor.timeFunction(
      'ui_render_time',
      'ui',
      fn,
      { component: componentName, operation }
    );
  };

  return {
    recordRenderTime,
    timeRender,
    getMetrics: () => performanceMonitor.getPerformanceSummary()
  };
}