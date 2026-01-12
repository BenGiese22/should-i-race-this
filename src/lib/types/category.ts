/**
 * Racing Category Enum and Helper Functions
 * Consolidates category handling across the application
 */

export enum Category {
  OVAL = 'oval',
  SPORTS_CAR = 'sports_car',
  FORMULA_CAR = 'formula_car',
  DIRT_OVAL = 'dirt_oval',
  DIRT_ROAD = 'dirt_road'
}

/**
 * Helper class for Category enum operations
 */
export class CategoryHelper {
  /**
   * All valid categories in order
   */
  static readonly ALL_CATEGORIES = [
    Category.OVAL,
    Category.SPORTS_CAR,
    Category.FORMULA_CAR,
    Category.DIRT_OVAL,
    Category.DIRT_ROAD
  ] as const;

  /**
   * Legacy mapping for backward compatibility
   */
  private static readonly LEGACY_MAPPING: Record<string, Category> = {
    'road': Category.SPORTS_CAR, // Legacy road -> sports_car
    'oval': Category.OVAL,
    'dirt_oval': Category.DIRT_OVAL,
    'dirt_road': Category.DIRT_ROAD,
    'sports_car': Category.SPORTS_CAR,
    'formula_car': Category.FORMULA_CAR
  };

  /**
   * Display names for UI
   */
  private static readonly DISPLAY_NAMES: Record<Category, string> = {
    [Category.OVAL]: 'Oval',
    [Category.SPORTS_CAR]: 'Sports Car',
    [Category.FORMULA_CAR]: 'Formula Car',
    [Category.DIRT_OVAL]: 'Dirt Oval',
    [Category.DIRT_ROAD]: 'Dirt Road'
  };

  /**
   * Check if a string is a valid category
   */
  static isValid(value: string): value is Category {
    return Object.values(Category).includes(value as Category);
  }

  /**
   * Normalize category string (handles legacy mappings)
   */
  static normalize(category: string): Category {
    const lower = category.toLowerCase().trim();
    const mapped = this.LEGACY_MAPPING[lower];
    
    if (mapped) {
      return mapped;
    }
    
    // Default fallback
    return Category.SPORTS_CAR;
  }

  /**
   * Get display name for category
   */
  static getDisplayName(category: Category): string {
    return this.DISPLAY_NAMES[category] || category;
  }

  /**
   * Get all categories as array
   */
  static getAllCategories(): Category[] {
    return [...this.ALL_CATEGORIES];
  }

  /**
   * Convert from iRacing schedule category format
   */
  static fromScheduleCategory(scheduleCategory: string): Category {
    return this.normalize(scheduleCategory);
  }

  /**
   * Check if category is dirt-based
   */
  static isDirtCategory(category: Category): boolean {
    return category === Category.DIRT_OVAL || category === Category.DIRT_ROAD;
  }

  /**
   * Check if category is oval-based
   */
  static isOvalCategory(category: Category): boolean {
    return category === Category.OVAL || category === Category.DIRT_OVAL;
  }

  /**
   * Check if category is road-based
   */
  static isRoadCategory(category: Category): boolean {
    return category === Category.SPORTS_CAR || 
           category === Category.FORMULA_CAR || 
           category === Category.DIRT_ROAD;
  }
}

/**
 * Type guard for Category
 */
export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CategoryHelper.isValid(value);
}