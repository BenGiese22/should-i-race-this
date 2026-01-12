/**
 * Recommendation System Types
 * 
 * Centralized enums and utilities for recommendation modes, risk levels, and confidence levels
 */

/**
 * Recommendation modes for different user goals
 */
export enum RecommendationMode {
  BALANCED = 'balanced',
  IRATING_PUSH = 'irating_push', 
  SAFETY_RECOVERY = 'safety_recovery'
}

/**
 * Risk levels for iRating and Safety Rating assessment
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Confidence levels for data quality assessment
 */
export enum ConfidenceLevel {
  HIGH = 'high',
  ESTIMATED = 'estimated',
  NO_DATA = 'no_data'
}

/**
 * Recommendation Mode Helper Class
 */
export class RecommendationModeHelper {
  /**
   * Get all valid recommendation modes
   */
  static getAllModes(): RecommendationMode[] {
    return Object.values(RecommendationMode);
  }

  /**
   * Validate if string is valid recommendation mode
   */
  static isValid(value: string): value is RecommendationMode {
    return Object.values(RecommendationMode).includes(value as RecommendationMode);
  }

  /**
   * Get display name for recommendation mode
   */
  static getDisplayName(mode: RecommendationMode): string {
    switch (mode) {
      case RecommendationMode.BALANCED:
        return 'Balanced';
      case RecommendationMode.IRATING_PUSH:
        return 'iRating Push';
      case RecommendationMode.SAFETY_RECOVERY:
        return 'Safety Recovery';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get description for recommendation mode
   */
  static getDescription(mode: RecommendationMode): string {
    switch (mode) {
      case RecommendationMode.BALANCED:
        return 'Balanced approach considering all factors equally';
      case RecommendationMode.IRATING_PUSH:
        return 'Prioritizes performance and iRating improvement';
      case RecommendationMode.SAFETY_RECOVERY:
        return 'Focuses on safety rating recovery and consistency';
      default:
        return 'Unknown mode';
    }
  }

  /**
   * Convert from string with validation
   */
  static fromString(value: string): RecommendationMode {
    if (RecommendationModeHelper.isValid(value)) {
      return value as RecommendationMode;
    }
    throw new Error(`Invalid recommendation mode: ${value}`);
  }

  /**
   * Safe conversion from string (returns null if invalid)
   */
  static tryFromString(value: string): RecommendationMode | null {
    return RecommendationModeHelper.isValid(value) ? value as RecommendationMode : null;
  }

  /**
   * Get default mode
   */
  static getDefault(): RecommendationMode {
    return RecommendationMode.BALANCED;
  }
}

/**
 * Risk Level Helper Class
 */
export class RiskLevelHelper {
  /**
   * Get all valid risk levels
   */
  static getAllLevels(): RiskLevel[] {
    return Object.values(RiskLevel);
  }

  /**
   * Validate if string is valid risk level
   */
  static isValid(value: string): value is RiskLevel {
    return Object.values(RiskLevel).includes(value as RiskLevel);
  }

  /**
   * Get numeric value for risk level (for comparison/sorting)
   */
  static getNumericValue(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.LOW:
        return 1;
      case RiskLevel.MEDIUM:
        return 2;
      case RiskLevel.HIGH:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Compare risk levels (-1: a < b, 0: a = b, 1: a > b)
   */
  static compare(a: RiskLevel, b: RiskLevel): number {
    return RiskLevelHelper.getNumericValue(a) - RiskLevelHelper.getNumericValue(b);
  }

  /**
   * Get color for risk level (for UI display)
   */
  static getColor(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.LOW:
        return '#22c55e'; // Green
      case RiskLevel.MEDIUM:
        return '#eab308'; // Yellow
      case RiskLevel.HIGH:
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get display name for risk level
   */
  static getDisplayName(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.LOW:
        return 'Low Risk';
      case RiskLevel.MEDIUM:
        return 'Medium Risk';
      case RiskLevel.HIGH:
        return 'High Risk';
      default:
        return 'Unknown Risk';
    }
  }

  /**
   * Convert from string with validation
   */
  static fromString(value: string): RiskLevel {
    if (RiskLevelHelper.isValid(value)) {
      return value as RiskLevel;
    }
    throw new Error(`Invalid risk level: ${value}`);
  }

  /**
   * Safe conversion from string
   */
  static tryFromString(value: string): RiskLevel | null {
    return RiskLevelHelper.isValid(value) ? value as RiskLevel : null;
  }
}

/**
 * Confidence Level Helper Class
 */
export class ConfidenceLevelHelper {
  /**
   * Get all valid confidence levels
   */
  static getAllLevels(): ConfidenceLevel[] {
    return Object.values(ConfidenceLevel);
  }

  /**
   * Validate if string is valid confidence level
   */
  static isValid(value: string): value is ConfidenceLevel {
    return Object.values(ConfidenceLevel).includes(value as ConfidenceLevel);
  }

  /**
   * Get numeric value for confidence level (for comparison/sorting)
   */
  static getNumericValue(level: ConfidenceLevel): number {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 3;
      case ConfidenceLevel.ESTIMATED:
        return 2;
      case ConfidenceLevel.NO_DATA:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Compare confidence levels (-1: a < b, 0: a = b, 1: a > b)
   */
  static compare(a: ConfidenceLevel, b: ConfidenceLevel): number {
    return ConfidenceLevelHelper.getNumericValue(a) - ConfidenceLevelHelper.getNumericValue(b);
  }

  /**
   * Get confidence level from race count
   */
  static fromRaceCount(raceCount: number): ConfidenceLevel {
    if (raceCount >= 3) return ConfidenceLevel.HIGH;
    if (raceCount >= 1) return ConfidenceLevel.ESTIMATED;
    return ConfidenceLevel.NO_DATA;
  }

  /**
   * Get display name for confidence level
   */
  static getDisplayName(level: ConfidenceLevel): string {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 'High Confidence';
      case ConfidenceLevel.ESTIMATED:
        return 'Estimated';
      case ConfidenceLevel.NO_DATA:
        return 'No Personal Data';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get color for confidence level
   */
  static getColor(level: ConfidenceLevel): string {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return '#22c55e'; // Green
      case ConfidenceLevel.ESTIMATED:
        return '#eab308'; // Yellow
      case ConfidenceLevel.NO_DATA:
        return '#6b7280'; // Gray
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get icon for confidence level
   */
  static getIcon(level: ConfidenceLevel): string {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return '✅';
      case ConfidenceLevel.ESTIMATED:
        return '📊';
      case ConfidenceLevel.NO_DATA:
        return '❓';
      default:
        return '❓';
    }
  }

  /**
   * Convert from string with validation
   */
  static fromString(value: string): ConfidenceLevel {
    if (ConfidenceLevelHelper.isValid(value)) {
      return value as ConfidenceLevel;
    }
    throw new Error(`Invalid confidence level: ${value}`);
  }

  /**
   * Safe conversion from string
   */
  static tryFromString(value: string): ConfidenceLevel | null {
    return ConfidenceLevelHelper.isValid(value) ? value as ConfidenceLevel : null;
  }
}

// Export constants for backward compatibility
export const RECOMMENDATION_MODES = {
  BALANCED: RecommendationMode.BALANCED,
  IRATING_PUSH: RecommendationMode.IRATING_PUSH,
  SAFETY_RECOVERY: RecommendationMode.SAFETY_RECOVERY,
} as const;

export const RISK_LEVELS = {
  LOW: RiskLevel.LOW,
  MEDIUM: RiskLevel.MEDIUM,
  HIGH: RiskLevel.HIGH,
} as const;

export const CONFIDENCE_LEVELS = {
  HIGH: ConfidenceLevel.HIGH,
  ESTIMATED: ConfidenceLevel.ESTIMATED,
  NO_DATA: ConfidenceLevel.NO_DATA,
} as const;