/**
 * Property-based tests for license category mapping
 * Feature: recommendations-refinements, Property 1: Five-Category License Recognition
 * Feature: recommendations-refinements, Property 2: License Category Preservation
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';

// Import the functions we need to test
import { mapLicenseCategory, mapLicenseLevelFromGroupName } from '../db';

describe('License Category Mapping Properties', () => {
  /**
   * Property 1: Five-Category License Recognition
   * For any license data from iRacing API containing all 5 categories (oval, sports_car, formula_car, dirt_oval, dirt_road), 
   * the License_System should correctly identify and process all 5 distinct categories without merging or losing any
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  test('Property 1: Five-Category License Recognition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, 2, 3, 4, 5, 6), // Valid iRacing category IDs
        (categoryId) => {
          const result = mapLicenseCategory(categoryId);
          
          // Should map to one of the 5 valid categories
          const validCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
          expect(validCategories).toContain(result);
          
          // Specific mappings should be preserved
          switch (categoryId) {
            case 1:
              expect(result).toBe('oval');
              break;
            case 2:
              expect(result).toBe('sports_car'); // Legacy road -> sports_car
              break;
            case 3:
              expect(result).toBe('dirt_oval');
              break;
            case 4:
              expect(result).toBe('dirt_road');
              break;
            case 5:
              expect(result).toBe('sports_car'); // Sports Car
              break;
            case 6:
              expect(result).toBe('formula_car'); // Formula Car
              break;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: License Category Preservation
   * For any license mapping operation, when provided with sports_car (category_id: 5) or formula_car (category_id: 6) data, 
   * the mapping function should preserve these as separate categories and not merge them into 'road'
   * **Validates: Requirements 8.2**
   */
  test('Property 2: License Category Preservation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(5, 6), // Sports Car and Formula Car category IDs
        (categoryId) => {
          const result = mapLicenseCategory(categoryId);
          
          // Should never return 'road' for sports_car or formula_car categories
          expect(result).not.toBe('road');
          
          // Should preserve as separate categories
          if (categoryId === 5) {
            expect(result).toBe('sports_car');
          } else if (categoryId === 6) {
            expect(result).toBe('formula_car');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: String category handling
   * For any string-based category input, the system should handle it correctly
   */
  test('Property: String Category Handling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road', 'road'),
        (categoryString) => {
          const result = mapLicenseCategory(categoryString);
          
          const validCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
          expect(validCategories).toContain(result);
          
          // Legacy 'road' should map to 'sports_car'
          if (categoryString === 'road') {
            expect(result).toBe('sports_car');
          } else {
            expect(result).toBe(categoryString);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Case insensitive handling
   * For any valid category string in different cases, should handle correctly
   */
  test('Property: Case Insensitive Category Handling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('OVAL', 'Sports_Car', 'FORMULA_CAR', 'Dirt_Oval', 'DIRT_ROAD'),
        (categoryString) => {
          const result = mapLicenseCategory(categoryString);
          
          const validCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
          expect(validCategories).toContain(result);
          
          // Should normalize to lowercase with underscores
          expect(result).toBe(categoryString.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Group Name License Level Mapping
   * For any valid iRacing group_name, should map to correct internal license level
   */
  test('Property: Group Name License Level Mapping', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Rookie', 'Class D', 'Class C', 'Class B', 'Class A', 'Pro', 'Professional'),
        (groupName) => {
          const result = mapLicenseLevelFromGroupName(groupName);
          
          const validLevels = ['Rookie', 'D', 'C', 'B', 'A', 'Pro'];
          expect(validLevels).toContain(result);
          
          // Specific mappings should be preserved
          switch (groupName) {
            case 'Rookie':
              expect(result).toBe('Rookie');
              break;
            case 'Class D':
              expect(result).toBe('D');
              break;
            case 'Class C':
              expect(result).toBe('C');
              break;
            case 'Class B':
              expect(result).toBe('B');
              break;
            case 'Class A':
              expect(result).toBe('A');
              break;
            case 'Pro':
            case 'Professional':
              expect(result).toBe('Pro');
              break;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Case Insensitive Group Name Handling
   * For any valid group name in different cases, should handle correctly
   */
  test('Property: Case Insensitive Group Name Handling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('rookie', 'CLASS D', 'class c', 'Class B', 'CLASS A', 'pro', 'PROFESSIONAL'),
        (groupName) => {
          const result = mapLicenseLevelFromGroupName(groupName);
          
          const validLevels = ['Rookie', 'D', 'C', 'B', 'A', 'Pro'];
          expect(validLevels).toContain(result);
          
          // Should handle case insensitively
          const normalized = groupName.toLowerCase().trim();
          if (normalized === 'rookie') {
            expect(result).toBe('Rookie');
          } else if (normalized === 'class d') {
            expect(result).toBe('D');
          } else if (normalized === 'class c') {
            expect(result).toBe('C');
          } else if (normalized === 'class b') {
            expect(result).toBe('B');
          } else if (normalized === 'class a') {
            expect(result).toBe('A');
          } else if (normalized === 'pro' || normalized === 'professional') {
            expect(result).toBe('Pro');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fallback Behavior for Invalid Group Names
   * For any invalid group name, should fall back to 'rookie'
   */
  test('Property: Fallback Behavior for Invalid Group Names', () => {
    // All valid license inputs that should NOT be considered invalid
    const validInputs = [
      'rookie', 'class d', 'class c', 'class b', 'class a', 'pro', 'professional',
      'd', 'c', 'b', 'a',
      // Numeric strings that map to valid license levels
      '1', '2', '3', '4', '5', '6'
    ];

    fc.assert(
      fc.property(
        fc.string().filter(s => !validInputs.includes(s.toLowerCase().trim())),
        (invalidGroupName) => {
          const result = mapLicenseLevelFromGroupName(invalidGroupName);
          expect(result).toBe('Rookie');
        }
      ),
      { numRuns: 100 }
    );
  });
});