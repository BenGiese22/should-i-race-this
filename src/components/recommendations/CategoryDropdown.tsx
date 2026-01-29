'use client';

import { Category } from '@/lib/recommendations/types';

interface CategoryDropdownProps {
  categories: Category[];
  currentCategory: Category;
  onCategoryChange: (category: Category) => void;
  primaryCategory?: Category;
  disabled?: boolean;
}

const categoryLabels: Record<Category, string> = {
  oval: 'Oval',
  sports_car: 'Sports Car',
  formula_car: 'Formula',
  dirt_oval: 'Dirt Oval',
  dirt_road: 'Dirt Road',
};

/**
 * Dropdown selector for license categories
 * Text-only design for cleaner appearance
 */
export function CategoryDropdown({
  categories,
  currentCategory,
  onCategoryChange,
  primaryCategory,
  disabled = false,
}: CategoryDropdownProps) {
  // Sort categories with primary first
  const sortedCategories = [...categories].sort((a, b) => {
    if (a === primaryCategory) return -1;
    if (b === primaryCategory) return 1;
    return 0;
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentCategory}
        onChange={(e) => onCategoryChange(e.target.value as Category)}
        disabled={disabled}
        className="px-3 py-2 text-sm rounded-lg bg-racing-gray-100 dark:bg-racing-gray-800 text-racing-gray-700 dark:text-racing-gray-200 focus:outline-none focus:ring-2 focus:ring-racing-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select category"
      >
        {sortedCategories.map((category) => (
          <option key={category} value={category}>
            {categoryLabels[category]}
            {category === primaryCategory ? ' (Primary)' : ''}
          </option>
        ))}
      </select>
      <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400">
        License category
      </p>
    </div>
  );
}
