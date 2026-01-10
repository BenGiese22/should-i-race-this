import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { recommendationEngine } from '@/lib/recommendations';
import { analyticsIntegration } from '@/lib/recommendations/analytics-integration';
import { getCachePerformanceMetrics } from '@/lib/recommendations/data-preparation';

/**
 * Debug endpoint for recommendations performance monitoring
 * Requirements: 12.4 - Create debug and validation endpoints
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    switch (action) {
      case 'metrics':
        // Get cache performance metrics
        const cacheMetrics = getCachePerformanceMetrics();
        
        return NextResponse.json({
          success: true,
          cacheMetrics,
          timestamp: new Date().toISOString()
        });

      case 'benchmark':
        // Benchmark recommendation performance
        const startTime = Date.now();
        
        // Clear caches to get cold performance
        recommendationEngine.clearCaches();
        const coldStartTime = Date.now();
        
        const coldRecommendations = await recommendationEngine.getFilteredRecommendations(
          session.userId,
          { maxResults: 10 }
        );
        const coldEndTime = Date.now();
        
        // Get warm performance (should use cache)
        const warmStartTime = Date.now();
        const warmRecommendations = await recommendationEngine.getFilteredRecommendations(
          session.userId,
          { maxResults: 10 }
        );
        const warmEndTime = Date.now();
        
        const totalTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          benchmark: {
            coldStartMs: coldEndTime - coldStartTime,
            warmStartMs: warmEndTime - warmStartTime,
            totalBenchmarkMs: totalTime,
            speedupRatio: (coldEndTime - coldStartTime) / (warmEndTime - warmStartTime),
            coldRecommendationCount: coldRecommendations.recommendations.length,
            warmRecommendationCount: warmRecommendations.recommendations.length,
            cacheStatus: {
              cold: coldRecommendations.metadata.cacheStatus,
              warm: warmRecommendations.metadata.cacheStatus
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'prefetch':
        // Test prefetch performance
        const prefetchStartTime = Date.now();
        
        await recommendationEngine.prefetchUserData(session.userId);
        
        const prefetchEndTime = Date.now();
        
        return NextResponse.json({
          success: true,
          prefetch: {
            prefetchTimeMs: prefetchEndTime - prefetchStartTime,
            cacheMetrics: getCachePerformanceMetrics()
          },
          timestamp: new Date().toISOString()
        });

      case 'cache-status':
        // Get detailed cache status
        const detailedMetrics = analyticsIntegration.getCacheMetrics();
        
        return NextResponse.json({
          success: true,
          cacheStatus: {
            ...detailedMetrics,
            recommendations: {
              hitRate: detailedMetrics.stats.hitRate,
              totalRequests: detailedMetrics.stats.totalRequests,
              cacheSize: detailedMetrics.size
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'clear-cache':
        // Clear all caches
        recommendationEngine.clearCaches();
        
        return NextResponse.json({
          success: true,
          message: 'All caches cleared',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: metrics, benchmark, prefetch, cache-status, clear-cache' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in recommendations performance debug:', error);
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case 'load-test':
        // Perform load test with multiple concurrent requests
        const concurrency = body.concurrency || 5;
        const iterations = body.iterations || 10;
        
        const loadTestResults = [];
        
        for (let i = 0; i < iterations; i++) {
          const batchStartTime = Date.now();
          
          // Create concurrent requests
          const promises = Array(concurrency).fill(null).map(() =>
            recommendationEngine.getFilteredRecommendations(
              userId || session.userId,
              { maxResults: 5 }
            )
          );
          
          const results = await Promise.all(promises);
          const batchEndTime = Date.now();
          
          loadTestResults.push({
            iteration: i + 1,
            batchTimeMs: batchEndTime - batchStartTime,
            concurrency,
            avgTimePerRequest: (batchEndTime - batchStartTime) / concurrency,
            cacheHitRates: results.map(r => r.metadata.cacheHitRate || 0)
          });
        }
        
        return NextResponse.json({
          success: true,
          loadTest: {
            concurrency,
            iterations,
            results: loadTestResults,
            summary: {
              avgBatchTime: loadTestResults.reduce((sum, r) => sum + r.batchTimeMs, 0) / loadTestResults.length,
              avgRequestTime: loadTestResults.reduce((sum, r) => sum + r.avgTimePerRequest, 0) / loadTestResults.length,
              maxBatchTime: Math.max(...loadTestResults.map(r => r.batchTimeMs)),
              minBatchTime: Math.min(...loadTestResults.map(r => r.batchTimeMs))
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action for POST. Use: load-test' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in recommendations performance load test:', error);
    return NextResponse.json(
      { error: 'Failed to perform load test' },
      { status: 500 }
    );
  }
}