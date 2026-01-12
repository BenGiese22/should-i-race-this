/**
 * Session Type System
 * 
 * Centralized enum and utilities for iRacing session types
 * Provides type safety, validation, and helper methods
 */

/**
 * Standardized session types for iRacing events
 */
export enum SessionType {
  PRACTICE = 'practice',
  QUALIFYING = 'qualifying', 
  TIME_TRIAL = 'time_trial',
  RACE = 'race'
}

/**
 * Session Type Helper Class
 * Provides utilities for working with session types
 */
export class SessionTypeHelper {
  /**
   * Get all valid session types as array
   */
  static getAllTypes(): SessionType[] {
    return Object.values(SessionType);
  }

  /**
   * Validate if a string is a valid session type
   */
  static isValid(value: string): value is SessionType {
    return Object.values(SessionType).includes(value as SessionType);
  }

  /**
   * Get human-readable display name for session type
   */
  static getDisplayName(sessionType: SessionType): string {
    switch (sessionType) {
      case SessionType.PRACTICE:
        return 'Practice';
      case SessionType.QUALIFYING:
        return 'Qualifying';
      case SessionType.TIME_TRIAL:
        return 'Time Trial';
      case SessionType.RACE:
        return 'Race';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if session type is competitive (affects ratings)
   */
  static isCompetitive(sessionType: SessionType): boolean {
    return sessionType === SessionType.QUALIFYING || 
           sessionType === SessionType.TIME_TRIAL || 
           sessionType === SessionType.RACE;
  }

  /**
   * Get session type priority for sorting (lower = higher priority)
   */
  static getPriority(sessionType: SessionType): number {
    switch (sessionType) {
      case SessionType.PRACTICE:
        return 1;
      case SessionType.QUALIFYING:
        return 2;
      case SessionType.TIME_TRIAL:
        return 3;
      case SessionType.RACE:
        return 4;
      default:
        return 999;
    }
  }

  /**
   * Sort session types by priority
   */
  static sortByPriority(sessionTypes: SessionType[]): SessionType[] {
    return sessionTypes.sort((a, b) => 
      SessionTypeHelper.getPriority(a) - SessionTypeHelper.getPriority(b)
    );
  }

  /**
   * Known iRacing event type mappings
   */
  private static readonly EVENT_TYPE_MAPPINGS: Record<number, SessionType> = {
    // Core mappings from iRacing API
    1: SessionType.RACE,
    2: SessionType.PRACTICE,
    3: SessionType.QUALIFYING,
    4: SessionType.TIME_TRIAL,
    5: SessionType.RACE,
    6: SessionType.QUALIFYING,
    7: SessionType.TIME_TRIAL,
    8: SessionType.TIME_TRIAL,
    9: SessionType.RACE,
    10: SessionType.RACE,
    11: SessionType.RACE,
    12: SessionType.RACE,
    13: SessionType.RACE,
    14: SessionType.RACE,
    15: SessionType.RACE,
    16: SessionType.RACE,
    17: SessionType.RACE,
    18: SessionType.RACE,
    19: SessionType.RACE,
    20: SessionType.RACE,
  };

  /**
   * Session name patterns for fallback normalization
   */
  private static readonly SESSION_NAME_PATTERNS: Array<{ pattern: RegExp; type: SessionType }> = [
    // Time Trial patterns (most specific first)
    { pattern: /lone.?qualify/i, type: SessionType.TIME_TRIAL },
    { pattern: /time.?trial/i, type: SessionType.TIME_TRIAL },
    { pattern: /hot.?lap/i, type: SessionType.TIME_TRIAL },
    { pattern: /^tt$/i, type: SessionType.TIME_TRIAL },
    
    // Practice patterns
    { pattern: /practice/i, type: SessionType.PRACTICE },
    { pattern: /warmup/i, type: SessionType.PRACTICE },
    { pattern: /warm.?up/i, type: SessionType.PRACTICE },
    
    // Qualifying patterns
    { pattern: /qualify/i, type: SessionType.QUALIFYING },
    { pattern: /qual/i, type: SessionType.QUALIFYING },
    { pattern: /grid/i, type: SessionType.QUALIFYING },
    
    // Race patterns (most general, should be last)
    { pattern: /race/i, type: SessionType.RACE },
    { pattern: /feature/i, type: SessionType.RACE },
    { pattern: /main/i, type: SessionType.RACE },
    { pattern: /heat/i, type: SessionType.RACE },
    { pattern: /final/i, type: SessionType.RACE },
  ];

  /**
   * Normalize iRacing session type from event data
   */
  static normalizeFromEventType(
    eventType: number,
    sessionName?: string,
    eventTypeName?: string
  ): SessionType {
    // First, try direct event type mapping
    if (SessionTypeHelper.EVENT_TYPE_MAPPINGS[eventType]) {
      return SessionTypeHelper.EVENT_TYPE_MAPPINGS[eventType];
    }
    
    // Fallback to event type name pattern matching
    if (eventTypeName) {
      const normalized = eventTypeName.toLowerCase();
      if (normalized.includes('practice')) return SessionType.PRACTICE;
      if (normalized.includes('qualif')) return SessionType.QUALIFYING;
      if (normalized.includes('time trial')) return SessionType.TIME_TRIAL;
      if (normalized.includes('race')) return SessionType.RACE;
    }
    
    // Fallback to session name pattern matching
    if (sessionName) {
      for (const { pattern, type } of SessionTypeHelper.SESSION_NAME_PATTERNS) {
        if (pattern.test(sessionName)) {
          return type;
        }
      }
    }
    
    // Default fallback - assume race (most common and safest)
    return SessionType.RACE;
  }

  /**
   * Convert from string to enum (with validation)
   */
  static fromString(value: string): SessionType {
    if (SessionTypeHelper.isValid(value)) {
      return value as SessionType;
    }
    throw new Error(`Invalid session type: ${value}`);
  }

  /**
   * Safe conversion from string to enum (returns null if invalid)
   */
  static tryFromString(value: string): SessionType | null {
    return SessionTypeHelper.isValid(value) ? value as SessionType : null;
  }
}

// Export the enum values as constants for backward compatibility
export const SESSION_TYPES = {
  PRACTICE: SessionType.PRACTICE,
  QUALIFYING: SessionType.QUALIFYING,
  TIME_TRIAL: SessionType.TIME_TRIAL,
  RACE: SessionType.RACE,
} as const;