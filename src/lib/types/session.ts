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
   * iRacing event_type mappings
   *
   * Verified from iRacing Data API documentation:
   * - 2 = Practice
   * - 3 = Qualifying
   * - 4 = Time Trial
   * - 5 = Race
   *
   * Note: The API may return other event_type values for special race formats
   * (heat races, team events, etc). Unknown types default to RACE as a safe fallback.
   *
   * Additional fields available in API response:
   * - event_type_name: Human-readable name (e.g., "Race", "Practice")
   * - official_session: Boolean indicating if the session affects iRating
   *
   * @see https://members-ng.iracing.com/data/constants/event_types
   */
  private static readonly EVENT_TYPE_MAPPINGS: Record<number, SessionType> = {
    // Verified core mappings from iRacing Data API documentation
    2: SessionType.PRACTICE,    // Practice sessions
    3: SessionType.QUALIFYING,  // Qualifying sessions
    4: SessionType.TIME_TRIAL,  // Time Trial sessions
    5: SessionType.RACE,        // Standard race sessions

    // Legacy/special event types (mapped to RACE as safe default)
    // These may appear in older data or special event formats
    1: SessionType.RACE,        // Possibly legacy race format
    6: SessionType.QUALIFYING,  // Possibly heat qualifying
    7: SessionType.TIME_TRIAL,  // Possibly alternate time trial
    8: SessionType.TIME_TRIAL,  // Possibly alternate time trial
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