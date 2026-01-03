import { NextRequest, NextResponse } from "next/server";

import type {
  Recommendation,
  RecommendationsResponse,
  RiskMode,
} from "@/features/recommendations/types";
import { scoreRace } from "@/lib/scoring/scoreRace";
import type { GlobalStats, PersonalStats } from "@/lib/scoring/types";
import { verifyJson, SESSION_COOKIE } from "@/lib/auth/signedCookie";
import { prisma } from "@/server/db/prisma";

const RISK_MODES: RiskMode[] = ["balanced", "irating_push", "sr_recovery"];
function parseMode(value: string | null): RiskMode | null {
  if (!value) return "balanced";
  if (RISK_MODES.includes(value as RiskMode)) return value as RiskMode;
  return null;
}

export function buildRecommendationId(entry: {
  seriesId: number;
  trackId: number;
  timeSlotLocalHour: number;
  isFixedSetup: boolean;
  raceLengthMin: number;
}) {
  return `${entry.seriesId}-${entry.trackId}-${entry.timeSlotLocalHour}-${entry.isFixedSetup ? 1 : 0}-${entry.raceLengthMin}`;
}

function startOfWeekIso(date = new Date()) {
  const utc = new Date(date);
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  utc.setUTCHours(0, 0, 0, 0);
  return utc.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function derivePersonalStats(license?: {
  irating: number;
  sr: number;
}): PersonalStats {
  const irating = license?.irating ?? 1500;
  const sr = license?.sr ?? 2.5;
  const expectedFinishDeltaPositions = clamp((irating - 1500) / 250, -6, 6);
  const incidentsPerRace = clamp(12 - sr * 2.2, 2, 12);
  const finishPositionStdDev = clamp(7 - (irating - 1500) / 1000, 3, 9);
  const startsOnCombo = 3;

  return {
    expectedFinishDeltaPositions,
    incidentsPerRace,
    finishPositionStdDev,
    startsOnCombo,
  };
}

function defaultGlobalStats(): GlobalStats {
  return {
    incidentsPerRaceAvg: 7.5,
    finishPositionStdDevAvg: 6.0,
    attritionRate: 0.18,
    sofStdDevByTimeSlot: 450,
  };
}

type SessionPayload = {
  iracing_cust_id: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = parseMode(searchParams.get("mode"));
  if (!mode) {
    return NextResponse.json(
      { error: "Invalid mode. Use balanced, irating_push, or sr_recovery." },
      { status: 400 }
    );
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json({ error: "Missing SESSION_SECRET" }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJson<SessionPayload>(sessionCookie, sessionSecret);
  const custId = Number(session?.iracing_cust_id);
  if (!Number.isFinite(custId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const activeSeasonId =
    settings?.activeSeasonId ??
    (await prisma.season.findFirst({ orderBy: { id: "desc" } }))?.id;

  if (!activeSeasonId) {
    return NextResponse.json({
      mode,
      weekStartDate: startOfWeekIso(),
      items: [],
    } satisfies RecommendationsResponse);
  }

  const activeWeek =
    settings?.activeWeek ??
    (
      await prisma.scheduleEntry.findFirst({
        where: { seasonId: activeSeasonId },
        orderBy: { week: "desc" },
      })
    )?.week;

  if (!activeWeek) {
    return NextResponse.json({
      mode,
      weekStartDate: startOfWeekIso(),
      items: [],
    } satisfies RecommendationsResponse);
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: { seasonId: activeSeasonId, week: activeWeek },
    include: { series: true, track: true },
    orderBy: { seriesId: "asc" },
  });

  const licenses = await prisma.memberLicense.findMany({
    where: { custId },
  });

  const licenseByCategory = new Map(
    licenses.map((license) => [license.category.toLowerCase(), license])
  );

  const items: Recommendation[] = entries
    .map((entry) => {
      const license = licenseByCategory.get(entry.series.category.toLowerCase());
      const personal = derivePersonalStats(license);
      const global = defaultGlobalStats();

      const scored = scoreRace({
        mode,
        context: {
          seriesId: entry.seriesId,
          trackId: entry.trackId,
          raceLengthMin: entry.raceLengthMin,
          timeSlotLocalHour: entry.timeSlotLocalHour,
          isFixedSetup: entry.isFixedSetup,
        },
        personal,
        global,
        currentIrating: license?.irating,
        currentSr: license?.sr,
      });

      return {
        id: buildRecommendationId(entry),
        seriesId: entry.seriesId,
        seriesName: entry.series.name,
        trackId: entry.trackId,
        trackName: entry.track.name,
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
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

  const response: RecommendationsResponse = {
    mode,
    weekStartDate: startOfWeekIso(),
    items,
  };

  return NextResponse.json(response);
}
