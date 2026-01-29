'use client';

import { getLicenseBadgeClass, getLicenseColor } from '@/lib/constants/license-colors';

interface LicenseBadgeProps {
  level: string;
  /** Show full label (e.g., "Class D") or short (e.g., "D") */
  variant?: 'full' | 'short' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional safety rating to display */
  safetyRating?: number;
  className?: string;
}

/**
 * License badge component matching iRacing's official badge colors
 *
 * Variants:
 * - full: "Class D" or "Rookie"
 * - short: "D" or "R"
 * - minimal: Just the colored badge with letter
 */
export function LicenseBadge({
  level,
  variant = 'short',
  size = 'md',
  safetyRating,
  className = '',
}: LicenseBadgeProps) {
  const colorConfig = getLicenseColor(level);
  const badgeClass = getLicenseBadgeClass(level);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const label =
    variant === 'full'
      ? colorConfig.label
      : variant === 'short'
        ? colorConfig.shortLabel
        : colorConfig.shortLabel;

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded border
        ${badgeClass}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {label}
      {safetyRating !== undefined && (
        <span className="opacity-90">{safetyRating.toFixed(2)}</span>
      )}
    </span>
  );
}
