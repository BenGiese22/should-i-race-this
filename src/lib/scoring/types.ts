export type RiskLevel = "low" | "medium" | "high";

export type RiskMode = "irating_push" | "balanced" | "sr_recovery";

export type RaceContext = {
  seriesId: number;
  trackId: number;
  carClass?: string;       // optional for later
  raceLengthMin: number;   // total race time
  timeSlotLocalHour: number; // 0-23, used for volatility modeling
  isFixedSetup: boolean;
};

export type PersonalStats = {
  // How you typically do relative to SOF / expected grid position on this combo.
  // Positive means you tend to finish better than expected.
  expectedFinishDeltaPositions: number; // e.g. +3.4 positions

  // Your incidents normalized to something stable (per race or per lap).
  incidentsPerRace: number; // e.g. 6.2

  // Consistency proxy: lower is better.
  finishPositionStdDev: number; // e.g. 5.1 (positions)

  // Familiarity proxy: more starts on combo should reduce risk
  startsOnCombo: number; // e.g. 12
};

export type GlobalStats = {
  // Global incident risk for this series+track
  incidentsPerRaceAvg: number; // e.g. 7.5

  // Global “chaos”: higher means outcomes are more random
  finishPositionStdDevAvg: number; // e.g. 6.0

  // DNF/attrition proxy
  attritionRate: number; // 0..1, e.g. 0.18

  // Strength-of-field variance by time slot; higher = more unpredictable splits
  sofStdDevByTimeSlot: number; // e.g. 450
};

export type ScoreInputs = {
  mode: RiskMode;
  context: RaceContext;
  personal: PersonalStats;
  global: GlobalStats;

  // Optional: your current SR/iR banding, for sensitivity tweaks later
  currentIrating?: number;
  currentSr?: number;
};

export type ScoreBreakdown = {
  performance: number;   // 0..1
  safety: number;        // 0..1
  consistency: number;   // 0..1
  predictability: number;// 0..1
  fatigueRisk: number;   // 0..1 (higher = worse)
  familiarity: number;   // 0..1
  attritionRisk: number; // 0..1 (higher = worse)
  timeVolatility: number;// 0..1 (higher = worse)
};

export type ScoreResult = {
  score: number;              // 0..100
  iratingRisk: RiskLevel;
  srRisk: RiskLevel;
  expectedFinishDeltaPositions: number;
  notes: string[];
  breakdown: ScoreBreakdown;
};
