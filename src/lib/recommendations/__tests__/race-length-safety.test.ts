/**
 * Tests for Race Length Safety Adjustment Feature
 *
 * This feature adjusts safety scores for unfamiliar series based on race length.
 * Longer races = more opportunity for incidents = lower safety score.
 *
 * Key behaviors:
 * 1. Personal history bypasses race length adjustment (uses actual incident data)
 * 2. For unfamiliar series, expected incidents are multiplied by a race length factor
 * 3. The multiplier uses logarithmic scaling: 1 + log2(length/20) * 0.5
 * 4. Multiplier is bounded between 0.8 (short races) and 2.0 (very long races)
 */

import { describe, test, expect } from '@jest/globals';
import { ScoringAlgorithm } from '../scoring';
import {
  RacingOpportunity,
  UserHistory,
  RecommendationMode,
  SeriesTrackHistory,
  Category,
  LicenseLevel,
} from '../types';

describe('Race Length Safety Adjustment', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  // Helper to create a basic racing opportunity
  const createOpportunity = (overrides: Partial<RacingOpportunity> = {}): RacingOpportunity => ({
    seriesId: 100,
    seriesName: 'Test Series',
    trackId: 50,
    trackName: 'Test Track',
    licenseRequired: 'C' as LicenseLevel,
    category: 'sports_car' as Category,
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 1,
    raceLength: 30,
    hasOpenSetup: false,
    timeSlots: [{ hour: 12, dayOfWeek: 6, strengthOfField: 2000, participantCount: 25 }],
    globalStats: {
      avgIncidentsPerRace: 3.0,
      avgFinishPositionStdDev: 5.0,
      avgStrengthOfField: 2000,
      strengthOfFieldVariability: 200,
      attritionRate: 10,
      avgRaceLength: 30,
    },
    ...overrides,
  });

  // Helper to create user history without experience in the test series
  const createUnfamiliarUserHistory = (): UserHistory => ({
    userId: 'test-user-123',
    seriesTrackHistory: [], // No history for the test series
    overallStats: {
      totalRaces: 50,
      avgIncidentsPerRace: 2.5,
      avgPositionDelta: 1.0,
      overallConsistency: 4.0,
    },
    licenseClasses: [
      { category: 'sports_car' as Category, level: 'B' as LicenseLevel, safetyRating: 3.5, iRating: 2000 },
    ],
  });

  // Helper to create user history with experience in the test series
  const createFamiliarUserHistory = (seriesId: number, trackId: number): UserHistory => ({
    userId: 'test-user-123',
    seriesTrackHistory: [
      {
        seriesId,
        trackId,
        raceCount: 10,
        avgStartingPosition: 12,
        avgFinishingPosition: 10,
        avgPositionDelta: 2,
        avgIncidents: 1.5, // Low incidents - clean driver in this series
        finishPositionStdDev: 3.0,
        lastRaceDate: new Date(),
      },
    ],
    overallStats: {
      totalRaces: 50,
      avgIncidentsPerRace: 2.5,
      avgPositionDelta: 1.0,
      overallConsistency: 4.0,
    },
    licenseClasses: [
      { category: 'sports_car' as Category, level: 'B' as LicenseLevel, safetyRating: 3.5, iRating: 2000 },
    ],
  });

  describe('Unfamiliar Series - Race Length Affects Safety Score', () => {
    test('shorter races (15 min) have higher safety scores than baseline (20 min)', () => {
      const userHistory = createUnfamiliarUserHistory();
      const shortRace = createOpportunity({ raceLength: 15 });
      const baselineRace = createOpportunity({ raceLength: 20 });

      const shortScore = scoringAlgorithm.calculateScore(shortRace, userHistory, 'balanced');
      const baselineScore = scoringAlgorithm.calculateScore(baselineRace, userHistory, 'balanced');

      expect(shortScore.factors.safety).toBeGreaterThan(baselineScore.factors.safety);
    });

    test('baseline races (20 min) have higher safety scores than medium races (45 min)', () => {
      const userHistory = createUnfamiliarUserHistory();
      const baselineRace = createOpportunity({ raceLength: 20 });
      const mediumRace = createOpportunity({ raceLength: 45 });

      const baselineScore = scoringAlgorithm.calculateScore(baselineRace, userHistory, 'balanced');
      const mediumScore = scoringAlgorithm.calculateScore(mediumRace, userHistory, 'balanced');

      expect(baselineScore.factors.safety).toBeGreaterThan(mediumScore.factors.safety);
    });

    test('medium races (45 min) have higher safety scores than long races (90 min)', () => {
      const userHistory = createUnfamiliarUserHistory();
      const mediumRace = createOpportunity({ raceLength: 45 });
      const longRace = createOpportunity({ raceLength: 90 });

      const mediumScore = scoringAlgorithm.calculateScore(mediumRace, userHistory, 'balanced');
      const longScore = scoringAlgorithm.calculateScore(longRace, userHistory, 'balanced');

      expect(mediumScore.factors.safety).toBeGreaterThan(longScore.factors.safety);
    });

    test('long races (60 min) have higher safety scores than very long races (80 min)', () => {
      const userHistory = createUnfamiliarUserHistory();
      // Note: The multiplier caps at 2.0 around 80 minutes, so 90+ min races have same multiplier
      // Testing 60 vs 80 to ensure we see the effect before the cap
      const longRace = createOpportunity({ raceLength: 60 });
      const veryLongRace = createOpportunity({ raceLength: 80 });

      const longScore = scoringAlgorithm.calculateScore(longRace, userHistory, 'balanced');
      const veryLongScore = scoringAlgorithm.calculateScore(veryLongRace, userHistory, 'balanced');

      expect(longScore.factors.safety).toBeGreaterThan(veryLongScore.factors.safety);
    });

    test('races beyond cap (90+ min) have same safety score due to multiplier cap', () => {
      const userHistory = createUnfamiliarUserHistory();
      // Both 90 and 180 min races hit the 2.0x multiplier cap
      const ninetyMinRace = createOpportunity({ raceLength: 90 });
      const enduranceRace = createOpportunity({ raceLength: 180 });

      const ninetyScore = scoringAlgorithm.calculateScore(ninetyMinRace, userHistory, 'balanced');
      const enduranceScore = scoringAlgorithm.calculateScore(enduranceRace, userHistory, 'balanced');

      // Both should have the same safety score since they hit the cap
      expect(ninetyScore.factors.safety).toBe(enduranceScore.factors.safety);
    });

    test('safety score decreases monotonically as race length increases', () => {
      const userHistory = createUnfamiliarUserHistory();
      const raceLengths = [15, 20, 30, 45, 60, 90, 120, 180, 240];
      const safetyScores: number[] = [];

      for (const raceLength of raceLengths) {
        const opportunity = createOpportunity({ raceLength });
        const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
        safetyScores.push(score.factors.safety);
      }

      // Verify monotonically decreasing (each score <= previous score)
      for (let i = 1; i < safetyScores.length; i++) {
        expect(safetyScores[i]).toBeLessThanOrEqual(safetyScores[i - 1]);
      }
    });

    test('significant difference between sprint (15 min) and endurance (120 min)', () => {
      const userHistory = createUnfamiliarUserHistory();
      const sprintRace = createOpportunity({ raceLength: 15 });
      const enduranceRace = createOpportunity({ raceLength: 120 });

      const sprintScore = scoringAlgorithm.calculateScore(sprintRace, userHistory, 'balanced');
      const enduranceScore = scoringAlgorithm.calculateScore(enduranceRace, userHistory, 'balanced');

      // Should see at least 10 point difference between sprint and endurance
      const difference = sprintScore.factors.safety - enduranceScore.factors.safety;
      expect(difference).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Familiar Series - Race Length Does NOT Affect Safety Score', () => {
    test('personal history is used regardless of race length', () => {
      const opportunity = createOpportunity({ seriesId: 100, trackId: 50 });

      // User has history with 1.5 avg incidents in this exact series/track
      const familiarHistory = createFamiliarUserHistory(100, 50);

      // Test with different race lengths - all should use the same personal history
      const shortRace = createOpportunity({ ...opportunity, raceLength: 15 });
      const longRace = createOpportunity({ ...opportunity, raceLength: 120 });

      const shortScore = scoringAlgorithm.calculateScore(shortRace, familiarHistory, 'balanced');
      const longScore = scoringAlgorithm.calculateScore(longRace, familiarHistory, 'balanced');

      // Safety scores should be identical since personal history is used
      expect(shortScore.factors.safety).toBe(longScore.factors.safety);
    });

    test('familiar series uses actual incident history not estimated incidents', () => {
      const opportunity = createOpportunity({
        seriesId: 100,
        trackId: 50,
        raceLength: 120, // Long race
        globalStats: {
          avgIncidentsPerRace: 5.0, // High global incidents
          avgFinishPositionStdDev: 5.0,
          avgStrengthOfField: 2000,
          strengthOfFieldVariability: 200,
          attritionRate: 15,
          avgRaceLength: 120,
        },
      });

      // User has clean record (1.5 incidents) in this series despite high global average
      const familiarHistory = createFamiliarUserHistory(100, 50);

      const score = scoringAlgorithm.calculateScore(opportunity, familiarHistory, 'balanced');

      // Safety should be high because personal history shows clean driving
      // Personal history: 1.5 incidents → score = (1 - 1.5/20) * 100 = 92.5
      expect(score.factors.safety).toBeGreaterThanOrEqual(90);
    });

    test('3+ races in series qualifies as familiar', () => {
      const opportunity = createOpportunity({ seriesId: 100, trackId: 50, raceLength: 120 });

      // Create history with exactly 3 races (minimum for "familiar")
      const barelyFamiliarHistory: UserHistory = {
        userId: 'test-user',
        seriesTrackHistory: [
          {
            seriesId: 100,
            trackId: 50,
            raceCount: 3, // Minimum for familiar
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2.0,
            finishPositionStdDev: 4.0,
            lastRaceDate: new Date(),
          },
        ],
        overallStats: {
          totalRaces: 10,
          avgIncidentsPerRace: 4.0, // Higher overall
          avgPositionDelta: 0,
          overallConsistency: 5.0,
        },
        licenseClasses: [
          { category: 'sports_car' as Category, level: 'C' as LicenseLevel, safetyRating: 3.0, iRating: 1500 },
        ],
      };

      const shortRace = createOpportunity({ ...opportunity, raceLength: 20 });
      const longRace = createOpportunity({ ...opportunity, raceLength: 120 });

      const shortScore = scoringAlgorithm.calculateScore(shortRace, barelyFamiliarHistory, 'balanced');
      const longScore = scoringAlgorithm.calculateScore(longRace, barelyFamiliarHistory, 'balanced');

      // Should be the same - using personal history not estimated
      expect(shortScore.factors.safety).toBe(longScore.factors.safety);
    });

    test('2 races in series does NOT qualify as familiar - race length adjustment applies', () => {
      const opportunity = createOpportunity({ seriesId: 100, trackId: 50 });

      // Create history with only 2 races (not enough for "familiar")
      const notFamiliarHistory: UserHistory = {
        userId: 'test-user',
        seriesTrackHistory: [
          {
            seriesId: 100,
            trackId: 50,
            raceCount: 2, // Below threshold
            avgStartingPosition: 15,
            avgFinishingPosition: 12,
            avgPositionDelta: 3,
            avgIncidents: 2.0,
            finishPositionStdDev: 4.0,
            lastRaceDate: new Date(),
          },
        ],
        overallStats: {
          totalRaces: 10,
          avgIncidentsPerRace: 3.0,
          avgPositionDelta: 0,
          overallConsistency: 5.0,
        },
        licenseClasses: [
          { category: 'sports_car' as Category, level: 'C' as LicenseLevel, safetyRating: 3.0, iRating: 1500 },
        ],
      };

      const shortRace = createOpportunity({ ...opportunity, raceLength: 20 });
      const longRace = createOpportunity({ ...opportunity, raceLength: 120 });

      const shortScore = scoringAlgorithm.calculateScore(shortRace, notFamiliarHistory, 'balanced');
      const longScore = scoringAlgorithm.calculateScore(longRace, notFamiliarHistory, 'balanced');

      // Should be different - race length adjustment applies because not enough history
      expect(shortScore.factors.safety).toBeGreaterThan(longScore.factors.safety);
    });
  });

  describe('Race Length Multiplier Bounds', () => {
    test('very short races (10 min) do not get excessive bonus', () => {
      const userHistory = createUnfamiliarUserHistory();

      // Test that 10-min race isn't dramatically higher than 15-min race
      const veryShortRace = createOpportunity({ raceLength: 10 });
      const shortRace = createOpportunity({ raceLength: 15 });

      const veryShortScore = scoringAlgorithm.calculateScore(veryShortRace, userHistory, 'balanced');
      const shortScore = scoringAlgorithm.calculateScore(shortRace, userHistory, 'balanced');

      // Difference should be modest (multiplier bounded at 0.8)
      const difference = veryShortScore.factors.safety - shortScore.factors.safety;
      expect(difference).toBeLessThanOrEqual(5);
    });

    test('extremely long races (360 min) do not get excessive penalty', () => {
      const userHistory = createUnfamiliarUserHistory();

      // Test that 6-hour race isn't dramatically lower than 3-hour race
      const threeHourRace = createOpportunity({ raceLength: 180 });
      const sixHourRace = createOpportunity({ raceLength: 360 });

      const threeHourScore = scoringAlgorithm.calculateScore(threeHourRace, userHistory, 'balanced');
      const sixHourScore = scoringAlgorithm.calculateScore(sixHourRace, userHistory, 'balanced');

      // Difference should be modest (multiplier capped at 2.0)
      const difference = threeHourScore.factors.safety - sixHourScore.factors.safety;
      expect(difference).toBeLessThanOrEqual(10);
    });
  });

  describe('Interaction with Recommendation Modes', () => {
    test('race length effect applies consistently across all modes', () => {
      const userHistory = createUnfamiliarUserHistory();
      const shortRace = createOpportunity({ raceLength: 20 });
      const longRace = createOpportunity({ raceLength: 90 });
      const modes: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];

      for (const mode of modes) {
        const shortScore = scoringAlgorithm.calculateScore(shortRace, userHistory, mode);
        const longScore = scoringAlgorithm.calculateScore(longRace, userHistory, mode);

        // Safety factor should always be higher for shorter race
        expect(shortScore.factors.safety).toBeGreaterThan(longScore.factors.safety);
      }
    });

    test('safety_recovery mode amplifies race length importance in overall score', () => {
      const userHistory = createUnfamiliarUserHistory();
      const shortRace = createOpportunity({ raceLength: 20 });
      const longRace = createOpportunity({ raceLength: 90 });

      const balancedShort = scoringAlgorithm.calculateScore(shortRace, userHistory, 'balanced');
      const balancedLong = scoringAlgorithm.calculateScore(longRace, userHistory, 'balanced');

      const safetyShort = scoringAlgorithm.calculateScore(shortRace, userHistory, 'safety_recovery');
      const safetyLong = scoringAlgorithm.calculateScore(longRace, userHistory, 'safety_recovery');

      const balancedDiff = balancedShort.overall - balancedLong.overall;
      const safetyDiff = safetyShort.overall - safetyLong.overall;

      // Safety recovery mode weighs safety at 0.30 vs balanced at 0.15
      // So the overall score difference should be larger in safety_recovery mode
      expect(safetyDiff).toBeGreaterThanOrEqual(balancedDiff);
    });
  });

  describe('Interaction with User Safety Rating', () => {
    test('low SR users see larger race length effect', () => {
      const lowSRUser: UserHistory = {
        userId: 'low-sr-user',
        seriesTrackHistory: [],
        overallStats: {
          totalRaces: 30,
          avgIncidentsPerRace: 4.5, // Higher incidents
          avgPositionDelta: -1.0,
          overallConsistency: 6.0,
        },
        licenseClasses: [
          { category: 'sports_car' as Category, level: 'D' as LicenseLevel, safetyRating: 2.0, iRating: 1200 },
        ],
      };

      const highSRUser: UserHistory = {
        userId: 'high-sr-user',
        seriesTrackHistory: [],
        overallStats: {
          totalRaces: 100,
          avgIncidentsPerRace: 1.5, // Low incidents
          avgPositionDelta: 2.0,
          overallConsistency: 3.0,
        },
        licenseClasses: [
          { category: 'sports_car' as Category, level: 'A' as LicenseLevel, safetyRating: 4.5, iRating: 3000 },
        ],
      };

      const shortRace = createOpportunity({ raceLength: 20 });
      const longRace = createOpportunity({ raceLength: 90 });

      const lowSRShort = scoringAlgorithm.calculateScore(shortRace, lowSRUser, 'balanced');
      const lowSRLong = scoringAlgorithm.calculateScore(longRace, lowSRUser, 'balanced');

      const highSRShort = scoringAlgorithm.calculateScore(shortRace, highSRUser, 'balanced');
      const highSRLong = scoringAlgorithm.calculateScore(longRace, highSRUser, 'balanced');

      // Both users should see safety decrease for longer races
      expect(lowSRShort.factors.safety).toBeGreaterThan(lowSRLong.factors.safety);
      expect(highSRShort.factors.safety).toBeGreaterThan(highSRLong.factors.safety);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero race length gracefully', () => {
      const userHistory = createUnfamiliarUserHistory();
      const opportunity = createOpportunity({ raceLength: 0 });

      // Should not throw, should produce a valid score
      expect(() => {
        scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
      }).not.toThrow();
    });

    test('handles negative race length gracefully', () => {
      const userHistory = createUnfamiliarUserHistory();
      const opportunity = createOpportunity({ raceLength: -10 });

      // Should not throw, should produce a valid score
      expect(() => {
        scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');
      }).not.toThrow();
    });

    test('handles very large race length gracefully', () => {
      const userHistory = createUnfamiliarUserHistory();
      const opportunity = createOpportunity({ raceLength: 1440 }); // 24 hours

      const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

      // Should produce valid score with safety >= 0
      expect(score.factors.safety).toBeGreaterThanOrEqual(0);
      expect(score.factors.safety).toBeLessThanOrEqual(100);
    });

    test('handles user with no races gracefully', () => {
      const newUser: UserHistory = {
        userId: 'new-user',
        seriesTrackHistory: [],
        overallStats: {
          totalRaces: 0,
          avgIncidentsPerRace: 0,
          avgPositionDelta: 0,
          overallConsistency: 0,
        },
        licenseClasses: [
          { category: 'sports_car' as Category, level: 'rookie' as LicenseLevel, safetyRating: 2.5, iRating: 1350 },
        ],
      };

      const shortRace = createOpportunity({ raceLength: 20 });
      const longRace = createOpportunity({ raceLength: 90 });

      const shortScore = scoringAlgorithm.calculateScore(shortRace, newUser, 'balanced');
      const longScore = scoringAlgorithm.calculateScore(longRace, newUser, 'balanced');

      // Should still apply race length adjustment based on global stats
      expect(shortScore.factors.safety).toBeGreaterThan(longScore.factors.safety);
    });
  });
});

/**
 * Property-Based Tests for Race Length Safety Adjustment
 *
 * These tests use fast-check to verify the race length safety adjustment
 * works correctly across a wide range of random inputs.
 */
import fc from 'fast-check';

describe('Race Length Safety Adjustment - Property-Based Tests', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  // Arbitraries for generating test data
  const categoryArb = fc.constantFrom('oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;
  const licenseLevelArb = fc.constantFrom('rookie', 'D', 'C', 'B', 'A', 'pro') as fc.Arbitrary<LicenseLevel>;
  const recommendationModeArb = fc.constantFrom('balanced', 'irating_push', 'safety_recovery') as fc.Arbitrary<RecommendationMode>;

  const globalStatsArb = fc.record({
    avgIncidentsPerRace: fc.float({ min: Math.fround(0.5), max: Math.fround(8), noNaN: true }),
    avgFinishPositionStdDev: fc.float({ min: Math.fround(1), max: Math.fround(15), noNaN: true }),
    avgStrengthOfField: fc.integer({ min: 800, max: 4000 }),
    strengthOfFieldVariability: fc.float({ min: Math.fround(50), max: Math.fround(500), noNaN: true }),
    attritionRate: fc.float({ min: Math.fround(0), max: Math.fround(30), noNaN: true }),
    avgRaceLength: fc.integer({ min: 15, max: 240 }),
  });

  const timeSlotArb = fc.record({
    hour: fc.integer({ min: 0, max: 23 }),
    dayOfWeek: fc.integer({ min: 0, max: 6 }),
    strengthOfField: fc.integer({ min: 800, max: 4000 }),
    participantCount: fc.integer({ min: 10, max: 50 }),
  });

  const racingOpportunityArb = fc.record({
    seriesId: fc.integer({ min: 1, max: 1000 }),
    seriesName: fc.string({ minLength: 5, maxLength: 30 }),
    trackId: fc.integer({ min: 1, max: 500 }),
    trackName: fc.string({ minLength: 5, maxLength: 30 }),
    licenseRequired: licenseLevelArb,
    category: categoryArb,
    seasonYear: fc.constant(2025),
    seasonQuarter: fc.integer({ min: 1, max: 4 }),
    raceWeekNum: fc.integer({ min: 0, max: 12 }),
    raceLength: fc.integer({ min: 10, max: 240 }),
    hasOpenSetup: fc.boolean(),
    timeSlots: fc.array(timeSlotArb, { minLength: 1, maxLength: 4 }),
    globalStats: globalStatsArb,
  }) as fc.Arbitrary<RacingOpportunity>;

  const licenseClassArb = fc.record({
    category: categoryArb,
    level: licenseLevelArb,
    safetyRating: fc.float({ min: Math.fround(1.5), max: Math.fround(4.99), noNaN: true }),
    iRating: fc.integer({ min: 800, max: 4000 }),
  });

  const unfamiliarUserHistoryArb = fc.record({
    userId: fc.uuid(),
    seriesTrackHistory: fc.constant([]), // No history - unfamiliar
    overallStats: fc.record({
      totalRaces: fc.integer({ min: 5, max: 200 }),
      avgIncidentsPerRace: fc.float({ min: Math.fround(1), max: Math.fround(6), noNaN: true }),
      avgPositionDelta: fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true }),
      overallConsistency: fc.float({ min: Math.fround(2), max: Math.fround(10), noNaN: true }),
    }),
    licenseClasses: fc.array(licenseClassArb, { minLength: 1, maxLength: 5 }),
  }) as fc.Arbitrary<UserHistory>;

  test('Property: Shorter race always has >= safety score than longer race (unfamiliar series)', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        unfamiliarUserHistoryArb,
        recommendationModeArb,
        fc.integer({ min: 10, max: 79 }), // Short race length (before cap)
        fc.integer({ min: 80, max: 240 }), // Long race length (at/after cap)
        async (opportunity, userHistory, mode, shortLength, longLength) => {
          // Ensure user has a matching license for the opportunity category
          const matchingLicense = {
            category: opportunity.category,
            level: 'B' as LicenseLevel,
            safetyRating: 3.0,
            iRating: 2000,
          };
          const userWithLicense = {
            ...userHistory,
            licenseClasses: [matchingLicense, ...userHistory.licenseClasses],
          };

          const shortOpportunity = { ...opportunity, raceLength: shortLength };
          const longOpportunity = { ...opportunity, raceLength: longLength };

          const shortScore = scoringAlgorithm.calculateScore(shortOpportunity, userWithLicense, mode);
          const longScore = scoringAlgorithm.calculateScore(longOpportunity, userWithLicense, mode);

          // Shorter race should have >= safety score
          expect(shortScore.factors.safety).toBeGreaterThanOrEqual(longScore.factors.safety);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: Safety score is always in valid range [0, 100]', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        unfamiliarUserHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          // Ensure user has a matching license
          const matchingLicense = {
            category: opportunity.category,
            level: 'C' as LicenseLevel,
            safetyRating: 3.0,
            iRating: 1800,
          };
          const userWithLicense = {
            ...userHistory,
            licenseClasses: [matchingLicense],
          };

          const score = scoringAlgorithm.calculateScore(opportunity, userWithLicense, mode);

          expect(score.factors.safety).toBeGreaterThanOrEqual(0);
          expect(score.factors.safety).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Familiar series ignores race length (same safety for any length)', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        fc.float({ min: Math.fround(0.5), max: Math.fround(5), noNaN: true }), // Personal incident rate
        recommendationModeArb,
        async (opportunity, personalIncidents, mode) => {
          // Create user with familiar history (3+ races in this series/track)
          const familiarHistory: UserHistory = {
            userId: 'test-user',
            seriesTrackHistory: [
              {
                seriesId: opportunity.seriesId,
                trackId: opportunity.trackId,
                raceCount: 10, // Familiar
                avgStartingPosition: 12,
                avgFinishingPosition: 10,
                avgPositionDelta: 2,
                avgIncidents: personalIncidents,
                finishPositionStdDev: 3.0,
                lastRaceDate: new Date(),
              },
            ],
            overallStats: {
              totalRaces: 50,
              avgIncidentsPerRace: 3.0,
              avgPositionDelta: 1.0,
              overallConsistency: 4.0,
            },
            licenseClasses: [
              { category: opportunity.category, level: 'B' as LicenseLevel, safetyRating: 3.5, iRating: 2000 },
            ],
          };

          // Create two opportunities with same series/track but different race lengths
          const shortRace = { ...opportunity, raceLength: 15 };
          const longRace = { ...opportunity, raceLength: 180 };

          const shortScore = scoringAlgorithm.calculateScore(shortRace, familiarHistory, mode);
          const longScore = scoringAlgorithm.calculateScore(longRace, familiarHistory, mode);

          // Safety scores should be identical - personal history used, race length ignored
          expect(shortScore.factors.safety).toBe(longScore.factors.safety);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: Race length effect is monotonic (longer = same or lower safety)', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        unfamiliarUserHistoryArb,
        recommendationModeArb,
        fc.array(fc.integer({ min: 10, max: 240 }), { minLength: 3, maxLength: 10 }),
        async (opportunity, userHistory, mode, raceLengths) => {
          // Ensure user has a matching license
          const matchingLicense = {
            category: opportunity.category,
            level: 'B' as LicenseLevel,
            safetyRating: 3.0,
            iRating: 2000,
          };
          const userWithLicense = {
            ...userHistory,
            licenseClasses: [matchingLicense],
          };

          // Sort race lengths ascending
          const sortedLengths = [...raceLengths].sort((a, b) => a - b);

          // Calculate safety scores for each race length
          const safetyScores = sortedLengths.map((raceLength) => {
            const opp = { ...opportunity, raceLength };
            return scoringAlgorithm.calculateScore(opp, userWithLicense, mode).factors.safety;
          });

          // Verify monotonically decreasing (or equal)
          for (let i = 1; i < safetyScores.length; i++) {
            expect(safetyScores[i]).toBeLessThanOrEqual(safetyScores[i - 1]);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property: Deterministic - same inputs produce same safety score', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        unfamiliarUserHistoryArb,
        recommendationModeArb,
        async (opportunity, userHistory, mode) => {
          const matchingLicense = {
            category: opportunity.category,
            level: 'C' as LicenseLevel,
            safetyRating: 3.0,
            iRating: 1800,
          };
          const userWithLicense = {
            ...userHistory,
            licenseClasses: [matchingLicense],
          };

          const score1 = scoringAlgorithm.calculateScore(opportunity, userWithLicense, mode);
          const score2 = scoringAlgorithm.calculateScore(opportunity, userWithLicense, mode);

          expect(score1.factors.safety).toBe(score2.factors.safety);
        }
      ),
      { numRuns: 50 }
    );
  });
});
