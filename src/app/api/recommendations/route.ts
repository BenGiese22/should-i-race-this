import { NextResponse } from "next/server";

import type {
  Recommendation,
  RecommendationsResponse,
  RiskMode,
} from "@/features/recommendations/types";
import { scoreRace } from "@/lib/scoring/scoreRace";
import type { GlobalStats, PersonalStats } from "@/lib/scoring/types";

import scheduleWeek from "@/features/recommendations/fixtures/scheduleWeek.json";
import statsByCombo from "@/features/recommendations/fixtures/statsByCombo.json";

type ScheduleEntry = {
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  timeSlotLocalHour: number;
  raceLengthMin: number;
  isFixedSetup: boolean;
};

type ComboStats = {
  personal: PersonalStats;
  global: GlobalStats;
};

const RISK_MODES: RiskMode[] = ["balanced", "irating_push", "sr_recovery"];
const WEEK_START_DATE = "2025-02-03";

function parseMode(value: string | null): RiskMode | null {
  if (!value) return "balanced";
  if (RISK_MODES.includes(value as RiskMode)) return value as RiskMode;
  return null;
}

function comboKey(seriesId: number, trackId: number) {
  return `${seriesId}-${trackId}`;
}

export function buildRecommendationId(entry: ScheduleEntry) {
  return `${entry.seriesId}-${entry.trackId}-${entry.timeSlotLocalHour}-${entry.isFixedSetup ? 1 : 0}-${entry.raceLengthMin}`;
}

export async function GET(request: Request) {
  if (process.env.USE_MOCK_DATA !== "true") {
    return NextResponse.json(
      { error: "Mock data disabled. Set USE_MOCK_DATA=true to enable." },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = parseMode(searchParams.get("mode"));
  if (!mode) {
    return NextResponse.json(
      { error: "Invalid mode. Use balanced, irating_push, or sr_recovery." },
      { status: 400 }
    );
  }

  const statsLookup = statsByCombo as Record<string, ComboStats>;

  const items: Recommendation[] = (scheduleWeek as ScheduleEntry[])
    .map((entry) => {
      const stats = statsLookup[comboKey(entry.seriesId, entry.trackId)];
      if (!stats) return null;

      const scored = scoreRace({
        mode,
        context: {
          seriesId: entry.seriesId,
          trackId: entry.trackId,
          raceLengthMin: entry.raceLengthMin,
          timeSlotLocalHour: entry.timeSlotLocalHour,
          isFixedSetup: entry.isFixedSetup,
        },
        personal: stats.personal,
        global: stats.global,
      });

      return {
        id: buildRecommendationId(entry),
        seriesId: entry.seriesId,
        seriesName: entry.seriesName,
        trackId: entry.trackId,
        trackName: entry.trackName,
        timeSlotLocalHour: entry.timeSlotLocalHour,
        raceLengthMin: entry.raceLengthMin,
        isFixedSetup: entry.isFixedSetup,
        score: scored.score,
        iratingRisk: scored.iratingRisk,
        srRisk: scored.srRisk,
        expectedFinishDeltaPositions: scored.expectedFinishDeltaPositions,
        notes: scored.notes,
        breakdown: scored.breakdown,
      };
    })
    .filter((item): item is Recommendation => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

  const response: RecommendationsResponse = {
    mode,
    weekStartDate: WEEK_START_DATE,
    items,
  };

  return NextResponse.json(response);
}
