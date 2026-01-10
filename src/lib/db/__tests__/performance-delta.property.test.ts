/**
 * Property-Based Tests for Performance Delta Calculation
 * Feature: racing-analytics-dashboard, Property 3: Performance Delta Calculation
 * Validates: Requirements 3.5, 4.8
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { calculatePositionDelta } from '../analytics';

describe('Performance Delta Calculation Properties', () => {
  /**
   * Property 3: Performance Delta Calculation
   * For any race result with valid starting and finishing positions, the system should 
   * calculate position delta as (starting position - finishing position), where positive 
   * values indicate improvement and negative values indicate decline.
   */
  test('Property 3: Position delta calculation with proper sign conventions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 60 }), // starting position
        fc.integer({ min: 1, max: 60 }), // finishing position
        async (startingPosition, finishingPosition) => {
          const delta = calculatePositionDelta(startingPosition, finishingPosition);
          
          // Delta should equal starting - finishing
          expect(delta).toBe(startingPosition - finishingPosition);
          
          // Positive delta means improvement (started lower, finished higher)
          if (delta! > 0) {
            expect(startingPosition).toBeGreaterThan(finishingPosition);
          }
          // Negative delta means decline (started higher, finished lower)
          else if (delta! < 0) {
            expect(startingPosition).toBeLessThan(finishingPosition);
          }
          // Zero delta means same position
          else {
            expect(startingPosition).toBe(finishingPosition);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3a: Delta calculation handles null values correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.integer({ min: 1, max: 60 })), // starting position (can be null)
        fc.option(fc.integer({ min: 1, max: 60 })), // finishing position (can be null)
        async (startingPosition, finishingPosition) => {
          const delta = calculatePositionDelta(startingPosition, finishingPosition);
          
          // If either position is null, delta should be null
          if (startingPosition === null || finishingPosition === null) {
            expect(delta).toBeNull();
          } else {
            // If both positions are valid, delta should be calculated
            expect(delta).toBe(startingPosition - finishingPosition);
            expect(delta).not.toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3b: Delta magnitude represents position change magnitude', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 60 }), // starting position
        fc.integer({ min: 1, max: 60 }), // finishing position
        async (startingPosition, finishingPosition) => {
          const delta = calculatePositionDelta(startingPosition, finishingPosition);
          
          // Absolute value of delta should equal the absolute difference in positions
          const expectedMagnitude = Math.abs(startingPosition - finishingPosition);
          expect(Math.abs(delta!)).toBe(expectedMagnitude);
          
          // Delta should be within valid range based on position constraints
          expect(delta!).toBeGreaterThanOrEqual(-59); // worst case: start 1st, finish 60th
          expect(delta!).toBeLessThanOrEqual(59);     // best case: start 60th, finish 1st
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3c: Delta calculation is commutative inverse', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 60 }), // position A
        fc.integer({ min: 1, max: 60 }), // position B
        async (positionA, positionB) => {
          const deltaAB = calculatePositionDelta(positionA, positionB);
          const deltaBA = calculatePositionDelta(positionB, positionA);
          
          // Delta from A to B should be the negative of delta from B to A
          // Handle JavaScript -0 vs 0 edge case by using strict equality check
          if (deltaAB === 0 && deltaBA === 0) {
            // Both deltas are zero (same position), which is correct
            expect(deltaAB).toBe(0);
            expect(deltaBA).toBe(0);
          } else {
            expect(deltaAB).toBe(-deltaBA!);
            expect(deltaBA).toBe(-deltaAB!);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3d: Delta preserves improvement/decline semantics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }), // starting position (middle range)
        fc.integer({ min: 1, max: 9 }),   // improvement amount
        async (startingPosition, improvementAmount) => {
          // Test improvement scenario
          const betterFinishingPosition = startingPosition - improvementAmount;
          const improvementDelta = calculatePositionDelta(startingPosition, betterFinishingPosition);
          
          // Improvement should result in positive delta
          expect(improvementDelta).toBeGreaterThan(0);
          expect(improvementDelta).toBe(improvementAmount);
          
          // Test decline scenario
          const worseFinishingPosition = startingPosition + improvementAmount;
          const declineDelta = calculatePositionDelta(startingPosition, worseFinishingPosition);
          
          // Decline should result in negative delta
          expect(declineDelta).toBeLessThan(0);
          expect(declineDelta).toBe(-improvementAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3e: Delta calculation consistency across data types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 1, max: 60 }),
        async (start, finish) => {
          // Test with different numeric representations
          const deltaInt = calculatePositionDelta(start, finish);
          const deltaFloat = calculatePositionDelta(parseFloat(start.toString()), parseFloat(finish.toString()));
          const deltaString = calculatePositionDelta(parseInt(start.toString()), parseInt(finish.toString()));
          
          // All should produce the same result
          expect(deltaInt).toBe(deltaFloat);
          expect(deltaInt).toBe(deltaString);
          expect(deltaFloat).toBe(deltaString);
          
          // Result should be an integer
          expect(Number.isInteger(deltaInt!)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});