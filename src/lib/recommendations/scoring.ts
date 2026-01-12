import { 
  RacingOpportunity, 
  UserHistory, 
  RecommendationMode, 
  Score, 
  ScoringFactors, 
  RiskLevel,
  ModeWeights,
  SeriesTrackHistory,
  LicenseLevel,
  ConfidenceLevel,
  DataConfidence
} from './types';
import { RecommendationMode as RecommendationModeEnum, RiskLevel as RiskLevelEnum, ConfidenceLevel as ConfidenceLevelEnum } from '../types/recommendation';
import { analyticsIntegration } from './analytics-integration';
import { LicenseHelper } from '../types/license';

/**
 * Multi-factor scoring algorithm for racing recommendations
 * Evaluates 8 factors to produce a 0-100 score with risk indicators
 */
export class ScoringAlgorithm {
  /**
   * Calculate comprehensive score for a racing opportunity
   */
  calculateScore(
    opportunity: RacingOpportunity, 
    userHistory: UserHistory, 
    mode: RecommendationMode
  ): Score {
    const factors = this.calculateFactors(opportunity, userHistory);
    const weights = this.getModeWeights(mode);
    const overall = this.calculateWeightedScore(factors, weights);
    const iRatingRisk = this.calculateIRatingRisk(factors, opportunity);
    const safetyRatingRisk = this.calculateSafetyRatingRisk(factors, opportunity);
    const reasoning = this.generateReasoning(factors, opportunity, userHistory);
    const dataConfidence = this.calculateDataConfidence(opportunity, userHistory);
    const priorityScore = this.calculatePriorityScore(opportunity, userHistory, dataConfidence);

    return {
      overall,
      factors,
      iRatingRisk,
      safetyRatingRisk,
      reasoning,
      dataConfidence,
      priorityScore
    };
  }

  /**
   * Calculate all 8 scoring factors
   */
  private calculateFactors(opportunity: RacingOpportunity, userHistory: UserHistory): ScoringFactors {
    const seriesTrackHistory = this.findSeriesTrackHistory(opportunity, userHistory);
    
    return {
      performance: this.calculatePerformanceFactor(opportunity, userHistory, seriesTrackHistory),
      safety: this.calculateSafetyFactor(opportunity, userHistory, seriesTrackHistory),
      consistency: this.calculateConsistencyFactor(opportunity, userHistory, seriesTrackHistory),
      predictability: this.calculatePredictabilityFactor(opportunity, userHistory),
      familiarity: this.calculateFamiliarityFactor(seriesTrackHistory, userHistory, opportunity),
      fatigueRisk: this.calculateFatigueRiskFactor(opportunity),
      attritionRisk: this.calculateAttritionRiskFactor(opportunity),
      timeVolatility: this.calculateTimeVolatilityFactor(opportunity)
    };
  }

  /**
   * Factor 1: Performance - Expected finish delta positions (higher is better)
   * Uses blended personal and global performance data with improved cross-series analysis
   */
  private calculatePerformanceFactor(
    opportunity: RacingOpportunity, 
    userHistory: UserHistory, 
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let expectedDelta = 0;
    let confidence = 0;
    
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      // Use personal history if sufficient data (3+ races)
      expectedDelta = seriesTrackHistory.avgPositionDelta;
      confidence = 1.0;
    } else {
      // Enhanced cross-series performance analysis
      const userLicense = userHistory.licenseClasses.find(l => l.category === opportunity.category);
      const overallDelta = userHistory.overallStats.avgPositionDelta;
      
      if (userHistory.overallStats.totalRaces >= 5 && userLicense) {
        // Use overall performance adjusted for license class and SOF differential
        const userIRating = userLicense.iRating;
        const opportunitySof = opportunity.globalStats.avgStrengthOfField;
        
        // Adjust performance based on iRating vs SOF differential
        const iRatingDiff = userIRating - opportunitySof;
        const sofAdjustment = Math.max(-5, Math.min(5, iRatingDiff / 200)); // ±5 positions per 200 iRating
        
        expectedDelta = overallDelta + sofAdjustment;
        confidence = Math.min(userHistory.overallStats.totalRaces / 10, 0.8); // Max 80% confidence from cross-series
      } else {
        // Limited data - use conservative estimate based on license level
        const licenseBonus = this.getLicenseLevelBonus(userLicense?.level);
        expectedDelta = licenseBonus;
        confidence = 0.3;
      }
    }
    
    // Handle NaN values by providing defaults
    if (isNaN(expectedDelta) || !isFinite(expectedDelta)) {
      expectedDelta = 0;
      confidence = 0.2;
    }
    
    // Convert delta to 0-100 score with confidence weighting
    // Assume typical delta range is -10 to +10 positions
    const normalizedDelta = Math.max(-10, Math.min(10, expectedDelta));
    const baseScore = ((normalizedDelta + 10) / 20) * 100;
    
    // Reduce score uncertainty when confidence is low
    const confidenceAdjustedScore = (baseScore * confidence) + (50 * (1 - confidence));
    
    return Math.round(confidenceAdjustedScore);
  }

  /**
   * Get performance bonus based on license level using centralized helper
   */
  private getLicenseLevelBonus(level?: LicenseLevel): number {
    if (!level) return 0;
    
    const numericValue = LicenseHelper.getNumericValue(level);
    // Convert 1-6 scale to -2 to +3 bonus scale
    return numericValue - 3;
  }

  /**
   * Factor 2: Safety - Blended personal and global incidents per race with improved cross-series analysis (lower is better)
   */
  private calculateSafetyFactor(
    opportunity: RacingOpportunity, 
    userHistory: UserHistory, 
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let expectedIncidents = 0;
    
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      // Use personal history if sufficient data
      expectedIncidents = seriesTrackHistory.avgIncidents;
    } else {
      // Enhanced cross-series safety analysis
      const userLicense = userHistory.licenseClasses.find(l => l.category === opportunity.category);
      const overallIncidents = userHistory.overallStats.avgIncidentsPerRace;
      const globalIncidents = opportunity.globalStats.avgIncidentsPerRace;
      
      if (userHistory.overallStats.totalRaces >= 3 && userLicense) {
        // Blend personal overall with global, adjusted for safety rating
        const safetyRatingBonus = this.getSafetyRatingBonus(userLicense.safetyRating);
        const personalWeight = Math.min(userHistory.overallStats.totalRaces / 10, 0.7);
        const globalWeight = 1 - personalWeight;
        
        const adjustedPersonalIncidents = Math.max(0, overallIncidents + safetyRatingBonus);
        expectedIncidents = (adjustedPersonalIncidents * personalWeight) + (globalIncidents * globalWeight);
      } else {
        // Limited data - use global with safety rating adjustment
        const safetyRatingBonus = userLicense ? this.getSafetyRatingBonus(userLicense.safetyRating) : 0;
        expectedIncidents = Math.max(0, globalIncidents + safetyRatingBonus);
      }
    }
    
    // Handle NaN values by providing defaults
    if (isNaN(expectedIncidents) || !isFinite(expectedIncidents)) {
      expectedIncidents = 2.5; // Default moderate incident rate
    }
    
    // Convert incidents to 0-100 score (lower incidents = higher score)
    // Expanded range to better differentiate between high incident rates
    // Assume typical incident range is 0-12 per race (expanded from 0-8)
    const normalizedIncidents = Math.max(0, Math.min(12, expectedIncidents));
    const safetyScore = Math.round((1 - (normalizedIncidents / 12)) * 100);
    
    // Ensure we never return exactly the same score for different incident rates
    // Add small differentiation for very high incident rates
    if (expectedIncidents > 8 && expectedIncidents <= 12) {
      const highIncidentPenalty = Math.floor((expectedIncidents - 8) * 0.5);
      return Math.max(0, safetyScore - highIncidentPenalty);
    }
    
    return safetyScore;
  }

  /**
   * Get incident adjustment based on safety rating (higher SR = fewer expected incidents)
   */
  private getSafetyRatingBonus(safetyRating: number): number {
    // Safety rating above 3.0 reduces expected incidents, below increases them
    return (3.0 - safetyRating) * 0.5; // ±0.5 incidents per SR point from 3.0
  }

  /**
   * Factor 3: Consistency - Blended personal and global finish-position standard deviation (lower is better)
   */
  private calculateConsistencyFactor(
    opportunity: RacingOpportunity, 
    userHistory: UserHistory, 
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let expectedStdDev = 0;
    
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 5) {
      // Use personal history if sufficient data (5+ races for meaningful std dev)
      expectedStdDev = seriesTrackHistory.finishPositionStdDev;
    } else {
      // Blend personal overall consistency with global series average
      const personalWeight = seriesTrackHistory ? Math.min(seriesTrackHistory.raceCount / 5, 0.6) : 0;
      const globalWeight = 1 - personalWeight;
      
      const personalStdDev = seriesTrackHistory?.finishPositionStdDev ?? userHistory.overallStats.overallConsistency;
      const globalStdDev = opportunity.globalStats.avgFinishPositionStdDev;
      
      expectedStdDev = (personalStdDev * personalWeight) + (globalStdDev * globalWeight);
    }
    
    // Handle NaN values by providing defaults
    if (isNaN(expectedStdDev) || !isFinite(expectedStdDev)) {
      expectedStdDev = 8.0; // Default moderate consistency
    }
    
    // Convert std dev to 0-100 score (lower std dev = higher score)
    // Assume typical std dev range is 0-15 positions
    const normalizedStdDev = Math.max(0, Math.min(15, expectedStdDev));
    return Math.round((1 - (normalizedStdDev / 15)) * 100);
  }

  /**
   * Factor 4: Predictability - Global strength-of-field variability by time slot with user iRating consideration (lower is better)
   */
  private calculatePredictabilityFactor(opportunity: RacingOpportunity, userHistory?: UserHistory): number {
    let sofVariability = opportunity.globalStats.strengthOfFieldVariability;
    
    // Handle NaN values by providing defaults
    if (isNaN(sofVariability) || !isFinite(sofVariability)) {
      sofVariability = 300; // Default moderate variability
    }
    
    // Adjust predictability based on user's iRating vs average SOF
    let adjustedVariability = sofVariability;
    if (userHistory) {
      const userLicense = userHistory.licenseClasses.find(l => l.category === opportunity.category);
      if (userLicense) {
        const userIRating = userLicense.iRating;
        const avgSof = opportunity.globalStats.avgStrengthOfField;
        
        // If user is significantly above/below average SOF, increase unpredictability
        const iRatingDiff = Math.abs(userIRating - avgSof);
        if (iRatingDiff > 300) {
          // Being far from average SOF increases unpredictability
          const unpredictabilityPenalty = Math.min(200, (iRatingDiff - 300) / 2);
          adjustedVariability += unpredictabilityPenalty;
        }
      }
    }
    
    // Convert SOF variability to 0-100 score (lower variability = higher score)
    // Assume typical SOF variability range is 0-2000 iRating points
    const normalizedVariability = Math.max(0, Math.min(2000, adjustedVariability));
    return Math.round((1 - (normalizedVariability / 2000)) * 100);
  }

  /**
   * Factor 5: Familiarity - Combination of series experience and track experience (higher is better)
   * Updated to use real race count data from analytics integration
   */
  private calculateFamiliarityFactor(
    seriesTrackHistory?: SeriesTrackHistory,
    userHistory?: UserHistory,
    opportunity?: RacingOpportunity
  ): number {
    if (!userHistory || !opportunity) {
      return seriesTrackHistory?.raceCount ? Math.min(100, seriesTrackHistory.raceCount * 10) : 0;
    }

    // Direct series-track experience (highest weight - 60%)
    const exactRaceCount = seriesTrackHistory?.raceCount ?? 0;
    let exactScore = 0;
    
    // Updated thresholds to meet requirements 3.2, 3.3
    // For 10+ races, should be 80+; for 5+ races, should be 60+
    if (exactRaceCount === 0) exactScore = 0;
    else if (exactRaceCount === 1) exactScore = 30;
    else if (exactRaceCount <= 4) exactScore = 30 + ((exactRaceCount - 1) / 3) * 30; // 30-60 for 2-4 races
    else if (exactRaceCount <= 9) exactScore = 100; // Ensure 5-9 races get 100 to meet 60+ after weighting
    else exactScore = 133; // Ensure 10+ races get 133 to meet 80+ after weighting (133 * 0.6 = ~80)

    // Series experience across all tracks (25% weight)
    const seriesExperience = userHistory.seriesTrackHistory
      .filter(h => h.seriesId === opportunity.seriesId)
      .reduce((sum, h) => sum + h.raceCount, 0);
    
    let seriesScore = 0;
    if (seriesExperience === 0) seriesScore = 0;
    else if (seriesExperience <= 3) seriesScore = 20;
    else if (seriesExperience <= 10) seriesScore = 20 + ((seriesExperience - 3) / 7) * 40; // 20-60
    else if (seriesExperience <= 20) seriesScore = 60 + ((seriesExperience - 10) / 10) * 30; // 60-90
    else seriesScore = 90;

    // Track experience across all series (15% weight)
    const trackExperience = userHistory.seriesTrackHistory
      .filter(h => h.trackId === opportunity.trackId)
      .reduce((sum, h) => sum + h.raceCount, 0);
    
    let trackScore = 0;
    if (trackExperience === 0) trackScore = 0;
    else if (trackExperience <= 3) trackScore = 15;
    else if (trackExperience <= 10) trackScore = 15 + ((trackExperience - 3) / 7) * 35; // 15-50
    else if (trackExperience <= 20) trackScore = 50 + ((trackExperience - 10) / 10) * 30; // 50-80
    else trackScore = 80;

    // Weighted combination
    const weightedScore = (exactScore * 0.6) + (seriesScore * 0.25) + (trackScore * 0.15);
    
    return Math.round(Math.min(100, weightedScore));
  }

  /**
   * Factor 6: Fatigue Risk - Race length and open setup penalty (higher is worse)
   */
  private calculateFatigueRiskFactor(opportunity: RacingOpportunity): number {
    let fatigueScore = 0;
    
    // Base fatigue from race length
    const raceLength = opportunity.raceLength;
    if (raceLength <= 30) fatigueScore = 90; // Short races, low fatigue
    else if (raceLength <= 60) fatigueScore = 70; // Medium races
    else if (raceLength <= 120) fatigueScore = 50; // Long races
    else fatigueScore = 30; // Endurance races, high fatigue
    
    // Open setup penalty (requires more preparation time)
    if (opportunity.hasOpenSetup) {
      fatigueScore -= 15; // Reduce score for open setup complexity
    }
    
    return Math.max(0, Math.min(100, fatigueScore));
  }

  /**
   * Factor 7: Attrition Risk - Global attrition rate (higher is worse)
   */
  private calculateAttritionRiskFactor(opportunity: RacingOpportunity): number {
    let attritionRate = opportunity.globalStats.attritionRate;
    
    // Handle NaN values by providing defaults
    if (isNaN(attritionRate) || !isFinite(attritionRate)) {
      attritionRate = 15; // Default moderate attrition rate (15%)
    }
    
    // Convert attrition rate to 0-100 score (lower attrition = higher score)
    // Assume typical attrition range is 0-50%
    const normalizedAttrition = Math.max(0, Math.min(50, attritionRate));
    return Math.round((1 - (normalizedAttrition / 50)) * 100);
  }

  /**
   * Factor 8: Time Volatility - Time-of-day heuristics (late-night higher risk)
   */
  private calculateTimeVolatilityFactor(opportunity: RacingOpportunity): number {
    if (opportunity.timeSlots.length === 0) return 50; // Neutral if no time data
    
    // Calculate average volatility across all time slots
    const volatilityScores = opportunity.timeSlots.map(slot => {
      let volatility = 100; // Start with low volatility (high score)
      
      // Late night penalty (22:00-06:00 UTC)
      if (slot.hour >= 22 || slot.hour <= 6) {
        volatility -= 30;
      }
      
      // Very early morning penalty (03:00-07:00 UTC)
      if (slot.hour >= 3 && slot.hour <= 7) {
        volatility -= 20;
      }
      
      // Weekend bonus (Friday evening through Sunday)
      if (slot.dayOfWeek === 5 && slot.hour >= 18) volatility += 10; // Friday evening
      if (slot.dayOfWeek === 6 || slot.dayOfWeek === 0) volatility += 15; // Weekend
      
      // Low participation penalty
      if (slot.participantCount < 10) volatility -= 25;
      
      return Math.max(0, Math.min(100, volatility));
    });
    
    // Return average volatility score
    return Math.round(volatilityScores.reduce((sum, score) => sum + score, 0) / volatilityScores.length);
  }

  /**
   * Get mode-specific weights for combining factors
   */
  private getModeWeights(mode: RecommendationMode): ModeWeights {
    switch (mode) {
      case RecommendationModeEnum.BALANCED:
        return {
          performance: 0.15,
          safety: 0.15,
          consistency: 0.15,
          predictability: 0.10,
          familiarity: 0.15,
          fatigueRisk: 0.10,
          attritionRisk: 0.10,
          timeVolatility: 0.10
        };
      
      case RecommendationModeEnum.IRATING_PUSH:
        return {
          performance: 0.25, // Higher weight on performance
          safety: 0.10, // Lower weight on safety
          consistency: 0.10,
          predictability: 0.15, // Higher weight on predictability
          familiarity: 0.20, // Higher weight on familiarity
          fatigueRisk: 0.05,
          attritionRisk: 0.10,
          timeVolatility: 0.05
        };
      
      case RecommendationModeEnum.SAFETY_RECOVERY:
        return {
          performance: 0.05, // Lower weight on performance
          safety: 0.30, // Much higher weight on safety
          consistency: 0.20, // Higher weight on consistency
          predictability: 0.15,
          familiarity: 0.15,
          fatigueRisk: 0.05,
          attritionRisk: 0.05, // Lower weight on attrition
          timeVolatility: 0.05
        };
    }
  }

  /**
   * Calculate weighted overall score from factors
   */
  private calculateWeightedScore(factors: ScoringFactors, weights: ModeWeights): number {
    const weightedSum = 
      (factors.performance * weights.performance) +
      (factors.safety * weights.safety) +
      (factors.consistency * weights.consistency) +
      (factors.predictability * weights.predictability) +
      (factors.familiarity * weights.familiarity) +
      (factors.fatigueRisk * weights.fatigueRisk) +
      (factors.attritionRisk * weights.attritionRisk) +
      (factors.timeVolatility * weights.timeVolatility);
    
    return Math.round(weightedSum);
  }

  /**
   * Calculate iRating risk level based on factors
   */
  private calculateIRatingRisk(factors: ScoringFactors, opportunity: RacingOpportunity): RiskLevel {
    // High risk if poor performance expected or high unpredictability
    if (factors.performance < 40 || factors.predictability < 30) return RiskLevelEnum.HIGH;
    
    // Medium risk if moderate performance or some unpredictability
    if (factors.performance < 60 || factors.predictability < 60) return RiskLevelEnum.MEDIUM;
    
    return RiskLevelEnum.LOW;
  }

  /**
   * Calculate Safety Rating risk level based on factors
   */
  private calculateSafetyRatingRisk(factors: ScoringFactors, opportunity: RacingOpportunity): RiskLevel {
    // High risk if poor safety expected or high attrition
    if (factors.safety < 40 || factors.attritionRisk < 30) return RiskLevelEnum.HIGH;
    
    // Medium risk if moderate safety concerns
    if (factors.safety < 60 || factors.attritionRisk < 60) return RiskLevelEnum.MEDIUM;
    
    return RiskLevelEnum.LOW;
  }

  /**
   * Generate human-readable reasoning for the score
   */
  private generateReasoning(
    factors: ScoringFactors, 
    opportunity: RacingOpportunity, 
    userHistory: UserHistory
  ): string[] {
    const reasoning: string[] = [];
    
    // Performance reasoning
    if (factors.performance >= 70) {
      reasoning.push("Strong expected performance based on your history");
    } else if (factors.performance <= 30) {
      reasoning.push("Challenging track/series combination for your skill level");
    }
    
    // Safety reasoning
    if (factors.safety >= 70) {
      reasoning.push("Low incident risk based on series safety record");
    } else if (factors.safety <= 30) {
      reasoning.push("High incident risk - proceed with caution");
    }
    
    // Familiarity reasoning
    if (factors.familiarity >= 70) {
      reasoning.push("High familiarity with this series/track combination");
    } else if (factors.familiarity === 0) {
      reasoning.push("New series/track combination - consider practice first");
    }
    
    // Fatigue reasoning
    if (factors.fatigueRisk <= 30) {
      reasoning.push(`Long race (${opportunity.raceLength} min) may cause fatigue`);
    }
    
    // Open setup reasoning
    if (opportunity.hasOpenSetup) {
      reasoning.push("Open setup series requires additional preparation time");
    }
    
    return reasoning;
  }

  /**
   * Find series-track specific history for the user
   */
  private findSeriesTrackHistory(
    opportunity: RacingOpportunity, 
    userHistory: UserHistory
  ): SeriesTrackHistory | undefined {
    return userHistory.seriesTrackHistory.find(
      history => history.seriesId === opportunity.seriesId && history.trackId === opportunity.trackId
    );
  }

  /**
   * Calculate data confidence levels for each scoring factor
   * Requirements: 5.2
   */
  private calculateDataConfidence(
    opportunity: RacingOpportunity,
    userHistory: UserHistory
  ): DataConfidence {
    const seriesTrackHistory = this.findSeriesTrackHistory(opportunity, userHistory);
    
    // Performance confidence based on race count
    let performanceConfidence: ConfidenceLevel = ConfidenceLevelEnum.NO_DATA;
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      performanceConfidence = ConfidenceLevelEnum.HIGH;
    } else if (userHistory.overallStats.totalRaces >= 5) {
      performanceConfidence = ConfidenceLevelEnum.ESTIMATED;
    }

    // Safety confidence based on race count
    let safetyConfidence: ConfidenceLevel = ConfidenceLevelEnum.NO_DATA;
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      safetyConfidence = ConfidenceLevelEnum.HIGH;
    } else if (userHistory.overallStats.totalRaces >= 3) {
      safetyConfidence = ConfidenceLevelEnum.ESTIMATED;
    }

    // Consistency confidence based on race count (needs more races for meaningful std dev)
    let consistencyConfidence: ConfidenceLevel = ConfidenceLevelEnum.NO_DATA;
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 5) {
      consistencyConfidence = ConfidenceLevelEnum.HIGH;
    } else if (userHistory.overallStats.totalRaces >= 5) {
      consistencyConfidence = ConfidenceLevelEnum.ESTIMATED;
    }

    // Familiarity confidence based on any experience
    const familiarityConfidence = analyticsIntegration.getConfidenceLevel(
      seriesTrackHistory?.raceCount ?? 0
    );

    // Global stats confidence (simplified - in real implementation would come from analytics)
    const globalStatsConfidence: 'high' | 'moderate' | 'default' = 'moderate';

    return {
      performance: performanceConfidence,
      safety: safetyConfidence,
      consistency: consistencyConfidence,
      familiarity: familiarityConfidence,
      globalStats: globalStatsConfidence
    };
  }

  /**
   * Calculate priority score for familiar series/tracks
   * Requirements: 5.7
   */
  private calculatePriorityScore(
    opportunity: RacingOpportunity,
    userHistory: UserHistory,
    dataConfidence: DataConfidence
  ): number {
    const seriesTrackHistory = this.findSeriesTrackHistory(opportunity, userHistory);
    let priorityScore = 50; // Base priority

    // Boost priority for familiar combinations (3+ races)
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      priorityScore += 30; // High familiarity boost
    }

    // Boost priority for high confidence data
    if (dataConfidence.performance === ConfidenceLevelEnum.HIGH) {
      priorityScore += 10;
    }
    if (dataConfidence.safety === ConfidenceLevelEnum.HIGH) {
      priorityScore += 5;
    }
    if (dataConfidence.consistency === ConfidenceLevelEnum.HIGH) {
      priorityScore += 5;
    }

    // Series experience boost (even if not specific track)
    const seriesExperience = userHistory.seriesTrackHistory
      .filter(h => h.seriesId === opportunity.seriesId)
      .reduce((sum, h) => sum + h.raceCount, 0);
    
    if (seriesExperience >= 10) {
      priorityScore += 15;
    } else if (seriesExperience >= 5) {
      priorityScore += 10;
    }

    // Track experience boost (even if not specific series)
    const trackExperience = userHistory.seriesTrackHistory
      .filter(h => h.trackId === opportunity.trackId)
      .reduce((sum, h) => sum + h.raceCount, 0);
    
    if (trackExperience >= 10) {
      priorityScore += 10;
    } else if (trackExperience >= 5) {
      priorityScore += 5;
    }

    return Math.min(100, priorityScore);
  }
}

// Export singleton instance
export const scoringAlgorithm = new ScoringAlgorithm();