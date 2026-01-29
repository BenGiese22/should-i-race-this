'use client';

import { RecommendationMode } from '@/lib/recommendations/types';

interface ModePillSelectorProps {
  currentMode: RecommendationMode;
  onModeChange: (mode: RecommendationMode) => void;
  disabled?: boolean;
}

const modeConfig: Record<RecommendationMode, { label: string; description: string }> = {
  balanced: {
    label: 'Balanced',
    description: 'Optimize for overall improvement',
  },
  irating_push: {
    label: 'iRating Push',
    description: 'Focus on gaining iRating',
  },
  safety_recovery: {
    label: 'Safety Recovery',
    description: 'Prioritize clean races',
  },
};

/**
 * Pill-style mode selector for recommendations
 * Text-only design for cleaner appearance
 */
export function ModePillSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ModePillSelectorProps) {
  const modes: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 p-1 bg-racing-gray-100 dark:bg-racing-gray-800 rounded-lg w-fit">
        {modes.map((mode) => {
          const config = modeConfig[mode];
          const isActive = currentMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${isActive
                  ? 'bg-white dark:bg-racing-gray-700 text-racing-gray-900 dark:text-white shadow-sm'
                  : 'text-racing-gray-600 dark:text-racing-gray-400 hover:text-racing-gray-900 dark:hover:text-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {config.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400">
        {modeConfig[currentMode].description}
      </p>
    </div>
  );
}
