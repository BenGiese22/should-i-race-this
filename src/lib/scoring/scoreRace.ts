import type { ScoreInputs, ScoreResult, ScoreBreakdown, RiskLevel } from "./types";

/** Clamp to [0, 1] */
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/** Map a value into [0,1] given a reasonable range. */
function normalize(x: number, min: number, max: number) {
  if (max <= min) return 0.5;
  return clamp01((x - min) / (max - min));
}

/** Invert a normalized value: 1 is good, 0 is bad. */
function inv01(x: number) {
  return clamp01(1 - x);
}

function riskFromProb(p: number): RiskLevel {
  // p is "riskiness" 0..1 (higher = riskier)
  if (p >= 0.67) return "high";
  if (p >= 0.34) return "medium";
  return "low";
}

type Weights = {
  performance: number;
  safety: number;
  consistency: number;
  predictability: number;
  familiarity: number;
  fatiguePenalty: number;
  attritionPenalty: number;
  timeVolatilityPenalty: number;
};

// Mode-specific weights (sum does not need to be 1; we normalize later)
function getWeights(mode: ScoreInputs["mode"]): Weights {
  switch (mode) {
    case "irating_push":
      return {
        performance: 3.2,
        safety: 1.2,
        consistency: 1.3,
        predictability: 1.0,
        familiarity: 1.0,
        fatiguePenalty: 0.8,
        attritionPenalty: 1.2,
        timeVolatilityPenalty: 1.0,
      };
    case "sr_recovery":
      return {
        performance: 0.8,
        safety: 3.2,
        consistency: 1.6,
        predictability: 1.2,
        familiarity: 1.4,
        fatiguePenalty: 1.2,
        attritionPenalty: 1.4,
        timeVolatilityPenalty: 1.3,
      };
    case "balanced":
    default:
      return {
        performance: 2.2,
        safety: 2.0,
        consistency: 1.5,
        predictability: 1.2,
        familiarity: 1.2,
        fatiguePenalty: 1.0,
        attritionPenalty: 1.3,
        timeVolatilityPenalty: 1.1,
      };
  }
}

/**
 * Score a scheduled race entry for a user.
 * Pure function: no IO, no dates, no env.
 */
export function scoreRace(input: ScoreInputs): ScoreResult {
  const { context, personal, global, mode } = input;
  const w = getWeights(mode);

  // --- Feature engineering (all become 0..1 “goodness” or “riskiness”) ---

  // Performance: expectedFinishDeltaPositions (higher is better)
  // Reasonable mapping: -10..+10 positions -> 0..1
  const performance = normalize(personal.expectedFinishDeltaPositions, -10, 10);

  // Safety: combine personal+global incident rates (lower is better)
  // Map incidents per race: 0..18 -> 1..0 (invert)
  const personalSafety = inv01(normalize(personal.incidentsPerRace, 0, 18));
  const globalSafety = inv01(normalize(global.incidentsPerRaceAvg, 0, 18));
  // Weighted blend: personal slightly stronger
  const safety = clamp01(0.6 * personalSafety + 0.4 * globalSafety);

  // Consistency: lower finish std dev is better
  // Map std dev 1..12 -> 1..0 (invert)
  const personalCons = inv01(normalize(personal.finishPositionStdDev, 1, 12));
  const globalCons = inv01(normalize(global.finishPositionStdDevAvg, 1, 12));
  const consistency = clamp01(0.65 * personalCons + 0.35 * globalCons);

  // Predictability: lower SOF variability is better (more stable splits)
  // Map 100..900 -> 1..0
  const predictability = inv01(normalize(global.sofStdDevByTimeSlot, 100, 900));

  // Familiarity: more starts = safer & more repeatable
  // Map 0..25 -> 0..1
  const familiarity = normalize(personal.startsOnCombo, 0, 25);

  // Fatigue risk: longer races increase risk; also open setups slightly more cognitive load
  // Map length 10..90 -> 0..1 (risk)
  const lengthRisk = normalize(context.raceLengthMin, 10, 90);
  const setupRisk = context.isFixedSetup ? 0 : 0.15;
  const fatigueRisk = clamp01(lengthRisk * 0.85 + setupRisk);

  // Attrition risk: higher attrition = riskier
  const attritionRisk = clamp01(global.attritionRate); // already 0..1

  // Time-of-day volatility proxy: late-night tends to be more variable for many series
  // This is a heuristic: treat 22-2 as higher volatility
  const hour = context.timeSlotLocalHour;
  const nightBand = (hour >= 22 || hour <= 2) ? 1 : (hour >= 19 ? 0.6 : 0.3);
  const timeVolatility = clamp01(nightBand);

  const breakdown: ScoreBreakdown = {
    performance,
    safety,
    consistency,
    predictability,
    familiarity,
    fatigueRisk,
    attritionRisk,
    timeVolatility,
  };

  // --- Combine into a 0..100 score ---
  // Positive contributions use goodness scores; penalties use risk scores.
  const positive =
    w.performance * performance +
    w.safety * safety +
    w.consistency * consistency +
    w.predictability * predictability +
    w.familiarity * familiarity;

  const penalties =
    w.fatiguePenalty * fatigueRisk +
    w.attritionPenalty * attritionRisk +
    w.timeVolatilityPenalty * timeVolatility;

  // Normalize: keep score stable across weight tweaks
  const maxPositive =
    w.performance + w.safety + w.consistency + w.predictability + w.familiarity;

  const maxPenalties = w.fatiguePenalty + w.attritionPenalty + w.timeVolatilityPenalty;

  // Convert to 0..1 then 0..100
  const raw01 = clamp01((positive / maxPositive) - (penalties / maxPenalties) * 0.5);
  const score = Math.round(raw01 * 100);

  // --- Risk outputs (separate from score; mode affects interpretation) ---
  // SR risk: mostly incidents + attrition + fatigue
  const srRiskiness = clamp01(
    0.5 * inv01(safety) + 0.25 * attritionRisk + 0.25 * fatigueRisk
  );

  // iRating risk: volatility + attrition + (low predictability) + (low consistency)
  const irRiskiness = clamp01(
    0.35 * inv01(predictability) + 0.25 * timeVolatility + 0.2 * attritionRisk + 0.2 * inv01(consistency)
  );

  const notes: string[] = [];

  // Notes (very MVP)
  if (personal.expectedFinishDeltaPositions >= 2) notes.push("You tend to overperform on this combo.");
  if (inv01(safety) >= 0.6) notes.push("Incident risk is elevated for your profile—survival first.");
  if (timeVolatility >= 0.8) notes.push("Late time slot: split strength and driving standards may vary.");
  if (fatigueRisk >= 0.7) notes.push("Longer race: fatigue/traffic risk increases—focus on clean pace.");
  if (attritionRisk >= 0.25) notes.push("Higher-than-average attrition: avoid hero moves early.");

  // Mode-specific note hint
  if (mode === "sr_recovery") notes.push("SR Recovery mode: prioritizing low incidents over finishing position.");
  if (mode === "irating_push") notes.push("iRating Push mode: accepting variance for upside.");

  return {
    score,
    iratingRisk: riskFromProb(irRiskiness),
    srRisk: riskFromProb(srRiskiness),
    expectedFinishDeltaPositions: personal.expectedFinishDeltaPositions,
    notes,
    breakdown,
  };
}
