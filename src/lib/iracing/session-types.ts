/**
 * Session Type Normalization
 * 
 * Normalizes iRacing event types and session names into standardized categories:
 * - Practice
 * - Qualifying  
 * - Time Trial
 * - Race
 */

export type SessionType = 'practice' | 'qualifying' | 'time_trial' | 'race';

/**
 * Known iRacing event type mappings
 * Based on iRacing API documentation and observed values from should-i-race-this project
 * 
 * From the official iRacing API docs and the old project:
 * - Event Type 2: Practice
 * - Event Type 3: Qualifying  
 * - Event Type 4: Time Trial
 * - Event Type 5: Race
 */
const EVENT_TYPE_MAPPINGS: Record<number, SessionType> = {
  // Practice sessions
  2: 'practice',
  
  // Qualifying sessions  
  3: 'qualifying',
  
  // Time Trial sessions
  4: 'time_trial',
  
  // Race sessions
  5: 'race',
  
  // Additional mappings based on observed data
  // These may need adjustment based on actual iRacing constants
  1: 'race',      // Likely race
  6: 'qualifying', // Likely qualifying
  7: 'time_trial', // Likely time trial
  8: 'time_trial', // Likely time trial
  9: 'race',      // Likely race
  10: 'race',     // Likely race
  11: 'race',     // Likely race
  12: 'race',     // Likely race
  13: 'race',     // Likely race
  14: 'race',     // Likely race
  15: 'race',     // Likely race
  16: 'race',     // Likely race
  17: 'race',     // Likely race
  18: 'race',     // Likely race
  19: 'race',     // Likely race
  20: 'race',     // Likely race
};

/**
 * Session name patterns for fallback normalization
 * Used when event type is unknown or ambiguous
 * Order matters - more specific patterns should come first
 */
const SESSION_NAME_PATTERNS: Array<{ pattern: RegExp; type: SessionType }> = [
  // Time Trial patterns (most specific first)
  { pattern: /lone.?qualify/i, type: 'time_trial' },
  { pattern: /time.?trial/i, type: 'time_trial' },
  { pattern: /hot.?lap/i, type: 'time_trial' },
  { pattern: /^tt$/i, type: 'time_trial' }, // Exact match for "TT"
  
  // Practice patterns
  { pattern: /practice/i, type: 'practice' },
  { pattern: /warmup/i, type: 'practice' },
  { pattern: /warm.?up/i, type: 'practice' },
  
  // Qualifying patterns (after time trial patterns)
  { pattern: /qualify/i, type: 'qualifying' },
  { pattern: /qual/i, type: 'qualifying' },
  { pattern: /grid/i, type: 'qualifying' },
  
  // Race patterns (should be last as it's most general)
  { pattern: /race/i, type: 'race' },
  { pattern: /feature/i, type: 'race' },
  { pattern: /main/i, type: 'race' },
  { pattern: /heat/i, type: 'race' },
  { pattern: /final/i, type: 'race' },
];

/**
 * Normalize iRacing session type to standardized format
 * 
 * @param eventType - iRacing event type number
 * @param sessionName - Session name string (optional fallback)
 * @param eventTypeName - Event type name string (optional fallback)
 * @returns Normalized session type
 */
export function normalizeSessionType(
  eventType: number,
  sessionName?: string,
  eventTypeName?: string
): SessionType {
  // First, try direct event type mapping
  if (EVENT_TYPE_MAPPINGS[eventType]) {
    return EVENT_TYPE_MAPPINGS[eventType];
  }
  
  // Fallback to event type name pattern matching (from should-i-race-this project)
  if (eventTypeName) {
    const normalized = eventTypeName.toLowerCase();
    if (normalized.includes('practice')) return 'practice';
    if (normalized.includes('qualif')) return 'qualifying';
    if (normalized.includes('time trial')) return 'time_trial';
    if (normalized.includes('race')) return 'race';
  }
  
  // Fallback to session name pattern matching
  if (sessionName) {
    for (const { pattern, type } of SESSION_NAME_PATTERNS) {
      if (pattern.test(sessionName)) {
        return type;
      }
    }
  }
  
  // Default fallback - if we can't determine the type, assume it's a race
  // This is the safest assumption as races are the most common session type
  return 'race';
}

/**
 * Get human-readable session type name
 */
export function getSessionTypeName(sessionType: SessionType): string {
  switch (sessionType) {
    case 'practice':
      return 'Practice';
    case 'qualifying':
      return 'Qualifying';
    case 'time_trial':
      return 'Time Trial';
    case 'race':
      return 'Race';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a session type is competitive (affects ratings)
 */
export function isCompetitiveSession(sessionType: SessionType): boolean {
  return sessionType === 'qualifying' || sessionType === 'time_trial' || sessionType === 'race';
}

/**
 * Get all valid session types
 */
export function getAllSessionTypes(): SessionType[] {
  return ['practice', 'qualifying', 'time_trial', 'race'];
}

/**
 * Validate session type string
 */
export function isValidSessionType(value: string): value is SessionType {
  return getAllSessionTypes().includes(value as SessionType);
}

/**
 * Get session type priority for sorting (lower number = higher priority)
 */
export function getSessionTypePriority(sessionType: SessionType): number {
  switch (sessionType) {
    case 'practice':
      return 1;
    case 'qualifying':
      return 2;
    case 'time_trial':
      return 3;
    case 'race':
      return 4;
    default:
      return 999;
  }
}