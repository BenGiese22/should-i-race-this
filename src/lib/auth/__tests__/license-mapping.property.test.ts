/**
 * Property-based tests for license category mapping
 * Feature: recommendations-refinements, Property 1: Five-Category License Recognition
 * Feature: recommendations-refinements, Property 2: License Category Preservation
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';

// Import the function we need to test - we'll need to export it from db.ts
import { mapLicenseCategory } from '../db';

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
});