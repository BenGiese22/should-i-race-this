/**
 * Property-Based Tests for Real Data Usage Over Defaults
 * Feature: recommendations-analytics-integration, Property 5: Real Data Usage Over Defaults
 * Validates: Requirements 3.1, 4.2, 4.3, 5.1
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

describe('Real Data Usage Over Defaults Properties', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  /**
   * Property 5: Real Data Usage Over Defaults
   * For any series-track combination with historical data, the system should use 
   * actual statistics rather than default values
   */
  test('Property 5: Performance factor uses real personal data when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        fc.float({ min: -15, max: Math.fround(15) }), // Real position delta
        fc.float({ min: 0, max: Math.fround(8) }), // Real incidents
        fc.integer({ min: 3, max: 50 }), // Sufficient race count
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (seriesId, trackId, realPositionDelta, realIncidents, raceCount, overallStats, licenseClasses) => {
          // Create opportunity with default global stats
          const opportunity: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: 2.5, // Default value
              avgFinishPositionStdDev: 8.0, // Default value
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          // Create user history with real personal data
          const realDataHistory: SeriesTrackHistory = {
            seriesId,
            trackId,
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 15 - realPositionDelta, // Calculate from delta
            avgPositionDelta: realPositionDelta,
            avgIncidents: realIncidents,
            finishPositionStdDev: 5,
            lastRaceDate: new Date()
          };

          const userHistoryWithRealData: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [realDataHistory],
            overallStats,
            licenseClasses
          };

          // Create user history without personal data (should use defaults/cross-series)
          const userHistoryWithoutData: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [], // No specific data
            overallStats,
            licenseClasses
          };

          const scoreWithRealData = scoringAlgorithm.calculateScore(opportunity, userHistoryWithRealData, 'balanced');
          const scoreWithoutData = scoringAlgorithm.calculateScore(opportunity, userHistoryWithoutData, 'balanced');

          // When real data is available (3+ races), performance should be different from default calculation
          // The algorithm should use the real position delta rather than falling back to defaults
          if (Math.abs(realPositionDelta) > 1) { // Only test when there's a meaningful difference
            expect(scoreWithRealData.factors.performance).not.toBe(scoreWithoutData.factors.performance);
          }

          // Safety factor should also use real incident data
          if (Math.abs(realIncidents - 2.5) > 0.5) { // When real incidents differ from default
            expect(scoreWithRealData.factors.safety).not.toBe(scoreWithoutData.factors.safety);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5a: Global statistics use real data when sufficient history exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        fc.float({ min: 0.5, max: Math.fround(6) }), // Real global incidents (different from default)
        fc.float({ min: 2, max: Math.fround(15) }), // Real global std dev (different from default)
        fc.float({ min: 5, max: Math.fround(40) }), // Real attrition rate (different from default)
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (seriesId, trackId, realGlobalIncidents, realGlobalStdDev, realAttritionRate, overallStats, licenseClasses) => {
          // Create opportunity with real global stats (simulating sufficient historical data)
          const opportunityWithRealGlobalStats: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: realGlobalIncidents,
              avgFinishPositionStdDev: realGlobalStdDev,
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: realAttritionRate,
              avgRaceLength: 60
            }
          };

          // Create opportunity with default global stats (simulating insufficient data)
          const opportunityWithDefaultStats: RacingOpportunity = {
            ...opportunityWithRealGlobalStats,
            globalStats: {
              avgIncidentsPerRace: 2.5, // Default
              avgFinishPositionStdDev: 8.0, // Default
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: 15, // Default
              avgRaceLength: 60
            }
          };

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [], // No personal data to isolate global stats effect
            overallStats,
            licenseClasses
          };

          const scoreWithRealGlobal = scoringAlgorithm.calculateScore(opportunityWithRealGlobalStats, userHistory, 'balanced');
          const scoreWithDefaultGlobal = scoringAlgorithm.calculateScore(opportunityWithDefaultStats, userHistory, 'balanced');

          // When real global data differs significantly from defaults, scores should be different
          if (Math.abs(realGlobalIncidents - 2.5) > 0.5) {
            expect(scoreWithRealGlobal.factors.safety).not.toBe(scoreWithDefaultGlobal.factors.safety);
          }

          if (Math.abs(realGlobalStdDev - 8.0) > 1.0) {
            expect(scoreWithRealGlobal.factors.consistency).not.toBe(scoreWithDefaultGlobal.factors.consistency);
          }

          if (Math.abs(realAttritionRate - 15) > 2.0) {
            expect(scoreWithRealGlobal.factors.attritionRisk).not.toBe(scoreWithDefaultGlobal.factors.attritionRisk);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5b: Cross-series analysis uses real overall performance data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        fc.float({ min: -10, max: Math.fround(10) }), // Real overall position delta
        fc.float({ min: 0, max: Math.fround(6) }), // Real overall incidents
        fc.integer({ min: 5, max: 100 }), // Sufficient overall race count
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (seriesId, trackId, realOverallDelta, realOverallIncidents, totalRaces, licenseClasses) => {
          // Create opportunity
          const opportunity: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: 2.5,
              avgFinishPositionStdDev: 8.0,
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          // Create user with real overall performance data but no specific series-track data
          const userHistoryWithRealOverall: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [], // No specific data - should use cross-series analysis
            overallStats: {
              totalRaces,
              avgIncidentsPerRace: realOverallIncidents,
              avgPositionDelta: realOverallDelta,
              overallConsistency: 6.0
            },
            licenseClasses
          };

          // Create user with minimal overall data (should fall back to license-based defaults)
          const userHistoryWithMinimalData: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats: {
              totalRaces: 2, // Insufficient for cross-series analysis
              avgIncidentsPerRace: 2.5,
              avgPositionDelta: 0,
              overallConsistency: 8.0
            },
            licenseClasses
          };

          const scoreWithRealOverall = scoringAlgorithm.calculateScore(opportunity, userHistoryWithRealOverall, 'balanced');
          const scoreWithMinimalData = scoringAlgorithm.calculateScore(opportunity, userHistoryWithMinimalData, 'balanced');

          // When sufficient overall data exists, it should be used instead of pure defaults
          // Performance should reflect the real overall performance data
          if (Math.abs(realOverallDelta) > 1 && totalRaces >= 5) {
            expect(scoreWithRealOverall.factors.performance).not.toBe(scoreWithMinimalData.factors.performance);
          }

          // Safety should reflect real overall incident data
          if (Math.abs(realOverallIncidents - 2.5) > 0.5 && totalRaces >= 3) {
            expect(scoreWithRealOverall.factors.safety).not.toBe(scoreWithMinimalData.factors.safety);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5c: iRating and Safety Rating adjustments use real license data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        fc.integer({ min: 1000, max: 3500 }), // User iRating (different from SOF)
        fc.float({ min: Math.fround(1.5), max: Math.fround(4.5) }), // User Safety Rating
        userOverallStatsArb,
        async (seriesId, trackId, userIRating, userSafetyRating, overallStats) => {
          // Create opportunity with known SOF
          const opportunitySof = 1800; // Fixed SOF for comparison
          const opportunity: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: 2.5,
              avgFinishPositionStdDev: 8.0,
              avgStrengthOfField: opportunitySof,
              strengthOfFieldVariability: 300,
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          // Create user with specific license data
          const userLicense: LicenseClass = {
            category: 'road',
            level: 'D',
            safetyRating: userSafetyRating,
            iRating: userIRating
          };

          const userHistoryWithLicense: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats,
            licenseClasses: [userLicense]
          };

          // Create user without license data (should use different defaults)
          const userHistoryWithoutLicense: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats,
            licenseClasses: []
          };

          const scoreWithLicense = scoringAlgorithm.calculateScore(opportunity, userHistoryWithLicense, 'balanced');
          const scoreWithoutLicense = scoringAlgorithm.calculateScore(opportunity, userHistoryWithoutLicense, 'balanced');

          // When iRating differs significantly from SOF, performance should be adjusted
          const iRatingDiff = Math.abs(userIRating - opportunitySof);
          if (iRatingDiff > 300) {
            expect(scoreWithLicense.factors.performance).not.toBe(scoreWithoutLicense.factors.performance);
          }

          // When Safety Rating differs from neutral (3.0), safety should be adjusted
          const safetyRatingDiff = Math.abs(userSafetyRating - 3.0);
          if (safetyRatingDiff > 0.5) {
            expect(scoreWithLicense.factors.safety).not.toBe(scoreWithoutLicense.factors.safety);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5d: Consistency factor uses real finish position standard deviation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        fc.float({ min: Math.fround(1), max: Math.fround(12) }), // Real personal consistency (std dev)
        fc.integer({ min: 5, max: 50 }), // Sufficient race count for consistency calculation
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (seriesId, trackId, realConsistency, raceCount, overallStats, licenseClasses) => {
          // Create opportunity
          const opportunity: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: 2.5,
              avgFinishPositionStdDev: 8.0, // Default global consistency
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          // Create user history with real consistency data
          const realConsistencyHistory: SeriesTrackHistory = {
            seriesId,
            trackId,
            raceCount,
            avgStartingPosition: 15,
            avgFinishingPosition: 15,
            avgPositionDelta: 0,
            avgIncidents: 2,
            finishPositionStdDev: realConsistency,
            lastRaceDate: new Date()
          };

          const userHistoryWithRealConsistency: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [realConsistencyHistory],
            overallStats,
            licenseClasses
          };

          // Create user history without specific consistency data
          const userHistoryWithoutData: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [],
            overallStats,
            licenseClasses
          };

          const scoreWithRealConsistency = scoringAlgorithm.calculateScore(opportunity, userHistoryWithRealConsistency, 'balanced');
          const scoreWithoutData = scoringAlgorithm.calculateScore(opportunity, userHistoryWithoutData, 'balanced');

          // When real consistency data differs significantly from global average, scores should differ
          if (Math.abs(realConsistency - 8.0) > 2.0 && raceCount >= 5) {
            expect(scoreWithRealConsistency.factors.consistency).not.toBe(scoreWithoutData.factors.consistency);
          }

          // Better consistency (lower std dev) should result in higher consistency score
          if (realConsistency < 5.0 && raceCount >= 5) {
            expect(scoreWithRealConsistency.factors.consistency).toBeGreaterThan(scoreWithoutData.factors.consistency);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5e: Algorithm avoids NaN and infinite values from real data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // seriesId
        fc.integer({ min: 1, max: 500 }), // trackId
        userOverallStatsArb,
        fc.array(licenseClassArb, { minLength: 1, maxLength: 4 }),
        async (seriesId, trackId, overallStats, licenseClasses) => {
          // Create opportunity with potentially problematic global stats
          const opportunity: RacingOpportunity = {
            seriesId,
            seriesName: 'Test Series',
            trackId,
            trackName: 'Test Track',
            licenseRequired: 'D',
            category: 'road',
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [fc.sample(timeSlotArb, 1)[0]],
            globalStats: {
              avgIncidentsPerRace: NaN, // Problematic data
              avgFinishPositionStdDev: Infinity, // Problematic data
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: NaN, // Problematic data
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          // Create user history with potentially problematic personal data
          const problematicHistory: SeriesTrackHistory = {
            seriesId,
            trackId,
            raceCount: 10,
            avgStartingPosition: 15,
            avgFinishingPosition: 15,
            avgPositionDelta: NaN, // Problematic data
            avgIncidents: Infinity, // Problematic data
            finishPositionStdDev: NaN, // Problematic data
            lastRaceDate: new Date()
          };

          const userHistory: UserHistory = {
            userId: fc.sample(fc.uuid(), 1)[0],
            seriesTrackHistory: [problematicHistory],
            overallStats,
            licenseClasses
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

          // All scores should be finite numbers between 0-100
          expect(Number.isFinite(score.overall)).toBe(true);
          expect(score.overall).toBeGreaterThanOrEqual(0);
          expect(score.overall).toBeLessThanOrEqual(100);

          expect(Number.isFinite(score.factors.performance)).toBe(true);
          expect(score.factors.performance).toBeGreaterThanOrEqual(0);
          expect(score.factors.performance).toBeLessThanOrEqual(100);

          expect(Number.isFinite(score.factors.safety)).toBe(true);
          expect(score.factors.safety).toBeGreaterThanOrEqual(0);
          expect(score.factors.safety).toBeLessThanOrEqual(100);

          expect(Number.isFinite(score.factors.consistency)).toBe(true);
          expect(score.factors.consistency).toBeGreaterThanOrEqual(0);
          expect(score.factors.consistency).toBeLessThanOrEqual(100);

          expect(Number.isFinite(score.factors.predictability)).toBe(true);
          expect(score.factors.predictability).toBeGreaterThanOrEqual(0);
          expect(score.factors.predictability).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});