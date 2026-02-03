/**
 * Utility functions for formatting license-related data
 */

/**
 * Format license category from snake_case to human-readable format
 * @param category - The category string (e.g., 'dirt_oval', 'sports_car')
 * @returns Formatted category name (e.g., 'Dirt Oval', 'Sports Car')
 */
export function formatLicenseCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'dirt_oval': 'Dirt Oval',
    'dirt_road': 'Dirt Road',
    'sports_car': 'Sports Car',
    'formula_car': 'Formula Car',
    'oval': 'Oval',
    'road': 'Road',
  };

  return categoryMap[category] || category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format license level to display format
 * @param level - The license level (e.g., 'rookie', 'A', 'pro')
 * @returns Formatted level (e.g., 'Rookie', 'A', 'Pro')
 */
export function formatLicenseLevel(level: string): string {
  if (level.toLowerCase() === 'rookie' || level.toLowerCase() === 'pro') {
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }
  return level.toUpperCase();
}
