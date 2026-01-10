/**
 * Property-Based Tests for Familiarity Score Thresholds
 * Feature: recommendations-analytics-integration, Property 4: Familiarity Score Thresholds
 * Validates: Requirements 3.2, 3.3
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
  LicenseLevel
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

describe('Familiarity Score Thresholds Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 4: Familiarity Score Thresholds
   * For any user with 10+ races in a series, the familiarity score should be 80+ for that series;
   * for 5+ races, the score should be 60+
   */
  test('Property 4: Familiarity score meets threshold requirements for race count', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 10, max: 50 }), // High race count (10+)
        async (opportunity, overallStats, licenseClasses, highRaceCount) => {
          // Create series-track history with high race count (10+ races)
          const highExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: highRaceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          };

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [highExperienceHistory],
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // For 10+ races, familiarity score should be 80+
          expect(score.factors.familiarity).toBeGreaterThanOrEqual(80);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4a: Familiarity score meets 60+ threshold for 5+ races', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 5, max: 9 }), // Medium race count (5-9 races)
        async (opportunity, overallStats, licenseClasses, mediumRaceCount) => {
          // Create series-track history with medium race count (5-9 races)
          const mediumExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: mediumRaceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          };

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [mediumExperienceHistory],
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // For 5+ races, familiarity score should be 60+
          expect(score.factors.familiarity).toBeGreaterThanOrEqual(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4b: Familiarity score increases monotonically with race count', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        async (opportunity, overallStats, licenseClasses, raceCount1, raceCount2) => {
          // Ensure we have two different race counts with clear ordering
          const lowerCount = Math.min(raceCount1, raceCount2);
          const higherCount = Math.max(raceCount1, raceCount2);
          
          // Skip if counts are the same
          if (lowerCount === higherCount) return;

          // Create histories with different race counts
          const lowerExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: lowerCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          };

          const higherExperienceHistory: SeriesTrackHistory = {
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId,
            raceCount: higherCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          };

          const lowerUserHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [lowerExperienceHistory],
            overallStats,
            licenseClasses
          };

          const higherUserHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [higherExperienceHistory],
            overallStats,
            licenseClasses
          };

          const lowerScore = scoringAlgorithm.calculateScore(opportunity, lowerUserHistory, 'balanced');
          const higherScore = scoringAlgorithm.calculateScore(opportunity, higherUserHistory, 'balanced');

          // Higher race count should result in higher or equal familiarity score
          expect(higherScore.factors.familiarity).toBeGreaterThanOrEqual(lowerScore.factors.familiarity);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4c: Series experience aggregation across tracks', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 5 }), // Multiple track experiences
        async (opportunity, overallStats, licenseClasses, trackRaceCounts) => {
          // Create multiple series-track histories for the same series but different tracks
          const seriesTrackHistories: SeriesTrackHistory[] = trackRaceCounts.map((raceCount, index) => ({
            seriesId: opportunity.seriesId,
            trackId: opportunity.trackId + index + 1, // Different tracks
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          }));

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: seriesTrackHistories,
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // Calculate total series experience
          const totalSeriesExperience = trackRaceCounts.reduce((sum, count) => sum + count, 0);

          // Familiarity should reflect series experience even if specific track is new
          // The algorithm should give credit for series experience (25% weight)
          if (totalSeriesExperience >= 10) {
            // Should get some familiarity credit from series experience
            expect(score.factors.familiarity).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4d: Track experience aggregation across series', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 5 }), // Multiple series experiences
        async (opportunity, overallStats, licenseClasses, seriesRaceCounts) => {
          // Create multiple series-track histories for the same track but different series
          const seriesTrackHistories: SeriesTrackHistory[] = seriesRaceCounts.map((raceCount, index) => ({
            seriesId: opportunity.seriesId + index + 1, // Different series
            trackId: opportunity.trackId,
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          }));

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: seriesTrackHistories,
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // Calculate total track experience
          const totalTrackExperience = seriesRaceCounts.reduce((sum, count) => sum + count, 0);

          // Familiarity should reflect track experience even if specific series is new
          // The algorithm should give credit for track experience (15% weight)
          if (totalTrackExperience >= 10) {
            // Should get some familiarity credit from track experience
            expect(score.factors.familiarity).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4e: Zero familiarity for completely new combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (opportunity, overallStats, licenseClasses) => {
          // Create user history with no matching series or track experience
          const unrelatedHistories: SeriesTrackHistory[] = [
            {
              seriesId: opportunity.seriesId + 1000, // Completely different series
              trackId: opportunity.trackId + 1000, // Completely different track
              raceCount: 10,
              avgStartingPosition: 15,
              avgFinishingPosition: 12,
              avgPositionDelta: 3,
              avgIncidents: 2,
              finishPositionStdDev: 5,
              lastRaceDate: new Date()
            }
          ];

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: unrelatedHistories,
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // Should have zero familiarity for completely new series-track combination
          expect(score.factors.familiarity).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});