/**
 * Performance Monitoring API for Production Deployment
 * Requirements: General performance improvements - performance monitoring for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { performanceMonitor } from '@/lib/performance/monitoring';
import { recommendationEngine } from '@/lib/recommendations';
import { batchProcessor } from '@/lib/recommendations/batch-processor';

// Helper function to create standardized responses
function createResponse(data: any, status: number = 200) {
  return NextResponse.json({
    ...data,
    timestamp: new Date().toISOString(),
    server: process.env.NODE_ENV
  }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';
    const minutes = parseInt(searchParams.get('minutes') || '5', 10);

    // Public endpoints (no auth required for monitoring)
    switch (action) {
      case 'health':
        // Basic health check
        return createResponse({
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || 'unknown'
        });

      case 'summary':
        // Performance summary for the last N minutes
        const summary = performanceMonitor.getPerformanceSummary(minutes);
        return createResponse({
          action: 'summary',
          timeRangeMinutes: minutes,
          ...summary
        });

      case 'cache-metrics':
        // Cache performance metrics
        const cacheMetrics = batchProcessor.getCacheMetrics();
        const engineMetrics = recommendationEngine.getPerformanceMetrics();
        
        return createResponse({
          action: 'cache-metrics',
          batchProcessor: cacheMetrics,
          recommendationEngine: engineMetrics
        });

      case 'alerts':
        // Get recent performance alerts
        const alerts = performanceMonitor.getAllAlerts()
          .filter(alert => alert.timestamp > Date.now() - (minutes * 60 * 1000))
          .sort((a, b) => b.timestamp - a.timestamp);
        
        return createResponse({
          action: 'alerts',
          timeRangeMinutes: minutes,
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.level === 'critical').length,
            warning: alerts.filter(a => a.level === 'warning').length
          }
        });

      default:
        return createResponse(
          { error: 'Invalid action. Use: health, summary, cache-metrics, alerts' },
          400
        );
    }
  } catch (error) {
    console.error('Error in performance monitoring API:', error);
    return createResponse(
      { error: 'Failed to get performance metrics' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for write operations
    const session = await getSession();
    if (!session?.userId) {
      return createResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'benchmark':
        // Run performance benchmark
        const benchmarkResults = await runPerformanceBenchmark(session.userId, params);
        return createResponse({
          action: 'benchmark',
          results: benchmarkResults
        });

      case 'load-test':
        // Run load test
        const loadTestResults = await runLoadTest(session.userId, params);
        return createResponse({
          action: 'load-test',
          results: loadTestResults
        });

      case 'clear-cache':
        // Clear all caches
        batchProcessor.clearAllCaches();
        recommendationEngine.clearCaches();
        performanceMonitor.clear();
        
        return createResponse({
          action: 'clear-cache',
          message: 'All caches and metrics cleared'
        });

      case 'record-metric':
        // Record custom performance metric
        const { name, value, unit, category, tags } = params;
        
        if (!name || value === undefined || !unit || !category) {
          return createResponse(
            { error: 'Missing required parameters: name, value, unit, category' },
            400
          );
        }
        
        performanceMonitor.recordMetric(name, value, unit, category, tags);
        
        return createResponse({
          action: 'record-metric',
          message: 'Metric recorded successfully',
          metric: { name, value, unit, category, tags }
        });

      case 'set-threshold':
        // Set performance threshold
        const { metricName, warning, critical } = params;
        
        if (!metricName || warning === undefined || critical === undefined) {
          return createResponse(
            { error: 'Missing required parameters: metricName, warning, critical' },
            400
          );
        }
        
        performanceMonitor.setThreshold(metricName, warning, critical);
        
        return createResponse({
          action: 'set-threshold',
          message: 'Threshold set successfully',
          threshold: { metricName, warning, critical }
        });

      default:
        return createResponse(
          { error: 'Invalid action. Use: benchmark, load-test, clear-cache, record-metric, set-threshold' },
          400
        );
    }
  } catch (error) {
    console.error('Error in performance monitoring POST:', error);
    return createResponse(
      { error: 'Failed to execute performance operation' },
      500
    );
  }
}

/**
 * Run comprehensive performance benchmark
 */
async function runPerformanceBenchmark(userId: string, params: any) {
  const { iterations = 5, maxResults = 20 } = params;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    // Clear caches for cold start measurement
    if (i === 0) {
      batchProcessor.clearAllCaches();
      recommendationEngine.clearCaches();
    }

    const startTime = performance.now();
    
    try {
      const recommendations = await performanceMonitor.timeFunction(
        'benchmark_recommendations',
        'api',
        () => recommendationEngine.getFilteredRecommendations(userId, { maxResults }),
        { iteration: i.toString(), type: i === 0 ? 'cold' : 'warm' }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        iteration: i + 1,
        type: i === 0 ? 'cold' : 'warm',
        duration,
        recommendationCount: recommendations.recommendations.length,
        cacheHitRate: recommendations.metadata.cacheHitRate || 0,
        processingTime: recommendations.metadata.processingTimeMs || duration
      });
    } catch (error) {
      results.push({
        iteration: i + 1,
        type: i === 0 ? 'cold' : 'warm',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      });
    }
  }

  // Calculate summary statistics
  const successfulResults = results.filter(r => !r.error);
  const coldStart = results[0];
  const warmResults = successfulResults.slice(1);

  return {
    iterations,
    results,
    summary: {
      coldStartTime: coldStart?.duration || 0,
      avgWarmTime: warmResults.length > 0 
        ? warmResults.reduce((sum, r) => sum + r.duration, 0) / warmResults.length 
        : 0,
      speedupRatio: coldStart?.duration && warmResults.length > 0
        ? coldStart.duration / (warmResults.reduce((sum, r) => sum + r.duration, 0) / warmResults.length)
        : 0,
      successRate: (successfulResults.length / results.length) * 100,
      avgCacheHitRate: successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + (r.cacheHitRate || 0), 0) / successfulResults.length
        : 0
    }
  };
}

/**
 * Run load test with concurrent requests
 */
async function runLoadTest(userId: string, params: any) {
  const { concurrency = 5, iterations = 10, maxResults = 10 } = params;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const batchStartTime = performance.now();
    
    // Create concurrent requests
    const promises = Array(concurrency).fill(null).map(async (_, index) => {
      const requestStartTime = performance.now();
      
      try {
        const recommendations = await recommendationEngine.getFilteredRecommendations(
          userId,
          { maxResults }
        );
        
        const requestEndTime = performance.now();
        
        return {
          requestIndex: index,
          duration: requestEndTime - requestStartTime,
          success: true,
          recommendationCount: recommendations.recommendations.length,
          cacheHitRate: recommendations.metadata.cacheHitRate || 0
        };
      } catch (error) {
        return {
          requestIndex: index,
          duration: performance.now() - requestStartTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const batchResults = await Promise.all(promises);
    const batchEndTime = performance.now();
    const batchDuration = batchEndTime - batchStartTime;

    results.push({
      iteration: i + 1,
      batchDuration,
      concurrency,
      requests: batchResults,
      avgRequestTime: batchResults.reduce((sum, r) => sum + r.duration, 0) / batchResults.length,
      successRate: (batchResults.filter(r => r.success).length / batchResults.length) * 100,
      throughput: (batchResults.filter(r => r.success).length / batchDuration) * 1000 // requests per second
    });
  }

  // Calculate overall statistics
  const allRequests = results.flatMap(r => r.requests);
  const successfulRequests = allRequests.filter(r => r.success);

  return {
    concurrency,
    iterations,
    totalRequests: allRequests.length,
    results,
    summary: {
      overallSuccessRate: (successfulRequests.length / allRequests.length) * 100,
      avgRequestTime: successfulRequests.length > 0
        ? successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length
        : 0,
      maxRequestTime: Math.max(...successfulRequests.map(r => r.duration)),
      minRequestTime: Math.min(...successfulRequests.map(r => r.duration)),
      avgThroughput: results.reduce((sum, r) => sum + r.throughput, 0) / results.length,
      maxThroughput: Math.max(...results.map(r => r.throughput))
    }
  };
}