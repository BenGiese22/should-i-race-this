/**
 * Scoring Algorithm Validation Script (Self-Contained)
 *
 * This script runs a copy of the scoring algorithm against mock user profiles
 * to validate recommendation quality across different modes.
 *
 * Run with: npx tsx scripts/validate-scoring.ts
 */

// ============================================================================
// Types (copied from src/lib/recommendations/types.ts to avoid DB dependency)
// ============================================================================

type Category = 'oval' | 'sports_car' | 'formula_car' | 'dirt_oval' | 'dirt_road';
type LicenseLevel = 'Rookie' | 'D' | 'C' | 'B' | 'A' | 'Pro';
type RecommendationMode = 'balanced' | 'irating_push' | 'safety_recovery';
type RiskLevel = 'low' | 'medium' | 'high';
type ConfidenceLevel = 'high' | 'estimated' | 'no_data';

interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  strengthOfField: number;
  participantCount: number;
}

interface GlobalStats {
  avgIncidentsPerRace: number;
  avgFinishPositionStdDev: number;
  avgStrengthOfField: number;
  strengthOfFieldVariability: number;
  attritionRate: number;
  avgRaceLength: number;
}

interface RacingOpportunity {
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  licenseRequired: LicenseLevel;
  category: Category;
  seasonYear: number;
  seasonQuarter: number;
  raceWeekNum: number;
  raceLength: number;
  hasOpenSetup: boolean;
  timeSlots: TimeSlot[];
  globalStats: GlobalStats;
}

interface SeriesTrackHistory {
  seriesId: number;
  trackId: number;
  raceCount: number;
  avgStartingPosition: number;
  avgFinishingPosition: number;
  avgPositionDelta: number;
  avgIncidents: number;
  finishPositionStdDev: number;
  lastRaceDate: Date;
}

interface UserOverallStats {
  totalRaces: number;
  avgIncidentsPerRace: number;
  avgPositionDelta: number;
  overallConsistency: number;
}

interface LicenseClass {
  category: Category;
  level: LicenseLevel;
  safetyRating: number;
  iRating: number;
}

interface UserHistory {
  userId: string;
  seriesTrackHistory: SeriesTrackHistory[];
  overallStats: UserOverallStats;
  licenseClasses: LicenseClass[];
}

interface ScoringFactors {
  performance: number;
  safety: number;
  consistency: number;
  predictability: number;
  familiarity: number;
  fatigueRisk: number;
  attritionRisk: number;
  timeVolatility: number;
}

interface DataConfidence {
  performance: ConfidenceLevel;
  safety: ConfidenceLevel;
  consistency: ConfidenceLevel;
  familiarity: ConfidenceLevel;
  globalStats: 'high' | 'moderate' | 'default';
}

interface Score {
  overall: number;
  factors: ScoringFactors;
  iRatingRisk: RiskLevel;
  safetyRatingRisk: RiskLevel;
  reasoning: string[];
  dataConfidence: DataConfidence;
  priorityScore: number;
}

interface ModeWeights {
  performance: number;
  safety: number;
  consistency: number;
  predictability: number;
  familiarity: number;
  fatigueRisk: number;
  attritionRisk: number;
  timeVolatility: number;
}

// ============================================================================
// Scoring Algorithm (copied from src/lib/recommendations/scoring.ts)
// ============================================================================

class ScoringAlgorithm {
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

  private calculateFactors(opportunity: RacingOpportunity, userHistory: UserHistory): ScoringFactors {
    const seriesTrackHistory = this.findSeriesTrackHistory(opportunity, userHistory);

    return {
      performance: this.calculatePerformanceFactor(opportunity, userHistory, seriesTrackHistory),
      safety: this.calculateSafetyFactor(opportunity, userHistory, seriesTrackHistory),
      consistency: this.calculateConsistencyFactor(opportunity, userHistory, seriesTrackHistory),
      predictability: this.calculatePredictabilityFactor(opportunity),
      familiarity: this.calculateFamiliarityFactor(seriesTrackHistory, userHistory, opportunity),
      fatigueRisk: this.calculateFatigueRiskFactor(opportunity),
      attritionRisk: this.calculateAttritionRiskFactor(opportunity),
      timeVolatility: this.calculateTimeVolatilityFactor(opportunity)
    };
  }

  private findSeriesTrackHistory(opportunity: RacingOpportunity, userHistory: UserHistory): SeriesTrackHistory | undefined {
    return userHistory.seriesTrackHistory.find(
      h => h.seriesId === opportunity.seriesId && h.trackId === opportunity.trackId
    );
  }

  private calculatePerformanceFactor(
    opportunity: RacingOpportunity,
    userHistory: UserHistory,
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let expectedDelta = 0;
    let confidence = 0;

    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      expectedDelta = seriesTrackHistory.avgPositionDelta;
      confidence = 1.0;
    } else {
      const userLicense = userHistory.licenseClasses.find(l => l.category === opportunity.category);
      const overallDelta = userHistory.overallStats.avgPositionDelta;

      if (userHistory.overallStats.totalRaces >= 5 && userLicense) {
        const userIRating = userLicense.iRating;
        const opportunitySof = opportunity.globalStats.avgStrengthOfField;
        const iRatingDiff = userIRating - opportunitySof;
        const sofAdjustment = Math.max(-5, Math.min(5, iRatingDiff / 200));
        expectedDelta = overallDelta + sofAdjustment;
        confidence = Math.min(userHistory.overallStats.totalRaces / 10, 0.8);
      } else {
        const licenseBonus = this.getLicenseLevelBonus(userLicense?.level);
        expectedDelta = licenseBonus;
        confidence = 0.3;
      }
    }

    if (isNaN(expectedDelta) || !isFinite(expectedDelta)) {
      expectedDelta = 0;
      confidence = 0.2;
    }

    const normalizedDelta = Math.max(-10, Math.min(10, expectedDelta));
    const baseScore = ((normalizedDelta + 10) / 20) * 100;
    const confidenceAdjustedScore = (baseScore * confidence) + (50 * (1 - confidence));

    return Math.round(confidenceAdjustedScore);
  }

  private getLicenseLevelBonus(level?: LicenseLevel): number {
    if (!level) return 0;
    const values: Record<LicenseLevel, number> = {
      'Rookie': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5, 'Pro': 6
    };
    return (values[level] || 1) - 3;
  }

  private calculateSafetyFactor(
    opportunity: RacingOpportunity,
    userHistory: UserHistory,
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let expectedIncidents = 0;

    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      // Use personal history - no race length adjustment needed
      expectedIncidents = seriesTrackHistory.avgIncidents;
    } else {
      const userLicense = userHistory.licenseClasses.find(l => l.category === opportunity.category);
      const userIncidentRate = userHistory.overallStats.avgIncidentsPerRace;
      const globalIncidentRate = opportunity.globalStats.avgIncidentsPerRace;

      // Calculate race length multiplier (baseline: 20 minutes)
      const raceLengthMultiplier = this.getRaceLengthIncidentMultiplier(opportunity.raceLength);

      if (userHistory.overallStats.totalRaces >= 5 && userLicense) {
        const srFactor = Math.max(0, userLicense.safetyRating - 2.0) / 3.0;
        const baseIncidents = (userIncidentRate * 0.6 + globalIncidentRate * 0.4) * (1 - srFactor * 0.3);
        // Apply race length multiplier for unfamiliar series
        expectedIncidents = baseIncidents * raceLengthMultiplier;
      } else {
        expectedIncidents = globalIncidentRate * raceLengthMultiplier;
      }
    }

    if (isNaN(expectedIncidents) || !isFinite(expectedIncidents)) {
      expectedIncidents = 4;
    }

    // Range expanded to 0-20 to account for race length multiplier (up to 2x)
    const normalizedIncidents = Math.max(0, Math.min(20, expectedIncidents));
    const score = Math.round((1 - normalizedIncidents / 20) * 100);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate incident multiplier based on race length
   * Longer races = more opportunity for incidents, but not linearly
   */
  private getRaceLengthIncidentMultiplier(raceLength: number, baselineLength: number = 20): number {
    if (raceLength <= baselineLength) {
      // Shorter or equal to baseline: slight bonus for very short races
      return Math.max(0.8, raceLength / baselineLength);
    }

    // Longer than baseline: use logarithmic scaling
    // 60-min race is ~1.5x, 120-min race is ~1.8x
    const ratio = raceLength / baselineLength;
    const multiplier = 1 + Math.log2(ratio) * 0.5;

    // Cap at 2.0x to avoid extreme penalties
    return Math.min(2.0, multiplier);
  }

  private calculateConsistencyFactor(
    opportunity: RacingOpportunity,
    userHistory: UserHistory,
    seriesTrackHistory?: SeriesTrackHistory
  ): number {
    let stdDev: number;

    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 3) {
      stdDev = seriesTrackHistory.finishPositionStdDev;
    } else {
      stdDev = opportunity.globalStats.avgFinishPositionStdDev;
    }

    if (isNaN(stdDev) || !isFinite(stdDev)) {
      stdDev = 5;
    }

    const normalizedStdDev = Math.max(1, Math.min(15, stdDev));
    const score = Math.round((1 - (normalizedStdDev - 1) / 14) * 100);

    return Math.max(0, Math.min(100, score));
  }

  private calculatePredictabilityFactor(opportunity: RacingOpportunity): number {
    const sofVariability = opportunity.globalStats.strengthOfFieldVariability;
    const normalizedVariability = Math.max(50, Math.min(500, sofVariability));
    const score = Math.round((1 - (normalizedVariability - 50) / 450) * 100);

    return Math.max(0, Math.min(100, score));
  }

  private calculateFamiliarityFactor(
    seriesTrackHistory: SeriesTrackHistory | undefined,
    userHistory: UserHistory,
    opportunity: RacingOpportunity
  ): number {
    if (seriesTrackHistory && seriesTrackHistory.raceCount >= 1) {
      const raceCount = seriesTrackHistory.raceCount;
      const recency = this.calculateRecencyBonus(seriesTrackHistory.lastRaceDate);
      const baseScore = Math.min(100, raceCount * 10);
      return Math.round(baseScore * (0.7 + 0.3 * recency));
    }

    const categoryHistory = userHistory.seriesTrackHistory.filter(
      h => {
        const matchingOpp = h.seriesId === opportunity.seriesId || h.trackId === opportunity.trackId;
        return matchingOpp;
      }
    );

    if (categoryHistory.length > 0) {
      const avgRaces = categoryHistory.reduce((sum, h) => sum + h.raceCount, 0) / categoryHistory.length;
      return Math.round(Math.min(50, avgRaces * 5));
    }

    return 0;
  }

  private calculateRecencyBonus(lastRaceDate: Date): number {
    const daysSinceRace = (Date.now() - lastRaceDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRace <= 7) return 1.0;
    if (daysSinceRace <= 30) return 0.8;
    if (daysSinceRace <= 90) return 0.5;
    return 0.3;
  }

  private calculateFatigueRiskFactor(opportunity: RacingOpportunity): number {
    const raceLength = opportunity.raceLength;
    if (raceLength <= 20) return 90;
    if (raceLength <= 40) return 70;
    if (raceLength <= 60) return 50;
    return 30;
  }

  private calculateAttritionRiskFactor(opportunity: RacingOpportunity): number {
    const attritionRate = opportunity.globalStats.attritionRate;
    const normalizedRate = Math.max(0, Math.min(50, attritionRate));
    return Math.round((1 - normalizedRate / 50) * 100);
  }

  private calculateTimeVolatilityFactor(opportunity: RacingOpportunity): number {
    const timeSlotCount = opportunity.timeSlots.length;
    if (timeSlotCount >= 12) return 90;
    if (timeSlotCount >= 6) return 70;
    if (timeSlotCount >= 3) return 50;
    return 30;
  }

  private getModeWeights(mode: RecommendationMode): ModeWeights {
    switch (mode) {
      case 'balanced':
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
      case 'irating_push':
        return {
          performance: 0.25,
          safety: 0.10,
          consistency: 0.10,
          predictability: 0.15,
          familiarity: 0.20,
          fatigueRisk: 0.05,
          attritionRisk: 0.10,
          timeVolatility: 0.05
        };
      case 'safety_recovery':
        return {
          performance: 0.05,
          safety: 0.30,
          consistency: 0.20,
          predictability: 0.10,
          familiarity: 0.15,
          fatigueRisk: 0.10,
          attritionRisk: 0.05,
          timeVolatility: 0.05
        };
    }
  }

  private calculateWeightedScore(factors: ScoringFactors, weights: ModeWeights): number {
    return Math.round(
      factors.performance * weights.performance +
      factors.safety * weights.safety +
      factors.consistency * weights.consistency +
      factors.predictability * weights.predictability +
      factors.familiarity * weights.familiarity +
      factors.fatigueRisk * weights.fatigueRisk +
      factors.attritionRisk * weights.attritionRisk +
      factors.timeVolatility * weights.timeVolatility
    );
  }

  private calculateIRatingRisk(factors: ScoringFactors, opportunity: RacingOpportunity): RiskLevel {
    if (factors.performance >= 60 && factors.familiarity >= 40) return 'low';
    if (factors.performance >= 40) return 'medium';
    return 'high';
  }

  private calculateSafetyRatingRisk(factors: ScoringFactors, opportunity: RacingOpportunity): RiskLevel {
    if (factors.safety >= 70 && factors.consistency >= 60) return 'low';
    if (factors.safety >= 50) return 'medium';
    return 'high';
  }

  private generateReasoning(
    factors: ScoringFactors,
    opportunity: RacingOpportunity,
    userHistory: UserHistory
  ): string[] {
    const reasoning: string[] = [];

    if (factors.familiarity >= 50) {
      reasoning.push('You have experience at this track/series combination');
    } else if (factors.familiarity > 0) {
      reasoning.push('Some familiarity with this series or track');
    } else {
      reasoning.push('New track and series for you');
    }

    if (factors.safety >= 70) {
      reasoning.push('Low incident rate expected');
    } else if (factors.safety < 50) {
      reasoning.push('Higher incident risk - race carefully');
    }

    if (factors.performance >= 60) {
      reasoning.push('Good position gain potential');
    } else if (factors.performance < 40) {
      reasoning.push('Challenging field for your rating');
    }

    return reasoning;
  }

  private calculateDataConfidence(
    opportunity: RacingOpportunity,
    userHistory: UserHistory
  ): DataConfidence {
    const history = this.findSeriesTrackHistory(opportunity, userHistory);
    const hasGoodHistory = history && history.raceCount >= 5;
    const hasModerateHistory = history && history.raceCount >= 2;

    return {
      performance: hasGoodHistory ? 'high' : hasModerateHistory ? 'estimated' : 'no_data',
      safety: hasGoodHistory ? 'high' : hasModerateHistory ? 'estimated' : 'no_data',
      consistency: hasGoodHistory ? 'high' : hasModerateHistory ? 'estimated' : 'no_data',
      familiarity: history ? 'high' : 'no_data',
      globalStats: 'high'
    };
  }

  private calculatePriorityScore(
    opportunity: RacingOpportunity,
    userHistory: UserHistory,
    dataConfidence: DataConfidence
  ): number {
    const history = this.findSeriesTrackHistory(opportunity, userHistory);
    if (history) {
      return Math.min(100, history.raceCount * 5);
    }
    return 0;
  }
}

// ============================================================================
// Mock User Profiles
// ============================================================================

interface MockUserProfile {
  name: string;
  description: string;
  userHistory: UserHistory;
}

const mockProfiles: MockUserProfile[] = [
  {
    name: 'New Driver',
    description: 'Just started - Rookie licenses, 12 races, MX-5 focus',
    userHistory: {
      userId: 'new-driver-001',
      seriesTrackHistory: [
        {
          seriesId: 234,
          trackId: 116, // Lime Rock - matches opportunity
          raceCount: 5,
          avgStartingPosition: 18,
          avgFinishingPosition: 15,
          avgPositionDelta: 3,
          avgIncidents: 3.2,
          finishPositionStdDev: 4.5,
          lastRaceDate: new Date()
        }
      ],
      overallStats: {
        totalRaces: 12,
        avgIncidentsPerRace: 4.0,
        avgPositionDelta: 2.5,
        overallConsistency: 4.8
      },
      licenseClasses: [
        { category: 'sports_car', level: 'Rookie', safetyRating: 2.8, iRating: 1150 },
        { category: 'formula_car', level: 'Rookie', safetyRating: 2.5, iRating: 1100 },
        { category: 'oval', level: 'Rookie', safetyRating: 2.2, iRating: 1050 }
      ]
    }
  },
  {
    name: 'Road Veteran',
    description: 'A-class road racer, 487 races, GT3/IMSA focus',
    userHistory: {
      userId: 'road-veteran-001',
      seriesTrackHistory: [
        {
          seriesId: 399, // IMSA
          trackId: 119, // Watkins Glen - matches opportunity
          raceCount: 45,
          avgStartingPosition: 8,
          avgFinishingPosition: 6,
          avgPositionDelta: 2,
          avgIncidents: 1.8,
          finishPositionStdDev: 3.2,
          lastRaceDate: new Date()
        },
        {
          seriesId: 401, // GT3
          trackId: 226, // Road America - matches opportunity
          raceCount: 15,
          avgStartingPosition: 10,
          avgFinishingPosition: 8,
          avgPositionDelta: 2,
          avgIncidents: 2.0,
          finishPositionStdDev: 3.0,
          lastRaceDate: new Date()
        }
      ],
      overallStats: {
        totalRaces: 487,
        avgIncidentsPerRace: 2.0,
        avgPositionDelta: 2.5,
        overallConsistency: 3.5
      },
      licenseClasses: [
        { category: 'sports_car', level: 'A', safetyRating: 4.2, iRating: 2850 },
        { category: 'formula_car', level: 'B', safetyRating: 3.5, iRating: 2100 },
        { category: 'oval', level: 'D', safetyRating: 2.8, iRating: 1400 }
      ]
    }
  },
  {
    name: 'Safety Recovery',
    description: 'Low SR (2.1), needs to rebuild safety rating - HIGH INCIDENTS RECENTLY',
    userHistory: {
      userId: 'safety-recovery-001',
      seriesTrackHistory: [
        {
          seriesId: 399, // IMSA
          trackId: 119, // Watkins Glen
          raceCount: 32,
          avgStartingPosition: 6,
          avgFinishingPosition: 8,
          avgPositionDelta: -2,
          avgIncidents: 5.5, // HIGH INCIDENTS!
          finishPositionStdDev: 6.0,
          lastRaceDate: new Date()
        },
        {
          seriesId: 234, // MX-5 - familiar, safer series
          trackId: 116, // Lime Rock - matches opportunity
          raceCount: 24,
          avgStartingPosition: 8,
          avgFinishingPosition: 6,
          avgPositionDelta: 2,
          avgIncidents: 2.0, // Low incidents here!
          finishPositionStdDev: 3.0,
          lastRaceDate: new Date()
        }
      ],
      overallStats: {
        totalRaces: 245,
        avgIncidentsPerRace: 4.5, // HIGH overall
        avgPositionDelta: 0.5,
        overallConsistency: 5.5
      },
      licenseClasses: [
        { category: 'sports_car', level: 'B', safetyRating: 2.1, iRating: 2450 }, // LOW SR!
        { category: 'formula_car', level: 'C', safetyRating: 2.4, iRating: 1800 },
        { category: 'oval', level: 'D', safetyRating: 2.0, iRating: 1350 }
      ]
    }
  }
];

// ============================================================================
// Mock Racing Opportunities
// ============================================================================

const racingOpportunities: RacingOpportunity[] = [
  {
    seriesId: 234,
    seriesName: 'Global Mazda MX-5 Fanatec Cup',
    trackId: 116,
    trackName: 'Lime Rock Park',
    licenseRequired: 'Rookie',
    category: 'sports_car',
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: 15,
    hasOpenSetup: false,
    timeSlots: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      dayOfWeek: 0,
      strengthOfField: 1200 + Math.random() * 200,
      participantCount: 25
    })),
    globalStats: {
      avgIncidentsPerRace: 2.5, // SAFE series
      avgFinishPositionStdDev: 4.0,
      avgStrengthOfField: 1300,
      strengthOfFieldVariability: 150,
      attritionRate: 8,
      avgRaceLength: 15
    }
  },
  {
    seriesId: 399,
    seriesName: 'IMSA iRacing Series',
    trackId: 119,
    trackName: 'Watkins Glen International',
    licenseRequired: 'A',
    category: 'sports_car',
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: 45,
    hasOpenSetup: true,
    timeSlots: Array.from({ length: 6 }, (_, i) => ({
      hour: i * 4,
      dayOfWeek: 0,
      strengthOfField: 2500 + Math.random() * 500,
      participantCount: 35
    })),
    globalStats: {
      avgIncidentsPerRace: 4.5, // MORE CHAOTIC
      avgFinishPositionStdDev: 5.5,
      avgStrengthOfField: 2700,
      strengthOfFieldVariability: 300,
      attritionRate: 15,
      avgRaceLength: 45
    }
  },
  {
    seriesId: 401,
    seriesName: 'GT3 Fanatec Challenge',
    trackId: 226,
    trackName: 'Road America',
    licenseRequired: 'B',
    category: 'sports_car',
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: 30,
    hasOpenSetup: true,
    timeSlots: Array.from({ length: 8 }, (_, i) => ({
      hour: i * 3,
      dayOfWeek: 0,
      strengthOfField: 2000 + Math.random() * 400,
      participantCount: 30
    })),
    globalStats: {
      avgIncidentsPerRace: 3.2, // MODERATE
      avgFinishPositionStdDev: 4.5,
      avgStrengthOfField: 2200,
      strengthOfFieldVariability: 200,
      attritionRate: 10,
      avgRaceLength: 30
    }
  },
  {
    seriesId: 402,
    seriesName: 'Porsche Cup',
    trackId: 62,
    trackName: 'Brands Hatch Circuit',
    licenseRequired: 'C',
    category: 'sports_car',
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: 20,
    hasOpenSetup: false,
    timeSlots: Array.from({ length: 12 }, (_, i) => ({
      hour: i * 2,
      dayOfWeek: 0,
      strengthOfField: 1800 + Math.random() * 300,
      participantCount: 28
    })),
    globalStats: {
      avgIncidentsPerRace: 2.8, // FAIRLY SAFE
      avgFinishPositionStdDev: 3.8,
      avgStrengthOfField: 1900,
      strengthOfFieldVariability: 180,
      attritionRate: 9,
      avgRaceLength: 20
    }
  },
  {
    seriesId: 500,
    seriesName: 'IMSA Endurance (2hr)',
    trackId: 42,
    trackName: 'Watkins Glen International',
    licenseRequired: 'B',
    category: 'sports_car',
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: 120, // 2 HOUR RACE
    hasOpenSetup: true,
    timeSlots: Array.from({ length: 4 }, (_, i) => ({
      hour: i * 6,
      dayOfWeek: 6, // Saturday
      strengthOfField: 2500 + Math.random() * 500,
      participantCount: 45
    })),
    globalStats: {
      avgIncidentsPerRace: 3.5, // Similar to regular IMSA
      avgFinishPositionStdDev: 5.5,
      avgStrengthOfField: 2600,
      strengthOfFieldVariability: 250,
      attritionRate: 18, // Higher attrition for endurance
      avgRaceLength: 120
    }
  }
];

// ============================================================================
// Validation Runner
// ============================================================================

const MODES: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];

function runValidation() {
  const scoringAlgorithm = new ScoringAlgorithm();

  console.log('═'.repeat(80));
  console.log(' SCORING ALGORITHM VALIDATION REPORT');
  console.log('═'.repeat(80));
  console.log();

  for (const profile of mockProfiles) {
    console.log('━'.repeat(80));
    console.log(`📊 PROFILE: ${profile.name}`);
    console.log(`   ${profile.description}`);
    console.log(`   Total Races: ${profile.userHistory.overallStats.totalRaces}`);
    console.log(`   Avg Incidents: ${profile.userHistory.overallStats.avgIncidentsPerRace.toFixed(1)}`);
    console.log(`   Primary License: ${profile.userHistory.licenseClasses[0]?.level} (SR: ${profile.userHistory.licenseClasses[0]?.safetyRating}, iR: ${profile.userHistory.licenseClasses[0]?.iRating})`);
    console.log('━'.repeat(80));
    console.log();

    for (const mode of MODES) {
      console.log(`  ┌─ MODE: ${mode.toUpperCase().replace('_', ' ')} ─────────────────────────────────────────`);

      // Score all opportunities
      const scores: { opportunity: RacingOpportunity; score: Score }[] = [];

      for (const opportunity of racingOpportunities) {
        const score = scoringAlgorithm.calculateScore(opportunity, profile.userHistory, mode);
        scores.push({ opportunity, score });
      }

      // Sort by overall score (descending)
      scores.sort((a, b) => b.score.overall - a.score.overall);

      // Display recommendations
      console.log('  │');
      console.log('  │  Rank  Series                              Len   Score  Perf  Safe  Fam   Risk');
      console.log('  │  ────  ──────────────────────────────────  ────  ─────  ────  ────  ────  ────');

      scores.forEach(({ opportunity, score }, index) => {
        const rank = index + 1;
        const seriesName = opportunity.seriesName.substring(0, 34).padEnd(34);
        const raceLen = (opportunity.raceLength + 'm').padStart(4);
        const overall = score.overall.toString().padStart(3);
        const perf = score.factors.performance.toString().padStart(3);
        const safe = score.factors.safety.toString().padStart(3);
        const fam = score.factors.familiarity.toString().padStart(3);
        const risk = score.safetyRatingRisk.padStart(6);

        const highlight = rank === 1 ? '★' : ' ';
        console.log(`  │  ${highlight}${rank}.   ${seriesName}  ${raceLen}    ${overall}   ${perf}   ${safe}   ${fam}   ${risk}`);
      });

      console.log('  │');

      // Analysis
      const topRec = scores[0];
      console.log('  │  📍 Top Recommendation:');
      console.log(`  │     ${topRec.opportunity.seriesName} @ ${topRec.opportunity.trackName}`);
      console.log(`  │     Overall: ${topRec.score.overall} | Factors: P:${topRec.score.factors.performance} S:${topRec.score.factors.safety} C:${topRec.score.factors.consistency} F:${topRec.score.factors.familiarity}`);

      // Mode-specific validation
      if (mode === 'safety_recovery') {
        const safestSeries = [...scores].sort((a, b) => b.score.factors.safety - a.score.factors.safety)[0];
        const topIsNotSafest = topRec.opportunity.seriesId !== safestSeries.opportunity.seriesId;

        if (topIsNotSafest && safestSeries.score.factors.safety > topRec.score.factors.safety + 5) {
          console.log('  │');
          console.log(`  │  ⚠️  ISSUE: Top rec is NOT the safest option!`);
          console.log(`  │     Safest: ${safestSeries.opportunity.seriesName} (Safety: ${safestSeries.score.factors.safety})`);
          console.log(`  │     Top rec safety: ${topRec.score.factors.safety} (${safestSeries.score.factors.safety - topRec.score.factors.safety} pts lower)`);
        } else {
          console.log('  │');
          console.log(`  │  ✅ Safety Recovery mode is recommending appropriately`);
        }
      }

      console.log('  └' + '─'.repeat(70));
      console.log();
    }
    console.log();
  }

  // Summary
  console.log('═'.repeat(80));
  console.log(' KEY OBSERVATIONS');
  console.log('═'.repeat(80));
  console.log();
  console.log('Check for these behaviors:');
  console.log('1. Safety Recovery mode should prioritize high-safety series for low-SR users');
  console.log('2. iRating Push should prioritize performance/familiarity over safety');
  console.log('3. Familiar series (with race history) should rank higher');
  console.log('4. New Driver should see beginner-appropriate recommendations');
  console.log();
}

// Run the validation
runValidation();
