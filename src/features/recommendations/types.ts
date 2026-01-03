export type RiskLevel = "low" | "medium" | "high";
export type RiskMode = "balanced" | "irating_push" | "sr_recovery";

export type ScoreBreakdown = {
  performance: number;
  safety: number;
  consistency: number;
  predictability: number;
  familiarity: number;
  fatigueRisk: number;
  attritionRisk: number;
  timeVolatility: number;
};

export type Recommendation = {
  id: string; // stable key for UI; we’ll compute from series/track/hour for now
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  timeSlotLocalHour: number;
  raceLengthMin: number;
  isFixedSetup: boolean;

  score: number; // 0..100
  iratingRisk: RiskLevel;
  srRisk: RiskLevel;
  expectedFinishDeltaPositions: number;

  notes: string[];
  breakdown: ScoreBreakdown;
};

export type RecommendationsResponse = {
  mode: RiskMode;
  weekStartDate?: string;
  items: Recommendation[];
};

export type TrackStat = {
  trackId: number;
  trackName: string;
  starts: number;
  avgFinishPos: number;
  incidentsPerRace: number;
  lastRaceAt?: string | null;
};

export type SeriesStat = {
  seriesId: number;
  seriesName: string;
  starts: number;
  avgFinishPos: number;
  incidentsPerRace: number;
  lastRaceAt?: string | null;
};

export type TrackStatsResponse = {
  items: TrackStat[];
};

export type SeriesStatsResponse = {
  items: SeriesStat[];
};

export type PerformanceView = "series" | "track" | "combo";

export type PerformanceRow = {
  key: string;
  label: string;
  seriesId?: number;
  trackId?: number;
  starts: number;
  avgFinish: number;
  incPerRace: number;
};

export type PerformanceResponse = {
  window: { seasonIds: number[]; label: string };
  view: PerformanceView;
  rows: PerformanceRow[];
};
