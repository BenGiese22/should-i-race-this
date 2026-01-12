import { 
  RacingOpportunity, 
  UserHistory, 
  RecommendationMode, 
  ScoredRecommendation,
  RecommendationResponse,
  ExperienceSummary
} from './types';
import { RecommendationModeHelper } from '../types/recommendation';
import { scoringAlgorithm } from './scoring';
import { licenseFilter } from './license-filter';
import { prepareUserHistory, getCurrentRacingOpportunities, prefetchRecommendationData } from './data-preparation';
import { visualScoringRenderer } from './visual-scoring';
import { categoryAnalyzer } from './category-analyzer';
import { analyticsIntegration } from './analytics-integration';

/**
 * Main recommendation engine that combines all components
 */
export class RecommendationEngine {
  /**
   * Generate personalized recommendations for a user with visual indicators
   */
  async generateRecommendations(
    userId: string, 
    mode: RecommendationMode = RecommendationModeHelper.getDefault()
  ): Promise<ScoredRecommendation[]> {
    // Prepare user history data
    const userHistory = await prepareUserHistory(userId);
    
    // Get current racing opportunities
    const allOpportunities = await getCurrentRacingOpportunities();
    
    // Filter opportunities based on user's license levels
    const eligibleOpportunities = licenseFilter.filterByLicense(allOpportunities, userHistory);
    
    // Score each eligible opportunity and add visual indicators
    const scoredRecommendations: ScoredRecommendation[] = eligibleOpportunities.map(opportunity => {
      const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
      const visualIndicators = visualScoringRenderer.renderVisualScoring(score);
      
      return {
        ...opportunity,
        score,
        visualIndicators
      };
    });
    
    // Sort by priority score first (familiar combinations), then by overall score
    // This implements experience-based prioritization (Requirements 5.7)
    scoredRecommendations.sort((a, b) => {
      // Primary sort: Priority score (higher is better)
      const priorityDiff = b.score.priorityScore - a.score.priorityScore;
      if (Math.abs(priorityDiff) > 5) { // Significant priority difference
        return priorityDiff;
      }
      
      // Secondary sort: Overall score (higher is better)
      return b.score.overall - a.score.overall;
    });
    
    return scoredRecommendations;
  }

  /**
   * Get recommendations with enhanced response including visual indicators and user profile
   * Requirements: 1.2, 9.2
   * Performance Optimization: Added prefetching and performance monitoring (Requirements: 8.1, 8.3)
   */
  async getFilteredRecommendations(
    userId: string,
    options: {
      mode?: RecommendationMode;
      category?: string;
      minScore?: number;
      maxResults?: number;
      includeAlmostEligible?: boolean;
    } = {}
  ): Promise<RecommendationResponse> {
    const {
      mode = RecommendationModeHelper.getDefault(),
      category,
      minScore = 0,
      maxResults = 20
    } = options;

    const startTime = Date.now();

    // Performance optimization: Prefetch data for faster processing
    await prefetchRecommendationData(userId);

    // Get user history
    const userHistory = await prepareUserHistory(userId);
    
    // Get primary category analysis
    const categoryAnalysis = await categoryAnalyzer.detectPrimaryCategory(userId);
    
    // Use primary category as default if no category specified
    const effectiveCategory = category || categoryAnalysis.primaryCategory;
    
    // Get all opportunities
    const allOpportunities = await getCurrentRacingOpportunities();
    
    // Filter by category
    const categoryFiltered = allOpportunities.filter(opp => opp.category === effectiveCategory);
    
    // Filter by license eligibility
    const eligibleOpportunities = licenseFilter.filterByLicense(categoryFiltered, userHistory);
    
    // Score opportunities and create enhanced recommendations with visual indicators
    const scoredRecommendations: ScoredRecommendation[] = eligibleOpportunities
      .map(opportunity => {
        const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
        const visualIndicators = visualScoringRenderer.renderVisualScoring(score);
        
        return {
          ...opportunity,
          score,
          visualIndicators
        };
      })
      .filter(scored => scored.score.overall >= minScore)
      .sort((a, b) => {
        // Primary sort: Priority score (higher is better) - prioritizes familiar combinations
        const priorityDiff = b.score.priorityScore - a.score.priorityScore;
        if (Math.abs(priorityDiff) > 5) { // Significant priority difference
          return priorityDiff;
        }
        
        // Secondary sort: Overall score (higher is better)
        return b.score.overall - a.score.overall;
      })
      .slice(0, maxResults);

    // Calculate experience summary
    const experienceSummary = this.calculateExperienceSummary(userHistory);
    
    // Calculate metadata with performance metrics
    const metadata = this.calculateMetadata(scoredRecommendations, allOpportunities.length, startTime);

    return {
      recommendations: scoredRecommendations,
      userProfile: {
        primaryCategory: categoryAnalysis.primaryCategory,
        licenseClasses: userHistory.licenseClasses,
        experienceSummary
      },
      metadata
    };
  }

  /**
   * Get detailed analysis for a specific opportunity with visual indicators
   */
  async analyzeOpportunity(
    userId: string,
    seriesId: number,
    trackId: number,
    mode: RecommendationMode = RecommendationModeHelper.getDefault()
  ): Promise<{
    opportunity: RacingOpportunity | null;
    score: ScoredRecommendation['score'] | null;
    visualIndicators: ScoredRecommendation['visualIndicators'] | null;
    isEligible: boolean;
    licenseRequirement: string;
    userLicense: string | null;
  }> {
    const userHistory = await prepareUserHistory(userId);
    const allOpportunities = await getCurrentRacingOpportunities();
    
    const opportunity = allOpportunities.find(
      opp => opp.seriesId === seriesId && opp.trackId === trackId
    );

    if (!opportunity) {
      return {
        opportunity: null,
        score: null,
        visualIndicators: null,
        isEligible: false,
        licenseRequirement: 'Unknown',
        userLicense: null
      };
    }

    const isEligible = licenseFilter.hasRequiredLicense(opportunity, userHistory);
    const userLicense = userHistory.licenseClasses.find(
      license => license.category === opportunity.category
    );

    let score = null;
    let visualIndicators = null;
    
    if (isEligible) {
      score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
      visualIndicators = visualScoringRenderer.renderVisualScoring(score);
    }

    return {
      opportunity,
      score,
      visualIndicators,
      isEligible,
      licenseRequirement: `${opportunity.category} ${opportunity.licenseRequired}`,
      userLicense: userLicense ? `${userLicense.category} ${userLicense.level}` : null
    };
  }

  /**
   * Get license progression recommendations
   */
  async getLicenseProgression(userId: string): Promise<{
    currentLicenses: UserHistory['licenseClasses'];
    progressionSuggestions: ReturnType<typeof licenseFilter.getLicenseProgressionSuggestions>;
    almostEligibleOpportunities: RacingOpportunity[];
  }> {
    const userHistory = await prepareUserHistory(userId);
    const allOpportunities = await getCurrentRacingOpportunities();
    
    return {
      currentLicenses: userHistory.licenseClasses,
      progressionSuggestions: licenseFilter.getLicenseProgressionSuggestions(userHistory),
      almostEligibleOpportunities: licenseFilter.getAlmostEligibleOpportunities(
        allOpportunities, 
        userHistory
      )
    };
  }

  /**
   * Calculate experience summary for user profile
   */
  private calculateExperienceSummary(userHistory: UserHistory): ExperienceSummary {
    const totalRaces = userHistory.overallStats.totalRaces;
    
    // Count unique series and tracks with experience
    const seriesWithExperience = new Set(
      userHistory.seriesTrackHistory.map(h => h.seriesId)
    ).size;
    
    const tracksWithExperience = new Set(
      userHistory.seriesTrackHistory.map(h => h.trackId)
    ).size;
    
    // Calculate most raced series
    const seriesRaceCounts = new Map<number, { seriesId: number; raceCount: number }>();
    userHistory.seriesTrackHistory.forEach(history => {
      const existing = seriesRaceCounts.get(history.seriesId);
      if (existing) {
        existing.raceCount += history.raceCount;
      } else {
        seriesRaceCounts.set(history.seriesId, {
          seriesId: history.seriesId,
          raceCount: history.raceCount
        });
      }
    });
    
    const mostRacedSeries = Array.from(seriesRaceCounts.values())
      .sort((a, b) => b.raceCount - a.raceCount)
      .slice(0, 5)
      .map(item => ({
        seriesId: item.seriesId,
        seriesName: `Series ${item.seriesId}`, // In real implementation, would lookup series name
        raceCount: item.raceCount
      }));
    
    // Calculate most raced tracks
    const trackRaceCounts = new Map<number, { trackId: number; raceCount: number }>();
    userHistory.seriesTrackHistory.forEach(history => {
      const existing = trackRaceCounts.get(history.trackId);
      if (existing) {
        existing.raceCount += history.raceCount;
      } else {
        trackRaceCounts.set(history.trackId, {
          trackId: history.trackId,
          raceCount: history.raceCount
        });
      }
    });
    
    const mostRacedTracks = Array.from(trackRaceCounts.values())
      .sort((a, b) => b.raceCount - a.raceCount)
      .slice(0, 5)
      .map(item => ({
        trackId: item.trackId,
        trackName: `Track ${item.trackId}`, // In real implementation, would lookup track name
        raceCount: item.raceCount
      }));
    
    return {
      totalRaces,
      seriesWithExperience,
      tracksWithExperience,
      mostRacedSeries,
      mostRacedTracks
    };
  }

  /**
   * Calculate metadata for the recommendation response
   * Performance Optimization: Enhanced with cache metrics (Requirements: 8.1)
   */
  private calculateMetadata(
    recommendations: ScoredRecommendation[], 
    totalOpportunities: number,
    startTime: number
  ) {
    let highConfidenceCount = 0;
    let estimatedCount = 0;
    let noDataCount = 0;
    
    recommendations.forEach(rec => {
      const confidence = rec.score.dataConfidence;
      if (confidence.performance === 'high' && confidence.safety === 'high') {
        highConfidenceCount++;
      } else if (confidence.performance === 'estimated' || confidence.safety === 'estimated') {
        estimatedCount++;
      } else {
        noDataCount++;
      }
    });
    
    // Enhanced cache status based on actual cache performance
    const processingTime = Date.now() - startTime;
    const cacheMetrics = analyticsIntegration.getCacheMetrics();
    const cacheStatus: 'hit' | 'miss' = cacheMetrics.stats.hitRate > 0.5 ? 'hit' : 'miss';
    
    return {
      totalOpportunities,
      highConfidenceCount,
      estimatedCount,
      noDataCount,
      cacheStatus,
      processingTimeMs: processingTime,
      cacheHitRate: cacheMetrics.stats.hitRate
    };
  }

  /**
   * Compare different recommendation modes for the same opportunities
   */
  async compareRecommendationModes(userId: string): Promise<{
    balanced: ScoredRecommendation[];
    iRatingPush: ScoredRecommendation[];
    safetyRecovery: ScoredRecommendation[];
  }> {
    const userHistory = await prepareUserHistory(userId);
    const allOpportunities = await getCurrentRacingOpportunities();
    const eligibleOpportunities = licenseFilter.filterByLicense(allOpportunities, userHistory);

    const scoreOpportunities = (mode: RecommendationMode) => 
      eligibleOpportunities
        .map(opportunity => {
          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
          const visualIndicators = visualScoringRenderer.renderVisualScoring(score);
          
          return {
            ...opportunity,
            score,
            visualIndicators
          };
        })
        .sort((a, b) => {
          // Primary sort: Priority score (higher is better) - prioritizes familiar combinations
          const priorityDiff = b.score.priorityScore - a.score.priorityScore;
          if (Math.abs(priorityDiff) > 5) { // Significant priority difference
            return priorityDiff;
          }
          
          // Secondary sort: Overall score (higher is better)
          return b.score.overall - a.score.overall;
        })
        .slice(0, 10); // Top 10 for each mode

    return {
      balanced: scoreOpportunities(RecommendationMode.BALANCED),
      iRatingPush: scoreOpportunities(RecommendationMode.IRATING_PUSH),
      safetyRecovery: scoreOpportunities(RecommendationMode.SAFETY_RECOVERY)
    };
  }

  /**
   * Performance monitoring: Get cache and performance metrics
   * Requirements: 8.1, 8.3
   */
  getPerformanceMetrics() {
    return analyticsIntegration.getCacheMetrics();
  }

  /**
   * Performance optimization: Clear all caches
   * Requirements: 8.1
   */
  clearCaches(): void {
    analyticsIntegration.clearCaches();
  }

  /**
   * Performance optimization: Prefetch data for a user
   * Requirements: 8.3
   */
  async prefetchUserData(userId: string): Promise<void> {
    await prefetchRecommendationData(userId);
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();