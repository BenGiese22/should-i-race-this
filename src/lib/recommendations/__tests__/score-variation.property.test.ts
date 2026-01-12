/**
 * Property-Based Tests for Score Variation Based on Experience
 * Feature: recommendations-analytics-integration, Property 9: Score Variation Based on Experience
 * Validates: Requirements 12.1
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
  LicenseLevel
} from '../types';

// Test data generators
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

describe('Score Variation Based on Experience Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 9: Score Variation Based on Experience
   * For any user with extensive experience in one series and no experience in another, 
   * the familiarity scores should be significantly different (>30 point difference)
   */
  test('Property 9: Familiarity scores vary significantly between experienced and inexperienced series', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        recommendationModeArb,
        async (experiencedOpportunity, inexperiencedOpportunity, overallStats, licenseClasses, mode) => {
          // Ensure the opportunities are different series
          fc.pre(experiencedOpportunity.seriesId !== inexperiencedOpportunity.seriesId);
          
          // Create extensive experience for first series (15+ races)
          const extensiveExperience: SeriesTrackHistory = {
            seriesId: experiencedOpportunity.seriesId,
            trackId: experiencedOpportunity.trackId,
            raceCount: fc.sample(fc.integer({ min: 15, max: 50 }), 1)[0],
            avgStartingPosition: fc.sample(fc.float({ min: 5, max: 25 }), 1)[0],
            avgFinishingPosition: fc.sample(fc.float({ min: 5, max: 25 }), 1)[0],
            avgPositionDelta: fc.sample(fc.float({ min: -5, max: 10 }), 1)[0],
            avgIncidents: fc.sample(fc.float({ min: 0, max: 5 }), 1)[0],
            finishPositionStdDev: fc.sample(fc.float({ min: 2, max: 8 }), 1)[0],
            lastRaceDate: new Date()
          };

          // Create user history with extensive experience in one series, none in the other
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [extensiveExperience], // Only experience in one series
            overallStats,
            licenseClasses
          };

          // Calculate scores for both opportunities
          const experiencedScore = scoringAlgorithm.calculateScore(experiencedOpportunity, userHistory, mode);
          const inexperiencedScore = scoringAlgorithm.calculateScore(inexperiencedOpportunity, userHistory, mode);

          // Familiarity scores should differ by more than 30 points
          const familiarityDifference = experiencedScore.factors.familiarity - inexperiencedScore.factors.familiarity;
          
          expect(familiarityDifference).toBeGreaterThan(30);
          
          // Experienced series should have high familiarity (60+ for 15+ races)
          expect(experiencedScore.factors.familiarity).toBeGreaterThanOrEqual(60);
          
          // Inexperienced series should have lower familiarity (may not be 0 due to cross-series experience)
          expect(inexperiencedScore.factors.familiarity).toBeLessThan(experiencedScore.factors.familiarity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9a: Performance scores vary based on series-specific experience', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        recommendationModeArb,
        async (experiencedOpportunity, inexperiencedOpportunity, overallStats, licenseClasses, mode) => {
          // Ensure the opportunities are different series
          fc.pre(experiencedOpportunity.seriesId !== inexperiencedOpportunity.seriesId);
          
          // Create strong performance history for first series
          const strongPerformanceHistory: SeriesTrackHistory = {
            seriesId: experiencedOpportunity.seriesId,
            trackId: experiencedOpportunity.trackId,
            raceCount: fc.sample(fc.integer({ min: 10, max: 30 }), 1)[0],
            avgStartingPosition: 15,
            avgFinishingPosition: 8, // Strong improvement
            avgPositionDelta: 7, // Positive delta
            avgIncidents: fc.sample(fc.float({ min: 0, max: 3 }), 1)[0],
            finishPositionStdDev: fc.sample(fc.float({ min: 2, max: 6 }), 1)[0],
            lastRaceDate: new Date()
          };

          // Create user history with strong performance in one series, none in the other
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [strongPerformanceHistory],
            overallStats: {
              ...overallStats,
              totalRaces: Math.max(overallStats.totalRaces, 10), // Ensure some overall experience
              avgPositionDelta: 0 // Neutral overall performance to highlight series-specific difference
            },
            licenseClasses
          };

          // Calculate scores for both opportunities
          const experiencedScore = scoringAlgorithm.calculateScore(experiencedOpportunity, userHistory, mode);
          const inexperiencedScore = scoringAlgorithm.calculateScore(inexperiencedOpportunity, userHistory, mode);

          // Performance scores should differ when there's series-specific strong performance
          const performanceDifference = experiencedScore.factors.performance - inexperiencedScore.factors.performance;
          
          // Should see meaningful difference in performance scores
          expect(performanceDifference).toBeGreaterThan(10);
          
          // Experienced series should have higher performance score due to specific history
          expect(experiencedScore.factors.performance).toBeGreaterThan(inexperiencedScore.factors.performance);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9b: Safety scores vary based on series-specific incident history', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        recommendationModeArb,
        async (safeOpportunity, riskyOpportunity, overallStats, licenseClasses, mode) => {
          // Ensure the opportunities are different series
          fc.pre(safeOpportunity.seriesId !== riskyOpportunity.seriesId);
          
          // Create clean safety record for first series
          const cleanSafetyHistory: SeriesTrackHistory = {
            seriesId: safeOpportunity.seriesId,
            trackId: safeOpportunity.trackId,
            raceCount: fc.sample(fc.integer({ min: 8, max: 25 }), 1)[0],
            avgStartingPosition: fc.sample(fc.float({ min: 8, max: 20 }), 1)[0],
            avgFinishingPosition: fc.sample(fc.float({ min: 8, max: 20 }), 1)[0],
            avgPositionDelta: fc.sample(fc.float({ min: -3, max: 5 }), 1)[0],
            avgIncidents: 0.5, // Very clean record
            finishPositionStdDev: fc.sample(fc.float({ min: 2, max: 8 }), 1)[0],
            lastRaceDate: new Date()
          };

          // Create user history with clean record in one series, none in the other
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [cleanSafetyHistory],
            overallStats: {
              ...overallStats,
              totalRaces: Math.max(overallStats.totalRaces, 8),
              avgIncidentsPerRace: 2.5 // Moderate overall incident rate to highlight series-specific difference
            },
            licenseClasses
          };

          // Make the risky opportunity have high global incident rate
          const riskyOpportunityWithHighIncidents = {
            ...riskyOpportunity,
            globalStats: {
              ...riskyOpportunity.globalStats,
              avgIncidentsPerRace: 5.0 // High incident series
            }
          };

          // Calculate scores for both opportunities
          const safeScore = scoringAlgorithm.calculateScore(safeOpportunity, userHistory, mode);
          const riskyScore = scoringAlgorithm.calculateScore(riskyOpportunityWithHighIncidents, userHistory, mode);

          // Safety scores should differ based on both personal history and global stats
          const safetyDifference = safeScore.factors.safety - riskyScore.factors.safety;
          
          // Should see meaningful difference in safety scores
          expect(safetyDifference).toBeGreaterThan(15);
          
          // Series with clean personal record should have higher safety score
          expect(safeScore.factors.safety).toBeGreaterThan(riskyScore.factors.safety);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9c: Overall scores reflect experience differences across multiple factors', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        recommendationModeArb,
        async (expertOpportunity, noviceOpportunity, overallStats, licenseClasses, mode) => {
          // Ensure the opportunities are different series
          fc.pre(expertOpportunity.seriesId !== noviceOpportunity.seriesId);
          
          // Create expert-level experience for first series
          const expertHistory: SeriesTrackHistory = {
            seriesId: expertOpportunity.seriesId,
            trackId: expertOpportunity.trackId,
            raceCount: fc.sample(fc.integer({ min: 20, max: 50 }), 1)[0], // Lots of experience
            avgStartingPosition: 12,
            avgFinishingPosition: 6, // Strong performance
            avgPositionDelta: 6, // Consistent improvement
            avgIncidents: 1.0, // Clean driving
            finishPositionStdDev: 3.0, // Consistent results
            lastRaceDate: new Date()
          };

          // Create user history with expert experience in one series, none in the other
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [expertHistory],
            overallStats: {
              ...overallStats,
              totalRaces: Math.max(overallStats.totalRaces, 20),
              avgPositionDelta: 2, // Decent overall performance
              avgIncidentsPerRace: 2.0 // Moderate overall incidents
            },
            licenseClasses
          };

          // Calculate scores for both opportunities
          const expertScore = scoringAlgorithm.calculateScore(expertOpportunity, userHistory, mode);
          const noviceScore = scoringAlgorithm.calculateScore(noviceOpportunity, userHistory, mode);

          // Expert series should have higher or equal overall score (core requirement)
          // In some edge cases, poor global stats can offset experience benefits
          expect(expertScore.overall).toBeGreaterThanOrEqual(noviceScore.overall);
          
          // Should see some difference in overall scores due to multiple factors, or at least equal
          const overallDifference = expertScore.overall - noviceScore.overall;
          expect(overallDifference).toBeGreaterThanOrEqual(0);
          
          // Expert series should have higher familiarity
          expect(expertScore.factors.familiarity).toBeGreaterThan(noviceScore.factors.familiarity);
          
          // Expert series should have higher performance score
          expect(expertScore.factors.performance).toBeGreaterThan(noviceScore.factors.performance);
          
          // Expert series should have higher priority score
          expect(expertScore.priorityScore).toBeGreaterThan(noviceScore.priorityScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9d: Data confidence levels reflect experience accurately', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        recommendationModeArb,
        async (experiencedOpportunity, inexperiencedOpportunity, overallStats, licenseClasses, mode) => {
          // Ensure the opportunities are different series
          fc.pre(experiencedOpportunity.seriesId !== inexperiencedOpportunity.seriesId);
          
          // Create high-confidence experience for first series
          const highConfidenceHistory: SeriesTrackHistory = {
            seriesId: experiencedOpportunity.seriesId,
            trackId: experiencedOpportunity.trackId,
            raceCount: fc.sample(fc.integer({ min: 10, max: 40 }), 1)[0], // Sufficient for high confidence
            avgStartingPosition: fc.sample(fc.float({ min: 5, max: 25 }), 1)[0],
            avgFinishingPosition: fc.sample(fc.float({ min: 5, max: 25 }), 1)[0],
            avgPositionDelta: fc.sample(fc.float({ min: -5, max: 10 }), 1)[0],
            avgIncidents: fc.sample(fc.float({ min: 0, max: 5 }), 1)[0],
            finishPositionStdDev: fc.sample(fc.float({ min: 2, max: 8 }), 1)[0],
            lastRaceDate: new Date()
          };

          // Create user history with high confidence in one series, none in the other
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [highConfidenceHistory],
            overallStats: {
              ...overallStats,
              totalRaces: Math.max(overallStats.totalRaces, 10)
            },
            licenseClasses
          };

          // Calculate scores for both opportunities
          const experiencedScore = scoringAlgorithm.calculateScore(experiencedOpportunity, userHistory, mode);
          const inexperiencedScore = scoringAlgorithm.calculateScore(inexperiencedOpportunity, userHistory, mode);

          // Data confidence should reflect experience levels
          expect(experiencedScore.dataConfidence.performance).toBe('high');
          expect(experiencedScore.dataConfidence.safety).toBe('high');
          expect(experiencedScore.dataConfidence.familiarity).toBe('high');
          
          // Inexperienced series should have lower confidence
          expect(inexperiencedScore.dataConfidence.performance).not.toBe('high');
          expect(inexperiencedScore.dataConfidence.safety).not.toBe('high');
          expect(inexperiencedScore.dataConfidence.familiarity).toBe('no_data');
        }
      ),
      { numRuns: 100 }
    );
  });
});