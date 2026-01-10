/**
 * iRacing Data Integration
 * 
 * Main export file for all iRacing-related functionality
 */

// Client exports
export {
  fetchMemberRecentRaces,
  fetchSubsessionResults,
  fetchSeasonSchedule,
  getCurrentSeason,
  clearRateLimit,
  type RaceResultsResponse,
  type ScheduleResponse,
  type SearchSeriesResponse,
} from './client';

// Session type exports
export {
  normalizeSessionType,
  getSessionTypeName,
  isCompetitiveSession,
  getAllSessionTypes,
  isValidSessionType,
  getSessionTypePriority,
  type SessionType,
} from './session-types';

// Sync exports
export {
  syncUserRaceData,
  getUserSyncStatus,
  needsSync,
  type SyncProgress,
  type SyncResult,
} from './sync';

// Schedule exports
export {
  syncScheduleData,
  getCurrentSchedule,
  getScheduleCacheStatus,
  getSeriesSchedule,
  getTrackSchedule,
  clearOldScheduleData,
  type ScheduleEntry,
  type ScheduleCacheStatus,
} from './schedule';