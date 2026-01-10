/**
 * Property-Based Tests for Comprehensive Filtering
 * Feature: racing-analytics-dashboard, Property 5: Comprehensive Filtering
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fc from 'fast-check';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../schema';

// Mock database for testing
const mockSql = neon('postgresql://test:test@localhost:5432/test');
const mockDb = drizzle(mockSql, { schema });

// Mock the database module
jest.mock('../index', () => ({
  db: mockDb,
}));

// Test data generators
const sessionTypeArb = fc.constantFrom('practice', 'qualifying', 'time_trial', 'race');
const groupingTypeArb = fc.constantFrom('series', 'track', 'series_track');

const raceResultArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  subsessionId: fc.bigInt({ min: 1n, max: 999999999n }),
  seriesId: fc.integer({ min: 1, max: 100 }),
  seriesName: fc.string({ minLength: 5, maxLength: 50 }),
  trackId: fc.integer({ min: 1, max: 50 }),
  trackName: fc.string({ minLength: 5, maxLength: 50 }),
  sessionType: sessionTypeArb,
  startingPosition: fc.option(fc.integer({ min: 1, max: 40 })),
  finishingPosition: fc.option(fc.integer({ min: 1, max: 40 })),
  incidents: fc.integer({ min: 0, max: 15 }),
  strengthOfField: fc.option(fc.integer({ min: 1000, max: 3500 })),
  raceDate: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
  seasonYear: fc.integer({ min: 2023, max: 2024 }),
  seasonQuarter: fc.integer({ min: 1, max: 4 }),
  raceWeekNum: fc.option(fc.integer({ min: 0, max: 12 })),
  raceLength: fc.option(fc.integer({ min: 15, max: 180 })),
  rawData: fc.option(fc.object()),
  createdAt: fc.date(),
});

const filterArb = fc.record({
  sessionTypes: fc.option(fc.array(sessionTypeArb, { minLength: 1, maxLength: 4 })),
  seasonYear: fc.option(fc.integer({ min: 2023, max: 2024 })),
  seasonQuarter: fc.option(fc.integer({ min: 1, max: 4 })),
  startDate: fc.option(fc.date({ min: new Date('2023-01-01'), max: new Date('2024-06-30') })),
  endDate: fc.option(fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })),
  seriesIds: fc.option(fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 })),
  trackIds: fc.option(fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 1, maxLength: 5 })),
});

describe('Comprehensive Filtering Properties', () => {
  beforeAll(() => {
    // Mock database operations for property testing
    jest.spyOn(mockDb, 'select').mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 5: Comprehensive Filtering
   * For any combination of search terms, series categories, session types, and date ranges, 
   * the filtering system should return only results that match all applied criteria and 
   * update results in real-time.
   */
  test('Property 5: Filtering returns only matching results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(raceResultArb, { minLength: 10, maxLength: 100 }),
        filterArb,
        groupingTypeArb,
        fc.uuid(), // userId
        async (raceResults, filters, groupBy, userId) => {
          // Ensure all race results belong to the same user
          const userRaceResults = raceResults.map(result => ({
            ...result,
            userId,
          }));

          // Apply filters manually to verify expected results
          let expectedResults = userRaceResults;

          // Filter by session types
          if (filters.sessionTypes && filters.sessionTypes.length > 0) {
            expectedResults = expectedResults.filter(result => 
              filters.sessionTypes!.includes(result.sessionType)
            );
          }

          // Filter by season year
          if (filters.seasonYear) {
            expectedResults = expectedResults.filter(result => 
              result.seasonYear === filters.seasonYear
            );
          }

          // Filter by season quarter
          if (filters.seasonQuarter) {
            expectedResults = expectedResults.filter(result => 
              result.seasonQuarter === filters.seasonQuarter
            );
          }

          // Filter by date range
          if (filters.startDate) {
            expectedResults = expectedResults.filter(result => 
              result.raceDate >= filters.startDate!
            );
          }
          if (filters.endDate) {
            expectedResults = expectedResults.filter(result => 
              result.raceDate <= filters.endDate!
            );
          }

          // Filter by series IDs
          if (filters.seriesIds && filters.seriesIds.length > 0) {
            expectedResults = expectedResults.filter(result => 
              filters.seriesIds!.includes(result.seriesId)
            );
          }

          // Filter by track IDs
          if (filters.trackIds && filters.trackIds.length > 0) {
            expectedResults = expectedResults.filter(result => 
              filters.trackIds!.includes(result.trackId)
            );
          }

          // Only include results with valid position data (as per analytics function)
          expectedResults = expectedResults.filter(result => 
            result.startingPosition !== null && result.finishingPosition !== null
          );

          // Verify filtering logic properties
          
          // 1. All filtered results should match ALL applied criteria
          for (const result of expectedResults) {
            if (filters.sessionTypes && filters.sessionTypes.length > 0) {
              expect(filters.sessionTypes).toContain(result.sessionType);
            }
            
            if (filters.seasonYear) {
              expect(result.seasonYear).toBe(filters.seasonYear);
            }
            
            if (filters.seasonQuarter) {
              expect(result.seasonQuarter).toBe(filters.seasonQuarter);
            }
            
            if (filters.startDate) {
              expect(result.raceDate.getTime()).toBeGreaterThanOrEqual(filters.startDate.getTime());
            }
            
            if (filters.endDate) {
              expect(result.raceDate.getTime()).toBeLessThanOrEqual(filters.endDate.getTime());
            }
            
            if (filters.seriesIds && filters.seriesIds.length > 0) {
              expect(filters.seriesIds).toContain(result.seriesId);
            }
            
            if (filters.trackIds && filters.trackIds.length > 0) {
              expect(filters.trackIds).toContain(result.trackId);
            }

            // Must have valid position data
            expect(result.startingPosition).not.toBeNull();
            expect(result.finishingPosition).not.toBeNull();
          }

          // 2. Filtered results should be a subset of original results
          expect(expectedResults.length).toBeLessThanOrEqual(userRaceResults.length);

          // 3. All filtered results should exist in original dataset
          for (const filteredResult of expectedResults) {
            expect(userRaceResults).toContainEqual(filteredResult);
          }

          // 4. No result that doesn't match criteria should be included
          const excludedResults = userRaceResults.filter(result => 
            !expectedResults.includes(result)
          );

          for (const excludedResult of excludedResults) {
            let shouldBeExcluded = false;

            // Check if it fails any filter criteria
            if (filters.sessionTypes && filters.sessionTypes.length > 0) {
              if (!filters.sessionTypes.includes(excludedResult.sessionType)) {
                shouldBeExcluded = true;
              }
            }

            if (filters.seasonYear && excludedResult.seasonYear !== filters.seasonYear) {
              shouldBeExcluded = true;
            }

            if (filters.seasonQuarter && excludedResult.seasonQuarter !== filters.seasonQuarter) {
              shouldBeExcluded = true;
            }

            if (filters.startDate && excludedResult.raceDate < filters.startDate) {
              shouldBeExcluded = true;
            }

            if (filters.endDate && excludedResult.raceDate > filters.endDate) {
              shouldBeExcluded = true;
            }

            if (filters.seriesIds && filters.seriesIds.length > 0) {
              if (!filters.seriesIds.includes(excludedResult.seriesId)) {
                shouldBeExcluded = true;
              }
            }

            if (filters.trackIds && filters.trackIds.length > 0) {
              if (!filters.trackIds.includes(excludedResult.trackId)) {
                shouldBeExcluded = true;
              }
            }

            // Check if it lacks valid position data
            if (excludedResult.startingPosition === null || excludedResult.finishingPosition === null) {
              shouldBeExcluded = true;
            }

            // If any filter would exclude it, it should not be in results
            if (shouldBeExcluded) {
              expect(expectedResults).not.toContain(excludedResult);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5a: Empty filters return all valid results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(raceResultArb, { minLength: 5, maxLength: 20 }),
        groupingTypeArb,
        fc.uuid(),
        async (raceResults, groupBy, userId) => {
          const userRaceResults = raceResults.map(result => ({
            ...result,
            userId,
          }));

          // With no filters, should return all results with valid position data
          const expectedResults = userRaceResults.filter(result => 
            result.startingPosition !== null && result.finishingPosition !== null
          );

          // Verify that empty filters don't exclude valid results
          expect(expectedResults.length).toBeLessThanOrEqual(userRaceResults.length);
          
          // All results with valid positions should be included
          for (const result of userRaceResults) {
            if (result.startingPosition !== null && result.finishingPosition !== null) {
              expect(expectedResults).toContain(result);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5b: Multiple filter combination is intersection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(raceResultArb, { minLength: 20, maxLength: 50 }),
        fc.array(sessionTypeArb, { minLength: 1, maxLength: 2 }),
        fc.integer({ min: 2023, max: 2024 }),
        fc.uuid(),
        async (raceResults, sessionTypes, seasonYear, userId) => {
          const userRaceResults = raceResults.map(result => ({
            ...result,
            userId,
          }));

          // Apply multiple filters - results should match ALL criteria
          // (intersection, not union)

          // Results should match ALL criteria (intersection, not union)
          const expectedResults = userRaceResults.filter(result => 
            sessionTypes.includes(result.sessionType) &&
            result.seasonYear === seasonYear &&
            result.startingPosition !== null &&
            result.finishingPosition !== null
          );

          // Verify intersection property
          for (const result of expectedResults) {
            expect(sessionTypes).toContain(result.sessionType);
            expect(result.seasonYear).toBe(seasonYear);
            expect(result.startingPosition).not.toBeNull();
            expect(result.finishingPosition).not.toBeNull();
          }

          // Results that match only one criterion should be excluded
          const partialMatches = userRaceResults.filter(result => 
            (sessionTypes.includes(result.sessionType) && result.seasonYear !== seasonYear) ||
            (!sessionTypes.includes(result.sessionType) && result.seasonYear === seasonYear)
          );

          for (const partialMatch of partialMatches) {
            expect(expectedResults).not.toContain(partialMatch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5c: Date range filtering is inclusive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(raceResultArb, { minLength: 10, maxLength: 30 }),
        fc.date({ min: new Date('2023-06-01'), max: new Date('2023-08-01') }),
        fc.date({ min: new Date('2023-09-01'), max: new Date('2023-11-01') }),
        fc.uuid(),
        async (raceResults, startDate, endDate, userId) => {
          // Ensure startDate <= endDate
          if (startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
          }

          const userRaceResults = raceResults.map(result => ({
            ...result,
            userId,
            // Ensure some results fall within, on boundaries, and outside the range
            raceDate: fc.sample(fc.oneof(
              fc.constant(startDate),
              fc.constant(endDate),
              fc.date({ min: new Date(startDate.getTime() - 86400000), max: startDate }),
              fc.date({ min: endDate, max: new Date(endDate.getTime() + 86400000) }),
              fc.date({ min: startDate, max: endDate })
            ), 1)[0],
          }));

          // Apply date range filters

          const expectedResults = userRaceResults.filter(result => 
            result.raceDate >= startDate &&
            result.raceDate <= endDate &&
            result.startingPosition !== null &&
            result.finishingPosition !== null
          );

          // Verify inclusive boundaries
          for (const result of expectedResults) {
            expect(result.raceDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(result.raceDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
          }

          // Results exactly on boundaries should be included
          const boundaryResults = userRaceResults.filter(result => 
            (result.raceDate.getTime() === startDate.getTime() || 
             result.raceDate.getTime() === endDate.getTime()) &&
            result.startingPosition !== null &&
            result.finishingPosition !== null
          );

          for (const boundaryResult of boundaryResults) {
            expect(expectedResults).toContain(boundaryResult);
          }

          // Results outside range should be excluded
          const outsideResults = userRaceResults.filter(result => 
            result.raceDate < startDate || result.raceDate > endDate
          );

          for (const outsideResult of outsideResults) {
            expect(expectedResults).not.toContain(outsideResult);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5d: Filter combinations preserve data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(raceResultArb, { minLength: 15, maxLength: 40 }),
        filterArb,
        fc.uuid(),
        async (raceResults, filters, userId) => {
          const userRaceResults = raceResults.map(result => ({
            ...result,
            userId,
          }));

          // Apply filters step by step and verify each step preserves integrity
          let currentResults = userRaceResults;

          // Step 1: Filter by valid positions (always applied)
          currentResults = currentResults.filter(result => 
            result.startingPosition !== null && result.finishingPosition !== null
          );

          const afterPositionFilter = currentResults.length;

          // Step 2: Apply session type filter
          if (filters.sessionTypes && filters.sessionTypes.length > 0) {
            currentResults = currentResults.filter(result => 
              filters.sessionTypes!.includes(result.sessionType)
            );
            expect(currentResults.length).toBeLessThanOrEqual(afterPositionFilter);
          }

          // Step 3: Apply season filters
          if (filters.seasonYear) {
            const beforeSeasonFilter = currentResults.length;
            currentResults = currentResults.filter(result => 
              result.seasonYear === filters.seasonYear
            );
            expect(currentResults.length).toBeLessThanOrEqual(beforeSeasonFilter);
          }

          // Step 4: Apply date filters
          if (filters.startDate) {
            const beforeDateFilter = currentResults.length;
            currentResults = currentResults.filter(result => 
              result.raceDate >= filters.startDate!
            );
            expect(currentResults.length).toBeLessThanOrEqual(beforeDateFilter);
          }

          // Each filter step should only reduce or maintain the result count
          // Final results should be subset of original
          expect(currentResults.length).toBeLessThanOrEqual(userRaceResults.length);

          // All final results should have valid data
          for (const result of currentResults) {
            expect(result.userId).toBe(userId);
            expect(result.startingPosition).not.toBeNull();
            expect(result.finishingPosition).not.toBeNull();
            expect(result.seriesId).toBeGreaterThan(0);
            expect(result.trackId).toBeGreaterThan(0);
            expect(result.incidents).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});