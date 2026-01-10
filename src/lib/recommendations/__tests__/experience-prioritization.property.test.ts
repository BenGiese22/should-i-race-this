/**
 * Property-Based Tests for Experience-Based Prioritization
 * Feature: recommendations-analytics-integration, Property 7: Experience-Based Prioritization
 * Validates: Requirements 5.7
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { ScoringAlgorithm } from '../scoring';
import { 
  RacingOpportunity, 
  UserHistory, 
  SeriesTrackHistory,
  UserOverallStats,
  LicenseClass,
  GlobalStats,
  TimeSlot,
  Category,
  LicenseLevel,
  ScoredOpportunity
} from '../types';

// Test data generators
const categoryArb = fc.constantFrom('oval', 'road', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;
const licenseLevelArb = fc.constantFrom('rookie', 'D', 'C', 'B', 'A', 'pro') as fc.Arbitrary<LicenseLevel>;

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
  totalRaces: fc.integer({ min: 10, max: 1000 }),
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

describe('Experience-Based Prioritization Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 7: Experience-Based Prioritization
   * For any recommendation list, series-track combinations where the user has 3+ races 
   * should be sorted higher than unfamiliar combinations
   */
  test('Property 7: Familiar combinations (3+ races) have higher priority scores than unfamiliar ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 3, max: 20 }), // Familiar race count (3+)
        async (opportunity, overallStats, licenseClasses, familiarRaceCount) => {
          // Create series-track history with familiar experience
          const familiarHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: familiarRaceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2, // Good performance to ensure it's not just performance driving the score
            avgIncidents: 1.5,
            finishPositionStdDev: 4,
            lastRaceDate: new Date()
          };

          // Create user history with familiar experience
          const familiarUserHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [familiarHistory],
            overallStats,
            licenseClasses
          };

          // Create user history with no experience (unfamiliar)
          const unfamiliarUserHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [], // No experience
            overallStats,
            licenseClasses
          };

          const familiarScore = scoringAlgorithm.calculateScore(opportunity, familiarUserHistory, 'balanced');
          const unfamiliarScore = scoringAlgorithm.calculateScore(opportunity, unfamiliarUserHistory, 'balanced');

          // The familiar recommendation should have a higher priority score
          expect(familiarScore.priorityScore).toBeGreaterThan(unfamiliarScore.priorityScore);
          
          // Familiar should be boosted above base priority (50)
          expect(familiarScore.priorityScore).toBeGreaterThan(50);
          
          // Unfamiliar should be at or near base priority
          expect(unfamiliarScore.priorityScore).toBeLessThanOrEqual(60); // Allow some small boosts from other factors
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7a: Priority score increases with experience level', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 1, max: 2 }), // Low experience (1-2 races)
        fc.integer({ min: 10, max: 30 }), // High experience (10+ races)
        async (opportunity, overallStats, licenseClasses, lowRaceCount, highRaceCount) => {
          // Create two different experience levels for the same opportunity
          const lowExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: lowRaceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 2,
            finishPositionStdDev: 6,
            lastRaceDate: new Date()
          };

          const highExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: highRaceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 2,
            finishPositionStdDev: 6,
            lastRaceDate: new Date()
          };

          const lowExperienceUser: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [lowExperienceHistory],
            overallStats,
            licenseClasses
          };

          const highExperienceUser: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [highExperienceHistory],
            overallStats,
            licenseClasses
          };

          const lowExpScore = scoringAlgorithm.calculateScore(opportunity, lowExperienceUser, 'balanced');
          const highExpScore = scoringAlgorithm.calculateScore(opportunity, highExperienceUser, 'balanced');

          // Higher experience should result in higher priority score
          expect(highExpScore.priorityScore).toBeGreaterThanOrEqual(lowExpScore.priorityScore);

          // High experience (10+ races) should get the familiarity boost
          expect(highExpScore.priorityScore).toBeGreaterThan(50); // Should be above base priority
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7b: Series experience contributes to prioritization', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.array(fc.integer({ min: 2, max: 8 }), { minLength: 3, maxLength: 6 }), // Multiple track experiences in same series
        async (opportunity, overallStats, licenseClasses, trackRaceCounts) => {
          // Create multiple series-track histories for the same series but different tracks
          const seriesExperienceHistories: SeriesTrackHistory[] = trackRaceCounts.map((raceCount, index) => ({
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId + index + 1, // Different tracks in same series
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 2,
            finishPositionStdDev: 6,
            lastRaceDate: new Date()
          }));

          // Create a user with no direct experience on the target track but experience in the series
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: seriesExperienceHistories,
            overallStats,
            licenseClasses
          };

          // Create a user with no experience at all for comparison
          const noExperienceUser: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats,
            licenseClasses
          };

          const seriesExpScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
          const noExpScore = scoringAlgorithm.calculateScore(opportunity, noExperienceUser, 'balanced');

          const totalSeriesExperience = trackRaceCounts.reduce((sum, count) => sum + count, 0);

          // Should get priority boost from series experience even without direct track experience
          if (totalSeriesExperience >= 10) {
            expect(seriesExpScore.priorityScore).toBeGreaterThan(noExpScore.priorityScore);
            expect(seriesExpScore.priorityScore).toBeGreaterThan(50); // Should get series experience boost
          } else if (totalSeriesExperience >= 5) {
            expect(seriesExpScore.priorityScore).toBeGreaterThanOrEqual(noExpScore.priorityScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7c: Track experience contributes to prioritization', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.array(fc.integer({ min: 2, max: 8 }), { minLength: 3, maxLength: 6 }), // Multiple series experiences on same track
        async (opportunity, overallStats, licenseClasses, seriesRaceCounts) => {
          // Create multiple series-track histories for the same track but different series
          const trackExperienceHistories: SeriesTrackHistory[] = seriesRaceCounts.map((raceCount, index) => ({
            seriesId: opportunity.seriesId + index + 1, // Different series on same track
            trackId: opportunity.trackId,
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 2,
            finishPositionStdDev: 6,
            lastRaceDate: new Date()
          }));

          // Create a user with no direct experience in the target series but experience on the track
          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: trackExperienceHistories,
            overallStats,
            licenseClasses
          };

          // Create a user with no experience at all for comparison
          const noExperienceUser: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats,
            licenseClasses
          };

          const trackExpScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
          const noExpScore = scoringAlgorithm.calculateScore(opportunity, noExperienceUser, 'balanced');

          const totalTrackExperience = seriesRaceCounts.reduce((sum, count) => sum + count, 0);

          // Should get priority boost from track experience even without direct series experience
          if (totalTrackExperience >= 10) {
            expect(trackExpScore.priorityScore).toBeGreaterThan(noExpScore.priorityScore);
            expect(trackExpScore.priorityScore).toBeGreaterThan(50); // Should get track experience boost
          } else if (totalTrackExperience >= 5) {
            expect(trackExpScore.priorityScore).toBeGreaterThanOrEqual(noExpScore.priorityScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7d: High confidence data increases priority', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 3, max: 10 }), // Sufficient races for high confidence
        async (opportunity, overallStats, licenseClasses, raceCount) => {
          // Create series-track history with sufficient data for high confidence
          const highConfidenceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 1.5,
            finishPositionStdDev: 4,
            lastRaceDate: new Date()
          };

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [highConfidenceHistory],
            overallStats,
            licenseClasses
          };

          // Create a user with low confidence data for comparison
          const lowConfidenceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: 1, // Low confidence
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 2,
            avgIncidents: 1.5,
            finishPositionStdDev: 4,
            lastRaceDate: new Date()
          };

          const lowConfidenceUser: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [lowConfidenceHistory],
            overallStats,
            licenseClasses
          };

          const highConfScore = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
          const lowConfScore = scoringAlgorithm.calculateScore(opportunity, lowConfidenceUser, 'balanced');

          // Should have high confidence for performance and safety with 3+ races
          expect(highConfScore.dataConfidence.performance).toBe('high');
          expect(highConfScore.dataConfidence.safety).toBe('high');

          // Priority score should reflect the high confidence boost
          expect(highConfScore.priorityScore).toBeGreaterThan(lowConfScore.priorityScore);
          expect(highConfScore.priorityScore).toBeGreaterThan(60); // Base + familiarity + confidence boosts
        }
      ),
      { numRuns: 100 }
    );
  });
});