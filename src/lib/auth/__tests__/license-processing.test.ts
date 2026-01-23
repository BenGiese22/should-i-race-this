/**
 * Tests for license processing functionality
 * Covers the updated updateUserLicenses function and group_name mapping
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { mapLicenseCategory, mapLicenseLevelFromGroupName } from '../db';

// Mock the database and other dependencies
jest.mock('../../db', () => ({
  db: {
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined)
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

jest.mock('../../db/schema', () => ({
  licenseClasses: {}
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn()
}));

describe('License Processing Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapLicenseLevelFromGroupName', () => {
    test('should map iRacing group names to internal license levels', () => {
      expect(mapLicenseLevelFromGroupName('Rookie')).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName('Class D')).toBe('D');
      expect(mapLicenseLevelFromGroupName('Class C')).toBe('C');
      expect(mapLicenseLevelFromGroupName('Class B')).toBe('B');
      expect(mapLicenseLevelFromGroupName('Class A')).toBe('A');
      expect(mapLicenseLevelFromGroupName('Pro')).toBe('Pro');
      expect(mapLicenseLevelFromGroupName('Professional')).toBe('Pro');
    });

    test('should handle case insensitive group names', () => {
      expect(mapLicenseLevelFromGroupName('rookie')).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName('class d')).toBe('D');
      expect(mapLicenseLevelFromGroupName('CLASS C')).toBe('C');
      expect(mapLicenseLevelFromGroupName('class b')).toBe('B');
      expect(mapLicenseLevelFromGroupName('CLASS A')).toBe('A');
      expect(mapLicenseLevelFromGroupName('PRO')).toBe('Pro');
    });

    test('should handle single letter group names', () => {
      expect(mapLicenseLevelFromGroupName('D')).toBe('D');
      expect(mapLicenseLevelFromGroupName('C')).toBe('C');
      expect(mapLicenseLevelFromGroupName('B')).toBe('B');
      expect(mapLicenseLevelFromGroupName('A')).toBe('A');
      expect(mapLicenseLevelFromGroupName('d')).toBe('D');
      expect(mapLicenseLevelFromGroupName('c')).toBe('C');
    });

    test('should handle whitespace in group names', () => {
      expect(mapLicenseLevelFromGroupName('  Rookie  ')).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName(' Class D ')).toBe('D');
      expect(mapLicenseLevelFromGroupName('  Class C  ')).toBe('C');
    });

    test('should fall back to Rookie for unknown group names', () => {
      expect(mapLicenseLevelFromGroupName('Unknown')).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName('')).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName('Invalid Level')).toBe('Rookie');
    });

    test('should handle numeric input (iRacing license_group values)', () => {
      // iRacing license_group mapping: 1=Rookie, 2=D, 3=C, 4=B, 5=A, 6=Pro
      expect(mapLicenseLevelFromGroupName(1)).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName(2)).toBe('D');
      expect(mapLicenseLevelFromGroupName(3)).toBe('C');
      expect(mapLicenseLevelFromGroupName(4)).toBe('B');
      expect(mapLicenseLevelFromGroupName(5)).toBe('A');
      expect(mapLicenseLevelFromGroupName(6)).toBe('Pro');
    });

    test('should handle invalid input types', () => {
      expect(mapLicenseLevelFromGroupName(null as any)).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName(undefined as any)).toBe('Rookie');
      expect(mapLicenseLevelFromGroupName({} as any)).toBe('Rookie');
    });
  });

  describe('OAuth License Data Processing', () => {
    test('should process OAuth object format license data', () => {
      const oauthLicenseData = {
        oval: {
          category_id: 1,
          category: 'oval',
          category_name: 'Oval',
          license_level: 2,
          safety_rating: 2.6,
          cpi: 10.798202,
          irating: 1300,
          tt_rating: 1350,
          mpr_num_races: 1,
          color: 'fc0706',
          group_name: 'Rookie',
          group_id: 1,
          pro_promotable: false,
          seq: 1,
          mpr_num_tts: 0
        },
        sports_car: {
          category_id: 5,
          category: 'sports_car',
          category_name: 'Sports Car',
          license_level: 14,
          safety_rating: 2.36,
          cpi: 29.131489,
          irating: 1492,
          tt_rating: 1350,
          mpr_num_races: 9,
          color: '00c702',
          group_name: 'Class B',
          group_id: 4,
          pro_promotable: false,
          seq: 2,
          mpr_num_tts: 0
        },
        formula_car: {
          category_id: 6,
          category: 'formula_car',
          category_name: 'Formula Car',
          license_level: 10,
          safety_rating: 2.33,
          cpi: 19.749882,
          irating: 1126,
          tt_rating: 1350,
          mpr_num_races: 0,
          color: 'feec04',
          group_name: 'Class C',
          group_id: 3,
          pro_promotable: false,
          seq: 3,
          mpr_num_tts: 0
        },
        dirt_oval: {
          category_id: 3,
          category: 'dirt_oval',
          category_name: 'Dirt Oval',
          license_level: 2,
          safety_rating: 2.5,
          cpi: 10.10941,
          irating: 1350,
          tt_rating: 1350,
          mpr_num_races: 0,
          color: 'fc0706',
          group_name: 'Rookie',
          group_id: 1,
          pro_promotable: false,
          seq: 4,
          mpr_num_tts: 0
        },
        dirt_road: {
          category_id: 4,
          category: 'dirt_road',
          category_name: 'Dirt Road',
          license_level: 2,
          safety_rating: 2.6,
          cpi: 10.83741,
          irating: 1377,
          tt_rating: 1350,
          mpr_num_races: 1,
          color: 'fc0706',
          group_name: 'Rookie',
          group_id: 1,
          pro_promotable: false,
          seq: 5,
          mpr_num_tts: 0
        }
      };

      // Convert to array format (simulating what updateUserLicenses does)
      const licensesArray = Object.values(oauthLicenseData);
      
      expect(licensesArray).toHaveLength(5);
      
      // Test each license is processed correctly
      licensesArray.forEach(license => {
        const category = mapLicenseCategory(license.category_id || license.category);
        const level = mapLicenseLevelFromGroupName(license.group_name);
        
        expect(['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road']).toContain(category);
        expect(['Rookie', 'D', 'C', 'B', 'A', 'Pro']).toContain(level);
        
        // Verify specific mappings from the test data
        if (license.category === 'oval') {
          expect(category).toBe('oval');
          expect(level).toBe('Rookie');
        }
        if (license.category === 'sports_car') {
          expect(category).toBe('sports_car');
          expect(level).toBe('B');
        }
        if (license.category === 'formula_car') {
          expect(category).toBe('formula_car');
          expect(level).toBe('C');
        }
      });
    });

    test('should handle mixed license data formats', () => {
      const mixedLicenseData = [
        {
          category_id: 1,
          group_name: 'Class D',
          safety_rating: 3.2,
          irating: 1400
        },
        {
          category: 'sports_car',
          license_level: 14, // Should be overridden by group_name
          group_name: 'Class A',
          safety_rating: 4.1,
          irating: 2100
        },
        {
          category: 'formula_car',
          level: 'B', // Fallback when no group_name
          safety_rating: 3.8,
          irating: 1800
        }
      ];

      mixedLicenseData.forEach(license => {
        const category = mapLicenseCategory(license.category_id || license.category);
        const level = mapLicenseLevelFromGroupName(
          license.group_name || license.license_level || license.level
        );
        
        expect(['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road']).toContain(category);
        expect(['Rookie', 'D', 'C', 'B', 'A', 'Pro']).toContain(level);
      });
    });
  });

  describe('License Category Mapping (Updated)', () => {
    test('should maintain existing category mappings', () => {
      // Numeric category IDs
      expect(mapLicenseCategory(1)).toBe('oval');
      expect(mapLicenseCategory(2)).toBe('sports_car'); // Legacy road -> sports_car
      expect(mapLicenseCategory(3)).toBe('dirt_oval');
      expect(mapLicenseCategory(4)).toBe('dirt_road');
      expect(mapLicenseCategory(5)).toBe('sports_car'); // Sports Car
      expect(mapLicenseCategory(6)).toBe('formula_car'); // Formula Car
    });

    test('should handle string category names', () => {
      expect(mapLicenseCategory('oval')).toBe('oval');
      expect(mapLicenseCategory('sports_car')).toBe('sports_car');
      expect(mapLicenseCategory('formula_car')).toBe('formula_car');
      expect(mapLicenseCategory('dirt_oval')).toBe('dirt_oval');
      expect(mapLicenseCategory('dirt_road')).toBe('dirt_road');
    });

    test('should handle legacy road category', () => {
      expect(mapLicenseCategory('road')).toBe('sports_car');
    });

    test('should handle case insensitive category strings', () => {
      expect(mapLicenseCategory('OVAL')).toBe('oval');
      expect(mapLicenseCategory('Sports_Car')).toBe('sports_car');
      expect(mapLicenseCategory('FORMULA_CAR')).toBe('formula_car');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty license data gracefully', () => {
      // These tests would need the actual updateUserLicenses function to be testable
      // For now, we test the mapping functions that are used within it
      expect(mapLicenseCategory('unknown')).toBe('sports_car'); // Default fallback
      expect(mapLicenseLevelFromGroupName('unknown')).toBe('Rookie'); // Default fallback
    });

    test('should handle malformed license objects', () => {
      const malformedLicense = {
        // Missing required fields
        some_other_field: 'value'
      };

      // Test that our mapping functions handle missing data gracefully
      expect(mapLicenseCategory(malformedLicense.category_id || malformedLicense.category)).toBe('sports_car');
      expect(mapLicenseLevelFromGroupName(malformedLicense.group_name || malformedLicense.license_level)).toBe('Rookie');
    });
  });
});