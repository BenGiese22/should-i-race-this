/**
 * Property-Based Tests for Primary Category Detection
 * Feature: recommendations-analytics-integration, Property 8: Primary Category Detection
 * Validates: Requirements 9.1, 9.2
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fc from 'fast-check';
import { CategoryAnalyzer, type CategoryAnalysis, type CategoryDistribution } from '../category-analyzer';
import type { Category } from '../types';

// Mock the database
jest.mock('../../db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
}));

// Mock the schema
jest.mock('../../db/schema', () => ({
  raceResults: {
    userId: 'userId',
    seriesId: 'seriesId',
    trackId: 'trackId',
    seasonYear: 'seasonYear',
    seasonQuarter: 'seasonQuarter',
    raceWeekNum: 'raceWeekNum',
    sessionType: 'sessionType',
  },
  scheduleEntries: {
    category: 'category',
    seriesId: 'seriesId',
    trackId: 'trackId',
    seasonYear: 'seasonYear',
    seasonQuarter: 'seasonQuarter',
    raceWeekNum: 'raceWeekNum',
  },
}));

import { db } from '../../db';

const mockDb = db as any;

// Test data generators
const categoryArb = fc.constantFrom('oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road') as fc.Arbitrary<Category>;

const categoryDistributionArb = fc.record({
  sports_car: fc.integer({ min: 0, max: 100 }),
  formula_car: fc.integer({ min: 0, max: 100 }),
  oval: fc.integer({ min: 0, max: 100 }),
  dirt_road: fc.integer({ min: 0, max: 100 }),
  dirt_oval: fc.integer({ min: 0, max: 100 }),
}).map(dist => ({
  ...dist,
  total: dist.sports_car + dist.formula_car + dist.oval + dist.dirt_road + dist.dirt_oval
}));

const raceResultArb = fc.record({
  category: categoryArb,
  raceCount: fc.integer({ min: 1, max: 50 }),
});

describe('Primary Category Detection Properties', () => {
  const categoryAnalyzer = new CategoryAnalyzer();

  beforeAll(() => {
    // Setup default mocks with proper chaining
    const mockGroupBy = jest.fn().mockResolvedValue([]);
    const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
    const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    
    mockDb.select.mockReturnValue({ from: mockFrom });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 8: Primary Category Detection
   * For any user with 70%+ races in one category, the system should identify that 
   * as their primary category and default to it
   */
  test('Property 8a: 70% threshold detection for primary category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryDistributionArb,
        async (userId, distribution) => {
          // Setup mock to return the distribution data
          const mockResults = Object.entries(distribution)
            .filter(([key, count]) => key !== 'total' && count > 0)
            .map(([category, count]) => ({ category, raceCount: count }));

          const mockGroupBy = jest.fn().mockResolvedValue(mockResults);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          // Call the analyzer
          const result = await categoryAnalyzer.detectPrimaryCategory(userId);

          // Verify result structure
          expect(result).toHaveProperty('primaryCategory');
          expect(result).toHaveProperty('confidence');
          expect(result).toHaveProperty('raceDistribution');
          expect(['sports_car', 'formula_car', 'oval', 'dirt_road', 'dirt_oval']).toContain(result.primaryCategory);
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);

          // Test the 70% threshold logic
          if (distribution.total === 0) {
            // Should default to sports_car when no data
            expect(result.primaryCategory).toBe('sports_car');
            expect(result.confidence).toBe(0);
          } else {
            const sportsCarPercentage = distribution.sports_car / distribution.total;
            const formulaCarPercentage = distribution.formula_car / distribution.total;
            const ovalPercentage = distribution.oval / distribution.total;
            const dirtRoadPercentage = distribution.dirt_road / distribution.total;
            const dirtOvalPercentage = distribution.dirt_oval / distribution.total;

            // Check 70% threshold logic
            if (sportsCarPercentage >= 0.7) {
              expect(result.primaryCategory).toBe('sports_car');
              expect(result.confidence).toBeCloseTo(sportsCarPercentage, 5);
            } else if (formulaCarPercentage >= 0.7) {
              expect(result.primaryCategory).toBe('formula_car');
              expect(result.confidence).toBeCloseTo(formulaCarPercentage, 5);
            } else if (ovalPercentage >= 0.7) {
              expect(result.primaryCategory).toBe('oval');
              expect(result.confidence).toBeCloseTo(ovalPercentage, 5);
            } else if (dirtRoadPercentage >= 0.7) {
              expect(result.primaryCategory).toBe('dirt_road');
              expect(result.confidence).toBeCloseTo(dirtRoadPercentage, 5);
            } else if (dirtOvalPercentage >= 0.7) {
              expect(result.primaryCategory).toBe('dirt_oval');
              expect(result.confidence).toBeCloseTo(dirtOvalPercentage, 5);
            } else {
              // Should be the category with most races
              const maxCount = Math.max(
                distribution.sports_car,
                distribution.formula_car,
                distribution.oval,
                distribution.dirt_road,
                distribution.dirt_oval
              );

              if (maxCount > 0) {
                let expectedCategory: Category;
                let expectedConfidence: number;

                if (distribution.sports_car === maxCount) {
                  expectedCategory = 'sports_car';
                  expectedConfidence = sportsCarPercentage;
                } else if (distribution.formula_car === maxCount) {
                  expectedCategory = 'formula_car';
                  expectedConfidence = formulaCarPercentage;
                } else if (distribution.oval === maxCount) {
                  expectedCategory = 'oval';
                  expectedConfidence = ovalPercentage;
                } else if (distribution.dirt_road === maxCount) {
                  expectedCategory = 'dirt_road';
                  expectedConfidence = dirtRoadPercentage;
                } else {
                  expectedCategory = 'dirt_oval';
                  expectedConfidence = dirtOvalPercentage;
                }

                expect(result.primaryCategory).toBe(expectedCategory);
                expect(result.confidence).toBeCloseTo(expectedConfidence, 5);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8b: Category distribution calculation is accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(raceResultArb, { minLength: 0, maxLength: 20 }),
        async (userId, raceResults) => {
          // Simulate database aggregation behavior - group by category and sum counts
          const aggregatedResults = new Map<Category, number>();
          raceResults.forEach(result => {
            const currentCount = aggregatedResults.get(result.category) || 0;
            aggregatedResults.set(result.category, currentCount + result.raceCount);
          });

          // Convert to the format that the database would return
          const mockDbResults = Array.from(aggregatedResults.entries()).map(([category, raceCount]) => ({
            category,
            raceCount
          }));

          // Setup mock to return the aggregated results
          const mockGroupBy = jest.fn().mockResolvedValue(mockDbResults);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          // Call the analyzer
          const distribution = await categoryAnalyzer.getCategoryDistribution(userId);

          // Calculate expected distribution
          const expected: CategoryDistribution = {
            sports_car: 0,
            formula_car: 0,
            oval: 0,
            dirt_road: 0,
            dirt_oval: 0,
            total: 0
          };

          // Aggregate race counts by category (handle duplicates)
          const categoryTotals = new Map<Category, number>();
          raceResults.forEach(result => {
            const currentCount = categoryTotals.get(result.category) || 0;
            categoryTotals.set(result.category, currentCount + result.raceCount);
          });

          // Convert to expected format
          categoryTotals.forEach((count, category) => {
            if (category in expected) {
              expected[category] = count;
              expected.total += count;
            }
          });

          // Verify the distribution matches expected values
          expect(distribution.sports_car).toBe(expected.sports_car);
          expect(distribution.formula_car).toBe(expected.formula_car);
          expect(distribution.oval).toBe(expected.oval);
          expect(distribution.dirt_road).toBe(expected.dirt_road);
          expect(distribution.dirt_oval).toBe(expected.dirt_oval);
          expect(distribution.total).toBe(expected.total);

          // Verify total is sum of all categories
          expect(distribution.total).toBe(
            distribution.sports_car + distribution.formula_car + distribution.oval + 
            distribution.dirt_road + distribution.dirt_oval
          );

          // Verify all counts are non-negative
          expect(distribution.sports_car).toBeGreaterThanOrEqual(0);
          expect(distribution.formula_car).toBeGreaterThanOrEqual(0);
          expect(distribution.oval).toBeGreaterThanOrEqual(0);
          expect(distribution.dirt_road).toBeGreaterThanOrEqual(0);
          expect(distribution.dirt_oval).toBeGreaterThanOrEqual(0);
          expect(distribution.total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8c: Primary category is always the most frequent when no 70% threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          sports_car: fc.integer({ min: 1, max: 30 }),
          formula_car: fc.integer({ min: 1, max: 30 }),
          oval: fc.integer({ min: 1, max: 30 }),
          dirt_road: fc.integer({ min: 1, max: 30 }),
          dirt_oval: fc.integer({ min: 1, max: 30 }),
        }).filter(dist => {
          // Ensure no category has 70%+ to test fallback logic
          const total = dist.sports_car + dist.formula_car + dist.oval + dist.dirt_road + dist.dirt_oval;
          return (
            dist.sports_car / total < 0.7 &&
            dist.formula_car / total < 0.7 &&
            dist.oval / total < 0.7 &&
            dist.dirt_road / total < 0.7 &&
            dist.dirt_oval / total < 0.7
          );
        }),
        async (userId, distribution) => {
          const total = distribution.sports_car + distribution.formula_car + distribution.oval + distribution.dirt_road + distribution.dirt_oval;
          
          // Setup mock to return the distribution data
          const mockResults = Object.entries(distribution)
            .map(([category, count]) => ({ category, raceCount: count }));

          const mockGroupBy = jest.fn().mockResolvedValue(mockResults);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          // Call the analyzer
          const result = await categoryAnalyzer.detectPrimaryCategory(userId);

          // Find the category with the most races
          const maxCount = Math.max(
            distribution.sports_car,
            distribution.formula_car,
            distribution.oval,
            distribution.dirt_road,
            distribution.dirt_oval
          );

          // The primary category should be one of the categories with max count
          const categoriesWithMaxCount = Object.entries(distribution)
            .filter(([, count]) => count === maxCount)
            .map(([category]) => category as Category);

          expect(categoriesWithMaxCount).toContain(result.primaryCategory);

          // Confidence should be the percentage of the primary category
          const expectedConfidence = distribution[result.primaryCategory] / total;
          expect(result.confidence).toBeCloseTo(expectedConfidence, 5);
          expect(result.confidence).toBeLessThan(0.7); // Since we filtered out 70%+ cases
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8d: Confidence level reflects actual percentage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryDistributionArb.filter(dist => dist.total > 0),
        async (userId, distribution) => {
          // Setup mock to return the distribution data
          const mockResults = Object.entries(distribution)
            .filter(([key, count]) => key !== 'total' && count > 0)
            .map(([category, count]) => ({ category, raceCount: count }));

          const mockGroupBy = jest.fn().mockResolvedValue(mockResults);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          // Call the analyzer
          const result = await categoryAnalyzer.detectPrimaryCategory(userId);

          // Calculate expected confidence (percentage of primary category)
          const primaryCategoryCount = distribution[result.primaryCategory];
          const expectedConfidence = primaryCategoryCount / distribution.total;

          expect(result.confidence).toBeCloseTo(expectedConfidence, 5);
          expect(result.confidence).toBeGreaterThan(0);
          expect(result.confidence).toBeLessThanOrEqual(1);

          // Verify that confidence represents the actual percentage
          expect(Math.abs(result.confidence - expectedConfidence)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8e: Edge cases handled correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Test with empty race data
          const mockGroupBy = jest.fn().mockResolvedValue([]);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          const result = await categoryAnalyzer.detectPrimaryCategory(userId);

          // Should default to sports_car with 0 confidence when no data
          expect(result.primaryCategory).toBe('sports_car');
          expect(result.confidence).toBe(0);
          expect(result.raceDistribution.total).toBe(0);
          expect(result.raceDistribution.sports_car).toBe(0);
          expect(result.raceDistribution.formula_car).toBe(0);
          expect(result.raceDistribution.oval).toBe(0);
          expect(result.raceDistribution.dirt_road).toBe(0);
          expect(result.raceDistribution.dirt_oval).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8f: All valid categories are supported', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryArb,
        fc.integer({ min: 10, max: 100 }),
        async (userId, dominantCategory, raceCount) => {
          // Create a distribution where one category has 80% (above 70% threshold)
          const otherCount = Math.floor(raceCount * 0.2 / 3); // Distribute remaining 20% among other categories
          const dominantCount = raceCount - (otherCount * 3);

          const mockResults = [
            { category: dominantCategory, raceCount: dominantCount },
            ...(dominantCategory !== 'sports_car' ? [{ category: 'sports_car', raceCount: otherCount }] : []),
            ...(dominantCategory !== 'formula_car' ? [{ category: 'formula_car', raceCount: otherCount }] : []),
            ...(dominantCategory !== 'oval' ? [{ category: 'oval', raceCount: otherCount }] : []),
            ...(dominantCategory !== 'dirt_road' ? [{ category: 'dirt_road', raceCount: otherCount }] : []),
            ...(dominantCategory !== 'dirt_oval' ? [{ category: 'dirt_oval', raceCount: otherCount }] : []),
          ].filter(result => result.raceCount > 0);

          const mockGroupBy = jest.fn().mockResolvedValue(mockResults);
          const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy });
          const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
          const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
          mockDb.select.mockReturnValue({ from: mockFrom });

          const result = await categoryAnalyzer.detectPrimaryCategory(userId);

          // Should detect the dominant category as primary
          expect(result.primaryCategory).toBe(dominantCategory);
          expect(result.confidence).toBeGreaterThan(0.7);

          // Verify all categories are valid
          expect(['sports_car', 'formula_car', 'oval', 'dirt_road', 'dirt_oval']).toContain(result.primaryCategory);
        }
      ),
      { numRuns: 100 }
    );
  });
});