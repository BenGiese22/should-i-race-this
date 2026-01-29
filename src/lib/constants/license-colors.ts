/**
 * iRacing License Badge Colors
 *
 * These colors match the official iRacing license badges:
 * - Rookie (R): Red
 * - Class D: Orange
 * - Class C: Yellow
 * - Class B: Green
 * - Class A: Blue
 * - Pro / Pro WC: Black
 *
 * Reference: Official iRacing license badge image
 */

export const LICENSE_COLORS = {
  rookie: {
    background: '#DC2626', // Red-600
    text: '#FFFFFF',
    border: '#B91C1C', // Red-700
    label: 'Rookie',
    shortLabel: 'R',
  },
  D: {
    background: '#EA580C', // Orange-600
    text: '#FFFFFF',
    border: '#C2410C', // Orange-700
    label: 'Class D',
    shortLabel: 'D',
  },
  C: {
    background: '#EAB308', // Yellow-500
    text: '#1F2937', // Gray-800 for contrast
    border: '#CA8A04', // Yellow-600
    label: 'Class C',
    shortLabel: 'C',
  },
  B: {
    background: '#16A34A', // Green-600
    text: '#FFFFFF',
    border: '#15803D', // Green-700
    label: 'Class B',
    shortLabel: 'B',
  },
  A: {
    background: '#2563EB', // Blue-600
    text: '#FFFFFF',
    border: '#1D4ED8', // Blue-700
    label: 'Class A',
    shortLabel: 'A',
  },
  pro: {
    background: '#1F2937', // Gray-800 (Black-ish)
    text: '#FFFFFF',
    border: '#111827', // Gray-900
    label: 'Pro',
    shortLabel: 'P',
  },
} as const;

export type LicenseLevelKey = keyof typeof LICENSE_COLORS;

/**
 * Get license color configuration by level
 * Handles both uppercase and lowercase inputs
 */
export function getLicenseColor(level: string) {
  const normalizedLevel = level.toLowerCase();

  // Handle various input formats
  if (normalizedLevel === 'r' || normalizedLevel === 'rookie') {
    return LICENSE_COLORS.rookie;
  }
  if (normalizedLevel === 'd') {
    return LICENSE_COLORS.D;
  }
  if (normalizedLevel === 'c') {
    return LICENSE_COLORS.C;
  }
  if (normalizedLevel === 'b') {
    return LICENSE_COLORS.B;
  }
  if (normalizedLevel === 'a') {
    return LICENSE_COLORS.A;
  }
  if (normalizedLevel === 'pro' || normalizedLevel === 'p' || normalizedLevel === 'prowc') {
    return LICENSE_COLORS.pro;
  }

  // Default to rookie if unknown
  return LICENSE_COLORS.rookie;
}

/**
 * Tailwind-compatible class names for license badges
 * Use these in className for consistent styling
 */
export const LICENSE_BADGE_CLASSES = {
  rookie: 'bg-red-600 text-white border-red-700',
  D: 'bg-orange-600 text-white border-orange-700',
  C: 'bg-yellow-500 text-gray-800 border-yellow-600',
  B: 'bg-green-600 text-white border-green-700',
  A: 'bg-blue-600 text-white border-blue-700',
  pro: 'bg-gray-800 text-white border-gray-900',
} as const;

/**
 * Get Tailwind class string for a license level
 */
export function getLicenseBadgeClass(level: string): string {
  const normalizedLevel = level.toLowerCase();

  if (normalizedLevel === 'r' || normalizedLevel === 'rookie') {
    return LICENSE_BADGE_CLASSES.rookie;
  }
  if (normalizedLevel === 'd') {
    return LICENSE_BADGE_CLASSES.D;
  }
  if (normalizedLevel === 'c') {
    return LICENSE_BADGE_CLASSES.C;
  }
  if (normalizedLevel === 'b') {
    return LICENSE_BADGE_CLASSES.B;
  }
  if (normalizedLevel === 'a') {
    return LICENSE_BADGE_CLASSES.A;
  }
  if (normalizedLevel === 'pro' || normalizedLevel === 'p' || normalizedLevel === 'prowc') {
    return LICENSE_BADGE_CLASSES.pro;
  }

  return LICENSE_BADGE_CLASSES.rookie;
}
