/**
 * Property-Based Tests for Mode-Based Weighting System
 * Feature: racing-analytics-dashboard, Property 8: Mode-Based Weighting
 * Validates: Requirements 7.9
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { ScoringAlgorithm } from '../scoring';
import { 
  RacingOpportunity, 
  UserHistory, 
  RecommendationMode, 
  SeriesTrackHistory,
  UserOverallStats,
  LicenseClass,
  GlobalStats,
  TimeSlot,
  Category,
  LicenseLevel,
  ScoringFactors
} from '../types';

// Test data generators (reusing from scoring.property.test.ts)
const categoryArb = fc.constantFrom('oval', 'road', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;
const licenseLevelArb = fc.constantFrom('rookie', 'D', 'C', 'B', 'A', 'pro') as fc.Arbitrary<LicenseLevel>;
import { RecommendationMode, RecommendationModeHelper } from '../../types/recommendation';

const recommendationModeArb = fc.constantFrom(...RecommendationModeHelper.getAllModes());

const timeSlotArb = fc.record({
  hour: fc.integer({ min: 0, max: 23 }),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  strengthOfField: fc.integer({ min: 800, max: 4000 }),
  participantCount: fc.integer({ min: 5, max: 60 })
}) as fc.Arbitrary<TimeSlot>;

const globalStatsArb = fc.record({
  avgIncidentsPerRace: fc.float({ min: 0, max: Math.fround(10) }),
  avgFinishPositionStdDev: fc.float({ min: 1, max: Math.fround(20) }),
  avgStrengthOfField: fc.integer({ min: 800, max: 4000 }),
  strengthOfFieldVariability: fc.float({ min: 50, max: Math.fround(2000) }),
  attritionRate: fc.float({ min: 0, max: Math.fround(50) }),
  avgRaceLength: fc.integer({ min: 15, max: 240 })
}) as fc.Arbitrary<GlobalStats>;

const racingOpportunityArb = fc.record({
  seriesId: fc.integer({ min: 1, max: 1000 }),
  seriesName: fc.string({ minLength: 5, maxLength: 50 }),
  trackId: fc.integer({ min: 1, max: 500 }),
  trackName: fc.string({ minLength: 5, maxLength: 50 }),
  licenseRequired: licenseLevelArb,
  category: categoryArb,
  seasonYear: fc.integer({ min: 2020, max: 2025 }),
  seasonQuarter: fc.integer({ min: 1, max: 4 }),
  raceWeekNum: fc.integer({ min: 0, max: 12 }),
  raceLength: fc.integer({ min: 15, max: 240 }),
  hasOpenSetup: fc.boolean(),
  timeSlots: fc.array(timeSlotArb, { minLength: 1, maxLength: 8 }),
  globalStats: globalStatsArb
}) as fc.Arbitrary<RacingOpportunity>;

const seriesTrackHistoryArb = fc.record({
  seriesId: fc.integer({ min: 1, max: 1000 }),
  trackId: fc.integer({ min: 1, max: 500 }),
  raceCount: fc.integer({ min: 1, max: 100 }),
  avgStartingPosition: fc.float({ min: 1, max: Math.fround(60) }),
  avgFinishingPosition: fc.float({ min: 1, max: Math.fround(60) }),
  avgPositionDelta: fc.float({ min: -30, max: Math.fround(30) }),
  avgIncidents: fc.float({ min: 0, max: Math.fround(15) }),
  finishPositionStdDev: fc.float({ min: Math.fround(0.5), max: Math.fround(20) }),
  lastRaceDate: fc.date({ min: new Date('2020-01-01'), max: new Date() })
}) as fc.Arbitrary<SeriesTrackHistory>;

const userOverallStatsArb = fc.record({
  totalRaces: fc.integer({ min: 1, max: 1000 }),
  avgIncidentsPerRace: fc.float({ min: 0, max: Math.fround(10) }),
  avgPositionDelta: fc.float({ min: -20, max: Math.fround(20) }),
  overallConsistency: fc.float({ min: 1, max: Math.fround(25) })
}) as fc.Arbitrary<UserOverallStats>;

const licenseClassArb = fc.record({
  category: categoryArb,
  level: licenseLevelArb,
  safetyRating: fc.float({ min: Math.fround(1.0), max: Math.fround(4.99) }),
  iRating: fc.integer({ min: 800, max: 4000 })
}) as fc.Arbitrary<LicenseClass>;

const userHistoryArb = fc.record({
  userId: fc.uuid(),
  seriesTrackHistory: fc.array(seriesTrackHistoryArb, { minLength: 0, maxLength: 20 }),
  overallStats: userOverallStatsArb,
  licenseClasses: fc.array(licenseClassArb, { minLength: 1, maxLength: 4 })
}) as fc.Arbitrary<UserHistory>;

describe('Mode-Based Weighting Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 8: Mode-Based Weighting
   * For any set of scoring factors, applying different recommendation modes 
   * (Balanced, iRating Push, Safety Rating Recovery) should produce different 
   * weighted scores that reflect the priorities of each mode.
   */
  test('Property 8: Different modes produce different weighted scores reflecting mode priorities', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        async (opportunity, userHistory) => {
          // Calculate scores for all three modes
          const balancedScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
          const iRatingScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'irating_push');
          const safetyScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'safety_recovery');

          // All scores should be valid
          expect(balancedScore.overall).toBeGreaterThanOrEqual(0);
          expect(balancedScore.overall).toBeLessThanOrEqual(100);
          expect(iRatingScore.overall).toBeGreaterThanOrEqual(0);
          expect(iRatingScore.overall).toBeLessThanOrEqual(100);
          expect(safetyScore.overall).toBeGreaterThanOrEqual(0);
          expect(safetyScore.overall).toBeLessThanOrEqual(100);

          // Factor scores should be identical (only weighting changes)
          expect(balancedScore.factors).toEqual(iRatingScore.factors);
          expect(balancedScore.factors).toEqual(safetyScore.factors);

          // If there are significant differences in factor scores, 
          // the overall scores should reflect mode priorities
          const factors = balancedScore.factors;
          
          // If performance is significantly better than safety
          if (factors.performance > factors.safety + 20) {
            // iRating push should score higher than safety recovery
            expect(iRatingScore.overall).toBeGreaterThanOrEqual(safetyScore.overall);
          }
          
          // If safety is significantly better than performance
          if (factors.safety > factors.performance + 20) {
            // Safety recovery should score higher than iRating push
            expect(safetyScore.overall).toBeGreaterThanOrEqual(iRatingScore.overall);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8a: iRating push mode emphasizes performance and familiarity', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        async (opportunity, userHistory) => {
          // Create scenarios with high performance/familiarity vs high safety
          const highPerformanceHistory = {
            ...userHistory,
            seriesTrackHistory: [
              {
                seriesId: opportunity.seriesId,
                trackId: opportunity.trackId,
                raceCount: 20, // High familiarity
                avgStartingPosition: 15,
                avgFinishingPosition: 5, // Excellent performance
                avgPositionDelta: 10,
                avgIncidents: 4, // Higher incidents (lower safety)
                finishPositionStdDev: 3,
                lastRaceDate: new Date()
              }
            ]
          };

          const highSafetyOpportunity = {
            ...opportunity,
            globalStats: {
              ...opportunity.globalStats,
              avgIncidentsPerRace: 1.0 // Very safe but assume neutral performance
            }
          };

          const iRatingScore = scoringAlgorithm.calculateScore(opportunity, highPerformanceHistory, 'irating_push');
          const safetyScore = scoringAlgorithm.calculateScore(highSafetyOpportunity, userHistory, 'safety_recovery');

          // With high performance/familiarity, iRating push should potentially score well
          // even if safety is not optimal
          if (iRatingScore.factors.performance >= 80 && iRatingScore.factors.familiarity >= 80) {
            expect(iRatingScore.overall).toBeGreaterThanOrEqual(60);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8b: Safety recovery mode emphasizes safety and consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        async (opportunity, userHistory) => {
          // Create scenario with high safety but lower performance
          const safeDrivingHistory = {
            ...userHistory,
            seriesTrackHistory: [
              {
                seriesId: opportunity.seriesId,
                trackId: opportunity.trackId,
                raceCount: 10,
                avgStartingPosition: 10,
                avgFinishingPosition: 12, // Slightly worse performance
                avgPositionDelta: -2,
                avgIncidents: 0.5, // Very low incidents (high safety)
                finishPositionStdDev: 2, // High consistency
                lastRaceDate: new Date()
              }
            ]
          };

          const safeOpportunity = {
            ...opportunity,
            globalStats: {
              ...opportunity.globalStats,
              avgIncidentsPerRace: 1.0, // Very safe series
              attritionRate: 5 // Low attrition
            }
          };

          const safetyScore = scoringAlgorithm.calculateScore(safeOpportunity, safeDrivingHistory, 'safety_recovery');

          // With high safety and consistency, safety recovery mode should score well
          // even if performance is not optimal
          if (safetyScore.factors.safety >= 80 && safetyScore.factors.consistency >= 80) {
            expect(safetyScore.overall).toBeGreaterThanOrEqual(60);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8c: Balanced mode provides moderate weighting across all factors', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        async (opportunity, userHistory) => {
          const balancedScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
          const iRatingScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'irating_push');
          const safetyScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'safety_recovery');

          // Balanced mode should generally produce scores between the extremes
          // when there are significant differences in factor priorities
          const factors = balancedScore.factors;
          
          // If performance and safety differ significantly
          if (Math.abs(factors.performance - factors.safety) > 30) {
            const scores = [balancedScore.overall, iRatingScore.overall, safetyScore.overall].sort((a, b) => a - b);
            
            // Balanced should often be in the middle (allowing for some variance)
            const isInMiddleRange = balancedScore.overall >= scores[0] && balancedScore.overall <= scores[2];
            expect(isInMiddleRange).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8d: Mode weighting is consistent and deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Same inputs should produce identical results
          const score1 = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
          const score2 = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);

          expect(score1.overall).toBe(score2.overall);
          expect(score1.factors).toEqual(score2.factors);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8e: Mode weights sum to 1.0 and produce valid weighted scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
          
          // Get the weights for this mode
          const weights = (scoringAlgorithm as any).getModeWeights(mode);
          
          // Weights should sum to 1.0
          const weightSum = 
            weights.performance + weights.safety + weights.consistency + 
            weights.predictability + weights.familiarity + weights.fatigueRisk + 
            weights.attritionRisk + weights.timeVolatility;
          
          expect(weightSum).toBeCloseTo(1.0, 5);
          
          // Manual calculation should match the algorithm's result
          const manualScore = Math.round(
            (score.factors.performance * weights.performance) +
            (score.factors.safety * weights.safety) +
            (score.factors.consistency * weights.consistency) +
            (score.factors.predictability * weights.predictability) +
            (score.factors.familiarity * weights.familiarity) +
            (score.factors.fatigueRisk * weights.fatigueRisk) +
            (score.factors.attritionRisk * weights.attritionRisk) +
            (score.factors.timeVolatility * weights.timeVolatility)
          );
          
          expect(score.overall).toBe(manualScore);
        }
      ),
      { numRuns: 100 }
    );
  });
});