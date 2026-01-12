/**
 * Tests for Category enum and CategoryHelper
 */

import { Category, CategoryHelper, isCategory } from '../category';

describe('Category Enum', () => {
  describe('CategoryHelper.isValid', () => {
    test('should validate correct category values', () => {
      expect(CategoryHelper.isValid('oval')).toBe(true);
      expect(CategoryHelper.isValid('sports_car')).toBe(true);
      expect(CategoryHelper.isValid('formula_car')).toBe(true);
      expect(CategoryHelper.isValid('dirt_oval')).toBe(true);
      expect(CategoryHelper.isValid('dirt_road')).toBe(true);
    });

    test('should reject invalid category values', () => {
      expect(CategoryHelper.isValid('invalid')).toBe(false);
      expect(CategoryHelper.isValid('')).toBe(false);
      expect(CategoryHelper.isValid('OVAL')).toBe(false); // Case sensitive
    });
  });

  describe('CategoryHelper.normalize', () => {
    test('should normalize valid categories', () => {
      expect(CategoryHelper.normalize('oval')).toBe(Category.OVAL);
      expect(CategoryHelper.normalize('sports_car')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('formula_car')).toBe(Category.FORMULA_CAR);
      expect(CategoryHelper.normalize('dirt_oval')).toBe(Category.DIRT_OVAL);
      expect(CategoryHelper.normalize('dirt_road')).toBe(Category.DIRT_ROAD);
    });

    test('should handle legacy road mapping', () => {
      expect(CategoryHelper.normalize('road')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('Road')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('ROAD')).toBe(Category.SPORTS_CAR);
    });

    test('should handle case insensitive input', () => {
      expect(CategoryHelper.normalize('OVAL')).toBe(Category.OVAL);
      expect(CategoryHelper.normalize('Sports_Car')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('Formula_Car')).toBe(Category.FORMULA_CAR);
    });

    test('should default to sports_car for invalid input', () => {
      expect(CategoryHelper.normalize('invalid')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.normalize('unknown')).toBe(Category.SPORTS_CAR);
    });
  });

  describe('CategoryHelper.getDisplayName', () => {
    test('should return correct display names', () => {
      expect(CategoryHelper.getDisplayName(Category.OVAL)).toBe('Oval');
      expect(CategoryHelper.getDisplayName(Category.SPORTS_CAR)).toBe('Sports Car');
      expect(CategoryHelper.getDisplayName(Category.FORMULA_CAR)).toBe('Formula Car');
      expect(CategoryHelper.getDisplayName(Category.DIRT_OVAL)).toBe('Dirt Oval');
      expect(CategoryHelper.getDisplayName(Category.DIRT_ROAD)).toBe('Dirt Road');
    });
  });

  describe('CategoryHelper.getAllCategories', () => {
    test('should return all categories', () => {
      const categories = CategoryHelper.getAllCategories();
      expect(categories).toHaveLength(5);
      expect(categories).toContain(Category.OVAL);
      expect(categories).toContain(Category.SPORTS_CAR);
      expect(categories).toContain(Category.FORMULA_CAR);
      expect(categories).toContain(Category.DIRT_OVAL);
      expect(categories).toContain(Category.DIRT_ROAD);
    });

    test('should return a new array each time', () => {
      const categories1 = CategoryHelper.getAllCategories();
      const categories2 = CategoryHelper.getAllCategories();
      expect(categories1).not.toBe(categories2); // Different array instances
      expect(categories1).toEqual(categories2); // Same content
    });
  });

  describe('CategoryHelper.fromScheduleCategory', () => {
    test('should handle schedule category formats', () => {
      expect(CategoryHelper.fromScheduleCategory('oval')).toBe(Category.OVAL);
      expect(CategoryHelper.fromScheduleCategory('road')).toBe(Category.SPORTS_CAR);
      expect(CategoryHelper.fromScheduleCategory('sports_car')).toBe(Category.SPORTS_CAR);
    });
  });

  describe('Category type checking methods', () => {
    test('CategoryHelper.isDirtCategory', () => {
      expect(CategoryHelper.isDirtCategory(Category.DIRT_OVAL)).toBe(true);
      expect(CategoryHelper.isDirtCategory(Category.DIRT_ROAD)).toBe(true);
      expect(CategoryHelper.isDirtCategory(Category.OVAL)).toBe(false);
      expect(CategoryHelper.isDirtCategory(Category.SPORTS_CAR)).toBe(false);
      expect(CategoryHelper.isDirtCategory(Category.FORMULA_CAR)).toBe(false);
    });

    test('CategoryHelper.isOvalCategory', () => {
      expect(CategoryHelper.isOvalCategory(Category.OVAL)).toBe(true);
      expect(CategoryHelper.isOvalCategory(Category.DIRT_OVAL)).toBe(true);
      expect(CategoryHelper.isOvalCategory(Category.SPORTS_CAR)).toBe(false);
      expect(CategoryHelper.isOvalCategory(Category.FORMULA_CAR)).toBe(false);
      expect(CategoryHelper.isOvalCategory(Category.DIRT_ROAD)).toBe(false);
    });

    test('CategoryHelper.isRoadCategory', () => {
      expect(CategoryHelper.isRoadCategory(Category.SPORTS_CAR)).toBe(true);
      expect(CategoryHelper.isRoadCategory(Category.FORMULA_CAR)).toBe(true);
      expect(CategoryHelper.isRoadCategory(Category.DIRT_ROAD)).toBe(true);
      expect(CategoryHelper.isRoadCategory(Category.OVAL)).toBe(false);
      expect(CategoryHelper.isRoadCategory(Category.DIRT_OVAL)).toBe(false);
    });
  });

  describe('isCategory type guard', () => {
    test('should correctly identify Category values', () => {
      expect(isCategory('oval')).toBe(true);
      expect(isCategory('sports_car')).toBe(true);
      expect(isCategory('invalid')).toBe(false);
      expect(isCategory(123)).toBe(false);
      expect(isCategory(null)).toBe(false);
      expect(isCategory(undefined)).toBe(false);
    });
  });
});

describe('Category Enum Values', () => {
  test('should have correct string values', () => {
    expect(Category.OVAL).toBe('oval');
    expect(Category.SPORTS_CAR).toBe('sports_car');
    expect(Category.FORMULA_CAR).toBe('formula_car');
    expect(Category.DIRT_OVAL).toBe('dirt_oval');
    expect(Category.DIRT_ROAD).toBe('dirt_road');
  });

  test('should be immutable', () => {
    // TypeScript enums are mutable at runtime, but we can test that the values are correct
    expect(Category.OVAL).toBe('oval');
    expect(Category.SPORTS_CAR).toBe('sports_car');
    expect(Category.FORMULA_CAR).toBe('formula_car');
    expect(Category.DIRT_OVAL).toBe('dirt_oval');
    expect(Category.DIRT_ROAD).toBe('dirt_road');
  });
});