'use client';

import { Category } from '@/lib/recommendations/types';

interface CategoryTabsProps {
  categories: Category[];
  currentCategory: Category;
  onCategoryChange: (category: Category) => void;
  primaryCategory?: Category;
  disabled?: boolean;
}

const categoryConfig: Record<Category, { label: string; icon: string }> = {
  oval: { label: 'Oval', icon: '🏁' },
  sports_car: { label: 'Sports Car', icon: '🏎️' },
  formula_car: { label: 'Formula', icon: '🎯' },
  dirt_oval: { label: 'Dirt Oval', icon: '🟤' },
  dirt_road: { label: 'Dirt Road', icon: '🌲' },
};

/**
 * Tab selector for license categories
 * Only shows categories the user has raced in
 */
export function CategoryTabs({
  categories,
  currentCategory,
  onCategoryChange,
  primaryCategory,
  disabled = false,
}: CategoryTabsProps) {
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
    <div className="border-b border-racing-gray-200 dark:border-racing-gray-700">
      <nav className="flex gap-1 overflow-x-auto" aria-label="Category tabs">
        {sortedCategories.map((category) => {
          const config = categoryConfig[category];
          const isActive = currentCategory === category;
          const isPrimary = category === primaryCategory;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${isActive
                  ? 'border-racing-blue text-racing-blue'
                  : 'border-transparent text-racing-gray-500 dark:text-racing-gray-400 hover:text-racing-gray-700 dark:hover:text-racing-gray-300 hover:border-racing-gray-300 dark:hover:border-racing-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              {isPrimary && !isActive && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-racing-gray-100 dark:bg-racing-gray-700 text-racing-gray-600 dark:text-racing-gray-400 rounded">
                  Primary
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
