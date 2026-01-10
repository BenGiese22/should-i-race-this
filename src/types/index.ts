// User and Authentication Types
export interface User {
  id: string;
  iracingCustomerId: number;
  displayName: string;
  createdAt: Date;
  lastSyncAt: Date | null;
}

export interface LicenseClass {
  category: 'oval' | 'road' | 'dirt_oval' | 'dirt_road';
  level: 'rookie' | 'D' | 'C' | 'B' | 'A' | 'pro';
  safetyRating: number;
  iRating: number;
}

// Race Data Types
export interface RaceResult {
  id: string;
  subsessionId: number;
  userId: string;
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  sessionType: SessionType;
  startingPosition: number | null;
  finishingPosition: number | null;
  positionDelta: number | null;
  incidents: number;
  strengthOfField: number | null;
  raceDate: Date;
  seasonYear: number;
  seasonQuarter: number;
  raceWeekNum: number | null;
  raceLength: number | null;
}

export type SessionType = 'practice' | 'qualifying' | 'time_trial' | 'race';

// Analytics Types
export interface PerformanceMetric {
  seriesId?: number;
  seriesName?: string;
  trackId?: number;
  trackName?: string;
  avgStartingPosition: number;
  avgFinishingPosition: number;
  positionDelta: number;
  avgIncidents: number;
  raceCount: number;
  consistency: number;
  // Additional fields for enhanced analysis
  bestFinish?: number;
  worstFinish?: number;
  totalIncidents?: number;
}

export type GroupingType = 'series' | 'track' | 'series_track';
export type RecommendationMode = 'balanced' | 'irating_push' | 'safety_recovery';

// Recommendation Types
export interface Score {
  overall: number; // 0-100
  factors: {
    performance: number;
    safety: number;
    consistency: number;
    predictability: number;
    familiarity: number;
    fatigueRisk: number;
    attritionRisk: number;
    timeVolatility: number;
  };
  iRatingRisk: 'low' | 'medium' | 'high';
  safetyRatingRisk: 'low' | 'medium' | 'high';
  reasoning: string[];
}

export interface RacingOpportunity {
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  licenseRequired: string;
  seasonYear: number;
  seasonQuarter: number;
  raceWeekNum: number;
  raceLength: number | null;
  hasOpenSetup: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface SyncResult {
  newResults: number;
  totalResults: number;
  lastSyncAt: Date;
}