'use client';

interface ConfidenceBadgeProps {
  level: 'high' | 'estimated' | 'no_data';
  size?: 'sm' | 'md';
  className?: string;
}

const CONFIDENCE_CONFIG = {
  high: {
    label: 'High Confidence',
    shortLabel: '✓',
    icon: '✓',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  estimated: {
    label: 'Estimated',
    shortLabel: '~',
    icon: '~',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  no_data: {
    label: 'Limited Data',
    shortLabel: '?',
    icon: '?',
    bgClass: 'bg-racing-gray-100 dark:bg-racing-gray-800',
    textClass: 'text-racing-gray-600 dark:text-racing-gray-400',
    borderClass: 'border-racing-gray-200 dark:border-racing-gray-700',
  },
};

/**
 * Badge indicating the confidence level of a recommendation
 *
 * - high: 3+ races in this series/track - personal data used
 * - estimated: Cross-series analysis used
 * - no_data: Global averages only
 */
export function ConfidenceBadge({
  level,
  size = 'md',
  className = '',
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded border
        ${config.bgClass}
        ${config.textClass}
        ${config.borderClass}
        ${sizeClasses[size]}
        ${className}
      `}
      title={config.label}
    >
      <span>{config.icon}</span>
      {size === 'md' && <span>{level === 'high' ? 'High' : level === 'estimated' ? 'Est.' : 'Limited'}</span>}
    </span>
  );
}
