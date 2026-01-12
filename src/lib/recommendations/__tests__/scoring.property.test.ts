/**
 * Property-Based Tests for Multi-Factor Scoring Algorithm
 * Feature: racing-analytics-dashboard, Property 7: Multi-Factor Scoring Algorithm
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10
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
  RiskLevel
} from '../types';

// Test data generators
const categoryArb = fc.constantFrom('oval', 'road', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;
const licenseLevelArb = fc.constantFrom('rookie', 'D', 'C', 'B', 'A', 'pro') as fc.Arbitrary<LicenseLevel>;
import { RecommendationMode, RecommendationModeHelper, RiskLevel, RiskLevelHelper } from '../../types/recommendation';

const recommendationModeArb = fc.constantFrom(...RecommendationModeHelper.getAllModes());
const riskLevelArb = fc.constantFrom(...RiskLevelHelper.getAllLevels());

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

describe('Multi-Factor Scoring Algorithm Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 7: Multi-Factor Scoring Algorithm
   * For any racing opportunity and user history, the scoring algorithm should evaluate 
   * all eight factors (Performance, Safety, Consistency, Predictability, Familiarity, 
   * Fatigue Risk, Attrition Risk, Time Volatility) and produce a score between 0-100 
   * with separate risk indicators.
   */
  test('Property 7: Multi-factor scoring produces valid scores and evaluates all factors', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);

          // Overall score must be between 0-100
          expect(score.overall).toBeGreaterThanOrEqual(0);
          expect(score.overall).toBeLessThanOrEqual(100);
          expect(Number.isInteger(score.overall)).toBe(true);

          // All 8 factors must be evaluated and within 0-100 range
          expect(score.factors.performance).toBeGreaterThanOrEqual(0);
          expect(score.factors.performance).toBeLessThanOrEqual(100);
          
          expect(score.factors.safety).toBeGreaterThanOrEqual(0);
          expect(score.factors.safety).toBeLessThanOrEqual(100);
          
          expect(score.factors.consistency).toBeGreaterThanOrEqual(0);
          expect(score.factors.consistency).toBeLessThanOrEqual(100);
          
          expect(score.factors.predictability).toBeGreaterThanOrEqual(0);
          expect(score.factors.predictability).toBeLessThanOrEqual(100);
          
          expect(score.factors.familiarity).toBeGreaterThanOrEqual(0);
          expect(score.factors.familiarity).toBeLessThanOrEqual(100);
          
          expect(score.factors.fatigueRisk).toBeGreaterThanOrEqual(0);
          expect(score.factors.fatigueRisk).toBeLessThanOrEqual(100);
          
          expect(score.factors.attritionRisk).toBeGreaterThanOrEqual(0);
          expect(score.factors.attritionRisk).toBeLessThanOrEqual(100);
          
          expect(score.factors.timeVolatility).toBeGreaterThanOrEqual(0);
          expect(score.factors.timeVolatility).toBeLessThanOrEqual(100);

          // Risk indicators must be valid levels
          expect(RiskLevelHelper.getAllLevels()).toContain(score.iRatingRisk);
          expect(RiskLevelHelper.getAllLevels()).toContain(score.safetyRatingRisk);

          // Reasoning must be an array of strings
          expect(Array.isArray(score.reasoning)).toBe(true);
          score.reasoning.forEach(reason => {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7a: Performance factor reflects expected position improvement', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Create a matching series-track history with known performance
          const goodPerformanceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: 10,
            avgStartingPosition: 15,
            avgFinishingPosition: 8, // Good improvement
            avgPositionDelta: 7, // Positive delta = improvement
            avgIncidents: 2,
            finishPositionStdDev: 3,
            lastRaceDate: new Date()
          };

          const badPerformanceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: 10,
            avgStartingPosition: 8,
            avgFinishingPosition: 15, // Poor performance
            avgPositionDelta: -7, // Negative delta = decline
            avgIncidents: 2,
            finishPositionStdDev: 3,
            lastRaceDate: new Date()
          };

          const goodUserHistory = {
            ...userHistory,
            seriesTrackHistory: [goodPerformanceHistory, ...userHistory.seriesTrackHistory]
          };

          const badUserHistory = {
            ...userHistory,
            seriesTrackHistory: [badPerformanceHistory, ...userHistory.seriesTrackHistory]
          };

          const goodScore = scoringAlgorithm.calculateScore(opportunity, goodUserHistory, mode);
          const badScore = scoringAlgorithm.calculateScore(opportunity, badUserHistory, mode);

          // Good performance should result in higher performance factor
          expect(goodScore.factors.performance).toBeGreaterThan(badScore.factors.performance);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7b: Safety factor reflects incident risk correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Create opportunities with different safety profiles
          const safeOpportunity = {
            ...opportunity,
            globalStats: {
              ...opportunity.globalStats,
              avgIncidentsPerRace: 1.0 // Very safe series
            }
          };

          const dangerousOpportunity = {
            ...opportunity,
            globalStats: {
              ...opportunity.globalStats,
              avgIncidentsPerRace: 6.0 // High incident series
            }
          };

          const safeScore = scoringAlgorithm.calculateScore(safeOpportunity, userHistory, mode);
          const dangerousScore = scoringAlgorithm.calculateScore(dangerousOpportunity, userHistory, mode);

          // Safe series should have higher safety factor
          expect(safeScore.factors.safety).toBeGreaterThan(dangerousScore.factors.safety);
          
          // High incident series should have higher safety rating risk
          if (dangerousScore.factors.safety < 40) {
            expect(dangerousScore.safetyRatingRisk).toBe('high');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7c: Familiarity factor increases with experience', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Create histories with different experience levels
          const noExperienceHistory = {
            ...userHistory,
            seriesTrackHistory: userHistory.seriesTrackHistory.filter(
              h => h.seriesId !== opportunity.seriesId || h.trackId !== opportunity.trackId
            )
          };

          const experiencedHistory = {
            ...userHistory,
            seriesTrackHistory: [
              {
                seriesId: opportunity.seriesId,
                trackId: opportunity.trackId,
                raceCount: 15, // Lots of experience
                avgStartingPosition: 10,
                avgFinishingPosition: 10,
                avgPositionDelta: 0,
                avgIncidents: 2,
                finishPositionStdDev: 5,
                lastRaceDate: new Date()
              },
              ...userHistory.seriesTrackHistory
            ]
          };

          const noExpScore = scoringAlgorithm.calculateScore(opportunity, noExperienceHistory, mode);
          const expScore = scoringAlgorithm.calculateScore(opportunity, experiencedHistory, mode);

          // More experience should result in higher familiarity
          expect(expScore.factors.familiarity).toBeGreaterThan(noExpScore.factors.familiarity);
          
          // No experience should result in 0 familiarity
          expect(noExpScore.factors.familiarity).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7d: Fatigue risk increases with race length and open setup', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Create short and long race opportunities
          const shortRace = {
            ...opportunity,
            raceLength: 20, // Short race
            hasOpenSetup: false
          };

          const longRace = {
            ...opportunity,
            raceLength: 180, // Long endurance race
            hasOpenSetup: true // With open setup complexity
          };

          const shortScore = scoringAlgorithm.calculateScore(shortRace, userHistory, mode);
          const longScore = scoringAlgorithm.calculateScore(longRace, userHistory, mode);

          // Short races should have lower fatigue risk (higher score)
          expect(shortScore.factors.fatigueRisk).toBeGreaterThan(longScore.factors.fatigueRisk);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7e: Time volatility reflects time-of-day risk patterns', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Create opportunities with different time patterns
          const primeTimeOpportunity = {
            ...opportunity,
            timeSlots: [
              {
                hour: 19, // 7 PM - prime time
                dayOfWeek: 6, // Saturday
                strengthOfField: 1500,
                participantCount: 25
              }
            ]
          };

          const lateNightOpportunity = {
            ...opportunity,
            timeSlots: [
              {
                hour: 3, // 3 AM - very late
                dayOfWeek: 2, // Tuesday
                strengthOfField: 1200,
                participantCount: 8 // Low participation
              }
            ]
          };

          const primeScore = scoringAlgorithm.calculateScore(primeTimeOpportunity, userHistory, mode);
          const lateScore = scoringAlgorithm.calculateScore(lateNightOpportunity, userHistory, mode);

          // Prime time should have lower volatility (higher score)
          expect(primeScore.factors.timeVolatility).toBeGreaterThan(lateScore.factors.timeVolatility);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7f: Scoring algorithm is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Same inputs should produce identical outputs
          const score1 = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);
          const score2 = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);

          expect(score1.overall).toBe(score2.overall);
          expect(score1.factors).toEqual(score2.factors);
          expect(score1.iRatingRisk).toBe(score2.iRatingRisk);
          expect(score1.safetyRatingRisk).toBe(score2.safetyRatingRisk);
          expect(score1.reasoning).toEqual(score2.reasoning);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7g: Risk indicators correlate with factor scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, mode);

          // High iRating risk should correlate with poor performance or predictability
          if (score.iRatingRisk === 'high') {
            expect(
              score.factors.performance < 40 || score.factors.predictability < 30
            ).toBe(true);
          }

          // High safety rating risk should correlate with poor safety or attrition
          if (score.safetyRatingRisk === 'high') {
            expect(
              score.factors.safety < 40 || score.factors.attritionRisk < 30
            ).toBe(true);
          }

          // Low risk should not have very poor factor scores
          if (score.iRatingRisk === RiskLevel.LOW) {
            expect(score.factors.performance).toBeGreaterThanOrEqual(40);
            expect(score.factors.predictability).toBeGreaterThanOrEqual(30);
          }

          if (score.safetyRatingRisk === RiskLevel.LOW) {
            expect(score.factors.safety).toBeGreaterThanOrEqual(40);
            expect(score.factors.attritionRisk).toBeGreaterThanOrEqual(30);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});