'use client';

interface ScoreProgressBarProps {
  /** Score value from 0-100 */
  value: number;
  /** Optional label to show before the bar */
  label?: string;
  /** Show the numeric value */
  showValue?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional description text */
  description?: string;
  /** Icon to display (emoji or component) */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Get HSL color interpolated between red (0) and green (100)
 * Uses HSL color space for smooth transitions:
 * - 0 = red (hsl 0)
 * - 50 = yellow/amber (hsl 45)
 * - 100 = green (hsl 120)
 */
export function getScoreColor(score: number): string {
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Interpolate hue from 0 (red) to 120 (green)
  // Using a slight curve to make yellow appear more in the middle range
  const hue = (clampedScore / 100) * 120;

  // Saturation and lightness for vibrant but readable colors
  const saturation = 70;
  const lightness = 45;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get Tailwind color class based on score thresholds
 * Fallback for when inline HSL isn't suitable
 */
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-lime-600';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-600';
}

/**
 * Score progress bar with dynamic red→green gradient
 *
 * The color smoothly transitions based on score:
 * - 0: Red (bad)
 * - 25: Orange-red
 * - 50: Yellow/Amber (neutral)
 * - 75: Lime green
 * - 100: Green (good)
 */
export function ScoreProgressBar({
  value,
  label,
  showValue = true,
  size = 'md',
  description,
  icon,
  className = '',
}: ScoreProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color = getScoreColor(clampedValue);

  const sizeClasses = {
    sm: {
      bar: 'h-1.5',
      text: 'text-xs',
      gap: 'gap-1',
    },
    md: {
      bar: 'h-2',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      bar: 'h-3',
      text: 'text-base',
      gap: 'gap-2',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`${className}`}>
      {/* Label row */}
      {(label || showValue || icon) && (
        <div className={`flex items-center justify-between ${sizes.gap} mb-1`}>
          <div className={`flex items-center ${sizes.gap} ${sizes.text}`}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {label && (
              <span className="text-racing-gray-700 dark:text-racing-gray-300 font-medium">
                {label}
              </span>
            )}
          </div>
          {showValue && (
            <span
              className={`${sizes.text} font-semibold`}
              style={{ color }}
            >
              {Math.round(clampedValue)}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        className={`w-full ${sizes.bar} bg-racing-gray-200 dark:bg-racing-gray-700 rounded-full overflow-hidden`}
      >
        <div
          className={`${sizes.bar} rounded-full transition-all duration-300 ease-out`}
          style={{
            width: `${clampedValue}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline score indicator
 * Shows just the colored bar segment with value
 */
export function ScoreIndicator({
  value,
  showValue = true,
  className = '',
}: {
  value: number;
  showValue?: boolean;
  className?: string;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color = getScoreColor(clampedValue);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="w-16 h-1.5 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-medium" style={{ color }}>
          {Math.round(clampedValue)}
        </span>
      )}
    </div>
  );
}
