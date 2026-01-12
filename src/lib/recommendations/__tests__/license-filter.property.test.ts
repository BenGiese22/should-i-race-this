/**
 * Property-Based Tests for License-Based Access Control
 * Feature: racing-analytics-dashboard, Property 6: License-Based Access Control
 * Validates: Requirements 6.3
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { LicenseFilter } from '../license-filter';
import { LicenseHelper, LicenseLevel } from '../../types/license';
import { 
  RacingOpportunity, 
  UserHistory, 
  LicenseClass,
  Category
} from '../types';

// Test data generators
const categoryArb = fc.constantFrom('oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;
const licenseLevelArb = fc.constantFrom(
  LicenseLevel.ROOKIE, 
  LicenseLevel.D, 
  LicenseLevel.C, 
  LicenseLevel.B, 
  LicenseLevel.A, 
  LicenseLevel.PRO
) as fc.Arbitrary<LicenseLevel>;

const licenseClassArb = fc.record({
  category: categoryArb,
  level: licenseLevelArb,
  safetyRating: fc.float({ min: Math.fround(1.0), max: Math.fround(4.99) }),
  iRating: fc.integer({ min: 800, max: 4000 })
}) as fc.Arbitrary<LicenseClass>;

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
  timeSlots: fc.array(fc.record({
    hour: fc.integer({ min: 0, max: 23 }),
    dayOfWeek: fc.integer({ min: 0, max: 6 }),
    strengthOfField: fc.integer({ min: 800, max: 4000 }),
    participantCount: fc.integer({ min: 5, max: 60 })
  }), { minLength: 1, maxLength: 8 }),
  globalStats: fc.record({
    avgIncidentsPerRace: fc.float({ min: 0, max: Math.fround(10) }),
    avgFinishPositionStdDev: fc.float({ min: 1, max: Math.fround(20) }),
    avgStrengthOfField: fc.integer({ min: 800, max: 4000 }),
    strengthOfFieldVariability: fc.float({ min: 50, max: Math.fround(2000) }),
    attritionRate: fc.float({ min: 0, max: Math.fround(50) }),
    avgRaceLength: fc.integer({ min: 15, max: 240 })
  })
}) as fc.Arbitrary<RacingOpportunity>;

const userHistoryArb = fc.record({
  userId: fc.uuid(),
  seriesTrackHistory: fc.array(fc.record({
    seriesId: fc.integer({ min: 1, max: 1000 }),
    trackId: fc.integer({ min: 1, max: 500 }),
    raceCount: fc.integer({ min: 1, max: 100 }),
    avgStartingPosition: fc.float({ min: 1, max: Math.fround(60) }),
    avgFinishingPosition: fc.float({ min: 1, max: Math.fround(60) }),
    avgPositionDelta: fc.float({ min: -30, max: Math.fround(30) }),
    avgIncidents: fc.float({ min: 0, max: Math.fround(15) }),
    finishPositionStdDev: fc.float({ min: Math.fround(0.5), max: Math.fround(20) }),
    lastRaceDate: fc.date({ min: new Date('2020-01-01'), max: new Date() })
  }), { minLength: 0, maxLength: 20 }),
  overallStats: fc.record({
    totalRaces: fc.integer({ min: 1, max: 1000 }),
    avgIncidentsPerRace: fc.float({ min: 0, max: Math.fround(10) }),
    avgPositionDelta: fc.float({ min: -20, max: Math.fround(20) }),
    overallConsistency: fc.float({ min: 1, max: Math.fround(25) })
  }),
  licenseClasses: fc.array(licenseClassArb, { minLength: 1, maxLength: 4 })
}) as fc.Arbitrary<UserHistory>;

describe('License-Based Access Control Properties', () => {
  const licenseFilter = new LicenseFilter();

  /**
   * Property 6: License Requirement Filtering
   * For any user with a set of licenses, the recommendation system should only return 
   * series where the user meets or exceeds the minimum license requirements in the 
   * appropriate category.
   * **Validates: Requirements 7.1**
   */
  test('Property 6: License Requirement Filtering - only eligible series returned', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(racingOpportunityArb, { minLength: 1, maxLength: 50 }),
        userHistoryArb,
        async (opportunities, userHistory) => {
          const filteredOpportunities = licenseFilter.filterByLicense(opportunities, userHistory);

          // Property 6: All returned series must meet license requirements
          for (const opportunity of filteredOpportunities) {
            // Find the user's highest license in the opportunity's category
            const userLicensesInCategory = userHistory.licenseClasses.filter(
              license => license.category === opportunity.category
            );

            // User must have at least one license in the opportunity's category
            expect(userLicensesInCategory.length).toBeGreaterThan(0);

            if (userLicensesInCategory.length > 0) {
              // Get the highest license level in this category using centralized helper
              const highestUserLicense = userLicensesInCategory.reduce((highest, current) => {
                return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
              });

              // User's highest license level must meet or exceed the requirement
              expect(LicenseHelper.meetsRequirement(highestUserLicense.level, opportunity.licenseRequired)).toBe(true);
            }
          }

          // No series should be returned that the user cannot participate in
          const ineligibleSeries = opportunities.filter(opp => {
            const userLicensesInCategory = userHistory.licenseClasses.filter(
              license => license.category === opp.category
            );

            if (userLicensesInCategory.length === 0) return true; // No license in category = ineligible

            // Get the highest license level in this category
            const highestUserLicense = userLicensesInCategory.reduce((highest, current) => {
              return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
            });

            return !LicenseHelper.meetsRequirement(highestUserLicense.level, opp.licenseRequired);
          });

          // None of the ineligible series should appear in filtered results
          for (const ineligible of ineligibleSeries) {
            const foundInFiltered = filteredOpportunities.some(
              filtered => filtered.seriesId === ineligible.seriesId && 
                         filtered.trackId === ineligible.trackId &&
                         filtered.licenseRequired === ineligible.licenseRequired // Must match license requirement too
            );
            expect(foundInFiltered).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Legacy Property 6: License-Based Access Control
   * For any user with specific license levels, the recommendation system should 
   * exclude all series that require higher license levels than the user possesses 
   * across all racing categories.
   */
  test('Legacy Property 6: License filtering excludes series requiring higher license levels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(racingOpportunityArb, { minLength: 1, maxLength: 50 }),
        userHistoryArb,
        async (opportunities, userHistory) => {
          const filteredOpportunities = licenseFilter.filterByLicense(opportunities, userHistory);

          // All filtered opportunities should be eligible for the user
          for (const opportunity of filteredOpportunities) {
            const isEligible = licenseFilter.hasRequiredLicense(opportunity, userHistory);
            expect(isEligible).toBe(true);
          }

          // No filtered opportunity should require a higher license than the user has
          for (const opportunity of filteredOpportunities) {
            const userLicensesInCategory = userHistory.licenseClasses.filter(
              license => license.category === opportunity.category
            );

            // If user has a license in this category, it should be sufficient
            if (userLicensesInCategory.length > 0) {
              // Get the highest license level in this category
              const highestUserLicense = userLicensesInCategory.reduce((highest, current) => {
                return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
              });

              expect(LicenseHelper.meetsRequirement(highestUserLicense.level, opportunity.licenseRequired)).toBe(true);
            }
          }

          // Filtered opportunities should be a subset of original opportunities
          expect(filteredOpportunities.length).toBeLessThanOrEqual(opportunities.length);

          // All filtered opportunities should exist in the original list
          for (const filtered of filteredOpportunities) {
            const exists = opportunities.some(
              opp => opp.seriesId === filtered.seriesId && opp.trackId === filtered.trackId
            );
            expect(exists).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6a: License hierarchy is correctly enforced', async () => {
    await fc.assert(
      fc.asyncProperty(
        licenseLevelArb,
        licenseLevelArb,
        categoryArb,
        async (userLevel, requiredLevel, category) => {
          const userHistory: UserHistory = {
            userId: 'test-user',
            seriesTrackHistory: [],
            overallStats: {
              totalRaces: 10,
              avgIncidentsPerRace: 2,
              avgPositionDelta: 0,
              overallConsistency: 5
            },
            licenseClasses: [{
              category,
              level: userLevel,
              safetyRating: 3.0,
              iRating: 1500
            }]
          };

          const opportunity: RacingOpportunity = {
            seriesId: 1,
            seriesName: 'Test Series',
            trackId: 1,
            trackName: 'Test Track',
            licenseRequired: requiredLevel,
            category,
            seasonYear: 2024,
            seasonQuarter: 1,
            raceWeekNum: 1,
            raceLength: 60,
            hasOpenSetup: false,
            timeSlots: [],
            globalStats: {
              avgIncidentsPerRace: 2,
              avgFinishPositionStdDev: 8,
              avgStrengthOfField: 1500,
              strengthOfFieldVariability: 300,
              attritionRate: 15,
              avgRaceLength: 60
            }
          };

          const hasLicense = licenseFilter.hasRequiredLicense(opportunity, userHistory);

          // User should have access if their level meets or exceeds required level
          const shouldHaveAccess = LicenseHelper.meetsRequirement(userLevel, requiredLevel);
          expect(hasLicense).toBe(shouldHaveAccess);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6b: Users without license in category are excluded', async () => {
    await fc.assert(
      fc.asyncProperty(
        racingOpportunityArb,
        userHistoryArb,
        async (opportunity, userHistory) => {
          // Create user history without license for the opportunity's category
          const userHistoryWithoutCategory = {
            ...userHistory,
            licenseClasses: userHistory.licenseClasses.filter(
              license => license.category !== opportunity.category
            )
          };

          // If user has no license in the opportunity's category, they should be excluded
          if (userHistoryWithoutCategory.licenseClasses.length === 0 || 
              !userHistoryWithoutCategory.licenseClasses.some(l => l.category === opportunity.category)) {
            const hasLicense = licenseFilter.hasRequiredLicense(opportunity, userHistoryWithoutCategory);
            expect(hasLicense).toBe(false);

            const filtered = licenseFilter.filterByLicense([opportunity], userHistoryWithoutCategory);
            expect(filtered).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6c: Almost eligible opportunities are one level away', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(racingOpportunityArb, { minLength: 1, maxLength: 20 }),
        userHistoryArb,
        async (opportunities, userHistory) => {
          const almostEligible = licenseFilter.getAlmostEligibleOpportunities(opportunities, userHistory);

          for (const opportunity of almostEligible) {
            const userLicense = userHistory.licenseClasses.find(
              license => license.category === opportunity.category
            );

            if (userLicense) {
              // Should be exactly one level below requirement
              const userValue = LicenseHelper.getNumericValue(userLicense.level);
              const requiredValue = LicenseHelper.getNumericValue(opportunity.licenseRequired);
              expect(requiredValue).toBe(userValue + 1);
            } else {
              // If no license in category, only rookie series should be almost eligible
              expect(opportunity.licenseRequired).toBe(LicenseLevel.ROOKIE);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Five-Category Filtering
   * For any user with licenses in multiple categories from the 5-category system 
   * (oval, sports_car, formula_car, dirt_oval, dirt_road), the filtering system 
   * should evaluate eligibility across all relevant categories.
   * **Validates: Requirements 7.5**
   */
  test('Property 7: Five-Category Filtering - evaluates all license categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(racingOpportunityArb, { minLength: 5, maxLength: 50 }),
        fc.array(licenseClassArb, { minLength: 2, maxLength: 5 }), // Multiple categories
        async (opportunities, licenseClasses) => {
          // Ensure we have opportunities across multiple categories
          const categories: Category[] = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
          
          // Create user history with multiple license categories
          const userHistory: UserHistory = {
            userId: 'test-user',
            seriesTrackHistory: [],
            overallStats: {
              totalRaces: 50,
              avgIncidentsPerRace: 2.5,
              avgPositionDelta: 0,
              overallConsistency: 8
            },
            licenseClasses: licenseClasses
          };

          const filteredOpportunities = licenseFilter.filterByLicense(opportunities, userHistory);

          // Property 7: System should evaluate eligibility across ALL 5 categories
          const userCategories = new Set(userHistory.licenseClasses.map(l => l.category));
          
          // For each category the user has a license in
          for (const category of userCategories) {
            const userLicensesInCategory = userHistory.licenseClasses.filter(l => l.category === category);
            if (userLicensesInCategory.length === 0) continue;

            // Get the highest license level in this category
            const highestUserLicense = userLicensesInCategory.reduce((highest, current) => {
              return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
            });

            const categoryOpportunities = opportunities.filter(opp => opp.category === category);
            const filteredCategoryOpportunities = filteredOpportunities.filter(opp => opp.category === category);

            // All filtered opportunities in this category should be eligible
            for (const opportunity of filteredCategoryOpportunities) {
              expect(LicenseHelper.meetsRequirement(highestUserLicense.level, opportunity.licenseRequired)).toBe(true);
            }

            // No eligible opportunities in this category should be excluded
            for (const opportunity of categoryOpportunities) {
              if (LicenseHelper.meetsRequirement(highestUserLicense.level, opportunity.licenseRequired)) {
                // This opportunity should be included in filtered results
                const isIncluded = filteredCategoryOpportunities.some(
                  filtered => filtered.seriesId === opportunity.seriesId && 
                             filtered.trackId === opportunity.trackId
                );
                expect(isIncluded).toBe(true);
              }
            }
          }

          // System should not include opportunities from categories user has no license for
          const opportunitiesFromUnlicensedCategories = opportunities.filter(opp => 
            !userCategories.has(opp.category)
          );

          for (const opportunity of opportunitiesFromUnlicensedCategories) {
            const isIncluded = filteredOpportunities.some(
              filtered => filtered.seriesId === opportunity.seriesId && 
                         filtered.trackId === opportunity.trackId
            );
            expect(isIncluded).toBe(false);
          }

          // Verify all 5 categories are properly handled
          for (const category of categories) {
            const hasLicense = userCategories.has(category);
            const categoryOpportunities = opportunities.filter(opp => opp.category === category);
            const filteredCategoryOpportunities = filteredOpportunities.filter(opp => opp.category === category);

            if (hasLicense) {
              // If user has license, some opportunities might be eligible
              expect(filteredCategoryOpportunities.length).toBeLessThanOrEqual(categoryOpportunities.length);
            } else {
              // If user has no license, no opportunities should be eligible
              expect(filteredCategoryOpportunities.length).toBe(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6d: License progression suggestions are valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        userHistoryArb,
        async (userHistory) => {
          const suggestions = licenseFilter.getLicenseProgressionSuggestions(userHistory);

          // Should have one suggestion per unique category, not per license class
          const uniqueCategories = [...new Set(userHistory.licenseClasses.map(l => l.category))];
          expect(suggestions).toHaveLength(uniqueCategories.length);

          for (const suggestion of suggestions) {
            // Suggestion category should be one of the user's categories
            const userCategories = userHistory.licenseClasses.map(l => l.category);
            expect(userCategories).toContain(suggestion.category);

            // Current level should be the highest level for this category
            const categoryLicenses = userHistory.licenseClasses.filter(l => l.category === suggestion.category);

            const highestLicense = categoryLicenses.reduce((highest, current) => {
              return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
            });

            expect(suggestion.currentLevel).toBe(highestLicense.level);

            // Next level should be valid progression
            if (suggestion.nextLevel) {
              const currentValue = LicenseHelper.getNumericValue(suggestion.currentLevel);
              const nextValue = LicenseHelper.getNumericValue(suggestion.nextLevel);

              expect(nextValue).toBe(currentValue + 1);
            } else {
              // If no next level, current should be 'Pro'
              expect(suggestion.currentLevel).toBe(LicenseLevel.PRO);
            }

            // Requirements should be a non-empty string
            expect(typeof suggestion.requirements).toBe('string');
            expect(suggestion.requirements.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6e: Available categories match user licenses', async () => {
    await fc.assert(
      fc.asyncProperty(
        userHistoryArb,
        async (userHistory) => {
          const availableCategories = licenseFilter.getAvailableCategories(userHistory);

          // Should have same number of categories as license classes
          expect(availableCategories).toHaveLength(userHistory.licenseClasses.length);

          // Each category should match a user license
          for (const category of availableCategories) {
            const hasLicense = userHistory.licenseClasses.some(
              license => license.category === category
            );
            expect(hasLicense).toBe(true);
          }

          // Each user license should have a corresponding category
          for (const license of userHistory.licenseClasses) {
            expect(availableCategories).toContain(license.category);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6f: Highest license level is correctly identified', async () => {
    await fc.assert(
      fc.asyncProperty(
        userHistoryArb,
        categoryArb,
        async (userHistory, category) => {
          const highestLevel = licenseFilter.getHighestLicenseLevel(userHistory, category);
          const userLicensesInCategory = userHistory.licenseClasses.filter(
            license => license.category === category
          );

          if (userLicensesInCategory.length > 0) {
            // Should return the highest license level in this category
            const expectedHighest = userLicensesInCategory.reduce((highest, current) => {
              return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
            });

            expect(highestLevel).toBe(expectedHighest.level);
          } else {
            expect(highestLevel).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});