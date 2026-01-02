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
