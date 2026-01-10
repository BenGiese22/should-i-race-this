import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { analyticsIntegration } from '@/lib/recommendations/analytics-integration';
import { recommendationEngine } from '@/lib/recommendations/engine';
import { getPerformanceMetrics, getGlobalSeriesTrackStats } from '@/lib/db/analytics';

/**
 * Debug endpoint to verify analytics data usage and confidence levels
 * Requirements: 12.4 - Create debug and validation endpoints
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics-usage';
    const userId = searchParams.get('userId') || session.userId;
    const seriesId = searchParams.get('seriesId');
    const trackId = searchParams.get('trackId');

    switch (action) {
      case 'analytics-usage':
        // Verify that recommendations are using analytics data
        const analyticsData = await analyticsIntegration.getUserPerformanceData(userId);
        const primaryCategory = await analyticsIntegration.getPrimaryCategory(userId);
        
        return NextResponse.json({
          success: true,
          analyticsUsage: {
            userPerformanceData: {
              seriesTrackHistoryCount: analyticsData.seriesTrackHistory.length,
              overallStats: analyticsData.overallStats,
              primaryCategory: analyticsData.primaryCategory,
              licenseClassesCount: analyticsData.licenseClasses.length,
              confidenceLevels: analyticsData.seriesTrackHistory.map(st => ({
                seriesId: st.seriesId,
                trackId: st.trackId,
                raceCount: st.raceCount,
                confidenceLevel: st.confidenceLevel
              }))
            },
            primaryCategoryDetection: {
              detectedCategory: primaryCategory,
              matchesUserData: primaryCategory === analyticsData.primaryCategory
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'confidence-levels':
        // Show confidence levels and data sources for all user combinations
        const userPerformance = await analyticsIntegration.getUserPerformanceData(userId);
        
        const confidenceBreakdown = {
          high: userPerformance.seriesTrackHistory.filter(st => st.confidenceLevel === 'high'),
          estimated: userPerformance.seriesTrackHistory.filter(st => st.confidenceLevel === 'estimated'),
          no_data: userPerformance.seriesTrackHistory.filter(st => st.confidenceLevel === 'no_data')
        };

        return NextResponse.json({
          success: true,
          confidenceLevels: {
            summary: {
              highConfidenceCount: confidenceBreakdown.high.length,
              estimatedCount: confidenceBreakdown.estimated.length,
              noDataCount: confidenceBreakdown.no_data.length,
              totalCombinations: userPerformance.seriesTrackHistory.length
            },
            breakdown: confidenceBreakdown,
            thresholds: {
              high: '3+ races',
              estimated: '1-2 races',
              no_data: '0 races'
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'data-sources':
        // Show which analytics functions are being called
        if (!seriesId || !trackId) {
          return NextResponse.json(
            { error: 'seriesId and trackId required for data-sources action' },
            { status: 400 }
          );
        }

        const seriesIdNum = parseInt(seriesId);
        const trackIdNum = parseInt(trackId);

        // Get data directly from analytics system
        const directAnalyticsData = await getPerformanceMetrics(userId, 'series_track');
        const directGlobalStats = await getGlobalSeriesTrackStats(seriesIdNum, trackIdNum);
        
        // Get data through integration layer
        const integrationUserData = await analyticsIntegration.getUserPerformanceData(userId);
        const integrationGlobalStats = await analyticsIntegration.getGlobalStatistics(seriesIdNum, trackIdNum);

        // Find specific combination in user data
        const userCombination = integrationUserData.seriesTrackHistory.find(
          st => st.seriesId === seriesIdNum && st.trackId === trackIdNum
        );

        return NextResponse.json({
          success: true,
          dataSources: {
            seriesId: seriesIdNum,
            trackId: trackIdNum,
            directAnalytics: {
              userDataFound: directAnalyticsData.some(d => d.seriesId === seriesIdNum && d.trackId === trackIdNum),
              globalStatsFound: !!directGlobalStats,
              globalStatsQuality: directGlobalStats ? 
                (directGlobalStats.totalRaces >= 50 ? 'high' : 
                 directGlobalStats.totalRaces >= 20 ? 'moderate' : 'default') : 'none'
            },
            integrationLayer: {
              userCombinationFound: !!userCombination,
              confidenceLevel: userCombination?.confidenceLevel || 'no_data',
              globalStatsQuality: integrationGlobalStats.dataQuality,
              usingDefaults: integrationGlobalStats.dataQuality === 'default'
            },
            dataConsistency: {
              userDataMatches: !!userCombination && directAnalyticsData.some(d => 
                d.seriesId === seriesIdNum && 
                d.trackId === trackIdNum &&
                Math.abs(d.positionDelta - userCombination.avgPositionDelta) < 0.1
              ),
              globalStatsMatches: directGlobalStats ? 
                Math.abs(parseFloat(directGlobalStats.avgIncidents?.toString() ?? '0') - integrationGlobalStats.avgIncidentsPerRace) < 0.1 :
                false
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'scoring-accuracy':
        // Validate scoring accuracy for a specific user
        const recommendations = await recommendationEngine.getFilteredRecommendations(userId, {
          maxResults: 5
        });

        const scoringValidation = recommendations.recommendations.map(rec => {
          const userHistory = analyticsData.seriesTrackHistory.find(
            st => st.seriesId === rec.seriesId && st.trackId === rec.trackId
          );

          return {
            seriesId: rec.seriesId,
            trackId: rec.trackId,
            seriesName: rec.seriesName,
            trackName: rec.trackName,
            score: {
              overall: rec.score.overall,
              factors: rec.score.factors,
              priorityScore: rec.score.priorityScore
            },
            dataConfidence: rec.score.dataConfidence,
            userExperience: userHistory ? {
              raceCount: userHistory.raceCount,
              avgPositionDelta: userHistory.avgPositionDelta,
              avgIncidents: userHistory.avgIncidents,
              confidenceLevel: userHistory.confidenceLevel
            } : null,
            validation: {
              familiarityMatchesExperience: userHistory ? 
                (userHistory.raceCount >= 10 && rec.score.factors.familiarity >= 80) ||
                (userHistory.raceCount >= 5 && rec.score.factors.familiarity >= 60) ||
                (userHistory.raceCount < 5 && rec.score.factors.familiarity < 60) : true,
              priorityScoreAppropriate: userHistory ? 
                (userHistory.raceCount >= 3 && rec.score.priorityScore > 50) ||
                (userHistory.raceCount < 3 && rec.score.priorityScore <= 50) : true,
              confidenceLevelCorrect: userHistory ?
                (userHistory.raceCount >= 3 && rec.score.dataConfidence.performance === 'high') ||
                (userHistory.raceCount >= 1 && userHistory.raceCount < 3 && rec.score.dataConfidence.performance === 'estimated') ||
                (userHistory.raceCount === 0 && rec.score.dataConfidence.performance === 'no_data') : true
            }
          };
        });

        return NextResponse.json({
          success: true,
          scoringAccuracy: {
            userId,
            recommendationCount: recommendations.recommendations.length,
            userProfile: recommendations.userProfile,
            validationResults: scoringValidation,
            overallValidation: {
              allFamiliarityScoresValid: scoringValidation.every(v => v.validation.familiarityMatchesExperience),
              allPriorityScoresValid: scoringValidation.every(v => v.validation.priorityScoreAppropriate),
              allConfidenceLevelsValid: scoringValidation.every(v => v.validation.confidenceLevelCorrect)
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'cache-analysis':
        // Analyze cache performance and hit rates
        const cacheMetrics = analyticsIntegration.getCacheMetrics();
        
        return NextResponse.json({
          success: true,
          cacheAnalysis: {
            metrics: cacheMetrics,
            performance: {
              hitRate: cacheMetrics.stats.hitRate,
              totalRequests: cacheMetrics.stats.totalRequests,
              cacheSize: cacheMetrics.size,
              efficiency: cacheMetrics.stats.hitRate > 0.7 ? 'excellent' : 
                         cacheMetrics.stats.hitRate > 0.5 ? 'good' : 
                         cacheMetrics.stats.hitRate > 0.3 ? 'fair' : 'poor'
            },
            recommendations: {
              shouldWarmCache: cacheMetrics.stats.hitRate < 0.5,
              shouldIncreaseSize: cacheMetrics.size > 1000,
              shouldOptimizeQueries: cacheMetrics.stats.totalRequests > 100 && cacheMetrics.stats.hitRate < 0.3
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Use: analytics-usage, confidence-levels, data-sources, scoring-accuracy, cache-analysis',
            availableActions: [
              'analytics-usage - Verify analytics data integration',
              'confidence-levels - Show confidence level breakdown',
              'data-sources - Compare direct vs integration layer data (requires seriesId & trackId)',
              'scoring-accuracy - Validate scoring accuracy against user experience',
              'cache-analysis - Analyze cache performance and efficiency'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in analytics validation debug:', error);
    return NextResponse.json(
      { error: 'Failed to validate analytics integration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for triggering validation actions that modify state
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId } = body;
    const targetUserId = userId || session.userId;

    switch (action) {
      case 'warm-cache':
        // Warm up caches for better performance testing
        await analyticsIntegration.prefetchUserData(targetUserId);
        
        return NextResponse.json({
          success: true,
          message: 'Cache warmed successfully',
          cacheMetrics: analyticsIntegration.getCacheMetrics(),
          timestamp: new Date().toISOString()
        });

      case 'clear-cache':
        // Clear caches to test cold performance
        analyticsIntegration.clearCaches();
        
        return NextResponse.json({
          success: true,
          message: 'Caches cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'validate-integration':
        // Comprehensive validation of analytics integration
        const startTime = Date.now();
        
        // Test user data retrieval
        const userData = await analyticsIntegration.getUserPerformanceData(targetUserId);
        const userDataTime = Date.now() - startTime;
        
        // Test global stats retrieval (use first user combination if available)
        let globalStatsTime = 0;
        let globalStatsTest = null;
        if (userData.seriesTrackHistory.length > 0) {
          const firstCombo = userData.seriesTrackHistory[0];
          const globalStartTime = Date.now();
          globalStatsTest = await analyticsIntegration.getGlobalStatistics(firstCombo.seriesId, firstCombo.trackId);
          globalStatsTime = Date.now() - globalStartTime;
        }
        
        // Test recommendation generation
        const recStartTime = Date.now();
        const recommendations = await recommendationEngine.getFilteredRecommendations(targetUserId, { maxResults: 3 });
        const recTime = Date.now() - recStartTime;
        
        const totalTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          integrationValidation: {
            userId: targetUserId,
            performance: {
              userDataRetrievalMs: userDataTime,
              globalStatsRetrievalMs: globalStatsTime,
              recommendationGenerationMs: recTime,
              totalTimeMs: totalTime,
              meetsPerformanceTarget: totalTime < 3000 // Sub-3-second requirement
            },
            dataQuality: {
              userCombinationsFound: userData.seriesTrackHistory.length,
              highConfidenceCount: userData.seriesTrackHistory.filter(st => st.confidenceLevel === 'high').length,
              primaryCategoryDetected: userData.primaryCategory,
              globalStatsQuality: globalStatsTest?.dataQuality || 'not_tested'
            },
            recommendations: {
              generated: recommendations.recommendations.length,
              highConfidenceRecs: recommendations.metadata.highConfidenceCount,
              cacheHitRate: recommendations.metadata.cacheHitRate || 0
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action for POST. Use: warm-cache, clear-cache, validate-integration',
            availableActions: [
              'warm-cache - Prefetch data for performance testing',
              'clear-cache - Clear all caches for cold performance testing', 
              'validate-integration - Run comprehensive integration validation'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in analytics validation POST:', error);
    return NextResponse.json(
      { error: 'Failed to execute validation action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}