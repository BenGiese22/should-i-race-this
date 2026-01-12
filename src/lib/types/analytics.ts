/**
 * Analytics Mode Enum and Helper Functions
 * Consolidates analytics mode handling across the application
 */

export enum AnalyticsMode {
  METRICS = 'metrics',
  TRENDS = 'trends',
  COMPARISON = 'comparison',
  SEASONS = 'seasons'
}

/**
 * Helper class for AnalyticsMode enum operations
 */
export class AnalyticsModeHelper {
  /**
   * All valid analytics modes in order
   */
  static readonly ALL_MODES = [
    AnalyticsMode.METRICS,
    AnalyticsMode.TRENDS,
    AnalyticsMode.COMPARISON,
    AnalyticsMode.SEASONS
  ] as const;

  /**
   * Display names for UI
   */
  private static readonly DISPLAY_NAMES: Record<AnalyticsMode, string> = {
    [AnalyticsMode.METRICS]: 'Performance Metrics',
    [AnalyticsMode.TRENDS]: 'Performance Trends',
    [AnalyticsMode.COMPARISON]: 'Session Comparison',
    [AnalyticsMode.SEASONS]: 'Season Data'
  };

  /**
   * Descriptions for each mode
   */
  private static readonly DESCRIPTIONS: Record<AnalyticsMode, string> = {
    [AnalyticsMode.METRICS]: 'Detailed performance metrics and statistics',
    [AnalyticsMode.TRENDS]: 'Performance trends over time',
    [AnalyticsMode.COMPARISON]: 'Compare performance across different session types',
    [AnalyticsMode.SEASONS]: 'Available seasons and season data'
  };

  /**
   * Check if a string is a valid analytics mode
   */
  static isValid(value: string): value is AnalyticsMode {
    return Object.values(AnalyticsMode).includes(value as AnalyticsMode);
  }

  /**
   * Normalize analytics mode string
   */
  static normalize(mode: string): AnalyticsMode {
    const lower = mode.toLowerCase().trim();
    
    switch (lower) {
      case 'metrics': return AnalyticsMode.METRICS;
      case 'trends': return AnalyticsMode.TRENDS;
      case 'comparison': return AnalyticsMode.COMPARISON;
      case 'seasons': return AnalyticsMode.SEASONS;
      default: return AnalyticsMode.METRICS; // Default fallback
    }
  }

  /**
   * Get display name for analytics mode
   */
  static getDisplayName(mode: AnalyticsMode): string {
    return this.DISPLAY_NAMES[mode] || mode;
  }

  /**
   * Get description for analytics mode
   */
  static getDescription(mode: AnalyticsMode): string {
    return this.DESCRIPTIONS[mode] || mode;
  }

  /**
   * Get all analytics modes as array
   */
  static getAllModes(): AnalyticsMode[] {
    return [...this.ALL_MODES];
  }

  /**
   * Check if mode requires time-based filtering
   */
  static requiresTimeFiltering(mode: AnalyticsMode): boolean {
    return mode === AnalyticsMode.TRENDS || mode === AnalyticsMode.METRICS;
  }

  /**
   * Check if mode supports series/track filtering
   */
  static supportsSeriesTrackFiltering(mode: AnalyticsMode): boolean {
    return mode === AnalyticsMode.METRICS || 
           mode === AnalyticsMode.TRENDS || 
           mode === AnalyticsMode.COMPARISON;
  }

  /**
   * Check if mode returns paginated results
   */
  static supportsPagination(mode: AnalyticsMode): boolean {
    return mode === AnalyticsMode.METRICS;
  }
}

/**
 * Type guard for AnalyticsMode
 */
export function isAnalyticsMode(value: unknown): value is AnalyticsMode {
  return typeof value === 'string' && AnalyticsModeHelper.isValid(value);
}